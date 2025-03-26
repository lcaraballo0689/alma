const express = require('express');
const router = express.Router();
const { getNotificacionesHistoricas, updateNotificacion, getResumen, getEntregasVencidas, getEntregasPendientes   } = require("../controllers/notificacionesController");
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/entregas-pendientes',authMiddleware, getEntregasPendientes);
router.get('/entregas-vencidas', authMiddleware, getEntregasVencidas);
router.get('/resumen', authMiddleware, getResumen);
router.get("/historico", authMiddleware, getNotificacionesHistoricas);
router.patch("/markRead/:id", authMiddleware, updateNotificacion);

module.exports = router;
