const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const apartmentRoutes = require('./apartment.routes');

// Connect sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/apartments', apartmentRoutes);

module.exports = router;
