const { log } = require("winston");
const { connectDB, sql } = require("../config/db");
const logger = require("../logger");
const { DateTime } = require("luxon");
const fs = require('fs');
const path = require('path');
const { resolveFilePath, filePathToBase64 } = require('../config/environment');

async function obtenerDetalleSolicitudPrestamo(req, res) {
  const { id } = req.body;

  logger.info(`📄 Generar PDF Prestamo ID: ${id} | Iniciando consulta de detalle de solicitud...`);

  if (!id) {
    logger.warn(`📄 Generar PDF Prestamo ID: ${id} | ID de solicitud no proporcionado.`);
    return res.status(400).json({ error: "El ID de la solicitud (consecutivo) es requerido en el body." });
  }

  try {
    const pool = await connectDB();
    logger.info(`📄 Generar PDF Prestamo ID: ${id} | Conectado a la base de datos.`);

    // 🔹 Solicitud principal
    const solicitudResult = await pool.request()
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
          ST.transportista,
          ST.usuarioVerifica
        FROM SolicitudTransporte ST
        WHERE ST.consecutivo = @solicitudId
      `);

    if (solicitudResult.recordset.length === 0) {
      logger.warn(`📄 Generar PDF Prestamo ID: ${id} | Solicitud no encontrada.`);
      return res.status(404).json({ message: "Solicitud no encontrada." });
    }

    const solicitud = solicitudResult.recordset[0];
    let solicitudIdReal = solicitud.solicitudId;
    logger.info(`📄 Generar PDF Prestamo ID: ${id} | Solicitud encontrada con ID real: ${solicitudIdReal}`);

    // 🔹 Cliente
    const clienteResult = await pool.request()
      .input("clienteId", sql.Int, solicitud.clienteId)
      .query(`SELECT nombre FROM Cliente WHERE id = @clienteId`);
    const entidad = clienteResult.recordset[0]?.nombre || "";

    // 🔹 Solicitante
    const usuarioSolicitanteResult = await pool.request()
      .input("usuarioId", sql.Int, solicitud.usuarioSolicitante)
      .query(`SELECT nombre, telefono FROM Usuario WHERE id = @usuarioId`);

    const solicitadoPor = usuarioSolicitanteResult.recordset[0]?.nombre || "";
    const contacto = usuarioSolicitanteResult.recordset[0]?.telefono || "";

    logger.info(`📄 Generar PDF Prestamo ID: ${id} | Solicitante: ${solicitadoPor}`);
    //todo: se debe invertir 
    // 🔹 Firmas
    let firmaTransportista = "";
    let nombreTransportista = "";
    let identificacionTransportista = "";
    if (solicitud.transportista) {
      try {
        const transportistaFirma = await pool.request()
          .input("nombre", sql.VarChar, solicitud.transportista)
          .query(`SELECT firma, nombre, cc FROM Usuario WHERE nombre = @nombre`);
          
        logger.info(`📄 Generar PDF Prestamo ID: ${id} | Transportista encontrado: ${!!transportistaFirma.recordset.length}`);
  
        if (transportistaFirma.recordset.length > 0) {
          firmaTransportista = transportistaFirma.recordset[0]?.firma || "";
          nombreTransportista = transportistaFirma.recordset[0]?.nombre || "";
          identificacionTransportista = transportistaFirma.recordset[0]?.cc || "";
        } else {
          logger.warn(`📄 Generar PDF Prestamo ID: ${id} | No se encontró el transportista: ${solicitud.transportista}`);
        }
      } catch (error) {
        logger.error(`📄 Generar PDF Prestamo ID: ${id} | Error al obtener datos del transportista: ${error.message}`);
      }
    }

    //FIXME: sustituir la ifrma del usuario porla firma del usuario que recibe la solicitud
    let firmaVerificador = "";
      const verificadorFirma = await pool.request()
      .input("id", sql.Int, solicitudIdReal)  // Usar el ID real de la solicitud en lugar de un valor hardcodeado
      .query(`
        SELECT 
        receptorNombre,
        receptorIdentificacion,
        firmaPath
        FROM Entregas
        WHERE solicitudId = @id
      `);
      
      logger.info(`📄 Generar PDF Prestamo ID: ${id} | Buscando firmas para solicitudId: ${solicitudIdReal}`);


      // Convertir ruta de firma a base64      const firmaPath = verificadorFirma.recordset[0]?.firmaPath || "";
      let firmaBase64 = "";
      if (firmaPath) {
        try {
          // Utilizar el helper para manejar la ruta y convertir a base64
          firmaBase64 = filePathToBase64(firmaPath);
          
          if (firmaBase64) {
            logger.info(`✅ Firma leída correctamente de la ruta: ${firmaPath}`);
          } else {
            logger.warn(`⚠️ No se pudo leer la firma de la ruta: ${firmaPath}`);
          }
        } catch (error) {
          logger.error(`❌ Error al leer el archivo de firma: ${error.message}`);
        }
      }
      firmaVerificador = firmaBase64;
      const VerificadorNombre = verificadorFirma.recordset[0]?.receptorNombre || "";
      const VerificadorIdentificacion = verificadorFirma.recordset[0]?.receptorIdentificacion || "";
    

    // 🔹 Detalles
    const detallesResult = await pool.request()
      .input("solicitudId", sql.Int, solicitud.solicitudId)
      .query(`
        SELECT id, referencia1, referencia2, descripcion
        FROM DetalleSolicitudTransporte
        WHERE solicitudTransporteId = @solicitudId
      `);

    const items = [];

    for (let i = 0; i < detallesResult.recordset.length; i++) {
      const detalle = detallesResult.recordset[i];
      let codigoXXI = "";

      const custodiaResult = await pool.request()
        .input("caja", sql.VarChar, detalle.referencia2)
        .query(`SELECT TOP 1 referencia1 FROM Custodia WHERE referencia2 = @caja`);

      if (custodiaResult.recordset.length > 0) {
        codigoXXI = custodiaResult.recordset[0].referencia1;
      }

      items.push({
        item: (i + 1).toString(),
        caja: detalle.referencia2,
        codigoXXI,
        observacion: solicitud.observaciones || ""
      });
    }

    logger.info(`📄 Generar PDF Prestamo ID: ${id} | Se procesaron ${items.length} ítems.`);

    // Parsear las fechas usando new Date() para que Luxon genere un DateTime
    const fechaSolicitudDT = DateTime.fromJSDate(new Date(solicitud.fechaSolicitud), {
      zone: "America/Bogota"
    });
    const fechaRecogidaDT = DateTime.fromJSDate(new Date(solicitud.fechaRecogida), {
      zone: "America/Bogota"
    });

    // Verificar si los DateTime son válidos
    if (!fechaSolicitudDT.isValid) {
      console.error("Fecha de solicitud inválida:", fechaSolicitudDT.invalidExplanation);
    }
    if (!fechaRecogidaDT.isValid) {
      console.error("Fecha de recogida inválida:", fechaRecogidaDT.invalidExplanation);
    }

    // Formatear fechas y horas
    const fechaElaboracion = fechaSolicitudDT.toFormat("dd-MM-yyyy"); // Ej: 06-04-2025
    const fechaRecogida = fechaRecogidaDT.toFormat("dd-MM-yyyy"); // Ej: 06-04-2025
    const horaSolicitud = fechaSolicitudDT.toFormat("hh:mm a");         // Ej: 06:32 PM
    const horaEntrega = fechaRecogidaDT.toFormat("hh:mm a");            // Ej: 07:22 PM

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
      horaSolicitud:  `${fechaElaboracion} / ${horaSolicitud}`,
      horaEntrega:  `${fechaRecogida} / ${horaEntrega}`,
      stickerSeguridad: solicitud.stickerSeguridad || "",
      items,
      recibidoPor: firmaTransportista,
      entregadoPor: firmaVerificador,
      nombreVerificador: VerificadorNombre,
      identificacionVerificador: VerificadorIdentificacion,
    };

    res.json(formatoData);
  } catch (error) {
    logger.error(`📄 Generar PDF Prestamo ID: ${id} | ❌ Error: ${error.message}`);
    logger.error(`📄 Stack: ${error.stack}`);
    
    // Proporcionar más detalles en la respuesta de error en modo desarrollo
    const errorResponse = {
      error: "Error interno del servidor.",
      message: error.message,
      // Incluir stack solo en desarrollo
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    };
    
    res.status(500).json(errorResponse);
  }
}

module.exports = {
  obtenerDetalleSolicitudPrestamo,
};
