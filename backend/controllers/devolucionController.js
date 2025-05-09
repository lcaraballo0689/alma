const path = require("path");
// Uso de Winston (configurado en logger.js)
const logger = require("../logger");
const { connectDB, sql } = require("../config/db");
const { getUserById } = require("../services/userService");
const { procesarTransferenciaInterna } = require("./transferenciasController"); // Importas la función

const {

  marcarCustodiaEnDevolucion,
  getCustodiasPrestadas
} = require("../services/custodiaService");
const {
  getOrCreateConsecutivos,
  incrementarUltimaDevolucion,
} = require("../services/consecutivoService");
const {
  createDevolucionCabecera,
  createDevolucionDetalle,
} = require("../services/devolucionService");

const { emitirNotificacion } = require("../services/socket"); // implementacon de ws

const smsService = require("../services/smsService"); // Implementación real o stub
const whatsappService = require("../services/whatsappService"); // Implementación real o stub
const emailService = require("../services/email.service"); // Debe exportar sendEmailTemplate además de sendEmail

const { sendCorreo } = require("../controllers/correoController");

/**
 * Función auxiliar para obtener el correo del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Correo del usuario.
 */
async function obtenerCorreoUsuario(pool, usuarioId) {
  const result = await pool.request().input("usuarioId", sql.Int, usuarioId)
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
      return await emailService.sendEmailTemplate({
        to: emailUsuario,
        subject,
        template: "notificacionGeneral", // Template genérico para notificaciones
        data: { message },
      });
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
      return await emailService.sendEmailTemplate({
        to: emailDefault,
        subject,
        template: "notificacionGeneral",
        data: { message },
      });
  }
}

// Controlador actualizado para crear una cabecera y múltiples detalles de préstamo
async function createDevolucion(req, res) {
  const logoPath = path.join(__dirname, "../assets/siglo.png");
  const { custodiaIds, usuarioId, observaciones, fecha_recoleccion, direccion_recoleccion, urgencia } = req.body;

  const errores = [];
  if (!custodiaIds?.length)
    errores.push("Debe seleccionar al menos una custodia.");
  if (!usuarioId) errores.push("No se ha proporcionado el ID del usuario.");
  if (errores.length) {
    return res
      .status(400)
      .json({ mensaje: "Hay errores en los datos proporcionados.", errores });
  }
  logger.info(">>>>> Body createDevolucion >>>>>: " + JSON.stringify(req.body));

  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const user = await getUserById(transaction, usuarioId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const custodias = await getCustodiasPrestadas(transaction, custodiaIds);
    if (custodias.length !== custodiaIds.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Una o más custodias no están Prestadas." });
    }

    const consecutivos = await getOrCreateConsecutivos(
      transaction,
      user.clienteId
    );


    const createdDevolucion = [];


    const paywer = {
      usuarioId,
      consecutivo: consecutivos.ultimaDevolucion,
      fechaSolicitud: new Date(),
      entregadoPor: "",
      observaciones,
      fecha_recoleccion: fecha_recoleccion,
      urgencia: urgencia,
      direccion_recoleccion: direccion_recoleccion,

    }
    console.log(`output->paywer`, paywer)
    // esto inserta en la tabla devolucion
    const devolucionId = await createDevolucionCabecera(transaction, paywer);

    for (const custodia of custodias) {

      const payload = {
        devolucionId,
        clienteId: custodia.clienteId,
        usuarioId,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimaDevolucion,
        fechaSolicitud: new Date(),
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        observaciones
      }
      console.log(`output->payload>>>>>>>>>`, payload)
      //esto inserta en la tabla devoluciones
      await createDevolucionDetalle(transaction, payload);

      await marcarCustodiaEnDevolucion(transaction, custodia.id);

      createdDevolucion.push({
        devolucionId,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
      });
    }

    //TODO: Armar el payload para createTransferencia SE HACE LA SOLICITUD DE TRASLADO
    const transferenciaPayload = {
      clienteId: user.clienteId,
      usuarioId: usuarioId,
      modulo: "Devolucion",
      observaciones: observaciones,
      fecha_recoleccion: fecha_recoleccion,
      urgencia: urgencia,
      direccion_recoleccion: direccion_recoleccion,
      items: custodias.map((custodia) => ({
        referencia2: custodia.referencia2,
      })),
    };

    // Llamar a createTransferencia
    await procesarTransferenciaInterna(transferenciaPayload, transaction);

    await incrementarUltimaDevolucion(transaction, user.clienteId);
    await transaction.commit();


    logger.info(
      `Notificación WS emitida para el canal usuario_${user.clienteId}.`
    );
    return res.status(201).json({
      message: "Préstamos creados exitosamente.",
      data: createdDevolucion,
    });
  } catch (error) {
    console.error("Error en createDevolucion:", error);
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Asigna un transportador para la entrega del préstamo.
 * Se espera en el body:
 * {
 *   "prestamoId": 5,
 *   "usuarioEntrega": 7
 * }
 * Actualiza el estado a "ASIGNADO" y registra la fecha de asignación (fechaEntrega).
 */
async function asignarTransportadorPrestamo(req, res, next) {
  if (!req.body || !req.body.prestamoId || !req.body.usuarioEntrega) {
    return res.status(400).json({
      error: "Se requieren los campos: prestamoId y usuarioEntrega.",
    });
  }

  const { prestamoId, usuarioEntrega } = req.body;
  const fechaEntrega = new Date();

  try {
    const pool = await connectDB();
    // Verificar que la solicitud de préstamo exista y esté en un estado válido (por ejemplo, SOLICITADO o PENDIENTE)
    const checkResult = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        SELECT id, estado 
        FROM Devolucion 
        WHERE id = @prestamoId
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Préstamo no encontrado." });
    }
    const prestamo = checkResult.recordset[0];
    if (prestamo.estado !== "SOLICITADO" && prestamo.estado !== "PENDIENTE") {
      return res.status(400).json({
        error:
          "El préstamo debe estar en estado SOLICITADO o PENDIENTE para asignar transportador.",
      });
    }

    const result = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId)
      .input("usuarioEntrega", sql.Int, usuarioEntrega)
      .input("fechaEntrega", sql.DateTime, fechaEntrega)
      .input("nuevoEstado", sql.VarChar, "ASIGNADO").query(`
        UPDATE Devolucion
        SET usuarioEntrega = @usuarioEntrega,
            fechaEntrega = @fechaEntrega,
            estado = @nuevoEstado
        WHERE id = @prestamoId
      `);

    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No se pudo actualizar el préstamo." });
    }

    return res.status(200).json({
      message: "Transportador asignado para el préstamo correctamente.",
      prestamoId,
      usuarioEntrega,
      fechaEntrega,
      estado: "ASIGNADO",
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Registra que el transportador ha entregado la caja en la dirección del cliente.
 * Se espera en el body:
 * {
 *   "prestamoId": 5
 * }
 * Actualiza el estado a "ENTREGADO" y registra la fecha de entrega.
 */
async function entregarPrestamo(req, res, next) {
  const { prestamoId } = req.body;
  if (!prestamoId) {
    return res.status(400).json({ error: "Se requiere el campo prestamoId." });
  }

  try {
    const pool = await connectDB();
    // Verificar que la solicitud exista y que esté en estado "ASIGNADO"
    const checkResult = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        SELECT id, estado 
        FROM Devolucion 
        WHERE id = @prestamoId
      `);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Préstamo no encontrado." });
    }
    const prestamo = checkResult.recordset[0];
    if (prestamo.estado !== "ASIGNADO") {
      return res.status(400).json({
        error:
          "El préstamo debe estar en estado ASIGNADO para registrar la entrega.",
      });
    }

    const fechaEntrega = new Date();
    const result = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId)
      .input("nuevoEstado", sql.VarChar, "ENTREGADO")
      .input("fechaEntrega", sql.DateTime, fechaEntrega).query(`
        UPDATE Devolucion
        SET estado = @nuevoEstado,
            fechaEntrega = @fechaEntrega
        WHERE id = @prestamoId
      `);
    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No se pudo actualizar el préstamo." });
    }
    return res.status(200).json({
      message: "Entrega confirmada por el transportador.",
      prestamoId,
      fechaEntrega,
      estado: "ENTREGADO",
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * El cliente confirma la recepción de la caja prestada.
 * Se espera en el body:
 * {
 *   "prestamoId": 5
 * }
 * Actualiza el estado a "FINALIZADO" y registra la fecha de recepción.
 */
async function confirmarRecepcionPrestamo(req, res, next) {
  const { prestamoId } = req.body;
  if (!prestamoId) {
    return res.status(400).json({ error: "Se requiere el campo prestamoId." });
  }
  try {
    const pool = await connectDB();
    const checkResult = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        SELECT id, estado 
        FROM Devolucion 
        WHERE id = @prestamoId
      `);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Préstamo no encontrado." });
    }
    const prestamo = checkResult.recordset[0];
    if (prestamo.estado !== "ENTREGADO") {
      return res.status(400).json({
        error:
          "El préstamo debe estar en estado ENTREGADO para confirmar la recepción.",
      });
    }
    const fechaRecepcion = new Date();
    const result = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId)
      .input("nuevoEstado", sql.VarChar, "FINALIZADO")
      .input("fechaRecepcion", sql.DateTime, fechaRecepcion).query(`
        UPDATE Devolucion
        SET estado = @nuevoEstado,
            fechaRecepcion = @fechaRecepcion
        WHERE id = @prestamoId
      `);
    if (result.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: "No se pudo actualizar el préstamo." });
    }
    return res.status(200).json({
      message: "Recepción confirmada por el cliente.",
      prestamoId,
      fechaRecepcion,
      estado: "FINALIZADO",
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Actualiza el estado final de una solicitud de préstamo (por ejemplo, a COMPLETADO o CANCELADO).
 * Se espera en el body:
 * {
 *   "prestamoId": 5,
 *   "estado": "COMPLETADO",
 *   "observaciones": "Proceso finalizado correctamente."
 * }
 */
async function actualizarEstadoPrestamo(req, res, next) {
  try {
    if (!req.body || !req.body.prestamoId || !req.body.estado) {
      return res
        .status(400)
        .json({ error: "Se requieren los campos: prestamoId y estado." });
    }
    const { prestamoId, estado, observaciones } = req.body;
    const fechaActual = new Date();
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId)
      .input("estado", sql.VarChar, estado)
      .input("observaciones", sql.VarChar, observaciones || "")
      .input("updatedAt", sql.DateTime, fechaActual).query(`
        UPDATE Devolucion
        SET estado = @estado,
            observaciones = @observaciones,
            updatedAt = @updatedAt
        WHERE id = @prestamoId
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se encontró el préstamo." });
    }
    return res.status(200).json({
      message: "Estado de la solicitud de préstamo actualizado exitosamente.",
      prestamoId,
      estado,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Elimina una solicitud de préstamo.
 * Se permite eliminar solo si la solicitud se encuentra en estado PENDIENTE.
 * Se espera en el body:
 * {
 *   "prestamoId": 8
 * }
 */
async function eliminarPrestamo(req, res, next) {
  let transaction;
  try {
    if (!req.body || !req.body.prestamoId) {
      return res
        .status(400)
        .json({ error: "El campo prestamoId es obligatorio." });
    }
    const { prestamoId } = req.body;
    const pool = await connectDB();
    // Validar que el préstamo esté en estado PENDIENTE
    const checkResult = await pool
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        SELECT estado
        FROM Devolucion
        WHERE id = @prestamoId
      `);
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Préstamo no encontrado." });
    }
    const { estado } = checkResult.recordset[0];
    if (estado !== "PENDIENTE") {
      return res.status(400).json({
        error: "Solo se puede eliminar un préstamo en estado PENDIENTE.",
      });
    }
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    // Eliminar los detalles asociados al préstamo (si existen)
    const deleteDetalle = await transaction
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        DELETE FROM DetallePrestamo
        WHERE prestamoId = @prestamoId
      `);
    // Eliminar la solicitud de préstamo
    const deletePrestamo = await transaction
      .request()
      .input("prestamoId", sql.Int, prestamoId).query(`
        DELETE FROM Devolucion
        WHERE id = @prestamoId
      `);
    if (deletePrestamo.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No se pudo eliminar el préstamo." });
    }
    await transaction.commit();
    return res.status(200).json({
      message: "Solicitud de préstamo eliminada exitosamente.",
      prestamoId,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return next(error);
  }
}

/**
 * Consulta las solicitudes de préstamo de un cliente.
 * Se espera en el body:
 * {
 *   "clienteId": 2,
 *   "estado": "PENDIENTE", // opcional
 *   "fechaInicio": "2025-03-01T00:00:00Z", // opcional
 *   "fechaFin": "2025-03-31T23:59:59Z" // opcional
 * }
 */
async function consultarDevolucion(req, res, next) {
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
      SELECT *
      FROM Devolucion
      WHERE clienteId = @clienteId
    `;
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
    const result = await request.query(query);
    return res.status(200).json({
      message: "Préstamos consultados exitosamente.",
      data: result.recordset,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Consulta el detalle de una solicitud de préstamo.
 * Se espera en el body:
 * { "prestamoId": 5 }
 */
async function consultarDetallePrestamo(req, res, next) {
  try {
    if (!req.body || !req.body.prestamoId) {
      return res
        .status(400)
        .json({ error: "El campo prestamoId es obligatorio." });
    }
    const { prestamoId } = req.body;
    const pool = await connectDB();
    const requestHeader = new sql.Request(pool);
    requestHeader.input("prestamoId", sql.Int, prestamoId);
    const headerResult = await requestHeader.query(`
      SELECT *
      FROM Devolucion
      WHERE id = @prestamoId
    `);
    if (headerResult.recordset.length === 0) {
      return res.status(404).json({ error: "No se encontró el préstamo." });
    }
    const prestamo = headerResult.recordset[0];
    // Suponiendo que existe una tabla DetallePrestamo para los items del préstamo
    const requestDetalle = new sql.Request(pool);
    requestDetalle.input("prestamoId", sql.Int, prestamoId);
    const detailResult = await requestDetalle.query(`
      SELECT *
      FROM DetallePrestamo
      WHERE prestamoId = @prestamoId
      ORDER BY id ASC
    `);
    return res.status(200).json({
      message: "Consulta exitosa.",
      prestamo,
      detalle: detailResult.recordset,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDevolucion,
  asignarTransportadorPrestamo,
  entregarPrestamo,
  confirmarRecepcionPrestamo,
  actualizarEstadoPrestamo,
  eliminarPrestamo,
  consultarDevolucion,
  consultarDetallePrestamo,
};
