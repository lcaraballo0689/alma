const express = require("express");
const router = express.Router();
const { downloadPDF } = require("../../controllers/reports/downloadController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Ruta para descargar un PDF
router.post("/", authMiddleware, downloadPDF);

module.exports = router;
