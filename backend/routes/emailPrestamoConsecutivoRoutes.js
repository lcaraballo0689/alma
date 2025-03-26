// routes/emailPrestamoConsecutivoRoutes.js
const express = require("express");
const router = express.Router();
const emailPrestamoConsecutivoController = require("../controllers/emailPrestamoConsecutivoController");

router.post("/emailPrestamoConsecutivo", emailPrestamoConsecutivoController.sendEmailPrestamoConsecutivo);

module.exports = router;
