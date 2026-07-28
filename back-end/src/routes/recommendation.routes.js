/**
 * Recommendation Routes
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const protect = require('../middlewares/auth.middleware');

// POST /api/recommendations/recommend
// Protected — requires authentication
router.post('/recommend', protect, recommendationController.recommend);

module.exports = router;
