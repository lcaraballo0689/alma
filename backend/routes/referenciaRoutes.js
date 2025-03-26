/**
 * @fileoverview Rutas para la gestión de la nomenclatura de referencia.
 * @module routes/nomenclaturaRoutes
 */

const { Router } = require('express');
const {
  getAllNomenclaturas,
  getNomenclaturaById,
  createNomenclatura,
  updateNomenclatura,
  deleteNomenclatura,
  bulkCreateNomenclaturas,
  generarReferencia
} = require('../controllers/nomenclaturaController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @route POST /nomenclatura/getAll
 * @description Obtiene todas las configuraciones de nomenclatura para un cliente.
 * Se espera recibir en el body: { "clienteId": 2 }
 */
router.post('/getAll', authMiddleware, getAllNomenclaturas);

/**
 * @route POST /nomenclatura/getById
 * @description Obtiene una configuración de nomenclatura por su ID para un cliente.
 * Se espera recibir en el body: { "id": 5, "clienteId": 2 }
 */
router.post('/getById', authMiddleware, getNomenclaturaById);

/**
 * @route POST /nomenclatura/create
 * @description Crea una nueva configuración de nomenclatura.
 * Se espera recibir en el body la configuración completa (incluyendo clienteId).
 */
router.post('/create', authMiddleware, createNomenclatura);

/**
 * @route POST /nomenclatura/update
 * @description Actualiza una configuración de nomenclatura existente.
 * Se espera recibir en el body: { "id": 5, "clienteId": 2, ...datos a actualizar... }
 */
router.post('/update', authMiddleware, updateNomenclatura);

/**
 * @route POST /nomenclatura/delete
 * @description Elimina una configuración de nomenclatura.
 * Se espera recibir en el body: { "id": 5, "clienteId": 2 }
 */
router.post('/delete', authMiddleware, deleteNomenclatura);

/**
 * @route POST /nomenclatura/bulkCreate
 * @description Crea múltiples configuraciones de nomenclatura.
 * Se espera recibir en el body:
 * {
 *   "nomenclaturas": [ {...}, {...}, ... ]
 * }
 */
router.post('/bulkCreate', authMiddleware, bulkCreateNomenclaturas);

/**
 * @route POST /nomenclatura/generarNomenclaruta
 * @description Genera la plantilla de referencia a partir de la configuración y datos proporcionados.
 * Se espera recibir en el body:
 * {
 *   "modulo": "transferencia",
 *   "datos": {
 *     "ubicacionId": "501",
 *     "anio": "2025",
 *     "mes": "03",
 *     "dia": "21",
 *     "secuencia": "001"
 *   }
 * }
 */
router.post('/generarNomenclaruta', authMiddleware, generarReferencia);

module.exports = router;

