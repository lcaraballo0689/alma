/**
 * @fileoverview Rutas para la gestión de usuarios.
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  updatePassword 
} = require('../controllers/userController');

// Middleware de autenticación (opcional)
// const { authenticateToken } = require('../middleware/auth');

// Rutas para usuarios
/**
 * @route GET /usuarios
 * @description Obtiene la lista de todos los usuarios.
 * @returns {Object[]} Lista de usuarios en formato JSON.
 */
router.get('/', getAllUsers);           // GET /api/usuarios

/**
 * @route GET /usuarios/:id
 * @description Obtiene un usuario por su ID.
 * @param {number} req.params.id - ID del usuario.
 * @returns {Object} Objeto JSON del usuario encontrado.
 */
router.get('/:id', getUserById);        // GET /api/usuarios/:id

/**
 * @route POST /usuarios
 * @description Crea un nuevo usuario.
 * @param {Object} req.body - Datos del nuevo usuario.
 * @returns {Object} Objeto JSON con el usuario creado o mensaje de error.
 */
router.post('/', createUser);           // POST /api/usuarios

/**
 * @route PUT /usuarios/:id
 * @description Actualiza los datos de un usuario existente.
 * @param {number} req.params.id - ID del usuario a actualizar.
 * @param {Object} req.body - Datos actualizados del usuario.
 * @returns {Object} Objeto JSON con el usuario actualizado o mensaje de error.
 */
router.put('/:id', updateUser);         // PUT /api/usuarios/:id

/**
 * @route DELETE /usuarios/:id
 * @description Elimina un usuario.
 * @param {number} req.params.id - ID del usuario a eliminar.
 * @returns {Object} Objeto JSON con mensaje de confirmación o error.
 */
router.delete('/:id', deleteUser);      // DELETE /api/usuarios/:id

/**
 * @route PATCH /usuarios/:id/password
 * @description Actualiza la contraseña de un usuario.
 * @param {number} req.params.id - ID del usuario.
 * @param {Object} req.body - Objeto que contiene la nueva contraseña.
 * @returns {Object} Objeto JSON con mensaje de confirmación o error.
 */
router.patch('/:id/password', updatePassword); // PATCH /api/usuarios/:id/password

module.exports = router;
