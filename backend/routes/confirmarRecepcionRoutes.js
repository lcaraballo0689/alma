const express = require("express");
const router = express.Router();
const confirmarRecepcionController = require("../controllers/confirmarRecepcionController");

// Define la ruta para confirmar entrega usando PUT
router.put("/", confirmarRecepcionController.confirmarRecepcion);

module.exports = router;
