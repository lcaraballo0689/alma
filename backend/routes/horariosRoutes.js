const express = require('express');
const router = express.Router();
const horariosController = require('../controllers/horariosController');

// GET - horarios agrupados por cliente
router.get('/', horariosController.getHorariosAgrupados);

// POST - guardar/actualizar horarios semanales de un cliente
router.post('/', horariosController.saveHorariosCliente);

module.exports = router;
