/**
 * @fileoverview Rutas para la gestión de bodegas.
 * @module routes/bodegaRoutes
 */

const { Router } = require('express');
const {
  getAllBodegas,
  getBodegaById,
  createBodega,
  updateBodega,
  deleteBodega
} = require('../controllers/bodegaController');
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = Router();

/**
 * @route GET /bodegas
 * @description Obtiene la lista de todas las bodegas.
 * @returns {Object[]} Lista de bodegas en formato JSON.
 */
router.get('/', getAllBodegas);

/**
 * @route GET /bodegas/:id
 * @description Obtiene una bodega por su ID.
 * @param {number} req.params.id - ID de la bodega.
 * @returns {Object} Objeto JSON de la bodega encontrada.
 */
router.get('/:id', authMiddleware, getBodegaById);

/**
 * @route POST /bodegas
 * @description Crea una nueva bodega.
 * @param {Object} req.body - Datos de la nueva bodega.
 * @returns {Object} Objeto JSON con la bodega creada o mensaje de error.
 */
router.post('/', createBodega);

/**
 * @route PUT /bodegas/:id
 * @description Actualiza los datos de una bodega existente.
 * @param {number} req.params.id - ID de la bodega a actualizar.
 * @param {Object} req.body - Datos actualizados de la bodega.
 * @returns {Object} Objeto JSON con la bodega actualizada o mensaje de error.
 */
router.put('/:id', authMiddleware, updateBodega);

/**
 * @route DELETE /bodegas/:id
 * @description Elimina una bodega.
 * @param {number} req.params.id - ID de la bodega a eliminar.
 * @returns {Object} Objeto JSON con mensaje de confirmación o error.
 */
router.delete('/:id', authMiddleware, deleteBodega);

module.exports = router;
