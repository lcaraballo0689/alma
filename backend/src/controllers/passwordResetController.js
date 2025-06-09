const crypto = require('crypto-js');
const passwordService = require('../services/passwordService');
const PasswordReset = require('../models/passwordReset');
const emailService = require('../services/emailService');

const PasswordResetController = {
  // Solicitar recuperación de contraseña
  requestReset: async (req, res) => {
    try {
      const { email } = req.body;

      // Verificar si el usuario existe
      const user = await passwordService.findUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.'
        });
      }

      // Generar token aleatorio
      const resetToken = crypto.lib.WordArray.random(32).toString();
      
      // Establecer expiración (1 hora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Invalidar tokens anteriores
      await PasswordReset.invalidateUserTokens(user.id);

      // Crear nuevo token
      await PasswordReset.create(user.id, email, resetToken, expiresAt);

      // Enviar email
      await emailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.'
      });
    } catch (error) {
      console.error('Error en solicitud de recuperación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud de recuperación de contraseña.'
      });
    }
  },

  // Validar token de recuperación
  validateToken: async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetRequest = await PasswordReset.findValidToken(token);
      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'El enlace de recuperación es inválido o ha expirado.'
        });
      }

      res.json({
        success: true,
        message: 'Token válido'
      });
    } catch (error) {
      console.error('Error al validar token:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar el token de recuperación.'
      });
    }
  },

  // Restablecer contraseña
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verificar token
      const resetRequest = await PasswordReset.findValidToken(token);
      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'El enlace de recuperación es inválido o ha expirado.'
        });
      }

      // Actualizar contraseña
      await passwordService.updatePassword(resetRequest.user_id, newPassword);

      // Marcar token como usado
      await PasswordReset.markAsUsed(token);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente.'
      });
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error al restablecer la contraseña.'
      });
    }
  }
};

module.exports = PasswordResetController; 