const express = require('express');
const router = express.Router();
const { requestReset, validateOTP, resetPassword } = require('../controllers/passwordResetController');

// Ruta para solicitar el código OTP de restablecimiento de contraseña
router.post('/request', requestReset);

// Ruta para validar el código OTP
router.post('/validate-otp', validateOTP);

// Ruta para restablecer la contraseña con el código OTP
router.post('/reset', resetPassword);

module.exports = router; 