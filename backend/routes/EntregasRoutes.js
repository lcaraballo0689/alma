// routes/confirmEntregaRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { confirmEntrega, listarEntregas } = require("../controllers/EntregasController");

/**
 * Ruta para confirmar una entrega.
 * Método: PUT
 */
router.put('/confirmar', authMiddleware, confirmEntrega);

/**
 * Ruta para listar entregas.
 * Método: POST
 */
router.post('/listar', authMiddleware, listarEntregas);

module.exports = router;
