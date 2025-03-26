// routes/excelRoutes.js
const express = require('express');
const router = express.Router();
const { cargarPrestamosExcel, descargarPlantillaExcel } = require('../controllers/prestamosMasivosExcelController');
const { authMiddleware } = require('../middlewares/authMiddleware');
// Para manejar uploads de Excel
const multer = require('multer');
const upload = multer();

// POST /api/excel/cargar
router.post('/cargar', authMiddleware, upload.single('file'), cargarPrestamosExcel);

// GET /api/excel/plantilla
router.get('/plantilla', authMiddleware, descargarPlantillaExcel);

module.exports = router;
