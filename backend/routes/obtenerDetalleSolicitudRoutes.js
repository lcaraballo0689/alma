const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const { obtenerDetalleSolicitud } = require("../controllers/obtenerDetalleSolicitud");
const { obtenerDetalleSolicitudPrestamo } = require("../controllers/obtenerDetalleSolicitudPrestamo");

router.post("/",authMiddleware, obtenerDetalleSolicitud);
router.post("/prestamo",authMiddleware, obtenerDetalleSolicitudPrestamo);

module.exports = router;
