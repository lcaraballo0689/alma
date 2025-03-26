const express = require("express");
const router = express.Router();
const { globalStates } = require("../controllers/globalStatesController");
const { authMiddleware } = require("../middlewares/authMiddleware"); // si usas autenticación

/**
 * @route POST /api/estados/listar-por-tipo
 * @desc Obtiene la lista de estados en función del 'tipo' (Prestamo, Devolucion, etc.) y el 'clienteId'.
 * Body: { tipo: string, clienteId: number }
 */
router.post("/listar", authMiddleware, globalStates);

module.exports = router;
