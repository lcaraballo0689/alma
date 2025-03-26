/**
 * @fileoverview Rutas para la gestión de Clientes.
 * @module routes/clienteRoutes
 */

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { authMiddleware } = require("../middlewares/authMiddleware");
/**
 * @route GET /clientes
 * @description Obtiene la lista de todos los registros de Cliente.
 * @returns {Object[]} Lista de clientes en formato JSON.
 */
router.get('/', authMiddleware, clienteController.getAll);

/**
 * @route GET /clientes/:id
 * @description Obtiene un registro de Cliente por su ID.
 * @param {number} req.params.id - ID del cliente.
 * @returns {Object} Registro de Cliente en formato JSON.
 */
router.get('/:id', authMiddleware, clienteController.getOne);

/**
 * @route POST /clientes
 * @description Crea un nuevo registro de Cliente.
 * @param {Object} req.body - Datos del nuevo cliente.
 * @returns {Object} Objeto JSON con el ID del cliente creado y un mensaje.
 */
router.post('/', authMiddleware, clienteController.create);

/**
 * @route PUT /clientes/:id
 * @description Actualiza un registro de Cliente existente.
 * @param {number} req.params.id - ID del cliente a actualizar.
 * @param {Object} req.body - Datos actualizados del cliente.
 * @returns {Object} Objeto JSON con un mensaje de éxito.
 */
router.put('/:id', authMiddleware, clienteController.update);

/**
 * @route DELETE /clientes/:id
 * @description Elimina un registro de Cliente.
 * @param {number} req.params.id - ID del cliente a eliminar.
 * @returns {Object} Objeto JSON con un mensaje de confirmación.
 */
router.delete('/:id', authMiddleware, clienteController.delete);

module.exports = router;
