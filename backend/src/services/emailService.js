const nodemailer = require('nodemailer');
const config = require('../config/config');

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Función para enviar email de recuperación de contraseña
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.user,
      to: email,
      subject: 'Recuperación de Contraseña - BODEGAPP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003049; text-align: center;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #003049; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Este enlace expirará en 1 hora por razones de seguridad.</p>
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new Error('Error al enviar el email de recuperación');
  }
};

module.exports = {
  sendPasswordResetEmail
}; 