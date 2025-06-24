const { log } = require("winston");
const { connectDB, sql } = require("../config/db");
const logger = require("../logger");
const { DateTime } = require("luxon");
const fs = require("fs").promises;
const path = require("path");
const { resolveFilePath, filePathToBase64 } = require("../config/environment");

// Función auxiliar para procesar la firma
async function procesarFirma(firma) {
  try {
    // Si la firma ya es base64, la retornamos tal cual
    if (firma && (firma.startsWith('data:image') || firma.startsWith('iVBORw0KGgo'))) {
      return firma;
    }

    // Si es una ruta de archivo
    if (firma && typeof firma === 'string' && (firma.includes('\\') || firma.includes('/'))) {
      try {
        // Leer el archivo
        const buffer = await fs.readFile(firma);
        // Convertir a base64
        const base64 = buffer.toString('base64');
        // Determinar el tipo de imagen basado en la extensión
        const ext = path.extname(firma).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 
                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                        'image/png'; // default a PNG si no se puede determinar
        
        return `data:${mimeType};base64,${base64}`;
      } catch (error) {
        logger.error(`Error al procesar la firma desde archivo: ${error.message}`);
        return null;
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error general al procesar la firma: ${error.message}`);
    return null;
  }
}

async function obtenerDetalleSolicitudPrestamo(req, res) {
  const { id } = req.body;

  logger.info(
    `📄 Generar PDF Prestamo ID: ${id} | Iniciando consulta de detalle de solicitud...`
  );

  if (!id) {
    logger.warn(
      `📄 Generar PDF Prestamo ID: ${id} | ID de solicitud no proporcionado.`
    );
    return res.status(400).json({
      error: "El ID de la solicitud (consecutivo) es requerido en el body.",
    });
  }

  try {
    const pool = await connectDB();
    logger.info(
      `📄 Generar PDF Prestamo ID: ${id} | Conectado a la base de datos.`
    );

    // 🔹 Solicitud principal
    const solicitudResult = await pool
      .request()
      .input("solicitudId", sql.Int, id).query(`
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
          ST.transportista,
          ST.usuarioVerifica
        FROM SolicitudTransporte ST
        WHERE ST.consecutivo = @solicitudId
      `);

    if (solicitudResult.recordset.length === 0) {
      logger.warn(
        `📄 Generar PDF Prestamo ID: ${id} | Solicitud no encontrada.`
      );
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    const solicitud = solicitudResult.recordset[0];
    let solicitudIdReal = solicitud.solicitudId;
    logger.info(
      `📄 Generar PDF Prestamo ID: ${id} | Solicitud encontrada con ID real: ${solicitudIdReal}`
    );

    // 🔹 Cliente
    const clienteResult = await pool
      .request()
      .input("clienteId", sql.Int, solicitud.clienteId)
      .query(`SELECT nombre FROM Cliente WHERE id = @clienteId`);
    const entidad = clienteResult.recordset[0]?.nombre || "";

    // 🔹 Solicitante
    const usuarioSolicitanteResult = await pool
      .request()
      .input("usuarioId", sql.Int, solicitud.usuarioSolicitante)
      .query(`SELECT nombre, telefono FROM Usuario WHERE id = @usuarioId`);

    const solicitadoPor = usuarioSolicitanteResult.recordset[0]?.nombre || "";
    const contacto = usuarioSolicitanteResult.recordset[0]?.telefono || "";

    logger.info(
      `📄 Generar PDF Prestamo ID: ${id} | Solicitante: ${solicitadoPor}`
    );
    //todo: se debe invertir
    // 🔹 Firmas
    let firmaTransportista = "";
    let nombreTransportista = "";
    let identificacionTransportista = "";
    if (solicitud.transportista) {
      try {
        const transportistaFirma = await pool
          .request()
          .input("nombre", sql.VarChar, solicitud.transportista)
          .query(
            `
            select firma, nombre, cc FROM Usuario WHERE nombre = @nombre`
          );

        logger.info(
          `📄 Generar PDF Prestamo ID: ${id} | Transportista encontrado: ${!!transportistaFirma
            .recordset.length}`
        );

        if (transportistaFirma.recordset.length > 0) {
          firmaTransportista = transportistaFirma.recordset[0]?.firma || "";
          nombreTransportista = transportistaFirma.recordset[0]?.nombre || "";
          identificacionTransportista =
            transportistaFirma.recordset[0]?.cc || "";
        } else {
          logger.warn(
            `📄 Generar PDF Prestamo ID: ${id} | No se encontró el transportista: ${solicitud.transportista}`
          );
        }
      } catch (error) {
        logger.error(
          `📄 Generar PDF Prestamo ID: ${id} | Error al obtener datos del transportista: ${error.message}`
        );
      }
    } //todo: Ya quedo con la firma de quien recibe en la tabla de Entregas - OK
    let firmaVerificador = "";
    let VerificadorNombre = "";
    let VerificadorIdentificacion = "";

    try {
      const verificadorFirma = await pool
        .request()
        .input("id", sql.Int, solicitudIdReal).query(`
          SELECT 
          receptorNombre,
          receptorIdentificacion,
          firmaPath
          FROM Entregas
          WHERE solicitudId = @id
        `);
      logger.info(
        `📄 Generar PDF Prestamo ID: ${id} | Buscando firmas para solicitudId: ${solicitudIdReal}`
      );
      // Verificamos que recordset existe antes de intentar acceder a su propiedad length
      logger.info(
        `📄 Registros encontrados en Entregas: ${
          verificadorFirma.recordset ? verificadorFirma.recordset.length : 0
        }`
      );

      // Definir variables necesarias aquí para que estén disponibles en todo el ámbito
      let firmaPath = "";
      let firmaBase64 = "";
      // Verificar si verificadorFirma y recordset existen, y si hay registros en el recordset
      if (
        verificadorFirma &&
        verificadorFirma.recordset &&
        verificadorFirma.recordset.length > 0
      ) {
        // Asignar valores de forma segura
        VerificadorNombre = verificadorFirma.recordset[0].receptorNombre || "";
        VerificadorIdentificacion =
          verificadorFirma.recordset[0].receptorIdentificacion || "";

        // Recuperar el path de la firma (ahora asignamos a la variable ya definida)
        firmaPath = verificadorFirma.recordset[0].firmaPath || "";
        logger.info(`📄 Ruta de firma encontrada: ${firmaPath}`);
        if (firmaPath) {
          try {
            // Utilizar el helper para manejar la ruta y convertir a base64
            firmaBase64 = filePathToBase64(firmaPath);

            if (firmaBase64) {
              logger.info(
                `✅ Firma leída correctamente de la ruta: ${firmaPath}`
              );
              firmaVerificador = firmaBase64;
            } else {
              logger.warn(
                `⚠️ No se pudo leer la firma de la ruta: ${firmaPath}`
              );
            }
          } catch (error) {
            logger.error(
              `❌ Error al leer el archivo de firma: ${error.message}`
            );
            logger.error(`❌ Stack: ${error.stack}`);
          }
        } else {
          logger.warn(
            `⚠️ No se encontró ruta de firma para la solicitud: ${solicitudIdReal}`
          );
        }
      } else {
        logger.warn(
          `⚠️ No se encontraron registros de entrega para la solicitud: ${solicitudIdReal}`
        );
      }
    } catch (error) {
      logger.error(`❌ Error al consultar datos de entrega: ${error.message}`);
    }

    const util = require("util"); // Asegúrate de tener esto si aún no lo has importado

    // Seccion para obtener la informacion del Trnasportista Asignado para la entrega de la Solicitud de Prestamo
    let transportistaInfo = {
      transportistaNombre: "",
      transportistaIdentificacion: "",
      transportistaFirma: ""
    }

    try {
      const transportistaGetData = await pool
        .request()
        .input("nombre", sql.VarChar, solicitud.transportista)
          .query(
            `
             SELECT firma, nombre, cc FROM Usuario WHERE nombre = @nombre`
          );

      if (
        transportistaGetData &&
        transportistaGetData.recordset &&
        transportistaGetData.recordset.length > 0
      ) {
        const row = transportistaGetData.recordset[0];
        transportistaInfo = {
          transportistaNombre: row.nombre || "",
          transportistaIdentificacion: row.cc || "",
          transportistaFirma: row.firma || "",
        };

        const firmaPresente = !!transportistaInfo.transportistaFirma;

        logger.warn(
          `👤 Informacion del Transportista de Solicitud de Prestamo: ${transportistaInfo.transportistaNombre} | CC: ${transportistaInfo.transportistaIdentificacion} | Firma presente: ${firmaPresente}`
        );
      } else {
        logger.warn(
          `⚠️ No se encontraron registros del Receptor de Solicitud de Prestamo: ${solicitudIdReal}`
        );
      }
    } catch (error) {
      logger.error(
        `❌ Error al consultar datos del Receptor de Solicitud de Prestamo: ${error.message}`
      );
    }


    // Seccion para obtener la informacion del auxiliar de bodega que dio salida a las cajas de 
    let bodegaInfo = {
      bodegaNombre: "",
      bodegaIdentificacion: "",
      bodegaFirma: "",
    };
    try {
      const bodegaAux = await pool
        .request()
        .input("id", sql.Int, solicitudIdReal).query(`
      SELECT 
        nombre AS bodegaNombre, 
        cc AS bodegaIdentificacion, 
        firma AS bodegaFirma
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

      if (bodegaAux && bodegaAux.recordset && bodegaAux.recordset.length > 0) {
        const row = bodegaAux.recordset[0];
        bodegaInfo = {
          bodegaNombre: row.bodegaNombre || "",
          bodegaIdentificacion: row.bodegaIdentificacion || "",
          bodegaFirma: row.bodegaFirma || "",
        };

        const firmaPresente = !!bodegaInfo.bodegaFirma;

        logger.warn(
          `👤 Informacion del Auxiliar de Bodega: ${bodegaInfo.bodegaNombre} | CC: ${bodegaInfo.bodegaIdentificacion} | Firma presente: ${firmaPresente}`
        );
      } else {
        logger.warn(
          `⚠️ No se encontraron registros de auxiliar de bodega para la solicitud: ${solicitudIdReal}`
        );
      }
    } catch (error) {
      logger.error(
        `❌ Error al consultar datos de auxiliar de bodega: ${error.message}`
      );
    }

    // seccion para obtener la informacion del receptor de la solicitud de prestamo
    let receptorInfo = {
      receptorNombre: "",
      receptorIdentificacion: "",
      receptorFirma: ""
    };

    try {
      const receptorResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT 
            receptorNombre,
            receptorIdentificacion,
            firmaPath as receptorFirma
          FROM Entregas 
          WHERE solicitudId = @id
        `);

      if (receptorResult && receptorResult.recordset && receptorResult.recordset.length > 0) {
        const row = receptorResult.recordset[0];
        receptorInfo = {
          receptorNombre: row.receptorNombre || "",
          receptorIdentificacion: row.receptorIdentificacion || "",
          receptorFirma: ""  // Se procesará después
        };

        // Procesar la firma (convertir de ruta a base64 si es necesario)
        receptorInfo.receptorFirma = await procesarFirma(row.receptorFirma);
        
        const firmaPresente = !!receptorInfo.receptorFirma;
        logger.warn(
          `👤 Información del Receptor de Solicitud de Prestamo: ${receptorInfo.receptorNombre} | CC: ${receptorInfo.receptorIdentificacion} | Firma presente: ${firmaPresente}`
        );
      } else {
        logger.warn(
          `⚠️ No se encontraron registros del Receptor de Solicitud de Prestamo: ${id}`
        );
      }
    } catch (error) {
      logger.error(
        `❌ Error al consultar datos del Receptor de Solicitud de Prestamo: ${error.message}`
      );
    }

    // 🔹 Detalles
    const detallesResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitud.solicitudId).query(`
        SELECT id, referencia1, referencia2, descripcion
        FROM DetalleSolicitudTransporte
        WHERE solicitudTransporteId = @solicitudId
      `);

    const items = [];

    for (let i = 0; i < detallesResult.recordset.length; i++) {
      const detalle = detallesResult.recordset[i];
      let codigoXXI = "";

      const custodiaResult = await pool
        .request()
        .input("caja", sql.VarChar, detalle.referencia2)
        .query(
          `SELECT TOP 1 referencia1 FROM Custodia WHERE referencia2 = @caja`
        );

      if (custodiaResult.recordset.length > 0) {
        codigoXXI = custodiaResult.recordset[0].referencia1;
      }

      items.push({
        item: (i + 1).toString(),
        caja: detalle.referencia2,
        codigoXXI,
        observacion: solicitud.observaciones || "",
      });
    }

    logger.info(
      `📄 Generar PDF Prestamo ID: ${id} | Se procesaron ${items.length} ítems.`
    );

    // Parsear las fechas usando new Date() para que Luxon genere un DateTime
    const fechaSolicitudDT = DateTime.fromJSDate(
      new Date(solicitud.fechaSolicitud),
      {
        zone: "America/Bogota",
      }
    );
    const fechaRecogidaDT = DateTime.fromJSDate(
      new Date(solicitud.fechaRecogida),
      {
        zone: "America/Bogota",
      }
    );

    // Verificar si los DateTime son válidos
    if (!fechaSolicitudDT.isValid) {
      console.error(
        "Fecha de solicitud inválida:",
        fechaSolicitudDT.invalidExplanation
      );
    }
    if (!fechaRecogidaDT.isValid) {
      console.error(
        "Fecha de recogida inválida:",
        fechaRecogidaDT.invalidExplanation
      );
    }

    // Formatear fechas y horas
    const fechaElaboracion = fechaSolicitudDT.toFormat("dd-MM-yyyy"); // Ej: 06-04-2025
    const fechaRecogida = fechaRecogidaDT.toFormat("dd-MM-yyyy"); // Ej: 06-04-2025
    const horaSolicitud = fechaSolicitudDT.toFormat("hh:mm a"); // Ej: 06:32 PM
    const horaEntrega = fechaRecogidaDT.toFormat("hh:mm a"); // Ej: 07:22 PM

    const formatoData = {
      noSolicitud: solicitud.noSolicitud?.toString() || "",
      solicitudId: solicitud.solicitudId?.toString() || "",
      entidad,
      solicitadoPor,
      direccion: solicitud.direccion || "",
      prioridad: solicitud.prioridad || "",
      observaciones: solicitud.observaciones || "",
      contacto,
      // Combinación de fecha y hora si se requiere
      fechaElaboracion: `${fechaElaboracion} / ${horaSolicitud}`,
      horaSolicitud: `${fechaElaboracion} / ${horaSolicitud}`,
      horaEntrega: `${fechaRecogida} / ${horaEntrega}`,
      stickerSeguridad: solicitud.stickerSeguridad || "",
      items,
      // Incluimos la info del transportista, bodega y receptor para el PDF
      transportistaInfo,
      bodegaInfo,
      receptorInfo,
      // Mantenemos los campos antiguos para retrocompatibilidad
      recibidoPor: firmaVerificador,
      entregadoPor: firmaTransportista,
      nombreVerificador: VerificadorNombre,
      identificacionVerificador: VerificadorIdentificacion,
    };

    res.json(formatoData);
  } catch (error) {
    logger.error(
      `📄 Generar PDF Prestamo ID: ${id} | ❌ Error: ${error.message}`
    );
    logger.error(`📄 Stack: ${error.stack}`);

    // Proporcionar más detalles en la respuesta de error en modo desarrollo
    const errorResponse = {
      error: "Error interno del servidor.",
      message: error.message,
      // Incluir stack solo en desarrollo
      ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    };

    res.status(500).json(errorResponse);
  }
}

module.exports = {
  obtenerDetalleSolicitudPrestamo,
};
