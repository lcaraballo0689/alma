const express = require("express");
const router = express.Router();
const { getPrestamos, getEstadosPrestamos  } = require("../../controllers/reports/prestamosReportsController");
const { authMiddleware } = require("../../middlewares/authMiddleware");
router.post("/", getPrestamos);

router.get("/estados",authMiddleware, getEstadosPrestamos); // Nueva ruta para obtener estados

module.exports = router;
