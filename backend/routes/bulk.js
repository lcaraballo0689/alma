const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { cargarCustodias } = require('../controllers/bulkController');

// Configuración del almacenamiento para multer
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // Máximo 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') cb(null, true);
    else cb(new Error('Solo se permiten archivos CSV'));
  }
});

// Ruta para la carga masiva
router.post('/cargar-custodias', upload.single('archivo'), cargarCustodias);

module.exports = router;
