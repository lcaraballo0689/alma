const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para obtener todas las cajas
router.get('/', authMiddleware, cajaController.getAllCajas);

module.exports = router;
