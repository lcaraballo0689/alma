const express = require('express');
const router = express.Router();
const PasswordResetController = require('../controllers/passwordResetController');

// Solicitar recuperación de contraseña
router.post('/request', PasswordResetController.requestReset);

// Validar token
router.get('/validate/:token', PasswordResetController.validateToken);

// Restablecer contraseña
router.post('/reset', PasswordResetController.resetPassword);

module.exports = router; 