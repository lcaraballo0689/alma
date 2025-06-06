const express = require("express");
const router = express.Router();
const path = require("path");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para descargar la APK
router.get("/download", authMiddleware, (req, res) => {
  try {
    const apkPath = path.join(__dirname, "../public/apk/bodegapp.apk");
    
    // Configurar headers para la descarga
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", 'attachment; filename="bodegapp.apk"');
    
    // Enviar el archivo
    res.download(apkPath, "bodegapp.apk", (err) => {
      if (err) {
        console.error("Error al descargar APK:", err);
        res.status(500).json({ error: "Error al descargar la APK" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router; 