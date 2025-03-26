/**
 * @fileoverview Rutas de autenticación para el API.
 * @module routes/authRoutes
 */

const { Router } = require('express');
const { login } = require('../controllers/authController');
const { refreshToken } = require('../controllers/tokenController');

const router = Router();

/**
 * @route POST /login
 * @description Autentica al usuario y genera un token JWT.
 * @param {Object} req.body - Objeto que contiene las credenciales (por ejemplo, email y password).
 * @returns {Object} Un objeto JSON que incluye el token en caso de éxito, o un error.
 */
router.post('/login', login);

/**
 * @route POST /refresh
 * @description Refresca el token JWT.
 * @param {Object} req.body - Objeto que contiene el refreshToken.
 * @returns {Object} Un objeto JSON que incluye el nuevo token en caso de éxito, o un error.
 */
router.post('/refresh', refreshToken);

module.exports = router;
