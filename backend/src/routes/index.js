const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const passwordResetRoutes = require('./passwordReset');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/password-reset', passwordResetRoutes);

module.exports = router; 