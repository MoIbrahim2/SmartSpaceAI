const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const apartmentRoutes = require('./apartment.routes');
const roomRoutes = require('./room.routes');
const generationRoutes = require('./generation.routes');
const contactRoutes = require('./contact.routes');
const billingRoutes = require('./billing.routes');
const roomLayoutRoutes = require('./roomLayout.routes');

// Health check for azure vm
router.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Connect sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/apartments', apartmentRoutes);
router.use('/rooms', roomRoutes);
router.use('/generations', generationRoutes);
router.use('/contact', contactRoutes);
router.use('/billing', billingRoutes);
router.use('/v1/rooms', roomLayoutRoutes);

module.exports = router;
