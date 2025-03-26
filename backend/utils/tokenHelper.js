// utils/tokenHelper.js
const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
  // Clonar el payload y eliminar propiedades que puedan causar conflicto
  const newPayload = { ...payload };
  delete newPayload.exp;
  delete newPayload.iat;
  const expiresIn = process.env.TOKEN_EXPIRATION || '15m';
  return jwt.sign(newPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn });
}

function generateRefreshToken(payload) {
  // Similarmente, eliminar exp y iat del payload si existen
  const newPayload = { ...payload };
  delete newPayload.exp;
  delete newPayload.iat;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
  return jwt.sign(newPayload, process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, { expiresIn });
}

module.exports = { generateAccessToken, generateRefreshToken };
