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

  // Corrección en la validación - cc y direccion son opcionales
  if (!clienteId || !tipoUsuarioId || !nombre || !telefono || !email || !password || typeof activo === 'undefined') {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios.',
      type: 'validation_error',
      showAlert: {
        icon: 'error',
        title: 'Campos Requeridos',
        text: 'Por favor, completa todos los campos obligatorios para crear el usuario.',
        toast: false,
        position: 'center',
        timer: 0,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#e74c3c'
      }
    });
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
    return res.status(201).json({ 
      message: 'Usuario creado exitosamente', 
      id: newId,
      type: 'success',
      showAlert: {
        icon: 'success',
        title: '¡Usuario Creado!',
        text: `El usuario ${nombre} ha sido creado exitosamente.`,
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false
      }
    });  } catch (error) {
    console.error('Error en createUser:', error);
    
    // Manejo específico de errores de base de datos
    if (error.number === 2627) { // Error de clave duplicada
      // Verificar si el error es por email duplicado
      if (error.message.includes('Usuario_email_key') || error.message.includes('email')) {
        const response = {
          error: `El email ${email} ya se encuentra registrado. Intenta con otro email.`,
          type: 'duplicate_email',
          showAlert: {
            icon: 'warning',
            title: 'Email Ya Registrado',
            text: `El email ${email} ya se encuentra registrado en el sistema. Por favor, intenta con otro email.`,
            toast: false,
            position: 'center',
            timer: 0,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f39c12'
          }
        };
        return res.status(409).json(response);
      }
      
      // Verificar si el error es por cédula duplicada
      if (error.message.includes('Usuario_cc_key') || error.message.includes('cc')) {
        return res.status(409).json({ 
          error: `La cédula ${cc} ya se encuentra registrada. Intenta con otra cédula.`,
          type: 'duplicate_cc',
          showAlert: {
            icon: 'warning',
            title: 'Cédula Ya Registrada',
            text: `La cédula ${cc} ya se encuentra registrada en el sistema. Por favor, verifica el número de cédula.`,
            toast: false,
            position: 'center',
            timer: 0,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f39c12'
          }
        });
      }
      
      // Error genérico de clave duplicada
      return res.status(409).json({ 
        error: 'Ya existe un registro con esa información. Verifica los datos ingresados.',
        type: 'duplicate_key',
        showAlert: {
          icon: 'warning',
          title: 'Información Duplicada',
          text: 'Ya existe un usuario con esa información. Por favor, verifica los datos ingresados.',
          toast: false,
          position: 'center',
          timer: 0,
          showConfirmButton: true,
          confirmButtonText: 'Revisar Datos',
          confirmButtonColor: '#f39c12'
        }
      });
    }
    
    // Error de clave foránea (cliente o tipo de usuario no existe)
    if (error.number === 547) {
      return res.status(400).json({ 
        error: 'El cliente o tipo de usuario seleccionado no es válido.',
        type: 'foreign_key_error',
        showAlert: {
          icon: 'error',
          title: 'Datos Inválidos',
          text: 'El cliente o tipo de usuario seleccionado no existe en el sistema. Por favor, selecciona opciones válidas.',
          toast: false,
          position: 'center',
          timer: 0,
          showConfirmButton: true,
          confirmButtonText: 'Revisar Selección',
          confirmButtonColor: '#e74c3c'
        }
      });
    }
    
    return res.status(500).json({ 
      error: 'Error interno del servidor al crear el usuario.',
      type: 'database_error',
      showAlert: {
        icon: 'error',
        title: 'Error del Sistema',
        text: 'No se pudo crear el usuario. Por favor, contacta al administrador del sistema.',
        toast: false,
        position: 'center',
        timer: 0,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#e74c3c'
      }
    });
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
    }    await request.query(queryText);

    return res.json({ 
      message: 'Usuario actualizado exitosamente.',
      type: 'success',
      showAlert: {
        icon: 'success',
        title: '¡Usuario Actualizado!',
        text: `Los datos del usuario ${nombre} han sido actualizados correctamente.`,
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false
      }
    });  } catch (error) {
    console.error('Error en updateUser:', error);
    
    // Manejo específico de errores de base de datos
    if (error.number === 2627) { // Error de clave duplicada
      if (error.message.includes('Usuario_email_key') || error.message.includes('email')) {
        return res.status(409).json({ 
          error: `El email ${email} ya se encuentra registrado. Intenta con otro email.`,
          type: 'duplicate_email',
          showAlert: {
            icon: 'warning',
            title: 'Email Ya Registrado',
            text: `El email ${email} ya está en uso por otro usuario. Por favor, intenta con otro email.`,
            toast: false,
            position: 'center',
            timer: 0,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#f39c12'
          }
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Error interno del servidor al actualizar usuario.',
      type: 'database_error',
      showAlert: {
        icon: 'error',
        title: 'Error del Sistema',
        text: 'No se pudo actualizar el usuario. Por favor, intenta nuevamente.',
        toast: false,
        position: 'center',
        timer: 0,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#e74c3c'
      }
    });
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
      .query('SELECT nombre FROM dbo.Usuario WHERE id = @id');

    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado.',
        type: 'not_found',
        showAlert: {
          icon: 'error',
          title: 'Usuario No Encontrado',
          text: 'El usuario que intentas eliminar no existe en el sistema.',
          toast: false,
          position: 'center',
          timer: 0,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#e74c3c'
        }
      });
    }

    const userName = check.recordset[0].nombre;

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.Usuario WHERE id = @id');

    return res.json({ 
      message: 'Usuario eliminado exitosamente.',
      type: 'success',
      showAlert: {
        icon: 'success',
        title: 'Usuario Eliminado',
        text: `El usuario "${userName}" ha sido eliminado exitosamente.`,
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false
      }
    });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor al eliminar usuario.',
      type: 'database_error',
      showAlert: {
        icon: 'error',
        title: 'Error del Sistema',
        text: 'No se pudo eliminar el usuario. Por favor, intenta nuevamente.',
        toast: false,
        position: 'center',
        timer: 0,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#e74c3c'
      }
    });
  }
}
/**
 * Actualiza únicamente la contraseña de un usuario.
 * @async
 * @param {Object} req - Objeto de solicitud, con req.params.id y req.body.password.
 * @param {Object} res - Objeto de respuesta.
 */
async function updatePassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.trim() === '') {
    return res.status(400).json({ error: 'La nueva contraseña es obligatoria.' });
  }

  try {
    const pool = await connectDB();

    // Verificar existencia del usuario
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM dbo.Usuario WHERE id = @id');
    if (!check.recordset.length) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Hashear y actualizar
    const hashed = await bcrypt.hash(password, 10);
    await pool.request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar, hashed)
      .query(`
        UPDATE dbo.Usuario
        SET password = @password
        WHERE id = @id
      `);    return res.json({ 
      message: 'Contraseña actualizada correctamente.',
      type: 'success',
      showAlert: {
        icon: 'success',
        title: '¡Contraseña Actualizada!',
        text: 'La contraseña ha sido cambiada exitosamente.',
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false
      }
    });
  } catch (error) {
    console.error('Error en updatePassword:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor.',
      type: 'database_error',
      showAlert: {
        icon: 'error',
        title: 'Error del Sistema',
        text: 'No se pudo actualizar la contraseña. Por favor, intenta nuevamente.',
        toast: false,
        position: 'center',
        timer: 0,
        showConfirmButton: true,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#e74c3c'
      }
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
};
