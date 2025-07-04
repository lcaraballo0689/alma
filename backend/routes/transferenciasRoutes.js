// routes/transferenciasRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTransferencia,
  scanQR,
  consultarTransferencias,
  consultarDetalleTransferencia,
  actualizarEstadoTransferencia,
  eliminarTransferencia,
  asignarUbicaciones,
  recepcionar,
  asignarTransportador,
  recoger,  listarUbicaciones,
  listarTransportistas,
  detalleCompletoTransferencia,
  getEntregaDetails
} = require('../controllers/transferenciasController');
const { authMiddleware } = require("../middlewares/authMiddleware");
router.post('/crear', authMiddleware, createTransferencia);
router.post('/qr/scan', authMiddleware, scanQR);
router.post('/consultar', authMiddleware, consultarTransferencias);
router.post('/detalle', authMiddleware, consultarDetalleTransferencia);
router.put('/actualizarEstado', authMiddleware, actualizarEstadoTransferencia);
router.put('/recepcionar', authMiddleware, recepcionar);
router.put('/asignarUbicaciones', authMiddleware, asignarUbicaciones);
router.delete('/eliminar', authMiddleware, eliminarTransferencia);
router.put('/asignarTransportador', authMiddleware, asignarTransportador);
router.put('/recoger', authMiddleware, recoger);
router.get('/ubicaciones', authMiddleware, listarUbicaciones);
router.get('/transportistas', authMiddleware, listarTransportistas);
router.post('/detalleCompleto', authMiddleware, detalleCompletoTransferencia);
router.post('/entregaDetails', authMiddleware, getEntregaDetails);


module.exports = router;
