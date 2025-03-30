const path = require("path");
const logger = require("../logger");

const { connectDB, sql } = require("../config/db");
const { getUserById } = require("../services/userService");
const { procesarTransferenciaInterna } = require("./transferenciasController");
const { generarQR } = require("../services/qrGenerator");

const {
  getCustodiasDisponibles,
  marcarCustodiaDesarchivadaPorReferencia2
} = require("../services/custodiaService");
const { incrementarUltimoDesarchive } = require("../services/consecutivoService");
const { emitirNotificacion } = require("../services/socket");
const smsService = require("../services/smsService");
const whatsappService = require("../services/whatsappService");
const emailService = require("../services/email.service");

// Funciones auxiliares que deben existir (o importarse) para el envío de correo
// generarQR: recibe un texto y retorna un data URL (string)
// generatePDFBuffer: genera un PDF con el detalle del movimiento y retorna un Buffer
// generateItemsTableHTML: genera una tabla HTML con la información de los items
// obtenerNombreUsuario: obtiene el nombre del usuario a partir de su ID
// obtenerCorreoUsuario: ya definida a continuación

async function obtenerCorreoUsuario(pool, usuarioId) {
  const result = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT TOP 1 email
      FROM Usuario
      WHERE id = @usuarioId
      ORDER BY id ASC
    `);
  return result.recordset.length > 0
    ? result.recordset[0].email
    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";
}

async function obtenerNombreUsuario(pool, usuarioId) {
  const result = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT TOP 1 nombre
      FROM Usuario
      WHERE id = @usuarioId
      ORDER BY id ASC
    `);
  return result.recordset.length > 0
    ? result.recordset[0].nombre
    : "Usuario";
}

/**
 * Función auxiliar para generar una tabla HTML a partir del arreglo de ítems.
 * @param {Array} items - Arreglo de items de la transferencia.
 * @returns {string} HTML de la tabla.
 */
function generateItemsTableHTML(items) {
  let html = `<table style="border-collapse: collapse; width: 100%;">
    <thead>
      <tr>
         <th style="border: 1px solid #ddd; padding: 8px;">Referencia2</th>
         <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
      </tr>
    </thead>
    <tbody>`;
  for (const item of items) {
    html += `<tr>
         <td style="border: 1px solid #ddd; padding: 8px;">${item.referencia2 || ""}</td>
         <td style="border: 1px solid #ddd; padding: 8px;">CAJA</td>
      </tr>`;
  }
  html += `</tbody></table>`;
  return html;
}


/**
 * Controlador para crear un desarchivado.
 * Recibe en el body:
 * - custodiaIds: array de IDs de custodias a desarchivar.
 * - usuarioId: ID del usuario que realiza la acción.
 * - direccion_entrega: dirección de entrega para el movimiento.
 * - observaciones: comentarios opcionales.
 */
async function createDesarchive(req, res) {
  const { custodiaIds, usuarioId, direccion_entrega, observaciones } = req.body;
  const errores = [];
  if (!custodiaIds?.length)
    errores.push("Debe seleccionar al menos una custodia.");
  if (!usuarioId) errores.push("No se ha proporcionado el ID del usuario.");
  if (!direccion_entrega)
    errores.push("No se ha proporcionado la dirección de entrega.");
  if (errores.length) {
    return res.status(400).json({
      mensaje: "Hay errores en los datos proporcionados.",
      errores,
    });
  }
  logger.info("Body createDesarchive: " + JSON.stringify(req.body));

  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const user = await getUserById(transaction, usuarioId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const custodias = await getCustodiasDisponibles(transaction, custodiaIds);
    if (custodias.length !== custodiaIds.length) {
      await transaction.rollback();
      return res.status(404).json({ error: "Una o más custodias no están disponibles." });
    }

    const createdDesarchives = [];
    for (const custodia of custodias) {
      await marcarCustodiaDesarchivadaPorReferencia2(transaction, custodia.referencia2);
      createdDesarchives.push({
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        direccion_entrega,
      });
    }
    
    //TODO: aqui se obtiene el id del consecutivo de desarchive
    const consecutivoDesarchive = await incrementarUltimoDesarchive(transaction, user.clienteId);
    
    console.log("consecutivoDesarchive", consecutivoDesarchive);

    // Armar el payload para la transferencia interna (movimiento de desarchivado)
    const transferenciaPayload = {
      clienteId: user.clienteId,
      usuarioId: usuarioId,
      modulo: "Desarchive",
      observaciones: observaciones,
      direccion_entrega: direccion_entrega,
      items: custodias.map((custodia) => ({
        referencia2: custodia.referencia2,
      })),
    };

    // Procesar la transferencia interna
    const transferencia = await procesarTransferenciaInterna(transferenciaPayload, transaction);

    console.log("trnasferenciaConsecutvo", transferencia);
    await transaction.commit();

    // ---------- Envío de correo (similar a createTransferencia) ----------
    // Generar el QR para la solicitud de desarchive
    const qrText = `solicitud_${transferencia.solicitudId}`; // Puede ajustarse según la lógica
    const qrCodeImage = await generarQR(qrText); // Función que retorna data URL de imagen

    // Guardar el QR en la base de datos (si es necesario)
    await new sql.Request(pool)
      .input("solicitudTransporteId", sql.Int, transferencia.solicitudId)
      .input("qrToken", sql.VarChar, qrText)
      .input("qrCodeImage", sql.VarChar, qrCodeImage)
      .input("activo", sql.Bit, 1)
      .query(`
        INSERT INTO QR_Solicitudes (solicitudTransporteId, qrToken, qrCodeImage, activo)
        VALUES (@solicitudTransporteId, @qrToken, @qrCodeImage, @activo)
      `);

    // Convertir el data URL del QR a Buffer
    let qrBuffer = null;
    const base64Prefix = "data:image/png;base64,";
    if (qrCodeImage.startsWith(base64Prefix)) {
      const base64Data = qrCodeImage.slice(base64Prefix.length);
      qrBuffer = Buffer.from(base64Data, "base64");
    }

    // Preparar la tabla HTML con los items
    const itemsTableHTML = generateItemsTableHTML(createdDesarchives);
    const nombreDelUsuario = await obtenerNombreUsuario(pool, usuarioId);
    const correoUsuario = await obtenerCorreoUsuario(pool, usuarioId);
    const clientEmailData = {
      userName: nombreDelUsuario,
      prestamosCount: createdDesarchives.length,
      consecutivo: consecutivoDesarchive.ultimoEnvio,
      itemsTable: itemsTableHTML,
      fechaSolicitud: new Date().toLocaleString(),
      year: new Date().getFullYear(),
    };

    // Armar los attachments: logo, QR (si se generó) y PDF
    const attachments = [
      {
        path: path.join(__dirname, "../assets/siglo.png"),
        cid: "siglo",
        filename: "siglo.png",
      }
    ];
    if (qrBuffer) {
      attachments.push({
        filename: "qr-code.png",
        content: qrBuffer,
        cid: "qrCodeImage",
      });
    };

    // Enviar correo al usuario
    const emailResponseClient = await emailService.sendEmailTemplate({
      to: correoUsuario,
      subject: `Solicitud de Desarchive #${consecutivoDesarchive.ultimoEnvio}`,
      template: "confirmacionSolicitudTransferencia", // Puede reutilizar el template de transferencia
      data: clientEmailData,
      attachments,
    });
    logger.info(`Correo enviado al usuario. Respuesta: ${JSON.stringify(emailResponseClient)}`);

    // Enviar correo a la bodega (correo configurado en env o default)
    const correoBodega = process.env.BODEGA_EMAIL || "bodega@tuempresa.com";
    const bodegaEmailData = {
      userName: "Equipo de Bodega",
      prestamosCount: createdDesarchives.length,
      consecutivo: consecutivoDesarchive.ultimoEnvio,
      itemsTable: itemsTableHTML,
      fechaSolicitud: new Date().toLocaleString(),
      year: new Date().getFullYear(),
      direccionRecoleccion: direccion_entrega,
    };
    const emailResponseBodega = await emailService.sendEmailTemplate({
      to: correoBodega,
      subject: `Nueva Solicitud de Desarchive #${consecutivoDesarchive.ultimoEnvio}`,
      template: "nuevaSolicitudDesarchive",
      data: bodegaEmailData,
      attachments,
    });
    logger.info(`Correo enviado a bodega. Respuesta: ${JSON.stringify(emailResponseBodega)}`);
    // ---------------------------------------------------------------------

    // Emitir notificación por WS
    logger.info(`Notificación WS emitida para el canal usuario_${user.clienteId}.`);
    emitirNotificacion(user.clienteId, "Desarchive completado", "El proceso de desarchivado se realizó exitosamente.");

    return res.status(201).json({
      message: "Desarchive creado exitosamente.",
      data: createdDesarchives,
      consecutivo: consecutivoDesarchive.ultimoEnvio,
      qrCode: qrCodeImage,
    });
  } catch (error) {
    logger.error("Error en createDesarchive: " + error.message);
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.error("Error al hacer rollback: " + rollbackError.message);
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  createDesarchive
};
