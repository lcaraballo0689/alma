const express = require('express');
const router = express.Router();
const carpetaController = require('../controllers/carpetaController');

// Ruta para obtener todas las carpetas
router.get('/', carpetaController.getAllCarpetas);

module.exports = router;
