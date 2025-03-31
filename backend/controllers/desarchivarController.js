const path = require("path");
const logger = require("../logger");

const { connectDB, sql } = require("../config/db");
const { getUserById } = require("../services/userService");
const { procesarTransferenciaInterna } = require("./transferenciasController");
const {
  getOrCreateConsecutivos,
} = require("../services/consecutivoService");
const {
  getCustodiasDisponibles,
} = require("../services/custodiaService");

// Controlador actualizado para crear una cabecera y múltiples detalles de Desarchive
async function createDesarchive(req, res) {
  const { custodiaIds, usuarioId, direccion_entrega, observaciones } =
    req.body;

  const errores = [];
  if (!custodiaIds?.length)
    errores.push("Debe seleccionar al menos una custodia.");
  if (!usuarioId) errores.push("No se ha proporcionado el ID del usuario.");
  if (!direccion_entrega)
    errores.push("No se ha proporcionado la dirección de entrega.");

  if (errores.length) {
    return res
      .status(400)
      .json({ mensaje: "Hay errores en los datos proporcionados.", errores });
  }
  logger.info("Body createPrestamos: " + JSON.stringify(req.body));

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
      return res
        .status(404)
        .json({ error: "Una o más custodias no están disponibles." });
    }

    const consecutivos = await getOrCreateConsecutivos(
      transaction,
      user.clienteId
    );

    console.log("belhemont", consecutivos);
    
  
    const createdDesarchive = [];

    for (const custodia of custodias) {

       //await marcarCustodiaSolicitada(transaction, custodia.id);

       createdDesarchive.push({
        custodiaIDd: custodia.id,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        item: custodia.item,
        direccion_entrega,
        observaciones: observaciones
       });
    }

    //TODO: Armar el payload para createTransferencia SE HACE LA SOLICITUD DE TRASLADO
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
    // Llamar a createTransferencia
    
    const aidis = await procesarTransferenciaInterna(transferenciaPayload, transaction);
    console.log("aidis", aidis);
    
    await transaction.commit();


    logger.info(
      `Notificación WS emitida para el canal usuario_${user.clienteId}.`
    );
    return res.status(201).json({
      message: "Préstamos creados exitosamente.",
      data: createdDesarchive,
      cantidad: createdDesarchive.length
    });
  } catch (error) {
    console.error("Error en createPrestamos:", error);
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
