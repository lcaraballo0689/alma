// services/email.service.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../logger');

// Configura el transporte SMTP según tus credenciales y configuración,
// incluyendo opciones de timeout para mayor estabilidad.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // ej.: "smtp.example.com"
  port: process.env.SMTP_PORT,       // ej.: 587
  secure: process.env.SMTP_SECURE,                     // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,     // Usuario SMTP
    pass: process.env.SMTP_PASS      // Contraseña SMTP
  },
  socketTimeout: 30000,       // Tiempo de espera en ms para el socket (30 segundos)
  connectionTimeout: 30000,   // Tiempo de espera en ms para la conexión
  greetingTimeout: 30000      // Tiempo de espera en ms para el saludo inicial
});

// Verifica la conexión al SMTP al iniciar el servicio.
transporter.verify((error, success) => {
  if (error) {
    logger.error("Error al verificar el transporte SMTP: " + error.message);
  } else {
    logger.info("Transporte SMTP configurado correctamente.");
  }
});

/**
 * Envía un correo básico.
 * @param {Object} options - Opciones del correo.
 * @param {string} options.to - Destinatario.
 * @param {string} options.subject - Asunto del correo.
 * @param {string} [options.text] - Texto plano del correo.
 * @param {string} [options.html] - HTML del correo.
 * @param {Array} [options.attachments] - (Opcional) Archivos adjuntos.
 * @returns {Promise} Promesa del envío del correo.
 */
function sendEmail({ to, subject, text, html, attachments }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM, // ej.: '"BODEGAPP" <noreply@bodegapp.com>'
    to,
    subject,
    text,
    html,
    attachments
  };
  return transporter.sendMail(mailOptions);
}

/**
 * Compila una plantilla de correo utilizando Handlebars y envía el email.
 * @param {Object} options - Opciones del correo.
 * @param {string} options.to - Destinatario.
 * @param {string} options.subject - Asunto del correo.
 * @param {string} options.template - Nombre de la plantilla (sin extensión).
 * @param {Object} options.data - Datos para reemplazar en la plantilla.
 * @param {Array} [options.attachments] - (Opcional) Archivos adjuntos.
 * @returns {Promise} Promesa del envío del correo.
 */
function sendEmailTemplate({ to, subject, template, data, attachments }) {
  console.log("TEMPLATEEEEEEEEEEE>>>>>>>>>>>>>> ", template);
  
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${template}.html`);
    const source = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);
    const html = compiledTemplate(data);
    return sendEmail({ to, subject, html, attachments });
  } catch (error) {
    logger.error(`Error en sendEmailTemplate: ${error.message}`);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendEmailTemplate
};
