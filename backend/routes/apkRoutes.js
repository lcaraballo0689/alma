const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para descargar la APK
router.get("/download", authMiddleware, (req, res) => {
  try {
    const apkPath = path.join(__dirname, "../public/apk/bodegapp.apk");
    
    // Verificar si el archivo existe
    if (!fs.existsSync(apkPath)) {
      console.error("APK no encontrada en:", apkPath);
      return res.status(404).json({ error: "APK no encontrada" });
    }

    // Obtener el tamaño del archivo
    const stat = fs.statSync(apkPath);
    
    // Configurar headers para la descarga
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="bodegapp.apk"');
    
    // Para dispositivos móviles, agregar headers adicionales
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    // Crear un stream de lectura y enviarlo
    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);
    
    // Manejar errores del stream
    fileStream.on('error', (error) => {
      console.error("Error al leer el archivo:", error);
      res.status(500).json({ error: "Error al leer el archivo" });
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router; 