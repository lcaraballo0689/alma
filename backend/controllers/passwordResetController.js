const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const { sendEmail } = require('../services/emailService');
const logger = require('../logger');

// Función para generar código OTP de 6 dígitos
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requestReset(req, res) {
    const { email } = req.body;
    
    try {
        logger.info('Iniciando solicitud de restablecimiento de contraseña para:', email);
        const pool = await connectDB();
        
        // Verificar si el usuario existe
        logger.info('Buscando usuario con email:', email);
        const userResult = await pool.request()
            .input('email', sql.VarChar, email)
            .query(
                'SELECT id, email, nombre FROM Usuario WHERE email = @email'
            );

        logger.info('Resultado de búsqueda de usuario:', userResult.recordset);

        if (userResult.recordset.length === 0) {
            logger.warn('No se encontró usuario con email:', email);
            return res.status(404).json({ 
                error: 'No se encontró ningún usuario con ese correo electrónico.' 
            });
        }

        const user = userResult.recordset[0];
        logger.info('Usuario encontrado:', { id: user.id, email: user.email });

        // Generar código OTP
        const otpCode = generateOTP();
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 15); // OTP válido por 15 minutos

        // Eliminar códigos OTP anteriores para este usuario
        await pool.request()
            .input('userId', sql.Int, user.id)
            .query('DELETE FROM PasswordResets WHERE usuario_id = @userId');

        // Guardar el código OTP en la base de datos
        logger.info('Guardando código OTP en la base de datos');
        await pool.request()
            .input('userId', sql.Int, user.id)
            .input('token', sql.VarChar, otpCode)
            .input('expiration', sql.DateTime, expirationDate)
            .query(
                `INSERT INTO PasswordResets (usuario_id, token, expiracion)
                VALUES (@userId, @token, @expiration)`
            );

        // Enviar el correo electrónico con el código OTP
        logger.info('Enviando código OTP por correo electrónico a:', user.email);
        await sendEmail({
            to: user.email,
            subject: 'Código de Verificación - Restablecimiento de Contraseña',
            text: `Hola ${user.nombre},

Has solicitado restablecer tu contraseña en BodegApp.

Tu código de verificación es: ${otpCode}

Este código expirará en 15 minutos por seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
Equipo de BodegApp`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Código de Verificación</h2>
                    <p>Hola <strong>${user.nombre}</strong>,</p>
                    <p>Has solicitado restablecer tu contraseña en BodegApp.</p>
                    
                    <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #007bff; margin: 0;">Tu código de verificación es:</h3>
                        <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${otpCode}</h1>
                    </div>
                    
                    <p style="color: #666;">Este código expirará en <strong>15 minutos</strong> por seguridad.</p>
                    <p style="color: #666;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #999; font-size: 12px;">Saludos,<br>Equipo de BodegApp</p>
                </div>
            `
        });

        logger.info('Código OTP enviado exitosamente');
        res.json({ 
            message: 'Se ha enviado un código de verificación a tu correo electrónico. Válido por 15 minutos.',
            success: true
        });

    } catch (error) {
        logger.error('Error en requestReset:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud de restablecimiento de contraseña.' 
        });
    }
}

async function validateOTP(req, res) {
    const { email, otp } = req.body;

    try {
        logger.info('Validando código OTP para email:', email);
        const pool = await connectDB();
        
        // Buscar el usuario y el código OTP
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('otp', sql.VarChar, otp)
            .query(`
                SELECT pr.usuario_id, pr.expiracion, u.email, u.nombre
                FROM PasswordResets pr
                INNER JOIN Usuario u ON pr.usuario_id = u.id
                WHERE u.email = @email AND pr.token = @otp
            `);

        if (result.recordset.length === 0) {
            logger.warn('Código OTP inválido para email:', email);
            return res.status(400).json({ 
                error: 'Código de verificación inválido o expirado.' 
            });
        }

        const { expiracion } = result.recordset[0];
        if (new Date() > new Date(expiracion)) {
            logger.warn('Código OTP expirado para email:', email);
            return res.status(400).json({ 
                error: 'El código de verificación ha expirado. Solicita uno nuevo.' 
            });
        }

        logger.info('Código OTP válido para email:', email);
        res.json({ 
            message: 'Código de verificación válido.',
            success: true
        });

    } catch (error) {
        logger.error('Error en validateOTP:', error);
        res.status(500).json({ 
            error: 'Error al validar el código de verificación.' 
        });
    }
}

async function resetPassword(req, res) {
    const { email, otp, password } = req.body;

    try {
        logger.info('Restableciendo contraseña para email:', email);
        const pool = await connectDB();
        
        // Buscar el usuario y validar el código OTP
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('otp', sql.VarChar, otp)
            .query(`
                SELECT pr.usuario_id, pr.expiracion, u.email, u.nombre
                FROM PasswordResets pr
                INNER JOIN Usuario u ON pr.usuario_id = u.id
                WHERE u.email = @email AND pr.token = @otp
            `);

        if (result.recordset.length === 0) {
            logger.warn('Código OTP inválido para restablecimiento:', email);
            return res.status(400).json({ 
                error: 'Código de verificación inválido o expirado.' 
            });
        }

        const { usuario_id, expiracion } = result.recordset[0];
        if (new Date() > new Date(expiracion)) {
            logger.warn('Código OTP expirado para restablecimiento:', email);
            return res.status(400).json({ 
                error: 'El código de verificación ha expirado. Solicita uno nuevo.' 
            });
        }

        // Encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar la contraseña
        await pool.request()
            .input('password', sql.VarChar, hashedPassword)
            .input('userId', sql.Int, usuario_id)
            .query(
                'UPDATE Usuario SET password = @password WHERE id = @userId'
            );

        // Eliminar el código OTP usado
        await pool.request()
            .input('userId', sql.Int, usuario_id)
            .query('DELETE FROM PasswordResets WHERE usuario_id = @userId');

        logger.info('Contraseña restablecida exitosamente para:', email);
        res.json({ 
            message: 'Contraseña actualizada exitosamente.',
            success: true
        });

    } catch (error) {
        logger.error('Error en resetPassword:', error);
        res.status(500).json({ 
            error: 'Error al restablecer la contraseña.' 
        });
    }
}

module.exports = {
    requestReset,
    validateOTP,
    resetPassword
}; 