const express = require('express');
const router = express.Router();
const bodegaController = require('../controllers/bodegaController');
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para obtener todas las bodegas
router.get('/', authMiddleware, bodegaController.getAllBodegas);

module.exports = router;
