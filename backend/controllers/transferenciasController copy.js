/* eslint-disable no-console */
require("dotenv").config();
const { connectDB, sql } = require("../config/db");
const emailService = require("../services/email.service"); // Debe exportar sendEmailTemplate además de sendEmail
const { generarQR } = require("../services/qrGenerator");
const { emitirNotificacion } = require("../services/socket");
const smsService = require("../services/smsService");         // Implementación real o stub
const whatsappService = require("../services/whatsappService"); // Implementación real o stub

// Uso de Winston (configurado en logger.js)
const logger = require("../logger");

/**
 * Función auxiliar para obtener el correo del cliente.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} clienteId - ID del cliente.
 * @returns {Promise<string>} Correo del cliente.
 */
async function obtenerCorreoCliente(pool, clienteId) {
  const result = await pool.request()
    .input("clienteId", sql.Int, clienteId)
    .query(`
      SELECT TOP 1 email, clienteId
      FROM Usuario
      WHERE clienteId = @clienteId
      ORDER BY id ASC
    `);
  return result.recordset.length > 0
    ? result.recordset[0].email
    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";
}

/**
 * Función auxiliar para obtener el correo del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Correo del usuario.
 */
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

/**
 * Función auxiliar para generar una tabla HTML a partir del arreglo de ítems.
 * @param {Array} items - Arreglo de items de la transferencia.
 * @returns {string} HTML de la tabla.
 */
function generateItemsTableHTML(items) {
  let html = `<table>
    <thead>
      <tr>
         <th>Referencia</th>
         <th>Descripción</th>
         <th>Cantidad</th>
      </tr>
    </thead>
    <tbody>`;
  for (const item of items) {
    html += `<tr>
         <td>${item.referencia2 || ""}</td>
         <td>${item.descripcion || ""}</td>
         <td>${item.cantidad || 1}</td>
      </tr>`;
  }
  html += `</tbody></table>`;
  return html;
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
async function registrarAuditoria(pool, solicitudId, estadoAnterior, nuevoEstado, usuarioId = null, comentarios = null) {
  await pool.request()
    .input("solicitudId", sql.Int, solicitudId)
    .input("EstadoAnterior", sql.VarChar, estadoAnterior)
    .input("NuevoEstado", sql.VarChar, nuevoEstado)
    .input("Usuario", sql.Int, usuarioId)
    .input("Comentarios", sql.VarChar, comentarios)
    .query(`
      INSERT INTO SolicitudTransporte_Audit (SolicitudID, EstadoAnterior, NuevoEstado, FechaEvento, Usuario, Comentarios)
      VALUES (@solicitudId, @EstadoAnterior, @NuevoEstado, GETDATE(), @Usuario, @Comentarios)
    `);
}

/**
 * Obtiene la preferencia de notificación para un usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Canal de notificación (ej.: 'EMAIL', 'SMS', 'WHATSAPP').
 */
async function obtenerPreferenciaNotificacion(pool, usuarioId) {
  const result = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT canalNotificacion
      FROM NotificacionesUsuarios
      WHERE usuarioId = @usuarioId AND activo = 1
    `);
  return result.recordset.length > 0 ? result.recordset[0].canalNotificacion : 'EMAIL';
}

/**
 * Envía una notificación utilizando el canal preferido del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @param {string} subject - Asunto (para email).
 * @param {string} message - Mensaje de notificación.
 */
async function enviarNotificacionPorCanal(pool, usuarioId, subject, message) {
  const canal = await obtenerPreferenciaNotificacion(pool, usuarioId);
  switch (canal.toUpperCase()) {
    case "EMAIL":
      await emailService.sendEmailTemplate({
        to: await obtenerCorreoUsuario(pool, usuarioId),
        subject,
        template: "notificacionGeneral", // Template genérico para notificaciones
        data: { message }
      });
      break;
    case "SMS":
      await smsService.sendSMS(usuarioId, message);
      break;
    case "WHATSAPP":
      await whatsappService.sendWhatsApp(usuarioId, message);
      break;
    default:
      await emailService.sendEmailTemplate({
        to: await obtenerCorreoUsuario(pool, usuarioId),
        subject,
        template: "notificacionGeneral",
        data: { message }
      });
  }
}

/**
 * Crea una nueva solicitud de transferencia (POST /api/client/transferencias/crear)
 * Campos obligatorios: clienteId, usuarioId, items (array).
 */
async function createTransferencia(req, res, next) {
  if (!req.body || !req.body.clienteId || !req.body.usuarioId || !req.body.items || !Array.isArray(req.body.items)) {
    return res.status(400).json({ error: "Se requieren los campos: clienteId, usuarioId y un array de items." });
  }
  for (const [index, item] of req.body.items.entries()) {
    if (!item.referencia2) {
      return res.status(400).json({ error: `El item en la posición ${index} debe incluir la propiedad referencia2.` });
    }
  }
  logger.info("Body createTransferencia: " + JSON.stringify(req.body));
  let transaction;
  let transactionStarted = false; // Flag para indicar si la transacción comenzó
  try {
    const pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true; // La transacción inició correctamente

    const { clienteId, usuarioId, items, observaciones } = req.body;
    // Actualizar consecutivo
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
    // Insertar la solicitud
    const requestInsertSolicitud = new sql.Request(transaction);
    requestInsertSolicitud
      .input("clienteId", sql.Int, clienteId)
      .input("consecutivo", sql.Int, nuevoConsecutivo)
      .input("estado", sql.VarChar, "PENDIENTE")
      .input("observaciones", sql.VarChar, observaciones || "");
    const insertSol = await requestInsertSolicitud.query(`
      INSERT INTO SolicitudTransporte (clienteId, consecutivo, estado, fechaSolicitud, observaciones, createdAt, updatedAt)
      VALUES (@clienteId, @consecutivo, @estado, GETDATE(), @observaciones, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() AS solicitudId;
    `);
    const solicitudId = insertSol.recordset[0].solicitudId;
    await registrarAuditoria(pool, solicitudId, 'NINGUNO', 'PENDIENTE', usuarioId, 'Creación de solicitud');
    // Insertar cada detalle
    for (const item of items) {
      await new sql.Request(transaction)
        .input("solicitudTransporteId", sql.Int, solicitudId)
        .input("tipo", sql.VarChar, "CAJA")
        .input("referencia1", sql.VarChar, item.referencia1 || "")
        .input("referencia2", sql.VarChar, item.referencia2)
        .input("referencia3", sql.VarChar, item.referencia3 || "")
        .input("descripcion", sql.VarChar, item.descripcion || "")
        .input("estado", sql.VarChar, "PENDIENTE")
        .query(`
          INSERT INTO DetalleSolicitudTransporte
          (solicitudTransporteId, tipo, referencia1, referencia2, referencia3, descripcion, estado, createdAt, updatedAt)
          VALUES (@solicitudTransporteId, @tipo, @referencia1, @referencia2, @referencia3, @descripcion, @estado, GETDATE(), GETDATE());
        `);
    }
    await transaction.commit();

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

    // Envío de correos usando plantillas
    const itemsTableHTML = generateItemsTableHTML(items);
    const correoCliente = process.env.BODEGA_EMAIL || await obtenerCorreoCliente(pool, clienteId);
    const correoBodega = process.env.BODEGA_EMAIL || "bodega@tuempresa.com";

    const clientEmailData = {
      userName: "Estimado Cliente", // Reemplazar si se cuenta con el nombre
      prestamosCount: items.length,
      consecutivo: nuevoConsecutivo,
      itemsTable: itemsTableHTML
    };
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Solicitud de Transferencia #${nuevoConsecutivo}`,
      template: "confirmacionSolicitudTransferencia",
      data: clientEmailData
    });

    const bodegaEmailData = {
      userName: "Equipo de Bodega",
      prestamosCount: items.length,
      consecutivo: nuevoConsecutivo,
      itemsTable: itemsTableHTML
    };
    await emailService.sendEmailTemplate({
      to: correoBodega,
      subject: `Nueva Solicitud de Transferencia #${nuevoConsecutivo}`,
      template: "nuevaSolicitudTransferencia",
      data: bodegaEmailData
    });

    logger.info(`Transferencia ${solicitudId} creada exitosamente.`);
    return res.status(201).json({
      message: "Solicitud de transferencia creada con éxito",
      solicitudId,
      consecutivo: nuevoConsecutivo,
      qrCode: qrCodeImage
    });
  } catch (error) {
    // Solo se hace rollback si la transacción inició correctamente
    if (transaction && transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error("Error al hacer rollback: " + rollbackError);
      }
    }
    logger.error("Error en createTransferencia: " + error);
    return next(error);
  }
}


/**
 * Escanea y valida el QR (POST /api/transferencias/qr/scan)
 */
async function scanQR(req, res, next) {
  const { qrToken, accion, datosExtra } = req.body;
  if (!qrToken || !accion) {
    return res.status(400).json({ error: "Se requieren los campos qrToken y accion." });
  }
  logger.info(`scanQR iniciado para token: ${qrToken} y acción: ${accion}`);
  const accionesMapping = {
    asignarTransportador: {
      nuevoEstado: "ASIGNADO",
      update: async (pool, solicitudId, datosExtra) => {
        if (!datosExtra || !datosExtra.usuarioCarga) {
          throw new Error("Falta usuarioCarga en datosExtra.");
        }
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .input("usuarioCarga", sql.Int, datosExtra.usuarioCarga)
          .query(`
            UPDATE SolicitudTransporte
            SET usuarioCarga = @usuarioCarga,
                fechaAsignacion = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    },
    iniciarRecoleccion: {
      nuevoEstado: "EN PROCESO DE RECOLECCION",
      update: async (pool, solicitudId) => {
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaCarga = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    },
    recogido: {
      nuevoEstado: "RECOGIDO",
      update: async (pool, solicitudId) => {
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaRecogida = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    },
    recepcionBodega: {
      nuevoEstado: "COMPLETADO",
      update: async (pool, solicitudId, datosExtra) => {
        if (!datosExtra || !datosExtra.usuarioId) {
          throw new Error("Falta usuarioId en datosExtra para recepcionBodega.");
        }
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .input("usuarioId", sql.Int, datosExtra.usuarioId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaVerificacion = GETDATE(),
                usuarioVerifica = @usuarioId
            WHERE id = @solicitudId
          `);
      }
    },
    // Otros mapeos (préstamo, devolución, desarchive) se mantienen similares...
    inicioEntrega: {
      nuevoEstado: "EN PROCESO DE ENTREGA",
      update: async (pool, solicitudId) => {
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaCarga = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    },
    entregado: {
      nuevoEstado: "ENTREGADO",
      update: async (pool, solicitudId) => {
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaRecogida = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    },
    clienteConfirma: {
      nuevoEstado: "COMPLETADO",
      update: async (pool, solicitudId) => {
        await pool.request()
          .input("solicitudId", sql.Int, solicitudId)
          .query(`
            UPDATE SolicitudTransporte
            SET fechaVerificacion = GETDATE()
            WHERE id = @solicitudId
          `);
      }
    }
    // Se pueden agregar más acciones según se requiera...
  };

  if (!accionesMapping[accion]) {
    return res.status(400).json({ error: "Acción no reconocida." });
  }
  const { nuevoEstado, update } = accionesMapping[accion];

  try {
    const pool = await connectDB();
    const requestQR = new sql.Request(pool);
    requestQR.input("qrToken", sql.VarChar, qrToken);
    const result = await requestQR.query(`
      SELECT * FROM QR_Solicitudes WHERE qrToken = @qrToken
    `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Token QR no encontrado." });
    }
    const qrRecord = result.recordset[0];
    if (!qrRecord.activo) {
      return res.status(400).json({ error: "El token QR está expirado o ya fue utilizado." });
    }
    const solicitudId = qrRecord.solicitudTransporteId;
    const currentStateResult = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`SELECT estado FROM SolicitudTransporte WHERE id = @solicitudId`);
    const estadoAnterior = currentStateResult.recordset.length > 0
      ? currentStateResult.recordset[0].estado
      : null;
    await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("nuevoEstado", sql.VarChar, nuevoEstado)
      .query(`
        UPDATE SolicitudTransporte
        SET estado = @nuevoEstado,
            updatedAt = GETDATE()
        WHERE id = @solicitudId
      `);
    if (update) {
      await update(pool, solicitudId, datosExtra);
    }
    await registrarAuditoria(pool, solicitudId, estadoAnterior, nuevoEstado, (datosExtra && datosExtra.usuarioId) || null, `Acción: ${accion}`);

    // Acciones finales: invalidar token si corresponde
    const accionesFinales = ["recepcionBodega", "clienteConfirma", "recepcionBodega_devolucion", "clienteConfirma_desarchive"];
    if (accionesFinales.includes(accion)) {
      await pool.request()
        .input("id", sql.Int, qrRecord.id)
        .query(`
          UPDATE QR_Solicitudes
          SET activo = 0
          WHERE id = @id
        `);
    }
    // Enviar notificación multicanal y registrar log
    const requestUsuarioId = new sql.Request(pool);
    requestUsuarioId.input("solicitudId", sql.Int, solicitudId);
    const solicitudResult = await requestUsuarioId.query(`
      SELECT usuarioId, clienteId FROM SolicitudTransporte WHERE id = @solicitudId
    `);
    const usuarioIdNotificacion = solicitudResult.recordset[0].usuarioId;
    const clienteId = solicitudResult.recordset[0].clienteId;
    const subject = `Actualización de Solicitud ${solicitudId}`;
    const mensaje = `La solicitud ha sido actualizada a ${nuevoEstado} (acción: ${accion}).`;
    await enviarNotificacionPorCanal(pool, usuarioIdNotificacion, subject, mensaje);
    emitirNotificacion(`usuario_${clienteId}`, {
      solicitudId,
      estado: nuevoEstado,
      fechaActualizacion: new Date(),
      mensaje
    });
    logger.info(`scanQR completado: solicitud ${solicitudId} actualizada a ${nuevoEstado}.`);
    return res.status(200).json({
      message: "Acción completada exitosamente.",
      solicitudId,
      nuevoEstado,
      accion
    });
  } catch (error) {
    logger.error("Error en scanQR: " + error);
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
      return res.status(400).json({ error: "El campo solicitudId es obligatorio." });
    }
    const { solicitudId } = req.body;
    const pool = await connectDB();
    // Consultamos para obtener estado y clienteId antes de eliminar
    const checkResult = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`SELECT estado, clienteId FROM SolicitudTransporte WHERE id = @solicitudId`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const { estado, clienteId } = checkResult.recordset[0];
    if (estado !== "PENDIENTE") {
      return res.status(400).json({ error: "Solo se puede eliminar una solicitud en estado PENDIENTE." });
    }
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    await new sql.Request(transaction)
      .input("solicitudId", sql.Int, solicitudId)
      .query(`DELETE FROM DetalleSolicitudTransporte WHERE solicitudTransporteId = @solicitudId`);
    const resultDelete = await new sql.Request(transaction)
      .input("solicitudId", sql.Int, solicitudId)
      .query(`DELETE FROM SolicitudTransporte WHERE id = @solicitudId`);
    if (resultDelete.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: "Solicitud a eliminar no encontrada." });
    }
    await transaction.commit();
    // Enviar notificación de eliminación (por ejemplo, al cliente)
    const correoCliente = await obtenerCorreoCliente(pool, clienteId);
    await emailService.sendEmailTemplate({
      to: correoCliente,
      subject: `Eliminación de Solicitud ${solicitudId}`,
      template: "transferenciaEliminada", // Plantilla a crear para notificar eliminación
      data: { solicitudId }
    });
    logger.info(`Solicitud ${solicitudId} eliminada exitosamente.`);
    return res.status(200).json({
      message: "Solicitud eliminada exitosamente.",
      solicitudId
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
      return res.status(400).json({ error: "El campo clienteId es obligatorio." });
    }
    const { clienteId, estado, fechaInicio, fechaFin } = req.body;
    const pool = await connectDB();
    const request = new sql.Request(pool);
    request.input("clienteId", sql.Int, clienteId);
    let query = `SELECT * FROM SolicitudTransporte WHERE clienteId = @clienteId`;
    if (estado) {
      query += " AND estado = @estado";
      request.input("estado", sql.VarChar, estado);
    }
    if (fechaInicio) {
      query += " AND fechaSolicitud >= @fechaInicio";
      request.input("fechaInicio", sql.DateTime, fechaInicio);
    }
    if (fechaFin) {
      query += " AND fechaSolicitud <= @fechaFin";
      request.input("fechaFin", sql.DateTime, fechaFin);
    }
    query += " ORDER BY fechaSolicitud DESC";
    console.log("queryyyyyyyyyyyyyyyyyyyyyyyyy: "query);
    
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
      return res.status(400).json({ error: "El campo solicitudId es obligatorio." });
    }
    const { solicitudId } = req.body;
    const pool = await connectDB();
    const requestHeader = new sql.Request(pool);
    requestHeader.input("solicitudId", sql.Int, solicitudId);
    const headerResult = await requestHeader.query(`
      SELECT * FROM SolicitudTransporte WHERE id = @solicitudId
    `);
    if (headerResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
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
    return res.status(400).json({ error: "Se requieren los campos: solicitudId y usuarioCarga." });
  }
  const { solicitudId, usuarioCarga } = req.body;
  try {
    const pool = await connectDB();
    const userResult = await pool.request()
      .input("usuarioId", sql.Int, usuarioCarga)
      .query(`
        SELECT nombre FROM Usuario WHERE id = @usuarioId
      `);
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    const usuarioNombre = userResult.recordset[0].nombre;
    const checkResult = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT id, estado, usuarioCarga, fechaAsignacion, clienteId FROM SolicitudTransporte WHERE id = @solicitudId
      `);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado === "ASIGNADO") {
      const userAssignedResult = await pool.request()
        .input("usuarioId", sql.Int, solicitud.usuarioCarga)
        .query(`SELECT dbo.GetNombreUsuario(@usuarioId) AS nombre`);
      const nombreAsignado = userAssignedResult.recordset.length > 0
        ? userAssignedResult.recordset[0].nombre
        : "desconocido";
      return res.status(400).json({
        error: `La solicitud ${solicitudId} ya está asignada a ${nombreAsignado} (ID: ${solicitud.usuarioCarga}) desde ${solicitud.fechaAsignacion}.`
      });
    }
    if (solicitud.estado !== "PENDIENTE") {
      return res.status(400).json({ error: "Solo se permite asignar transportador a solicitudes en estado PENDIENTE." });
    }
    const result = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("usuarioCarga", sql.Int, usuarioCarga)
      .input("nuevoEstado", sql.VarChar, "ASIGNADO")
      .query(`
        UPDATE SolicitudTransporte
        SET usuarioCarga = @usuarioCarga,
            fechaAsignacion = GETDATE(),
            estado = @nuevoEstado,
            updatedAt = GETDATE()
        WHERE id = @solicitudId
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se pudo actualizar la solicitud." });
    }
    // Enviar notificación al transportador asignado
    const correoTransportador = await obtenerCorreoUsuario(pool, usuarioCarga);
    await emailService.sendEmailTemplate({
      to: correoTransportador,
      subject: `Asignación a Transferencia ${solicitudId}`,
      template: "asignacionTransportador", // Plantilla a crear para asignación
      data: { usuario: usuarioNombre, solicitudId }
    });
    logger.info(`Solicitud ${solicitudId} asignada a transportador ${usuarioNombre} (ID: ${usuarioCarga}).`);
    return res.status(200).json({
      message: `Solicitud asignada a transportador ${usuarioNombre} correctamente.`,
      solicitudId,
      usuarioCarga,
      usuarioNombre,
      fechaAsignacion: new Date(),
      estado: "ASIGNADO"
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
    const checkResult = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`SELECT id, estado, clienteId FROM SolicitudTransporte WHERE id = @solicitudId`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado !== "ASIGNADO") {
      return res.status(400).json({ error: "La solicitud debe estar en estado ASIGNADO para registrar la recogida." });
    }
    await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("nuevoEstado", sql.VarChar, "RECOGIDO")
      .query(`
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
      data: { solicitudId }
    });
    logger.info(`Solicitud ${solicitudId} marcada como RECOGIDO.`);
    return res.status(200).json({
      message: "Solicitud marcada como RECOGIDO.",
      solicitudId,
      fechaRecogida: new Date(),
      estado: "RECOGIDO"
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
      return res.status(400).json({ error: "Se requieren los campos: solicitudId y estado." });
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
      return res.status(404).json({ error: "No se encontró la solicitud con el ID proporcionado." });
    }
    // Notificar actualización vía correo
    const correoUsuario = await obtenerCorreoUsuario(pool, req.body.usuarioId || 0);
    await emailService.sendEmailTemplate({
      to: correoUsuario,
      subject: `Actualización de Solicitud ${solicitudId}`,
      template: "actualizacionTransferencia", // Plantilla para actualización
      data: { solicitudId, estado, observaciones }
    });
    logger.info(`Estado de la solicitud ${solicitudId} actualizado a ${estado}.`);
    return res.status(200).json({ message: "Estado actualizado exitosamente.", solicitudId, estado });
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
    return res.status(400).json({ error: "Falta el campo solicitudId o usuarioId." });
  }
  try {
    const pool = await connectDB();
    const checkResult = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`SELECT id, estado, clienteId FROM SolicitudTransporte WHERE id = @id`);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = checkResult.recordset[0];
    if (solicitud.estado === "RECIBIDO") {
      return res.status(400).json({ error: "La solicitud ya fue RECIBIDA." });
    }
    await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .input("usuarioId", sql.Int, usuarioId)
      .input("nuevoEstado", sql.VarChar, "RECIBIDO")
      .query(`
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
      data: { solicitudId }
    });
    logger.info(`Solicitud ${solicitudId} marcada como RECIBIDA.`);
    return res.json({ message: "Solicitud marcada como RECIBIDA." });
  } catch (error) {
    logger.error("Error en recepcionar: " + error);
    return next(error);
  }
}

/**
 * Asigna ubicaciones a los items de una solicitud de transferencia (POST /api/client/transferencias/asignarUbicaciones)
 */
async function asignarUbicaciones(req, res, next) {
  if (!req.body || !req.body.solicitudId || !req.body.asignaciones || !Array.isArray(req.body.asignaciones)) {
    return res.status(400).json({ error: "Se requieren los campos: solicitudId y un array de asignaciones." });
  }
  const { solicitudId, asignaciones } = req.body;
  try {
    const pool = await connectDB();
    const solResult = await pool.request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT id, estado, clienteId FROM SolicitudTransporte WHERE id = @solicitudId
      `);
    if (solResult.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    const solicitud = solResult.recordset[0];
    if (solicitud.estado !== "RECIBIDO") {
      return res.status(400).json({ error: "La solicitud no está en un estado adecuado para asignar ubicaciones." });
    }
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      for (const asign of asignaciones) {
        const { detalleId, ubicacionId } = asign;
        const detalleResult = await transaction.request()
          .input("detalleId", sql.Int, detalleId)
          .query(`
            SELECT id, referencia1, referencia2, referencia3, estado, tipo
            FROM DetalleSolicitudTransporte
            WHERE id = @detalleId
          `);
        if (detalleResult.recordset.length === 0) {
          throw new Error(`El detalle con ID=${detalleId} no existe.`);
        }
        const detalle = detalleResult.recordset[0];
        if (detalle.estado !== "PENDIENTE") {
          throw new Error(`Detalle ID=${detalleId} no está en estado PENDIENTE.`);
        }
        const ubicacionResult = await transaction.request()
          .input("ubicacionId", sql.Int, ubicacionId)
          .query(`
            SELECT * FROM Ubicacion WHERE id = @ubicacionId
          `);
        if (ubicacionResult.recordset.length === 0) {
          throw new Error(`Ubicación ID=${ubicacionId} no existe.`);
        }
        const ubicacion = ubicacionResult.recordset[0];
        if (ubicacion.ocupado === true || ubicacion.estado !== "DISPONIBLE") {
          throw new Error(`Ubicación ID=${ubicacionId} no está disponible.`);
        }
        const custodiaResult = await transaction.request()
          .input("referencia2", sql.VarChar, detalle.referencia2)
          .query(`
            SELECT id, referencia1 FROM Custodia WHERE referencia2 = @referencia2
          `);
        let custodia;
        if (custodiaResult.recordset.length === 0) {
          const clienteId = solicitud.clienteId;
          const item = detalle.tipo || "CAJA";
          const insertResult = await transaction.request()
            .input("clienteId", sql.Int, clienteId)
            .input("bodegaId", sql.Int, ubicacion.bodega_id)
            .input("ubicacionId", sql.Int, ubicacionId)
            .input("item", sql.VarChar, item)
            .input("referencia1", sql.VarChar, ubicacion.codigo)
            .input("referencia2", sql.VarChar, detalle.referencia2)
            .input("referencia3", sql.VarChar, detalle.referencia3 || "")
            .query(`
              INSERT INTO Custodia (clienteId, bodega_id, ubicacionId, item, referencia1, referencia2, referencia3, estado, baja)
              VALUES (@clienteId, @bodegaId, @ubicacionId, @item, @referencia1, @referencia2, @referencia3, 'DISPONIBLE', 0);
              SELECT SCOPE_IDENTITY() AS custodiaId;
            `);
          const newId = insertResult.recordset[0].custodiaId;
          custodia = { id: newId, referencia1: ubicacion.codigo };
        } else {
          custodia = custodiaResult.recordset[0];
        }
        await transaction.request()
          .input("custodiaId", sql.Int, custodia.id)
          .input("ubicacionId", sql.Int, ubicacionId)
          .query(`
            UPDATE Custodia SET ubicacionId = @ubicacionId WHERE id = @custodiaId
          `);
        await transaction.request()
          .input("ubicacionId", sql.Int, ubicacionId)
          .query(`
            UPDATE Ubicacion SET ocupado = 1, estado = 'OCUPADO' WHERE id = @ubicacionId
          `);
        await transaction.request()
          .input("detalleId", sql.Int, detalleId)
          .query(`
            UPDATE DetalleSolicitudTransporte SET estado = 'ASIGNADO' WHERE id = @detalleId
          `);
      }
      await transaction.commit();
      // Enviar notificación vía correo sobre asignación de ubicaciones
      const correoCliente = await obtenerCorreoCliente(pool, solicitud.clienteId);
      await emailService.sendEmailTemplate({
        to: correoCliente,
        subject: `Ubicaciones asignadas para solicitud ${solicitudId}`,
        template: "ubicacionesAsignadas", // Plantilla para notificar asignación de ubicaciones
        data: { solicitudId }
      });
      logger.info(`Ubicaciones asignadas para la solicitud ${solicitudId}.`);
      return res.status(200).json({ message: "Ubicaciones asignadas correctamente." });
    } catch (err) {
      await transaction.rollback();
      logger.error("Error en asignarUbicaciones: " + err);
      return next(err);
    }
  } catch (error) {
    logger.error("Error en asignarUbicaciones (externo): " + error);
    return next(error);
  }
}

module.exports = {
  createTransferencia,
  scanQR,
  consultarTransferencias,
  consultarDetalleTransferencia,
  actualizarEstadoTransferencia,
  eliminarTransferencia,
  asignarUbicaciones,
  recepcionar,
  asignarTransportador,
  recoger,
};
