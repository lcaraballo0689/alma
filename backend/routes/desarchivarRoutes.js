const express = require("express");
const router = express.Router();
const {
  iniciarDesarchivar,
  confirmarDesarchivar,
  confirmarDesarchivarMasivo,
  getPdfFile,
  consultarDetalleDesarchivo,
  listarDesarchivos,
  cancelarDesarchivar,
  actualizarEstadoDesarchivo
} = require("../controllers/desarchivarController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Endpoint para iniciar el proceso de desarchivo (traslado a dirección del cliente)
router.post("/iniciar", authMiddleware, iniciarDesarchivar);

// Endpoint para confirmar la recepción y generar constancia PDF
router.post("/confirmar-masivo", authMiddleware, confirmarDesarchivarMasivo);
router.post("/confirmar", authMiddleware, confirmarDesarchivar);
router.post("/pdf", authMiddleware, getPdfFile);

/**
 * @route POST /api/desarchivo/consultar
 * @desc Consulta los registros de desarchivo de un cliente,
 *       recibiendo "clienteId" obligatorio en el body.
 */
router.post("/consultar", authMiddleware, consultarDetalleDesarchivo);
router.post("/listar", authMiddleware, listarDesarchivos);
router.post("/cancelar", authMiddleware, cancelarDesarchivar);
router.post('/actualizar-estado', authMiddleware, actualizarEstadoDesarchivo);

module.exports = router;
