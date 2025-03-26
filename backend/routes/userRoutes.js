/**
 * @fileoverview Rutas para la gestión de usuarios.
 * @module routes/userRoutes
 */

const { Router } = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = Router();

/**
 * @route GET /usuarios
 * @description Obtiene la lista de todos los usuarios.
 * @returns {Object[]} Lista de usuarios en formato JSON.
 */
router.get('/', authMiddleware, getAllUsers);

/**
 * @route GET /usuarios/:id
 * @description Obtiene un usuario por su ID.
 * @param {number} req.params.id - ID del usuario.
 * @returns {Object} Objeto JSON del usuario encontrado.
 */
router.get('/:id', authMiddleware, getUserById);

/**
 * @route POST /usuarios
 * @description Crea un nuevo usuario.
 * @param {Object} req.body - Datos del nuevo usuario.
 * @returns {Object} Objeto JSON con el usuario creado o mensaje de error.
 */
router.post('/', authMiddleware, createUser);

/**
 * @route PUT /usuarios/:id
 * @description Actualiza los datos de un usuario existente.
 * @param {number} req.params.id - ID del usuario a actualizar.
 * @param {Object} req.body - Datos actualizados del usuario.
 * @returns {Object} Objeto JSON con el usuario actualizado o mensaje de error.
 */
router.put('/:id', authMiddleware, updateUser);

/**
 * @route DELETE /usuarios/:id
 * @description Elimina un usuario.
 * @param {number} req.params.id - ID del usuario a eliminar.
 * @returns {Object} Objeto JSON con mensaje de confirmación o error.
 */
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
