// controllers/authController.js
const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenHelper');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar email y password.' });
  }

  try {
    const pool = await connectDB();

    // Consulta los datos del usuario por correo
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT [id], [clienteId], [tipoUsuarioId], [nombre], [direccion],
               [telefono], [cc], [email], [password], [activo], [firma]
        FROM dbo.Usuario
        WHERE email = @email
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña inválidos.' });
    }
    const user = result.recordset[0];

    // Comparación de contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña inválidos.' });
    }

    // Verifica que el usuario esté activo
    if (!user.activo) {
      return res.status(403).json({
        error: 'Usuario inactivo. Contacte con el administrador del sistema.'
      });
    }

    // Obtiene el nombre del cliente si aplica
    let clienteNombre = "";
    if (user.clienteId) {
      const clientResult = await pool.request()
        .input('clienteId', sql.Int, user.clienteId)
        .query(`
          SELECT TOP (1) [nombre]
          FROM dbo.Cliente
          WHERE id = @clienteId
        `);
      if (clientResult.recordset.length > 0) {
        clienteNombre = clientResult.recordset[0].nombre;
      }
    }

    // Consulta los permisos asociados al tipo de usuario
    const permisosResult = await pool.request()
      .input('tipoUsuarioId', sql.Int, user.tipoUsuarioId)
      .query(`
        SELECT p.id, p.nombre, p.descripcion
        FROM dbo.TipoUsuario_Permiso tup
        JOIN dbo.Permiso p ON tup.permisoId = p.id
        WHERE tup.tipoUsuarioId = @tipoUsuarioId
      `);
    const permisos = permisosResult.recordset || [];

    // Excluir campos sensibles y agregar clienteNombre y permisos al objeto del usuario
    const { password: omitPassword, firma: omitFirma, ...userWithoutSensitive } = user;
    userWithoutSensitive.clienteNombre = clienteNombre;
    userWithoutSensitive.permisos = permisos;

    console.log("Permisos del Usuario:", permisos);

    // Genera los tokens incluyendo los datos (con permisos) del usuario
    const token = generateAccessToken(userWithoutSensitive);
    const refreshToken = generateRefreshToken(userWithoutSensitive);

    return res.json({
      token,
      refreshToken,
      user: userWithoutSensitive
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = { login };
