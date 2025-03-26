// routes/correoRoutes.js
const express = require("express");
const router = express.Router();
const correoController = require("../controllers/correoController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, correoController.sendCorreo);

module.exports = router;
