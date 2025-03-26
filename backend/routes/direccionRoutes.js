/**
 * @fileoverview Rutas para la gestión de Direccion.
 * @module routes/direccionRoutes
 */

const express = require('express');
const router = express.Router();
const direccionController = require('../controllers/direccionController');
const { authMiddleware } = require("../middlewares/authMiddleware");
/**
 * @route GET /direcciones
 * @description Obtiene los TOP 1000 registros de direcciones.
 */
router.get('/', authMiddleware, direccionController.getAllDirecciones);

/**
 * @route GET /direcciones/:id
 * @description Obtiene una dirección por su ID.
 * @param {number} req.params.id - ID de la dirección.
 */
router.get('/:id', authMiddleware, direccionController.getDireccionById);

/**
 * @route GET /direcciones/cliente/:clienteId
 * @description Obtiene todas las direcciones para un cliente dado.
 * @param {number} req.params.clienteId - ID del cliente.
 */
router.get('/cliente/:clienteId', authMiddleware, direccionController.getDireccionesByClienteId);

/**
 * @route POST /direcciones
 * @description Crea una nueva dirección.
 */
router.post('/', authMiddleware, direccionController.createDireccion);

/**
 * @route PUT /direcciones/:id
 * @description Actualiza una dirección existente.
 * @param {number} req.params.id - ID de la dirección a actualizar.
 */
router.put('/:id', authMiddleware, direccionController.updateDireccion);

/**
 * @route DELETE /direcciones/:id
 * @description Elimina una dirección.
 * @param {number} req.params.id - ID de la dirección a eliminar.
 */
router.delete('/:id', authMiddleware, direccionController.deleteDireccion);

module.exports = router;
