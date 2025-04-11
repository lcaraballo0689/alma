// controllers/userController.js

const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcrypt');
const { processFirma } = require('./processFirma'); // Importa la función auxiliar


/**
 * Obtiene todos los usuarios.
 * @async
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object[]>} Lista de usuarios en formato JSON.
 */
async function getAllUsers(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query('SELECT * FROM dbo.Usuario');
    return res.json(result.recordset);
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Obtiene un usuario por su ID.
 * @async
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} Usuario encontrado en formato JSON.
 */
async function getUserById(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM dbo.Usuario WHERE id = @id');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error en getUserById:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Crea un nuevo usuario.
 * La contraseña se almacena de forma hasheada.
 * @async
 * @param {Object} req - Objeto de solicitud que contiene los datos del usuario en req.body.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} Objeto JSON con el ID del usuario creado y un mensaje.
 */
async function createUser(req, res) {
  const {
    clienteId,
    tipoUsuarioId,
    nombre,
    direccion,
    telefono,
    cc,
    email,
    password,
    activo,
    firma
  } = req.body;

  if (!clienteId || !tipoUsuarioId || !nombre || !telefono || !email || !password || typeof activo === 'undefined') {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    // Hashear la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await connectDB();
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .input('tipoUsuarioId', sql.Int, tipoUsuarioId)
      .input('nombre', sql.NVarChar, nombre)
      .input('direccion', sql.NVarChar, direccion || '')
      .input('telefono', sql.NVarChar, telefono)
      .input('cc', sql.NVarChar, cc || '')
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('activo', sql.Bit, activo)
      .input('firma', sql.NVarChar, firma || '')
      .query(`
        INSERT INTO dbo.Usuario
          (clienteId, tipoUsuarioId, nombre, direccion, telefono, cc, email, password, activo, firma)
        VALUES
          (@clienteId, @tipoUsuarioId, @nombre, @direccion, @telefono, @cc, @email, @password, @activo, @firma);
        SELECT SCOPE_IDENTITY() as insertedId;
      `);

    const newId = result.recordset[0].insertedId;
    return res.status(201).json({ message: 'Usuario creado', id: newId });
  } catch (error) {
    console.error('Error en createUser:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Actualiza un usuario existente.
 * Nota: Actualmente la actualización de la contraseña se realiza sin rehashear;
 * considera agregar lógica para actualizar la contraseña solo si se envía un nuevo valor.
 * @async
 * @param {Object} req - Objeto de solicitud, con req.params.id y datos en req.body.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} Objeto JSON con un mensaje de éxito.
 */
/**
 * Actualiza un usuario existente.
 * Nota: Si password está vacío, no se actualiza la contraseña.
 * @async
 * @param {Object} req - Objeto de solicitud, con req.params.id y datos en req.body.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} Objeto JSON con un mensaje de éxito.
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const {
    clienteId,
    tipoUsuarioId,
    nombre,
    telefono,
    email,
    password,
    activo
  } = req.body;
  // Se asume que 'firma' puede venir en el body pero se le dará prioridad al archivo si está presente
  let { firma } = req.body;

  try {
    const pool = await connectDB();
    // Verificar que el usuario exista
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT password FROM dbo.Usuario WHERE id = @id');

    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    // Determinar si se proporcionó una nueva contraseña
    const isPasswordProvided = password && password.trim() !== "";
    let hashedPassword;
    if (isPasswordProvided) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Si el request incluye un archivo para la firma, se procesa y se asigna a 'firma'
    if (req.file) {
      firma = processFirma(req.file);
    }

    // Construir la consulta SQL según si se actualiza la contraseña o no
    let queryText;
    const request = pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .input('tipoUsuarioId', sql.Int, tipoUsuarioId)
      .input('nombre', sql.NVarChar, nombre)
      .input('telefono', sql.NVarChar, telefono)
      .input('email', sql.NVarChar, email)
      .input('activo', sql.Bit, activo)
      .input('firma', sql.NVarChar, firma || '');

    if (isPasswordProvided) {
      queryText = `
        UPDATE dbo.Usuario
        SET
          clienteId = @clienteId,
          tipoUsuarioId = @tipoUsuarioId,
          nombre = @nombre,
          telefono = @telefono,
          email = @email,
          password = @password,
          activo = @activo,
          firma = @firma
        WHERE id = @id
      `;
      request.input('password', sql.NVarChar, hashedPassword);
    } else {
      queryText = `
        UPDATE dbo.Usuario
        SET
          clienteId = @clienteId,
          tipoUsuarioId = @tipoUsuarioId,
          nombre = @nombre,
          telefono = @telefono,
          email = @email,
          activo = @activo,
          firma = @firma
        WHERE id = @id
      `;
    }

    await request.query(queryText);

    return res.json({ message: 'Usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('Error en updateUser:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


/**
 * Elimina un usuario.
 * @async
 * @param {Object} req - Objeto de solicitud con req.params.id.
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<Object>} Objeto JSON con un mensaje de confirmación.
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM dbo.Usuario WHERE id = @id');

    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.Usuario WHERE id = @id');

    return res.json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
