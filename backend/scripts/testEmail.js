require('dotenv').config();
const { sendEmail } = require('../services/emailService');
const logger = require('../logger');

async function testEmail() {
    try {
        await sendEmail({
            to: 'lecmbogota@gmail.com',
            subject: 'Prueba de correo electrónico',
            text: 'Este es un correo de prueba para verificar la configuración del servicio de correo electrónico.'
        });
        logger.info('Correo de prueba enviado exitosamente.');
    } catch (error) {
        logger.error('Error al enviar correo de prueba:', error);
    }
}

testEmail(); 