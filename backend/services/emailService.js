const nodemailer = require('nodemailer');
const logger = require('../logger');

// Configuración del transporte SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verificar la configuración del transporte
transporter.verify()
    .then(() => {
        logger.info('Transporte SMTP configurado correctamente.');
    })
    .catch((error) => {
        logger.error('Error al configurar el transporte SMTP:', error);
    });

async function sendEmail({ to, subject, text, html }) {
    try {
        logger.info('Intentando enviar correo electrónico a:', to);
        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Correo electrónico enviado:', info.messageId);
        return info;
    } catch (error) {
        logger.error('Error al enviar correo electrónico:', error);
        throw error;
    }
}

module.exports = {
    sendEmail
}; 