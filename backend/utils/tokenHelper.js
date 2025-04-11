// utils/tokenHelper.js
const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
  // Clonar el payload y eliminar propiedades que puedan causar conflicto (exp, iat)
  const newPayload = { ...payload };
  delete newPayload.exp;
  delete newPayload.iat;
  // El tiempo de expiración del token se obtiene de la variable de entorno TOKEN_EXPIRATION,
  // o se usa el valor por defecto '15m'
  const expiresIn = process.env.TOKEN_EXPIRATION || '15m';
  // Se firma el token usando el secreto definido en ACCESS_TOKEN_SECRET
  return jwt.sign(newPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn });
}

function generateRefreshToken(payload) {
  // Clonar el payload y eliminar exp e iat para evitar posibles conflictos
  const newPayload = { ...payload };
  delete newPayload.exp;
  delete newPayload.iat;
  // El tiempo de expiración para el refresh token se obtiene de REFRESH_TOKEN_EXPIRATION o se utiliza '7d'
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
  // Se usa REFRESH_TOKEN_SECRET si está definido, de lo contrario se utiliza ACCESS_TOKEN_SECRET
  return jwt.sign(newPayload, process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, { expiresIn });
}

module.exports = { generateAccessToken, generateRefreshToken };
