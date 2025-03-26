const express = require('express');
const router = express.Router();
const { getTransicionesPermitidas } = require('../controllers/estadoTransicionesController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/transiciones',authMiddleware, getTransicionesPermitidas);

module.exports = router;
