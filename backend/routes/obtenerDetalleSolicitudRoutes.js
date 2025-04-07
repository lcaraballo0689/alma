const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');

const { obtenerDetalleSolicitud } = require("../controllers/obtenerDetalleSolicitud");

router.post("/",authMiddleware, obtenerDetalleSolicitud);

module.exports = router;
