const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload'); // multer instance or middleware
const entregaController = require('../controllers/entregaController');

/**
 * Rutas para gestión de entregas de cajas al cliente
 * Endpoint: POST /api/client/entregas/realizar
 * multipart/form-data: solicitudId, usuarioId, entregas (JSON), firma (file), fotos (files[])
 */
router.post(
  '/realizar',
  upload.any(),                  // usa el middleware multer para cargar archivos
  entregaController.realizarEntrega
);

module.exports = router;
