/**
 * @fileoverview Rutas para la gestión de Custodia.
 * @module routes/custodiaRoutes
 */

const express = require('express');
const router = express.Router();
const custodiaController = require('../controllers/custodiaController');
const { authMiddleware } = require("../middlewares/authMiddleware");

/**
 * @route GET /custodias
 * @description Obtiene la lista de todos los registros de Custodia.
 * @returns {Object[]} Lista de registros de Custodia en formato JSON.
 */
router.get('/', authMiddleware, custodiaController.getAll);

/**
 * @route GET /custodias/:id
 * @description Obtiene un registro de Custodia por su ID.
 * @param {number} req.params.id - ID del registro de Custodia.
 * @returns {Object} Registro de Custodia en formato JSON.
 */
router.get('/:id', authMiddleware, custodiaController.getOne);

/**
 * @route POST /custodias
 * @description Crea un nuevo registro de Custodia.
 * @param {Object} req.body - Datos del nuevo registro de Custodia.
 * @returns {Object} Objeto JSON con el ID del registro creado y un mensaje.
 */
router.post('/', authMiddleware, custodiaController.create);

/**
 * @route POST /custodias/cliente
 * @description Obtiene registros de Custodia filtrados por clienteId.
 * @param {number} req.body.clienteId - ID del cliente.
 * @returns {Object[]} Lista de registros de Custodia en formato JSON.
 */
router.post('/cliente', authMiddleware, custodiaController.getByClienteId);

/**
 * @route PUT /custodias/:id
 * @description Actualiza un registro de Custodia existente.
 * @param {number} req.params.id - ID del registro a actualizar.
 * @param {Object} req.body - Datos actualizados del registro de Custodia.
 * @returns {Object} Objeto JSON con un mensaje de éxito.
 */
router.put('/:id', authMiddleware, custodiaController.update);

/**
 * @route DELETE /custodias/:id
 * @description Elimina un registro de Custodia.
 * @param {number} req.params.id - ID del registro a eliminar.
 * @returns {Object} Objeto JSON con un mensaje de confirmación.
 */
router.delete('/:id', authMiddleware, custodiaController.delete);

module.exports = router;
