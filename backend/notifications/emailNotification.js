// notifications/emailNotification.js
const { getTemplate } = require('../utils/emailTemplateManager');
const nodemailer = require('nodemailer');
const logger = require('../logger');

// Configura el transporte de correo (ajusta la configuración según tu proveedor SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  auth: {
    user: 'user@example.com',
    pass: 'yourpassword'
  }
});

async function sendLoanConfirmationEmail(to, data) {
  try {
    // Compila la plantilla con los datos recibidos
    const emailBody = getTemplate('confirmacionSolicitudPrestamo', data);
    const mailOptions = {
      from: '"BODEGAPP" <noreply@bodegapp.com>',
      to: to,
      subject: 'Confirmación de Solicitud de Préstamo',
      html: emailBody,
      attachments: [
        {
          filename: 'logo.png',
          path: './logo.png', // Asegúrate de que la ruta sea correcta
          cid: 'logo' // El mismo cid que se usa en el template HTML
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email enviado a ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error al enviar email a ${to}: ${error.message}`);
    throw error;
  }
}

module.exports = { sendLoanConfirmationEmail };
