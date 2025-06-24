const { connectDB, sql } = require("../config/db");
const logger = require("../logger");
const { DateTime } = require("luxon");
const { filePathToBase64 } = require("../config/environment");

/**
 * Process a signature - converts file paths to base64 if needed
 */
async function procesarFirma(firma) {
  try {
    // Return as is if already in base64 format
    if (firma && (firma.startsWith("data:image") || firma.startsWith("iVBORw0KGgo"))) {
      return firma;
    }

    // If it's a file path, convert to base64
    if (firma && typeof firma === "string" && (firma.includes("\\") || firma.includes("/"))) {
      return filePathToBase64(firma);
    }

    return null;
  } catch (error) {
    logger.error(`Error al procesar la firma: ${error.message}`);
    return null;
  }
}

/**
 * Standardized user information format
 */
function formatUserInfo(userData) {
  return {
    nombre: userData?.nombre || "",
    identificacion: userData?.cc || "",
    firma: userData?.firma || "",
    telefono: userData?.telefono || ""
  };
}

/**
 * Fetch user information with standardized output
 */
async function getUser(pool, { id = null, nombre = null }) {
  if (!id && !nombre) return null;
  
  let query, paramName, paramValue;
  
  if (id) {
    query = "SELECT id, nombre, telefono, cc, firma FROM Usuario WHERE id = @userId";
    paramName = "userId";
    paramValue = id;
  } else {
    query = "SELECT nombre, telefono, cc, firma FROM Usuario WHERE nombre = @nombre";
    paramName = "nombre";
    paramValue = nombre;
  }
  
  try {
    const result = await pool
      .request()
      .input(paramName, id ? sql.Int : sql.VarChar, paramValue)
      .query(query);
    
    return result.recordset[0] ? formatUserInfo(result.recordset[0]) : null;
  } catch (error) {
    logger.error(`Error al obtener usuario (${paramName}=${paramValue}): ${error.message}`);
    return null;
  }
}

/**
 * Format date to Colombian standard
 */
function formatDateTime(date) {
  if (!date) return { date: "", time: "", formatted: "" };
  
  const dateDT = DateTime.fromJSDate(new Date(date), { zone: "America/Bogota" });
  
  if (!dateDT.isValid) {
    logger.warn(`Fecha inválida: ${dateDT.invalidExplanation}`);
    return { date: "", time: "", formatted: "" };
  }
  
  const formattedDate = dateDT.toFormat("dd-MM-yyyy");
  const formattedTime = dateDT.toFormat("hh:mm a");
  
  return {
    date: formattedDate,
    time: formattedTime,
    formatted: `${formattedDate} / ${formattedTime}`
  };
}

/**
 * Get delivery information for a solicitud
 */
async function getEntregaInfo(pool, solicitudId) {
  try {
    const result = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT 
          receptorNombre as nombre,
          receptorIdentificacion as identificacion,
          firmaPath,
          fechaEntrega
        FROM Entregas
        WHERE solicitudId = @id
      `);
    
    const entrega = result.recordset[0] || {};
    
    return {
      nombre: entrega.nombre || "",
      identificacion: entrega.identificacion || "",
      firma: await procesarFirma(entrega.firmaPath || ""),
      horaEntrega: formatDateTime(entrega.fechaEntrega || ""),
    };
  } catch (error) {
    logger.error(`Error al obtener información de entrega (ID=${solicitudId}): ${error.message}`);
    return { 
      nombre: "", 
      identificacion: "", 
      firma: "",
      fechaEntrega: "" 
    };
  }
}

/**
 * Get auxiliary staff information who assigned the transportista
 */
async function getBodegaAuxiliarInfo(pool, solicitudId) {
  try {
    const result = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT 
          nombre, 
          cc as identificacion, 
          firma
        FROM Usuario
        WHERE id IN (
            SELECT JSONData.usuario
            FROM SolicitudTransporte ST
            CROSS APPLY OPENJSON(ST.observacionesUsuario)
            WITH (
                fecha DATETIME,
                usuario INT,
                estadoAnterior NVARCHAR(100),
                nuevoEstado NVARCHAR(100),
                observacion NVARCHAR(MAX),
                accion NVARCHAR(100)
            ) AS JSONData
            WHERE JSONData.nuevoEstado = 'asignado a transportador'
              AND ST.id = @id
        )
      `);
      
    const aux = result.recordset[0] || {};
    
    return {
      nombre: aux.nombre || "",
      identificacion: aux.identificacion || "",
      firma: aux.firma || ""
    };
  } catch (error) {
    logger.error(`Error al obtener información de auxiliar de bodega (ID=${solicitudId}): ${error.message}`);
    return { nombre: "", identificacion: "", firma: "" };
  }
}

/**
 * Get detailed information about the solicitud items
 */
async function getDetallesSolicitud(pool, solicitudId) {
  try {
    const detallesResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT id, referencia1, referencia2, descripcion
        FROM DetalleSolicitudTransporte
        WHERE solicitudTransporteId = @solicitudId
      `);
    
    const items = [];
    
    for (const [index, detalle] of detallesResult.recordset.entries()) {
      const custodiaResult = await pool
        .request()
        .input("caja", sql.VarChar, detalle.referencia2)
        .query(`SELECT TOP 1 referencia1 FROM Custodia WHERE referencia2 = @caja`);

      items.push({
        item: (index + 1).toString(),
        caja: detalle.referencia2,
        codigoXXI: custodiaResult.recordset[0]?.referencia1 || "",
        observacion: detalle.descripcion || ""
      });
    }
    
    return items;
  } catch (error) {
    logger.error(`Error al obtener detalles de solicitud (ID=${solicitudId}): ${error.message}`);
    return [];
  }
}

/**
 * Controller for retrieving loan request details
 */
async function obtenerDetalleSolicitudPrestamo(req, res) {
  const { id } = req.body;

  logger.info(`📄 Generar PDF Prestamo ID: ${id} | Iniciando consulta...`);

  if (!id) {
    return res.status(400).json({
      error: "El ID de la solicitud (consecutivo) es requerido en el body."
    });
  }

  try {
    const pool = await connectDB();

    // 1. Get main solicitud data
    const solicitudResult = await pool
      .request()
      .input("solicitudId", sql.Int, id)
      .query(`
        SELECT 
          ST.id AS solicitudId,
          ST.consecutivo AS noSolicitud,
          ST.clienteId,
          ST.usuarioSolicitante,
          ST.direccion,
          ST.prioridad,
          ST.fechaSolicitud,
          ST.fechaRecogida,
          ST.observaciones,
          ST.stickerSeguridad,
          ST.transportista
        FROM SolicitudTransporte ST
        WHERE ST.consecutivo = @solicitudId
      `);

    if (solicitudResult.recordset.length === 0) {
      logger.warn(`📄 Generar PDF Prestamo ID: ${id} | Solicitud no encontrada.`);
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    const solicitud = solicitudResult.recordset[0];
    const solicitudIdReal = solicitud.solicitudId;
    
    // 2. Get all related data in parallel for better performance
    const [
      clienteData,
      solicitante,
      transportista,
      bodegaAux,
      receptor,
      items
    ] = await Promise.all([
      // Cliente information
      pool.request()
        .input("clienteId", sql.Int, solicitud.clienteId)
        .query(`SELECT nombre FROM Cliente WHERE id = @clienteId`)
        .then(result => result.recordset[0]?.nombre || ""),
      
      // Solicitante information
      getUser(pool, { id: solicitud.usuarioSolicitante }),
      
      // Transportista information
      getUser(pool, { nombre: solicitud.transportista }),
      
      // Bodega auxiliar information
      getBodegaAuxiliarInfo(pool, solicitudIdReal),
      
      // Receptor information
      getEntregaInfo(pool, solicitudIdReal),
      
      // Items information
      getDetallesSolicitud(pool, solicitudIdReal)
    ]);
    
    // 3. Format dates
    const fechaSolicitud = formatDateTime(solicitud.fechaSolicitud);
    const fechaRecogida = formatDateTime(solicitud.fechaRecogida);


    // 4. Build the final response with standardized structure
    const formatoData = {
      noSolicitud: solicitud.noSolicitud?.toString() || "",
      solicitudId: solicitudIdReal.toString(),
      entidad: clienteData,
      solicitadoPor: solicitante?.nombre || "",
      direccion: solicitud.direccion || "",
      prioridad: solicitud.prioridad || "",
      observaciones: solicitud.observaciones || "",
      contacto: solicitante?.telefono || "",
      fechaElaboracion: fechaSolicitud.formatted,
      horaSolicitud: fechaSolicitud.formatted,
      //horaEntrega: fechaRecogida.formatted,
      horaEntrega: receptor?.horaEntrega?.formatted || "",

      stickerSeguridad: solicitud.stickerSeguridad || "",
      items,
      
      // User information with standardized fields
      personal: {
        solicitante,
        transportista: {
          nombre: transportista?.nombre || "",
          identificacion: transportista?.identificacion || "",
          firma: transportista?.firma || ""
        },
        bodegaAuxiliar: bodegaAux,
        receptor
      },
      
      // Legacy fields maintained for compatibility
      transportistaInfo: {
        transportistaNombre: transportista?.nombre || "",
        transportistaIdentificacion: transportista?.identificacion || "", 
        transportistaFirma: transportista?.firma || ""
      },
      bodegaInfo: {
        bodegaNombre: bodegaAux.nombre,
        bodegaIdentificacion: bodegaAux.identificacion,
        bodegaFirma: bodegaAux.firma
      },
      receptorInfo: {
        receptorNombre: receptor.nombre,
        receptorIdentificacion: receptor.identificacion,
        receptorFirma: receptor.firma
      },
      recibidoPor: receptor.firma,
      entregadoPor: transportista?.firma || "",
      nombreVerificador: receptor.nombre,
      identificacionVerificador: receptor.identificacion
    };

    res.json(formatoData);
  } catch (error) {
    logger.error(`📄 Generar PDF Prestamo ID: ${id} | ❌ Error: ${error.message}`);
    logger.error(`📄 Stack: ${error.stack}`);

    const errorResponse = {
      error: "Error interno del servidor.",
      message: error.message,
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    };

    res.status(500).json(errorResponse);
  }
}

module.exports = { 
  obtenerDetalleSolicitudPrestamo 
};
