// routes/transferenciasRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Configuración básica (en memoria)
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
const {
  descargarPlantillaUbicaciones,
  cargarUbicacionesExcel,
  descargarPlantillaTransferencias,
  procesarAsignacionesTransferencias,
  validarCodigosUbicacion
} = require('../controllers/transferenciasExcelController');
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
router.get('/descargarPlantillaUbicaciones/:solicitudId', authMiddleware, descargarPlantillaUbicaciones);
router.post('/cargarUbicacionesExcel', authMiddleware, upload.single('file'), cargarUbicacionesExcel);

// Rutas específicas para transferencias
router.get('/descargarPlantillaTransferencias/:transferenciaId', authMiddleware, descargarPlantillaTransferencias);
router.post('/procesarAsignacionesTransferencias', authMiddleware, procesarAsignacionesTransferencias);

// Nuevo endpoint para validar códigos de ubicación
router.post('/validarCodigosUbicacion', authMiddleware, validarCodigosUbicacion);

module.exports = router;
