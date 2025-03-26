// routes/confirmRecepcionRoutes.js
const express = require("express");
const router = express.Router();
const confirmRecepcionController = require("../controllers/confirmRecepcionController");

router.put("/confirmRecepcion", confirmRecepcionController.confirmRecepcion);

module.exports = router;
