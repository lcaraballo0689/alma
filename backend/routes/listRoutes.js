// routes/listRoutes.js
const express = require("express");
const router = express.Router();
const listController = require("../controllers/listController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.get("/list",authMiddleware, listController.listRecords);

module.exports = router;
