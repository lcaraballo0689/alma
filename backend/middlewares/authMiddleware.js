// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  let tokenStr = authHeader;
  if (!authHeader.startsWith('Bearer ')) {
    tokenStr = 'Bearer ' + authHeader;
  }
  
  const token = tokenStr.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { authMiddleware: verifyToken };
