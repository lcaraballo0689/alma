const express = require('express');
const router = express.Router();
const { 
  createPrestamos,
  asignarTransportadorPrestamo,
  entregarPrestamo,
  confirmarRecepcionPrestamo,
  actualizarEstadoPrestamo,
  eliminarPrestamo,
  consultarPrestamos,
  consultarDetallePrestamo
} = require('../controllers/prestamosController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Crear una nueva solicitud de préstamo
router.post('/crear', authMiddleware, createPrestamos);

// Asignar un transportador para la entrega del préstamo
router.put('/asignarTransportador', authMiddleware, asignarTransportadorPrestamo);

// Registrar que el transportador ha entregado la(s) caja(s) al cliente
router.put('/entregar', authMiddleware, entregarPrestamo);

// El cliente confirma la recepción de la(s) caja(s)
router.put('/confirmarRecepcion', authMiddleware, confirmarRecepcionPrestamo);

// Actualizar el estado final de la solicitud de préstamo (ej. COMPLETADO o CANCELADO)
router.put('/actualizarEstado', authMiddleware, actualizarEstadoPrestamo);

// Eliminar la solicitud de préstamo (solo si está en estado PENDIENTE)
router.delete('/eliminar', authMiddleware, eliminarPrestamo);

// Consultar todas las solicitudes de préstamo para un cliente
router.post('/consultar', authMiddleware, consultarPrestamos);

// Consultar el detalle de una solicitud de préstamo (cabecera y items)
router.post('/detalle', authMiddleware, consultarDetallePrestamo);

module.exports = router;
