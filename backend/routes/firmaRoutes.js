const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload"); // ✅ debe existir y exportar `upload.single(...)`
const { authMiddleware } = require('../middlewares/authMiddleware'); // ✅ este archivo debe existir y exportar la función
const { cargarFirmaUsuarioArchivo } = require("../controllers/cargarFirmaUsuarioController"); // ✅ este archivo debe existir y exportar la función

router.post("/cargar", authMiddleware, upload.single("firma"), cargarFirmaUsuarioArchivo); // ❗ Si aquí algo es undefined, lanza el error

module.exports = router;
