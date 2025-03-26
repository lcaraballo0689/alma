const express = require('express');
const router = express.Router();
const { obtenerHistorialSolicitudes } = require('../controllers/auditoriaController');
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post('/', obtenerHistorialSolicitudes);

module.exports = router;
