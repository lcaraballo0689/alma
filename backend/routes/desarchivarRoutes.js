const express = require("express");
const router = express.Router();
const { createDesarchive } = require("../controllers/desarchivarController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para crear un desarchivado
router.post("/crear",authMiddleware, createDesarchive);

module.exports = router;
