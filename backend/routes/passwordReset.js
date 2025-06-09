const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Solicitar recuperación de contraseña
router.post('/request', passwordResetController.requestReset);

// Validar token
router.get('/validate/:token', passwordResetController.validateToken);

// Restablecer contraseña
router.post('/reset', passwordResetController.resetPassword);

module.exports = router; 