// routes/correo2Routes.js
const express = require("express");
const router = express.Router();
const correo2Controller = require("../controllers/correo2Controller");

router.post("/correo2", correo2Controller.sendCorreo2);

module.exports = router;
