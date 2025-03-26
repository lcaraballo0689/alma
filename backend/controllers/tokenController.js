// controllers/tokenController.js
const jwt = require('jsonwebtoken');
const { generateAccessToken } = require('../utils/tokenHelper');

async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token requerido.' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET);
    // Generar un nuevo access token a partir del payload del refresh token,
    // sin las propiedades exp e iat (se eliminan en generateAccessToken)
    const newAccessToken = generateAccessToken(decoded);

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refrescando token:', error);
    return res.status(401).json({ error: 'Refresh token inválido o expirado.' });
  }
}

module.exports = { refreshToken };
