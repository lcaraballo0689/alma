/* eslint-disable no-console */
require("dotenv").config();
const path = require("path");
const PDFDocument = require("pdfkit"); // Asegúrate de tener PDFKit instalado
const { connectDB, sql } = require("../config/db");
const emailService = require("../services/email.service"); // Debe exportar sendEmailTemplate
const { generarQR } = require("../services/qrGenerator");
const { emitirNotificacion } = require("../services/socket");
const smsService = require("../services/smsService");
const whatsappService = require("../services/whatsappService");
const { storeNotification } = require("../services/notificationService");
const { getSolicitudTransporteDetails } = require('../utils/solicitudTransporteHelper');
const { formatDate } = require('../utils/dateUtils');




const logger = require("../logger");

/**
 * Función auxiliar para obtener el correo del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Correo del usuario.
 */
async function obtenerCorreoUsuario(pool, usuarioId) {
  const result = await pool
    .request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT email
      FROM Usuario
      WHERE id = @usuarioId
    `);
  return result.recordset.length > 0
    ? result.recordset[0].email
    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";
}
async function obtenerNombreUsuario(pool, usuarioId) {
  const result = await pool
    .request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT TOP 1 nombre
      FROM Usuario
      WHERE id = @usuarioId
      ORDER BY id ASC
    `);
  return result.recordset.length > 0
    ? result.recordset[0].nombre
    : "Cliente";
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
 * Obtiene la preferencia de notificación para un usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Canal de notificación (ej.: 'EMAIL', 'SMS', 'WHATSAPP').
 */
async function obtenerPreferenciaNotificacion(pool, usuarioId) {
  const result = await pool.request().input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT canalNotificacion
      FROM NotificacionesUsuarios
      WHERE usuarioId = @usuarioId AND activo = 1
    `);
  return result.recordset.length > 0
    ? result.recordset[0].canalNotificacion
    : "EMAIL";
}
/**
 * Envía una notificación utilizando el canal preferido del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @param {string} subject - Asunto (para email).
 * @param {string} message - Mensaje de notificación.
 */
async function enviarNotificacionPorCanal(pool, usuarioId, subject, message) {
  // Obtener el canal de notificación
  const canal = await obtenerPreferenciaNotificacion(pool, usuarioId);
  logger.info(
    `enviarNotificacionPorCanal: usuarioId=${usuarioId}, subject=${subject}, message=${message}, canal=${canal}`
  );

  // Función sencilla para validar que el email tenga un "@".
  const esEmailValido = (email) => email && email.includes("@");

  // Según el canal, enviar la notificación
  switch (canal.toUpperCase()) {
    case "EMAIL":
      const emailUsuario = await obtenerCorreoUsuario(pool, usuarioId);
      logger.info(
        `Datos para EMAIL: usuarioId=${usuarioId}, email=${emailUsuario}`
      );
      if (!esEmailValido(emailUsuario)) {
        logger.error(`El email obtenido no es válido: ${emailUsuario}`);
        throw new Error(
          "El email del usuario no es válido para enviar notificaciones."
        );
      }
      logger.warn('se envia correo por trnasferencia controller - eniar notificacion por canal')
      logger.info(`enviando correo a Cliene -  ${emailUsuario}`)
      await emailService.sendEmailTemplate({
        to: emailUsuario,
        subject,
        template: "acuseMovimiento", // Template genérico para notificaciones
        data: { message },
      })

      logger.warn('se envia correo por trnasferencia controller - eniar notificacion por canal')
      logger.info(`enviando correo a Bodega -  ${process.env.BODEGA_EMAIL}`)
      await emailService.sendEmailTemplate({
        to: process.env.BODEGA_EMAIL,
        subject,
        template: "acuseMovimiento", // Template genérico para notificaciones
        data: { message },
      })

      return
    case "SMS":
      return await smsService.sendSMS(usuarioId, message);
    case "WHATSAPP":
      return await whatsappService.sendWhatsApp(usuarioId, message);
    default:
      // Por defecto, se envía por email
      const emailDefault = await obtenerCorreoUsuario(pool, usuarioId);
      if (!esEmailValido(emailDefault)) {
        logger.error(
          `El email obtenido no es válido (default): ${emailDefault}`
        );
        throw new Error(
          "El email del usuario no es válido para enviar notificaciones."
        );
      }


      const attachments = [
        {
          path: path.join(__dirname, "../assets/siglo.png"),
          cid: "siglo",
          filename: "siglo.png",
        }
      ];
      logger.warn('se envia correo por trnasferencia controller - enviar notificacion por canal - entro en el case default')
      return await emailService.sendEmailTemplate({
        to: emailDefault,
        subject,
        template: "notificacionGeneral",
        data: { message },
        attachments,
      });
  }
}

/**
 * Registra un evento en la tabla de auditoría.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} solicitudId - ID de la solicitud.
 * @param {string} estadoAnterior - Estado anterior.
 * @param {string} nuevoEstado - Nuevo estado.
 * @param {number|null} usuarioId - (Opcional) ID del usuario que realizó el cambio.
 * @param {string|null} comentarios - (Opcional) Comentarios adicionales.
 */
async function registrarAuditoria(
  pool,
  solicitudId,
  estadoAnterior,
  nuevoEstado,
  usuarioId = null,
  comentarios = null
) {
  try {
    const result = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("EstadoAnterior", sql.VarChar, estadoAnterior)
      .input("NuevoEstado", sql.VarChar, nuevoEstado)
      .input("usuarioId", sql.Int, usuarioId)
      .input("Comentarios", sql.VarChar, comentarios).query(`
        INSERT INTO SolicitudTransporte_Audit 
          (SolicitudID, EstadoAnterior, NuevoEstado, FechaEvento, Usuario, Comentarios)
        OUTPUT INSERTED.*
        VALUES 
          (@solicitudId, @EstadoAnterior, @NuevoEstado, GETDATE(), @usuarioId, @Comentarios);
      `);

    // result.recordset[0] contiene el registro insertado completo
    const registroInsertado = result.recordset[0];
    logger.info(
      `Auditoría registrada para SolicitudID ${solicitudId}: ${estadoAnterior} -> ${nuevoEstado}. Registro: ${JSON.stringify(
        registroInsertado
      )}`
    );
    return registroInsertado;
  } catch (error) {
    logger.error(
      `Error al registrar auditoría para SolicitudID ${solicitudId}: ${error.message}`
    );
    throw error;
  }
}

async function procesarTransferenciaInterna(payload, pool, transaction) {
  const { clienteId, usuarioId, items, observaciones, modulo, direccion_entrega, fecha_recoleccion, direccion_recoleccion, urgencia } = payload;


  if (!clienteId || !usuarioId || !Array.isArray(items) || items.length === 0) {
    throw new Error("Datos incompletos para la transferencia.");
  }

  // Determinar la columna de consecutivo según el módulo
  let columnaConsecutivo = "";
  switch (modulo) {
    case "Prestamo":
      columnaConsecutivo = "ultimoPrestamo";
      break;
    case "transferencia":
      columnaConsecutivo = "ultimoTransporte";
      break;
    case "Devolucion":
      columnaConsecutivo = "ultimaDevolucion";
      break;
    case "Desarchive":
      columnaConsecutivo = "ultimoEnvio";
      break;
    default:
      throw new Error(`Módulo no reconocido: ${modulo}`);
  }
  const querys = `SELECT ${columnaConsecutivo} AS ultimoNumero FROM Consecutivos WHERE clienteId = ${clienteId}`
  console.log(querys);

  // Consulta el consecutivo actual de la columna determinada
  const resultCons = await new sql.Request(transaction)
    .input("clienteId", sql.Int, clienteId)
    .query(querys);



  let ultimoNumero = resultCons.recordset[0]?.ultimoNumero || 0;
  const nuevoConsecutivo = ultimoNumero + 1;

  // Actualizar el consecutivo en la columna correspondiente
  await new sql.Request(transaction)
    .input("nuevoNumero", sql.Int, nuevoConsecutivo)
    .input("clienteId", sql.Int, clienteId)
    .query(`UPDATE Consecutivos SET ${columnaConsecutivo} = @nuevoNumero WHERE clienteId = @clienteId`);

  // Se define la dirección (si no se pasa direccion_entrega se utiliza direccion_recoleccion)
  const direccion = direccion_entrega || direccion_recoleccion || null;

  // Insertar la solicitud en SolicitudTransporte
  const insertSol = await new sql.Request(transaction)
    .input("clienteId", sql.Int, clienteId)
    .input("consecutivo", sql.Int, nuevoConsecutivo)
    .input("estado", sql.VarChar, "solicitud creada")
    .input("observaciones", sql.VarChar, observaciones)
    .input("modulo", sql.VarChar, modulo)
    .input("urgencia", sql.VarChar, urgencia )
    .input("direccion", sql.VarChar, direccion)
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      INSERT INTO SolicitudTransporte 
        (clienteId, modulo, consecutivo, estado, fechaSolicitud, observaciones, createdAt, updatedAt, direccion, prioridad, usuarioSolicitante)
      VALUES 
        (@clienteId, @modulo, @consecutivo, @estado, GETDATE(), @observaciones, GETDATE(), GETDATE(), @direccion, @urgencia, @usuarioId);
      SELECT SCOPE_IDENTITY() AS solicitudId;
    `);

  const solicitudId = insertSol.recordset[0].solicitudId;

  await registrarAuditoria(pool, solicitudId, "NINGUNO", "solicitud creada", usuarioId, "Creación de solicitud");

  // Insertar cada detalle de la solicitud
  for (const item of items) {
    await new sql.Request(transaction)
      .input("solicitudTransporteId", sql.Int, solicitudId)
      .input("tipo", sql.VarChar, "CAJA")
      .input("referencia1", sql.VarChar, item.referencia1 || "")
      .input("referencia2", sql.VarChar, item.referencia2)
      .input("referencia3", sql.VarChar, item.referencia3 || "")
      .input("descripcion", sql.VarChar, item.descripcion || "")
      .input("estado", sql.VarChar, "solicitud creada")
      .query(`
        INSERT INTO DetalleSolicitudTransporte
        (solicitudTransporteId, tipo, referencia1, referencia2, referencia3, descripcion, estado, createdAt, updatedAt)
        VALUES (@solicitudTransporteId, @tipo, @referencia1, @referencia2, @referencia3, @descripcion, @estado, GETDATE(), GETDATE());
      `);
  }

  // Generar y guardar el QR
  const qrText = `solicitud_${solicitudId}`;
  const qrCodeImage = await generarQR(qrText);
  await new sql.Request(pool)
    .input("solicitudTransporteId", sql.Int, solicitudId)
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

  // Preparar datos para la plantilla de correo
  let itemsTableHTML = generateItemsTableHTML(items);
  let nombreDelUsuario = await obtenerNombreUsuario(pool, usuarioId);
  let correoUsuario = await obtenerCorreoUsuario(pool, usuarioId);
  let plantillaEmailUser = "";
  let plantillaEmailBodega = "";
  let bodegaEmailData = {};
  let clientEmailData = {};
  let correoBodega = process.env.BODEGA_EMAIL || "bodega@tuempresa.com";
  // Generar el PDF con el detalle de la solicitud
  let pdfBuffer = await generatePDFBuffer(nuevoConsecutivo, clienteId, observaciones, items);
  // Armar attachments (logo, QR y PDF)
  let attachments = [
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
  }
  attachments.push({
    filename: "detalle-solicitud.pdf",
    content: pdfBuffer,
    contentType: "application/pdf",
  });

  if (qrBuffer) {
    attachments.push({
      filename: "qr-code.png",
      content: qrBuffer,
      cid: "qrCodeImage",
    });
  }
  attachments.push({
    filename: "detalle-solicitud.pdf",
    content: pdfBuffer,
    contentType: "application/pdf",
  });

  switch (modulo) {
    case "Prestamo":
      plantillaEmailUser = "confirmacionSolicitudPrestamo";
      plantillaEmailBodega = "nuevaSolicitudPrestamo";
      bodegaEmailData = {
        userName: "Equipo de Bodega",
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
        direccionRecoleccion: direccion_entrega,
        observaciones: observaciones
      };
      clientEmailData = {
        userName: nombreDelUsuario, // Puedes reemplazar por el nombre real
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        observaciones: observaciones,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      };
      break;
    case "transferencia":
      plantillaEmailUser = "confirmacionSolicitudTransferencia";
      plantillaEmailBodega = "nuevaSolicitudTransferencia";
      bodegaEmailData = {
        userName: "Equipo de Bodega",
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
        direccionRecoleccion: direccion_entrega,
        observaciones: observaciones
      };
      clientEmailData = {
        userName: nombreDelUsuario, // Puedes reemplazar por el nombre real
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        observaciones: observaciones,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      };
      break;
    case "Devolucion":
      plantillaEmailUser = "confirmacionSolicitudDevolucion";
      plantillaEmailBodega = "nuevaSolicitudDevolucion";
      bodegaEmailData = {
        userName: "Equipo de Bodega",
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
        direccionRecoleccion: direccion_recoleccion,
        observaciones: observaciones
      };
      clientEmailData = {
        userName: nombreDelUsuario, // Puedes reemplazar por el nombre real
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        observaciones: observaciones,
        fechaSolicitud: new Date().toLocaleString(),
        direccionRecoleccion: direccion_recoleccion,
        year: new Date().getFullYear(),
      };
      break;
    case "Desarchive":
      plantillaEmailUser = "confirmacionSolicitudDesarchive";
      plantillaEmailBodega = "nuevaSolicitudDesarchive";
      //TODO: falta incluir la referencia 1 
      bodegaEmailData = {
        userName: "Equipo de Bodega",
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
        direccion_entrega: direccion_entrega,
        observaciones: observaciones
      };
      clientEmailData = {
        userName: nombreDelUsuario, // Puedes reemplazar por el nombre real
        prestamosCount: items.length,
        consecutivo: nuevoConsecutivo,
        itemsTable: itemsTableHTML,
        observaciones: observaciones,
        direccion_entrega: direccion_entrega,
        fechaSolicitud: new Date().toLocaleString(),
        year: new Date().getFullYear(),
      };

      break;
    default:
      throw new Error(`Módulo no reconocido: ${modulo}`);
  }


  logger.warn('se envia correo por trnasferencia controller - trnasferencia interna a cliente ')

  // Enviar correo al usuario
  await emailService.sendEmailTemplate({
    to: correoUsuario,
    subject: `Confirmacion de Solicitud de ${modulo} #${nuevoConsecutivo}`,
    template: plantillaEmailUser,
    data: clientEmailData,
    attachments,
  });
  logger.warn('se envia correo por trnasferencia controller - trnasferencia interna a bodega')

  await emailService.sendEmailTemplate({
    to: correoBodega,
    subject: `Nueva Solicitud de ${modulo} #${nuevoConsecutivo}`,
    template: plantillaEmailBodega,
    data: bodegaEmailData,
    attachments,
  });





  return { solicitudId, nuevoConsecutivo };
}


/**
 * Función auxiliar para generar un PDF en memoria con los detalles de la solicitud.
 * Este PDF incorpora elementos de seguridad:
 * - Watermark ("Documento Certificado") en el fondo.
 * - Sección de firmas para el responsable y el cliente.
 * - Footer con fecha de emisión, aviso de certificación y sección de firma digital.
 * 
 * Nota: PDFKit no soporta firmas digitales de forma nativa.
 * Para firmarlo digitalmente, se debe utilizar una librería adicional (ej. node-signpdf)
 * junto con un certificado digital que cumpla con estándares como PAdES.
 *
 * @param {number} nuevoConsecutivo - Número de solicitud.
 * @param {number} clienteId - ID del cliente.
 * @param {string} observaciones - Observaciones de la solicitud.
 * @param {Array} items - Array de ítems.
 * @returns {Promise<Buffer>} Buffer del PDF generado.
 */
function generatePDFBuffer(nuevoConsecutivo, clienteId, observaciones, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    let buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // ====== WATERMARK ======
    doc.save();
    doc.fontSize(60)
      .fillColor("grey")
      .opacity(0.2)
      .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
      .text("Documento Certificado", doc.page.width / 4, doc.page.height / 2, {
        align: "center",
        width: doc.page.width / 2,
      });
    doc.restore();
    doc.opacity(1);

    // ====== ENCABEZADO ======
    doc.fontSize(20)
      .fillColor("#000")
      .text(`Detalle de la Solicitud #${nuevoConsecutivo}`, { align: "center", underline: true });
    doc.moveDown();
    doc.fontSize(12)
      .text(`Cliente ID: ${clienteId}`);
    doc.text(`Observaciones: ${observaciones || "N/A"}`);
    doc.moveDown();
    doc.fontSize(14)
      .text("Items:", { underline: true });
    doc.moveDown(0.5);

    // ====== LISTADO DE ÍTEMS ======
    items.forEach((item, idx) => {
      doc.fontSize(12)
        .text(`${idx + 1}. Referencia: ${item.referencia2}, Descripción: ${item.descripcion || "N/A"}, Cantidad: ${item.cantidad || 1}`);
      doc.moveDown(0.2);
    });

    // ====== SECCIÓN DE FIRMAS ======
    doc.moveDown(2);
    const pageWidth = doc.page.width - doc.options.margins.left - doc.options.margins.right;
    const signatureWidth = pageWidth / 2 - 20;
    const signatureY = doc.y;
    // Línea para la firma del Responsable
    doc.moveTo(doc.options.margins.left, signatureY)
      .lineTo(doc.options.margins.left + signatureWidth, signatureY)
      .strokeColor("#333")
      .stroke();
    // Línea para la firma del Cliente
    doc.moveTo(doc.options.margins.left + pageWidth / 2 + 20, signatureY)
      .lineTo(doc.options.margins.left + pageWidth / 2 + 20 + signatureWidth, signatureY)
      .strokeColor("#333")
      .stroke();
    doc.fontSize(10)
      .fillColor("#666");
    doc.text("Firma Responsable", doc.options.margins.left, signatureY + 5, { width: signatureWidth, align: "center" });
    doc.text("Firma Cliente", doc.options.margins.left + pageWidth / 2 + 20, signatureY + 5, { width: signatureWidth, align: "center" });

    // ====== FOOTER CON AVISO DE FIRMA DIGITAL ======
    const footerY = doc.page.height - 70;
    doc.fontSize(10)
      .fillColor("#777")
      .text(`Fecha de emisión: ${new Date().toLocaleString()}`, 50, footerY, { align: "center", width: doc.page.width - 100 });
    doc.moveDown(0.2);
    doc.text("Documento Certificado - No sujeto a alteraciones", { align: "center", width: doc.page.width - 100 });
    doc.moveDown(0.2);
    // Sección informativa de firma digital
    doc.fontSize(9)
      .fillColor("#555")
      .text("Firmado Digitalmente: Este documento cuenta con una firma digital que garantiza su integridad y autenticidad.", { align: "center", width: doc.page.width - 100 });
    doc.text("Certificado Digital: Empleado certificado por una CA confiable, cumpliendo con estándares PAdES.", { align: "center", width: doc.page.width - 100 });

    doc.end();
  });
}



/**
 * Crea una nueva solicitud de transferencia (POST /api/client/transferencias/crear)
 * Campos obligatorios: clienteId, usuarioId, items (array).
 * Además, se envía un correo con plantilla al usuario y a la bodega, adjuntando
 * el logo, el código QR (convertido a Buffer) y un PDF con el detalle de la solicitud.
 */
async function createTransferencia(req, res, next) {
  // Validación inicial de los datos de entrada
  if (
    !req.body ||
    !req.body.clienteId ||
    !req.body.usuarioId ||
    !req.body.items ||
    !req.body.direccionRecoleccion ||
    !Array.isArray(req.body.items)
  ) {
    logger.error("createTransferencia - Datos incompletos", {
      required: ["clienteId", "usuarioId", "items (array)", "direccionRecoleccion"],
      received: req.body,
    });
    return res.status(400).json({
      error: "Se requieren los campos: clienteId, usuarioId y un array de items.",
    });
  }

  // Validación de cada item del array
  for (const [index, item] of req.body.items.entries()) {
    if (!item.referencia2) {
      logger.error("createTransferencia - Falta 'referencia2' en item", { index, item });
      return res.status(400).json({
        error: `El item en la posición ${index} debe incluir la propiedad referencia2.`,
      });
    }
  }

  logger.info("createTransferencia - Datos recibidos", { body: req.body });
  let transaction;
  let transactionStarted = false;

  try {
    // Conexión a la BD y comienzo de la transacción
    const pool = await connectDB();
    logger.info("createTransferencia - Conexión a la BD establecida");

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    logger.debug("createTransferencia - Transacción iniciada");

    const { clienteId, usuarioId, items, observaciones, direccionRecoleccion } = req.body;

    // Actualizar consecutivo para el cliente
    const requestConsecutivos = new sql.Request(transaction);
    requestConsecutivos.input("clienteId", sql.Int, clienteId);
    const resultCons = await requestConsecutivos.query(`
      SELECT ultimoTransporte FROM Consecutivos WHERE clienteId = @clienteId
    `);
    let ultimoTransporte = resultCons.recordset.length > 0 ? resultCons.recordset[0].ultimoTransporte : 0;
    const nuevoConsecutivo = ultimoTransporte + 1;
    await new sql.Request(transaction)
      .input("nuevoTransporte", sql.Int, nuevoConsecutivo)
      .input("clienteId", sql.Int, clienteId)
      .query(`UPDATE Consecutivos SET ultimoTransporte = @nuevoTransporte WHERE clienteId = @clienteId`);
    logger.info("createTransferencia - Consecutivo actualizado", { clienteId, nuevoConsecutivo });

    // Insertar la solicitud en la tabla SolicitudTransporte
    const requestInsertSolicitud = new sql.Request(transaction);
    requestInsertSolicitud
      .input("clienteId", sql.Int, clienteId)
      .input("usuarioSolicitante", sql.Int, usuarioId)
      .input("consecutivo", sql.Int, nuevoConsecutivo)
      .input("estado", sql.VarChar, "solicitud creada")
      .input("observaciones", sql.VarChar, observaciones || "")
      .input("direccionRecoleccion", sql.VarChar, direccionRecoleccion || "");
    const insertSol = await requestInsertSolicitud.query(`
      INSERT INTO SolicitudTransporte (modulo, clienteId, consecutivo, estado, fechaSolicitud, observaciones, createdAt, updatedAt, direccion, usuarioSolicitante)
      VALUES ('transferencia', @clienteId, @consecutivo, @estado, GETDATE(), @observaciones, GETDATE(), GETDATE(), @direccionRecoleccion, @usuarioSolicitante);
      SELECT SCOPE_IDENTITY() AS solicitudId;
    `);
    const solicitudId = insertSol.recordset[0].solicitudId;
    logger.info("createTransferencia - Solicitud insertada", { solicitudId, nuevoConsecutivo });

    await registrarAuditoria(pool, solicitudId, "NINGUNO", "solicitud creada", usuarioId, "Creación de solicitud");
    logger.debug("createTransferencia - Auditoría registrada", { solicitudId });

    // Insertar cada detalle de la solicitud
    for (const item of items) {
      await new sql.Request(transaction)
        .input("solicitudTransporteId", sql.Int, solicitudId)
        .input("tipo", sql.VarChar, "CAJA")
        .input("referencia1", sql.VarChar, item.referencia1 || "")
        .input("referencia2", sql.VarChar, item.referencia2)
        .input("referencia3", sql.VarChar, item.referencia3 || "")
        .input("descripcion", sql.VarChar, item.descripcion || "")
        .input("estado", sql.VarChar, "solicitud creada")
        .query(`
          INSERT INTO DetalleSolicitudTransporte
          (solicitudTransporteId, tipo, referencia1, referencia2, referencia3, descripcion, estado, createdAt, updatedAt)
          VALUES (@solicitudTransporteId, @tipo, @referencia1, @referencia2, @referencia3, @descripcion, @estado, GETDATE(), GETDATE());
        `);
    }
    logger.info("createTransferencia - Detalles insertados", { totalItems: items.length });

    await transaction.commit();
    logger.info("createTransferencia - Transacción comprometida");

    // Generar y guardar el QR asociado a la solicitud
    const qrText = `solicitud_${solicitudId}`;
    const qrCodeImage = await generarQR(qrText);
    await new sql.Request(pool)
      .input("solicitudTransporteId", sql.Int, solicitudId)
      .input("qrToken", sql.VarChar, qrText)
      .input("qrCodeImage", sql.VarChar, qrCodeImage)
      .input("activo", sql.Bit, 1)
      .query(`
        INSERT INTO QR_Solicitudes (solicitudTransporteId, qrToken, qrCodeImage, activo)
        VALUES (@solicitudTransporteId, @qrToken, @qrCodeImage, @activo)
      `);
    logger.info("createTransferencia - QR generado y guardado", { qrToken: qrText });

    // Convertir el data URL del QR a Buffer
    let qrBuffer = null;
    const base64Prefix = "data:image/png;base64,";
    if (qrCodeImage.startsWith(base64Prefix)) {
      const base64Data = qrCodeImage.slice(base64Prefix.length);
      qrBuffer = Buffer.from(base64Data, "base64");
    }

    // Preparar datos para la plantilla de correo
    const itemsTableHTML = generateItemsTableHTML(items);
    const nombreDelUsuario = await obtenerNombreUsuario(pool, usuarioId);
    const correoUsuario = await obtenerCorreoUsuario(pool, usuarioId);
    const clientEmailData = {
      userName: nombreDelUsuario,
      prestamosCount: items.length,
      consecutivo: nuevoConsecutivo,
      itemsTable: itemsTableHTML,
      fechaSolicitud: new Date().toLocaleString(),
      year: new Date().getFullYear(),
    };

    // Generar el PDF con el detalle de la solicitud
    const pdfBuffer = await generatePDFBuffer(nuevoConsecutivo, clienteId, observaciones, items);
    logger.debug("createTransferencia - PDF generado", { consecutivo: nuevoConsecutivo });

    // Armar attachments (logo, QR y PDF)
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
    }
    attachments.push({
      filename: "detalle-solicitud.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    });

    // Enviar correo al usuario
    logger.warn("createTransferencia - Envío de correo a cliente iniciado");
    await emailService.sendEmailTemplate({
      to: correoUsuario,
      subject: `Solicitud de Transferencia #${nuevoConsecutivo}`,
      template: "confirmacionSolicitudTransferencia",
      data: clientEmailData,
      attachments,
    });
    logger.info("createTransferencia - Correo enviado al cliente", { correoUsuario, consecutivo: nuevoConsecutivo });

    // Enviar correo a la bodega
    const correoBodega = process.env.BODEGA_EMAIL || "bodega@tuempresa.com";
    const bodegaEmailData = {
      userName: "Equipo de Bodega",
      prestamosCount: items.length,
      consecutivo: nuevoConsecutivo,
      itemsTable: itemsTableHTML,
      fechaSolicitud: new Date().toLocaleString(),
      year: new Date().getFullYear(),
      direccionRecoleccion,
    };
    logger.warn("createTransferencia - Envío de correo a bodega iniciado");
    await emailService.sendEmailTemplate({
      to: correoBodega,
      subject: `Nueva Solicitud de Transferencia #${nuevoConsecutivo}`,
      template: "nuevaSolicitudTransferencia",
      data: bodegaEmailData,
      attachments,
    });
    logger.info("createTransferencia - Correo enviado a bodega", { correoBodega, consecutivo: nuevoConsecutivo });

    logger.info("createTransferencia - Transferencia creada exitosamente", { solicitudId, consecutivo: nuevoConsecutivo });
    return res.status(201).json({
      message: "Solicitud de transferencia creada con éxito",
      solicitudId,
      consecutivo: nuevoConsecutivo,
      qrCode: qrCodeImage,
    });
  } catch (error) {
    if (transaction && transactionStarted) {
      try {
        await transaction.rollback();
        logger.info("createTransferencia - Transacción revertida debido a error");
      } catch (rollbackError) {
        logger.error("createTransferencia - Error al hacer rollback", { rollbackError: rollbackError.message });
      }
    }
    logger.error("createTransferencia - Error general", { error: error.message, stack: error.stack });
    return next(error);
  }
}


/**
 * Genera un PDF corporativo en formato apaisado (landscape) que sirva de
 * constancia del movimiento, con un aspecto más limpio y distribuido.
 *
 * - Logotipo y título en el encabezado.
 * - Línea divisoria debajo del encabezado.
 * - Datos básicos de la solicitud (ID, cliente, observaciones).
 * - Tabla de ítems con encabezados y fondo.
 * - Sección de firmas en la parte inferior.
 *
 * @param {number} nuevoConsecutivo - Número de solicitud (ej. #36).
 * @param {number} clienteId - ID del cliente.
 * @param {string} observaciones - Observaciones de la solicitud.
 * @param {Array} items - Arreglo de ítems [{ referencia2, descripcion, cantidad }, ...].
 * @returns {Promise<Buffer>} - Devuelve un Buffer con el contenido del PDF.
 */
function generatePDFBuffer(nuevoConsecutivo, clienteId, observaciones, items) {
  return new Promise((resolve, reject) => {
    // Documento en formato apaisado, tamaño LETTER.
    const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margin: 40 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', err => reject(err));

    // ========== ENCABEZADO ==========
    // Logo en la esquina superior izquierda
    const logoPath = path.join(__dirname, "../assets/siglo.png");
    doc.image(logoPath, 40, 30, { width: 100 });

    // Título principal
    doc
      .fontSize(18)
      .fillColor("#2c3e50")
      .text("Constancia de Movimiento", 160, 40, { align: "left" });

    // Subtítulo (Solicitud de Transferencia)
    doc
      .fontSize(12)
      .fillColor("#444")
      .text(`Solicitud de Transferencia #${nuevoConsecutivo}`, 160, 65, { align: "left" });

    // Línea horizontal separadora debajo del encabezado
    doc
      .moveTo(40, 100)
      .lineTo(doc.page.width - 40, 100)
      .stroke("#cccccc");

    // ========== DATOS BÁSICOS ==========
    // Posición de inicio para la sección de datos
    let currentY = 110;

    doc
      .fontSize(11)
      .fillColor("#333")
      .text(`Cliente ID: ${clienteId}`, 40, currentY);
    currentY += 15;

    doc
      .text(`Observaciones: ${observaciones || "N/A"}`, 40, currentY);
    currentY += 30;

    // ========== TABLA DE ÍTEMS ==========
    // Encabezado de la tabla
    doc
      .fontSize(11)
      .fillColor("#ffffff")
      .rect(40, currentY, 200, 20).fill("#2c3e50")   // Columna Referencia
      .rect(240, currentY, 300, 20).fill("#2c3e50") // Columna Descripción
      .rect(540, currentY, 80, 20).fill("#2c3e50"); // Columna Cantidad

    doc.fillColor("#ffffff").text("Referencia", 45, currentY + 5);
    doc.text("Descripción", 245, currentY + 5);
    doc.text("Cantidad", 545, currentY + 5);

    // Volver a color normal para las filas
    doc.fillColor("#333");

    let rowY = currentY + 20;
    const rowHeight = 20;

    items.forEach((item, idx) => {
      doc
        .fontSize(10)
        .text(item.referencia2 || "", 45, rowY + 5, { width: 190, ellipsis: true })
        .text(item.descripcion || "", 245, rowY + 5, { width: 290, ellipsis: true })
        .text(String(item.cantidad || 1), 545, rowY + 5, { width: 75 });

      // Opcional: Dibujar líneas horizontales para cada fila
      doc
        .moveTo(40, rowY)
        .lineTo(620, rowY)
        .strokeColor("#dddddd")
        .stroke();

      rowY += rowHeight;
    });

    // Dibujar la línea final de la tabla
    doc
      .moveTo(40, rowY)
      .lineTo(620, rowY)
      .strokeColor("#dddddd")
      .stroke();

    currentY = rowY + 30; // Dejar espacio después de la tabla

    // ========== SECCIÓN DE FIRMAS ==========
    // Dos líneas para las firmas
    const signatureLineWidth = 200;
    doc
      .moveTo(40, currentY)
      .lineTo(40 + signatureLineWidth, currentY)
      .strokeColor("#333")
      .stroke();
    doc
      .moveTo(360, currentY)
      .lineTo(360 + signatureLineWidth, currentY)
      .strokeColor("#333")
      .stroke();

    doc.fontSize(10).fillColor("#666");
    doc.text("Firma Responsable", 40, currentY + 5);
    doc.text("Firma Cliente", 360, currentY + 5);

    // Finalizar el documento
    doc.end();
  });
}


async function scanQR(req, res, next) {
  try {
    const { qrToken, accion, usuarioId, clienteId, asignaciones, transportista, documentoIdentidad, placa, sticker } = req.body;

    // Validación inicial de campos obligatorios
    if (!qrToken || !accion || !usuarioId || !clienteId) {
      logger.error("scanQR - Campos obligatorios faltantes", { qrToken, accion, usuarioId, clienteId });
      return res.status(400).json({
        error: "Se requieren los campos: qrToken, accion, usuarioId y clienteId.",
      });
    }

    // Log de inicio de la función con detalles de entrada (nivel debug para evitar exponer datos sensibles en producción)
    logger.debug("scanQR iniciado con datos", { body: req.body });

    // Conexión a la base de datos
    const pool = await connectDB();
    logger.info("scanQR - Conexión a la BD establecida");

    // Configuración de parámetros para el SP
    const request = pool.request()
      .input("qrToken", sql.NVarChar, qrToken)
      .input("accion", sql.NVarChar, accion)
      .input("usuarioId", sql.Int, usuarioId)
      .input("clienteId", sql.Int, clienteId)
      .input("transportista", sql.NVarChar, transportista)
      .input("documentoIdentidad", sql.NVarChar, documentoIdentidad)
      .input("placa", sql.NVarChar, placa)
      .input("sticker", sql.NVarChar, sticker || null);


    // Manejo de asignaciones según la acción
    if (accion.toLowerCase() === 'completado') {
      if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
        logger.error("scanQR - Asignaciones faltantes para acción 'completado'", { accion, asignaciones });
        return res.status(400).json({ error: "Debe enviar asignaciones de ubicaciones para cada caja a custodiar." });
      }

      const tableAsignaciones = new sql.Table();
      tableAsignaciones.columns.add('detalleId', sql.Int);
      tableAsignaciones.columns.add('ubicacionId', sql.Int);

      asignaciones.forEach(({ detalleId, ubicacionId }) => {
        tableAsignaciones.rows.add(detalleId, ubicacionId);
      });

      request.input("asignaciones", tableAsignaciones);
      logger.info("scanQR - Asignaciones procesadas", { totalAsignaciones: asignaciones.length });
    } else {
      const emptyTable = new sql.Table();
      emptyTable.columns.add('detalleId', sql.Int);
      emptyTable.columns.add('ubicacionId', sql.Int);
      request.input("asignaciones", emptyTable);
      logger.info("scanQR - Asignaciones no requeridas para la acción", { accion });
    }

    // Ejecución del procedimiento almacenado
    const result = await request.execute("SP_ScanQR");

    if (!result.recordset || result.recordset.length === 0) {
      logger.error("scanQR - El SP_ScanQR no devolvió resultados");
      return res.status(500).json({ error: "Error interno al procesar la transición." });
    }

    const spResponse = result.recordset[0];
    logger.info("scanQR - SP_ScanQR ejecutado exitosamente", { spResponse });

    // Obtener el correo del usuario para notificaciones
    const correoUsuario = await obtenerCorreoUsuario(pool, usuarioId);
    logger.debug("scanQR - Correo del usuario obtenido", { usuarioId, correoUsuario });

    // Envío de correos de notificación
    try {
      const destinatario = `"${correoUsuario}"`;
      const TransporteDetails = await getSolicitudTransporteDetails(spResponse.SolicitudId, ["modulo", "usuarioSolicitante"]);
      const emailCLiente = await obtenerCorreoUsuario(pool, TransporteDetails.adicionales.usuarioSolicitante)

      const fechaActual = new Date();
      const emailData = {
        solicitudId: TransporteDetails.consecutivo,
        solicitudTransporteId: spResponse.SolicitudId,
        estadoAnterior: spResponse.EstadoAnterior,
        estadoActual: spResponse.NuevoEstado,
        fechaActualizacion: formatDate(fechaActual),
        observaciones: spResponse.Observaciones,
        modulo: spResponse.Modulo,
        placa,
        documentoIdentidad,
        transportista
      };

      const attachments = [{
        path: path.join(__dirname, "../assets/siglo.png"),
        cid: "siglo",
        filename: "siglo.png"
      }];

      

      logger.warn(`scanQR - iniciando envio del correo al cliente que realizo la solicitud - ${emailCLiente}`);
      // Enviar correo al cliente
      await emailService.sendEmailTemplate({
        to: emailCLiente,
        subject: `Acuse de Movimiento de ${TransporteDetails.adicionales.modulo} - Solicitud ${TransporteDetails.consecutivo} - ESTADO: ${spResponse.NuevoEstado}`,
        template: "acuseMovimiento",
        data: emailData,
        attachments,
      });
      logger.info("scanQR - Correo enviado al cliente", { emailCLiente, solicitudId: spResponse.SolicitudId });


      if (destinatario !== process.env.BODEGA_EMAIL) {
        logger.warn(`scanQR - iniciando envio del correo al quien Actualizo la solicitud - ${destinatario}`);
        // Enviar correo al usuario que gestiona el movimiento
        await emailService.sendEmailTemplate({
          to: destinatario,
          subject: `Acuse de Movimiento de ${TransporteDetails.adicionales.modulo} - Solicitud ${spResponse.SolicitudId} - ESTADO: ${spResponse.NuevoEstado}`,
          template: "acuseMovimiento",
          data: emailData,
          attachments,
        });
        logger.info("scanQR - Correo enviado al usuario que gestiona el movimiento", { destinatario, solicitudId: spResponse.SolicitudId });
      }else{
        logger.warn(`scanQR - Se omite el envio del correo al solicitante ya que es el mismo que bodega`);
      }


      logger.warn(`scanQR - iniciando envio del correo a bodega - ${process.env.BODEGA_EMAIL}`);
      // Enviar correo a bodega
      await emailService.sendEmailTemplate({
        to: process.env.BODEGA_EMAIL,
        subject: `Acuse de Movimiento de ${TransporteDetails.adicionales.modulo} - Solicitud ${spResponse.SolicitudId} - ESTADO: ${spResponse.NuevoEstado}`,
        template: "acuseMovimiento",
        data: emailData,
        attachments,
      });
      logger.info("scanQR - Correo enviado a bodega", { bodegaEmail: process.env.BODEGA_EMAIL, solicitudId: spResponse.SolicitudId });
    } catch (emailErr) {
      logger.error("scanQR - Error al enviar correo", { error: emailErr.message, stack: emailErr.stack });
    }

    const TransporteDetails = await getSolicitudTransporteDetails(spResponse.SolicitudId, ["modulo"]);
    // Envío de notificación vía WebSocket
    const mensaje = `La solicitud de ${TransporteDetails.adicionales.modulo} N°${TransporteDetails.consecutivo}, vinculada a la solicitud de transporte N°${spResponse.SolicitudId}, ha sido actualizada y se encuentra en el estado ${spResponse.NuevoEstado}`;
    const mensajeId = await storeNotification({
      usuarioId,
      title: "Nuevo Mensaje",
      message: mensaje,
      estado: "no leído",
    });

    emitirNotificacion(`usuario_${clienteId}`, {
      mensajeId,
      solicitudId: TransporteDetails.consecutivo,
      estado: spResponse.NuevoEstado,
      fechaActualizacion: new Date(),
      mensaje,
    });
    logger.info("scanQR - Notificación WebSocket emitida", { canal: `usuario_${clienteId}`, mensajeId });

    return res.status(200).json(spResponse);
  } catch (error) {
    logger.error("scanQR - Error general", { error: error.message, stack: error.stack });
    return next(error);
  }
}




/**
 * Elimina una solicitud de transferencia (DELETE /api/client/transferencias/eliminar)
 */
async function eliminarTransferencia(req, res, next) {
  let transaction;
  try {
    if (!req.body || !req.body.solicitudId) {
      return res
        .status(400)
        .json({ error: "El campo solicitudId es obligatorio." });
    }
    const { solicitudId } = req.body;
    const pool = await connectDB();
    // Consultamos para obtener estado y clienteId antes de eliminar
    const checkResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(
        `SELECT estado, clienteId FROM SolicitudTransporte WHERE id = @solicitudId`
      );
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const { estado, clienteId } = checkResult.recordset[0];
    if (estado !== "solicitud creada") {
      return res.status(400).json({
        error:
          "Solo se puede eliminar una solicitud en estado solicitud creada.",
      });
    }
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    await new sql.Request(transaction)
      .input("solicitudId", sql.Int, solicitudId)
      .query(
        `DELETE FROM DetalleSolicitudTransporte WHERE solicitudTransporteId = @solicitudId`
      );
    const resultDelete = await new sql.Request(transaction)
      .input("solicitudId", sql.Int, solicitudId)
      .query(`DELETE FROM SolicitudTransporte WHERE id = @solicitudId`);
    if (resultDelete.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Solicitud a eliminar no encontrada." });
    }
    await transaction.commit();
    // Enviar notificación de eliminación (por ejemplo, al cliente)
    const correoCliente = await obtenerCorreoCliente(pool, clienteId);






    logger.warn('se envia correo por trnasferencia controller - crear transferencia cliente')
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Eliminación de Solicitud ${solicitudId}`,
      template: "transferenciaEliminada", // Plantilla a crear para notificar eliminación
      data: { solicitudId },
    });






    logger.info(`Solicitud ${solicitudId} eliminada exitosamente.`);
    return res.status(200).json({
      message: "Solicitud eliminada exitosamente.",
      solicitudId,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error("Error en eliminarTransferencia: " + error);
    return next(error);
  }
}

/**
 * Consulta las solicitudes de transferencia para un cliente (POST /api/client/transferencias/consultar)
 */
async function consultarTransferencias(req, res, next) {
  try {
    if (!req.body || !req.body.clienteId) {
      return res
        .status(400)
        .json({ error: "El campo clienteId es obligatorio." });
    }
    const { clienteId, estado, fechaInicio, fechaFin } = req.body;
    const pool = await connectDB();
    const request = new sql.Request(pool);
    request.input("clienteId", sql.Int, clienteId);

    let query = `
      SELECT
          st.id,
          st.clienteId,
          st.consecutivo,
          st.estado,
          st.fechaSolicitud,
          st.fechaVerificacion,
          st.fechaCarga,
          uv.nombre AS usuarioVerifica,  -- Nombre del usuario que verificó
          uc.nombre AS usuarioCarga,     -- Nombre del usuario que cargó
          st.observaciones,
          st.createdAt,
          st.updatedAt,
          st.fechaAsignacion,
          st.fechaRecogida,
          st.qrToken,
          st.modulo,
          st.direccion,
          st.placa,
          st.transportista,
          st.documentoIdentidad
      FROM SolicitudTransporte st
      LEFT JOIN Usuario uv ON st.usuarioVerifica = uv.id
      LEFT JOIN Usuario uc ON st.usuarioCarga = uc.id
      WHERE st.clienteId = @clienteId`;

    if (estado) {
      query += " AND st.estado = @estado";
      request.input("estado", sql.VarChar, estado);
    }
    if (fechaInicio) {
      query += " AND st.fechaSolicitud >= @fechaInicio";
      request.input("fechaInicio", sql.DateTime, fechaInicio);
    }
    if (fechaFin) {
      query += " AND st.fechaSolicitud <= @fechaFin";
      request.input("fechaFin", sql.DateTime, fechaFin);
    }
    query += " ORDER BY st.id DESC";

    const result = await request.query(query);
    logger.info(`Consulta de transferencias para cliente ${clienteId} exitosa.`);
    return res.status(200).json({
      message: "Transferencias consultadas exitosamente",
      data: result.recordset,
    });
  } catch (error) {
    logger.error("Error en consultarTransferencias: " + error);
    return next(error);
  }
}


/**
 * Consulta el detalle de una transferencia (POST /api/client/transferencias/consultarDetalle)
 */
async function consultarDetalleTransferencia(req, res, next) {
  try {
    if (!req.body || !req.body.solicitudId) {
      return res
        .status(400)
        .json({ error: "El campo solicitudId es obligatorio." });
    }
    const { solicitudId } = req.body;
    const pool = await connectDB();
    const requestHeader = new sql.Request(pool);
    requestHeader.input("solicitudId", sql.Int, solicitudId);
    const headerResult = await requestHeader.query(`
      SELECT * FROM SolicitudTransporte WHERE id = @solicitudId
    `);
    if (headerResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: `"Solicitud Numero: ${solicitudId} no encontrada."` });
    }
    const solicitud = headerResult.recordset[0];
    const requestDetalle = new sql.Request(pool);
    requestDetalle.input("solicitudId", sql.Int, solicitudId);
    const detailResult = await requestDetalle.query(`
      SELECT * FROM DetalleSolicitudTransporte WHERE solicitudTransporteId = @solicitudId ORDER BY id ASC
    `);
    logger.info(`Consulta de detalle para solicitud ${solicitudId} exitosa.`);
    return res.status(200).json({
      message: "Consulta exitosa",
      solicitud,
      detalle: detailResult.recordset,
    });
  } catch (error) {
    logger.error("Error en consultarDetalleTransferencia: " + error);
    return next(error);
  }
}

/**
 * Asigna un transportador a la solicitud de transferencia (POST /api/client/transferencias/asignarTransportador)
 */
async function asignarTransportador(req, res, next) {
  if (!req.body || !req.body.solicitudId || !req.body.usuarioCarga) {
    return res
      .status(400)
      .json({ error: "Se requieren los campos: solicitudId y usuarioCarga." });
  }
  const { solicitudId, usuarioCarga } = req.body;
  try {
    const pool = await connectDB();
    const userResult = await pool
      .request()
      .input("usuarioId", sql.Int, usuarioCarga).query(`
        SELECT nombre FROM Usuario WHERE id = @usuarioId
      `);
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const usuarioNombre = userResult.recordset[0].nombre;
    const checkResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId).query(`
        SELECT id, estado, usuarioCarga, fechaAsignacion, clienteId FROM SolicitudTransporte WHERE id = @solicitudId
      `);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado === "ASIGNADO") {
      const userAssignedResult = await pool
        .request()
        .input("usuarioId", sql.Int, solicitud.usuarioCarga)
        .query(`SELECT dbo.GetNombreUsuario(@usuarioId) AS nombre`);
      const nombreAsignado =
        userAssignedResult.recordset.length > 0
          ? userAssignedResult.recordset[0].nombre
          : "desconocido";
      return res.status(400).json({
        error: `La solicitud ${solicitudId} ya está asignada a ${nombreAsignado} (ID: ${solicitud.usuarioCarga}) desde ${solicitud.fechaAsignacion}.`,
      });
    }
    if (solicitud.estado !== "solicitud creada") {
      return res.status(400).json({
        error:
          "Solo se permite asignar transportador a solicitudes en estado solicitud creada.",
      });
    }
    const result = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("usuarioCarga", sql.Int, usuarioCarga)
      .input("nuevoEstado", sql.VarChar, "ASIGNADO").query(`
        UPDATE SolicitudTransporte
        SET usuarioCarga = @usuarioCarga,
            fechaAsignacion = GETDATE(),
            estado = @nuevoEstado,
            updatedAt = GETDATE()
        WHERE id = @solicitudId
      `);
    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No se pudo actualizar la solicitud." });
    }
    // Enviar notificación al transportador asignado
    const correoTransportador = await obtenerCorreoUsuario(pool, usuarioCarga);
    await emailService.sendEmailTemplate({
      to: correoTransportador,
      subject: `Asignación a Transferencia ${solicitudId}`,
      template: "asignacionTransportador", // Plantilla a crear para asignación
      data: { usuario: usuarioNombre, solicitudId },
    });
    logger.info(
      `Solicitud ${solicitudId} asignada a transportador ${usuarioNombre} (ID: ${usuarioCarga}).`
    );
    return res.status(200).json({
      message: `Solicitud asignada a transportador ${usuarioNombre} correctamente.`,
      solicitudId,
      usuarioCarga,
      usuarioNombre,
      fechaAsignacion: new Date(),
      estado: "ASIGNADO",
    });
  } catch (error) {
    logger.error("Error en asignarTransportador: " + error);
    return next(error);
  }
}

/**
 * Registra que el transportador ha recogido las cajas (POST /api/client/transferencias/recoger)
 */
async function recoger(req, res, next) {
  const { solicitudId } = req.body;
  if (!solicitudId) {
    return res.status(400).json({ error: "Se requiere el campo solicitudId." });
  }
  try {
    const pool = await connectDB();
    const checkResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(
        `SELECT id, estado, clienteId FROM SolicitudTransporte WHERE id = @solicitudId`
      );
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado !== "ASIGNADO") {
      return res.status(400).json({
        error:
          "La solicitud debe estar en estado ASIGNADO para registrar la recogida.",
      });
    }
    await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("nuevoEstado", sql.VarChar, "RECOGIDO").query(`
        UPDATE SolicitudTransporte
        SET estado = @nuevoEstado,
            fechaRecogida = GETDATE(),
            updatedAt = GETDATE()
        WHERE id = @solicitudId
      `);
    // Notificar recogida vía correo al cliente
    const correoCliente = await obtenerCorreoCliente(pool, solicitud.clienteId);
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Transferencia ${solicitudId} marcada como RECOGIDO`,
      template: "transferenciaRecogida", // Plantilla para notificar recogida
      data: { solicitudId },
    });
    logger.info(`Solicitud ${solicitudId} marcada como RECOGIDO.`);
    return res.status(200).json({
      message: "Solicitud marcada como RECOGIDO.",
      solicitudId,
      fechaRecogida: new Date(),
      estado: "RECOGIDO",
    });
  } catch (error) {
    logger.error("Error en recoger: " + error);
    return next(error);
  }
}

/**
 * Actualiza el estado de una transferencia (PUT /api/client/transferencias/actualizarEstado)
 */
async function actualizarEstadoTransferencia(req, res, next) {
  try {
    if (!req.body || !req.body.solicitudId || !req.body.estado) {
      return res
        .status(400)
        .json({ error: "Se requieren los campos: solicitudId y estado." });
    }
    const { solicitudId, estado, observaciones } = req.body;
    const pool = await connectDB();
    const request = new sql.Request(pool);
    request.input("solicitudId", sql.Int, solicitudId);
    request.input("estado", sql.VarChar, estado);
    request.input("observaciones", sql.VarChar, observaciones || "");
    const result = await request.query(`
      UPDATE SolicitudTransporte
      SET estado = @estado,
          observaciones = @observaciones,
          updatedAt = GETDATE()
      WHERE id = @solicitudId
    `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: "No se encontró la solicitud con el ID proporcionado.",
      });
    }
    // Notificar actualización vía correo
    const correoUsuario = await obtenerCorreoUsuario(
      pool,
      req.body.usuarioId || 0
    );
    await emailService.sendEmailTemplate({
      to: correoUsuario,
      subject: `Actualización de Solicitud ${solicitudId}`,
      template: "actualizacionTransferencia", // Plantilla para actualización
      data: { solicitudId, estado, observaciones },
    });
    logger.info(
      `Estado de la solicitud ${solicitudId} actualizado a ${estado}.`
    );
    return res.status(200).json({
      message: "Estado actualizado exitosamente.",
      solicitudId,
      estado,
    });
  } catch (error) {
    logger.error("Error en actualizarEstadoTransferencia: " + error);
    return next(error);
  }
}

/**
 * Marca una solicitud como RECIBIDO (POST /api/client/transferencias/recepcionar)
 */
async function recepcionar(req, res, next) {
  const { solicitudId, usuarioId } = req.body;
  if (!solicitudId || !usuarioId) {
    return res
      .status(400)
      .json({ error: "Falta el campo solicitudId o usuarioId." });
  }
  try {
    const pool = await connectDB();
    const checkResult = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(
        `SELECT id, estado, clienteId FROM SolicitudTransporte WHERE id = @id`
      );
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado === "RECIBIDO") {
      return res.status(400).json({ error: "La solicitud ya fue RECIBIDA." });
    }
    await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("usuarioId", sql.Int, usuarioId)
      .input("nuevoEstado", sql.VarChar, "RECIBIDO").query(`
        UPDATE SolicitudTransporte
        SET estado = @nuevoEstado,
            fechaVerificacion = GETDATE(),
            usuarioVerifica = @usuarioId,
            updatedAt = GETDATE()
        WHERE id = @solicitudId
      `);
    // Notificar recepción vía correo al cliente
    const correoCliente = await obtenerCorreoCliente(pool, solicitud.clienteId);
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Solicitud ${solicitudId} marcada como RECIBIDA`,
      template: "transferenciaRecibida", // Plantilla para notificar recepción
      data: { solicitudId },
    });
    logger.info(`Solicitud ${solicitudId} marcada como RECIBIDA.`);
    return res.json({ message: "Solicitud marcada como RECIBIDA." });
  } catch (error) {
    logger.error("Error en recepcionar: " + error);
    return next(error);
  }
}

async function asignarUbicaciones(req, res, next) {
  if (
    !req.body ||
    !req.body.solicitudId ||
    !req.body.asignaciones ||
    !Array.isArray(req.body.asignaciones)
  ) {
    return res.status(400).json({
      error: "Se requieren los campos: solicitudId y un array de asignaciones.",
    });
  }
  const { solicitudId, asignaciones } = req.body;
  let transaction;
  try {
    const pool = await connectDB();
    logger.info(
      `Iniciando asignarUbicaciones para solicitudId: ${solicitudId}`
    );
    const solResult = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId).query(`
        SELECT id, estado, clienteId FROM SolicitudTransporte 
        WHERE id = @solicitudId
      `);
    if (solResult.recordset.length === 0) {
      logger.error("Solicitud no encontrada.");
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = solResult.recordset[0];
    logger.info(`Solicitud obtenida: ${JSON.stringify(solicitud)}`);
    if (solicitud.estado.toLowerCase().trim() !== "completado") {
      logger.error(
        "La solicitud no está en un estado adecuado para asignar ubicaciones."
      );
      return res.status(400).json({
        error:
          "La solicitud no está en un estado adecuado para asignar ubicaciones.",
      });
    }
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    logger.info("Transacción iniciada");

    // Array para acumular resultados de asignación
    const resultAsignaciones = [];

    for (const asign of asignaciones) {
      const { detalleId, ubicacionId } = asign;
      logger.info(
        `Procesando asignación: detalleId=${detalleId}, ubicacionId=${ubicacionId}`
      );

      // 1. Validar el detalle
      const detalleResult = await transaction
        .request()
        .input("detalleId", sql.Int, detalleId).query(`
          SELECT id, referencia1, referencia2, referencia3, estado, tipo
          FROM DetalleSolicitudTransporte
          WHERE id = @detalleId
        `);
      if (detalleResult.recordset.length === 0) {
        throw new Error(`El detalle con ID=${detalleId} no existe.`);
      }
      const detalle = detalleResult.recordset[0];
      logger.info(`Detalle obtenido: ${JSON.stringify(detalle)}`);
      if (detalle.estado.toLowerCase().trim() !== "completado") {
        throw new Error(
          `Detalle ID=${detalleId} no está en estado completado.`
        );
      }

      // 2. Validar la ubicación
      const ubicacionResult = await transaction
        .request()
        .input("ubicacionId", sql.Int, ubicacionId).query(`
          SELECT * FROM Ubicacion WHERE id = @ubicacionId
        `);
      if (ubicacionResult.recordset.length === 0) {
        throw new Error(`Ubicación ID=${ubicacionId} no existe.`);
      }
      const ubicacion = ubicacionResult.recordset[0];
      logger.info(`Ubicación obtenida: ${JSON.stringify(ubicacion)}`);
      if (
        ubicacion.ocupado === true ||
        ubicacion.estado.toUpperCase() !== "DISPONIBLE"
      ) {
        throw new Error(`Ubicación ID=${ubicacionId} no está disponible.`);
      }

      // 3. Generar la nomenclatura usando el SP_GenerarReferencia1
      const spResult = await transaction
        .request()
        .input("modulo", sql.NVarChar, "transferencia")
        .input("ubicacionId", sql.Int, ubicacionId)
        .input("clienteId", sql.Int, solicitud.clienteId)
        .output("nuevaReferencia", sql.NVarChar(255))
        .query(
          "EXEC SP_GenerarReferencia1 @modulo, @ubicacionId, @clienteId, @nuevaReferencia OUTPUT"
        );
      const nuevaReferencia = spResult.output.nuevaReferencia;
      logger.info(`Nueva referencia generada: ${nuevaReferencia}`);
      if (!nuevaReferencia) {
        throw new Error("No se generó una nueva referencia.");
      }

      // 4. Insertar un nuevo registro en Custodia
      const clienteId = solicitud.clienteId;
      const item = detalle.tipo || "CAJA";
      const insertResult = await transaction
        .request()
        .input("clienteId", sql.Int, clienteId)
        .input("bodegaId", sql.Int, ubicacion.bodega_id)
        .input("ubicacionId", sql.Int, ubicacionId)
        .input("item", sql.VarChar, item)
        .input("nuevaReferencia", sql.NVarChar, nuevaReferencia)
        .input("referencia2", sql.VarChar, detalle.referencia2)
        .input("referencia3", sql.VarChar, detalle.referencia3 || "").query(`
          INSERT INTO Custodia (clienteId, bodega_id, ubicacionId, item, referencia1, referencia2, referencia3, estado, baja)
          VALUES (@clienteId, @bodegaId, @ubicacionId, @item, @nuevaReferencia, @referencia2, @referencia3, 'DISPONIBLE', 0);
          SELECT SCOPE_IDENTITY() AS custodiaId;
        `);
      const newId = insertResult.recordset[0].custodiaId;
      logger.info(`Registro insertado en Custodia con custodiaId: ${newId}`);

      // 5. Actualizar la Ubicación a ocupado
      await transaction.request().input("ubicacionId", sql.Int, ubicacionId)
        .query(`
          UPDATE Ubicacion 
          SET ocupado = 1, estado = 'OCUPADO' 
          WHERE id = @ubicacionId
        `);
      // 6. Actualizar el detalle a 'ASIGNADO'
      await transaction.request().input("detalleId", sql.Int, detalleId).query(`
          UPDATE DetalleSolicitudTransporte 
          SET estado = 'ASIGNADO' 
          WHERE id = @detalleId
        `);

      resultAsignaciones.push({
        detalleId,
        ubicacionId,
        referencia: nuevaReferencia,
      });
    }
    await transaction.commit();
    logger.info("Transacción commit exitosa.");

    // Enviar notificación vía correo
    const correoCliente = await obtenerCorreoCliente(pool, solicitud.clienteId);
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Ubicaciones asignadas para solicitud ${solicitudId}`,
      template: "ubicacionesAsignadas",
      data: { solicitudId },
    });
    logger.info(`Notificación enviada a ${correoCliente}.`);

    return res.status(200).json({
      message: "Ubicaciones asignadas correctamente.",
      asignaciones: resultAsignaciones,
    });
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
        logger.info("Transacción rollback ejecutada.");
      } catch (rollbackError) {
        logger.error("Error al hacer rollback: " + rollbackError.message);
      }
    }
    logger.error("Error en asignarUbicaciones: " + err.message);
    return next(err);
  }
}

/**
 * Lista las ubicaciones (GET /api/client/transferencias/ubicaciones)
 */
async function listarUbicaciones(req, res, next) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
             id,
             bodega_id,
             modulo,
             entrepano,
             cara,
             piso,
             coordenadaX,
             coordenadaY,
             coordenadaZ,
             ocupado,
             estado,
             codigo
      FROM dbo.Ubicacion
    `);
    logger.info("Ubicaciones consultadas exitosamente.");
    return res.status(200).json({
      message: "Ubicaciones consultadas exitosamente",
      data: result.recordset,
    });
  } catch (error) {
    logger.error("Error en listarUbicaciones: " + error);
    return next(error);
  }
}

module.exports = {
  scanQR,
  createTransferencia,

  consultarTransferencias,
  consultarDetalleTransferencia,
  actualizarEstadoTransferencia,
  eliminarTransferencia,
  asignarUbicaciones,
  recepcionar,
  asignarTransportador,
  recoger,
  listarUbicaciones,
  procesarTransferenciaInterna
};
