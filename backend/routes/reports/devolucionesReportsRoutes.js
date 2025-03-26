const express = require('express');
const { getDevoluciones, getEstados } = require('../../controllers/reports/devolucionesReportsController');
const { authMiddleware } = require("../../middlewares/authMiddleware");

const router = express.Router();

// Ruta para obtener devoluciones con clienteId obligatorio y estado opcional
router.post("/", getDevoluciones);

router.get("/estados", authMiddleware, getEstados); // Nueva ruta para obtener estados

module.exports = router;
