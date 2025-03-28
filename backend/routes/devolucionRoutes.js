const express = require("express");
const router = express.Router();
const {createDevolucion} = require("../controllers/devolucionController");
const { cargarDevolucionesMasivasExcel } = require('../controllers/DevolucionesMasivasExcelController')
const { authMiddleware } = require("../middlewares/authMiddleware");
const multer = require("multer");
const upload = multer(); // Configuración básica (en memoria)

// Ruta para actualizar estados mediante PUT
router.post('/crear', authMiddleware, createDevolucion);
// Ruta para cargar devoluciones desde un archivo Excel
router.post("/cargueMasivo",authMiddleware, upload.single("file"), cargarDevolucionesMasivasExcel);


module.exports = router;
