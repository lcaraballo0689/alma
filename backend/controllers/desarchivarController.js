const path = require("path");
const logger = require("../logger");
const { getIdsByReferencia2 } = require('../utils/cusodiaHelper');
const { connectDB, sql } = require("../config/db");
const { getUserById } = require("../services/userService");
const { procesarTransferenciaInterna } = require("./transferenciasController");
const { getOrCreateConsecutivos } = require("../services/consecutivoService");
const { getCustodiasDisponibles,marcarCustodiaSolicitada, marcarCustodiaDesarchivadaPorReferencia2 } = require("../services/custodiaService");
const { emitirNotificacion } = require("../services/socket");
const { storeNotification } = require("../services/notificationService");
const { getSolicitudTransporteDetails } = require('../utils/solicitudTransporteHelper');


// Controlador actualizado para crear una cabecera y múltiples detalles de Desarchive
async function createDesarchive(req, res) {
  // Ahora se espera que el body tenga la propiedad "referencias2" (un array)
  const { referencias2, usuarioId, direccion_entrega, observaciones } = req.body;
console.log(">>>>>>=>=>=>=>=> ", req.body);

  const errores = [];
  // Validamos que referencias2 sea un array y tenga al menos un elemento
  if (!referencias2 || !Array.isArray(referencias2) || referencias2.length === 0) {
    errores.push("Debe seleccionar al menos una custodia.");
  }
  if (!usuarioId) errores.push("No se ha proporcionado el ID del usuario.");
  if (!direccion_entrega) {
    errores.push("No se ha proporcionado la dirección de entrega.");
  }
  
  if (errores.length) {
    return res
      .status(400)
      .json({ mensaje: "Hay errores en los datos proporcionados.", errores });
  }
  
  logger.info("Body createDesarchive: " + JSON.stringify(req.body));

  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  // Se usa referencias2 (recibido del body) para obtener los IDs de la tabla Custodia.
  let ids;
  try {
    ids = await getIdsByReferencia2(referencias2);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    await transaction.begin();

    const user = await getUserById(transaction, usuarioId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const custodias = await getCustodiasDisponibles(transaction, ids);
    if (custodias.length !== ids.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "Una o más custodias no están disponibles." });
    }

    const consecutivos = await getOrCreateConsecutivos(transaction, user.clienteId);
    console.log("Consecutivos obtenidos:", consecutivos);
    
    const createdDesarchive = [];

    for (const custodia of custodias) {

      await marcarCustodiaDesarchivadaPorReferencia2(transaction, custodia.referencia2);

      createdDesarchive.push({
        custodiaIDd: custodia.id,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        item: custodia.item,
        direccion_entrega,
        observaciones
      });
    }

    // Armar el payload para crear la transferencia
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

    // Llamar a procesar la transferencia interna
    const aidis = await procesarTransferenciaInterna(transferenciaPayload, transaction);
    console.log("IDs de transferencia procesados:", aidis);
    
    await transaction.commit();


    
    // await enviarNotificacionPorCanal(pool, usuarioId, subjectNotif, mensaje);
    // logger.info("Notificación enviada por canal preferido.");
    
    const TransporteDetails = await getSolicitudTransporteDetails (solicitudNro, ['estado', 'modulo']);
    console.log('consecutivo para ws en DesarchiveController: ===>>> ', TransporteDetails.consecutivo);
    
    const mensaje = `Solicitud de Desarchive #${TransporteDetails.consecutivo} Creada, Estado Actual: Solicitud Creada.`;
    
    const mensajeId = await storeNotification({
      usuarioId: usuarioId,
      title: `Nuevo Mensaje de - ${TransporteDetails.adicionales.modulo} `,
      message: mensaje,
      estado: "no leído",
    });


    emitirNotificacion(`usuario_${user.clienteId}`, {
      mensajeId,
      solicitudId: TransporteDetails.consecutivo,
      estado: TransporteDetails.adicionales.estado,
      fechaActualizacion: new Date(),
      mensaje,
    });

    logger.info(`Notificación WS emitida para el canal usuario_${user.clienteId}.`);
    return res.status(201).json({
      message: "Desarchive creado exitosamente.",
      data: createdDesarchive,
      cantidad: createdDesarchive.length
    });
  } catch (error) {
    console.error("Error en createDesarchive:", error);
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  createDesarchive
};
