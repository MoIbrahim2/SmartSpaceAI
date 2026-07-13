const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const apartmentRoutes = require('./apartment.routes');
const roomRoutes = require('./room.routes');
const generationRoutes = require('./generation.routes');
const contactRoutes = require('./contact.routes');

// Connect sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/apartments', apartmentRoutes);
router.use('/rooms', roomRoutes);
router.use('/generations', generationRoutes);
router.use('/contact', contactRoutes);

module.exports = router;
