const express = require("express");
const router = express.Router();
const {createDevolucion} = require("../controllers/devolucionController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Ruta para actualizar estados mediante PUT
router.post('/crear', authMiddleware, createDevolucion);


module.exports = router;
