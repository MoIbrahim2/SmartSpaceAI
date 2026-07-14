const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billing.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const { createCheckoutSchema } = require('../validators/billing.validator');

// POST /api/billing/create-checkout (Protected)
router.post('/create-checkout', protect, validate(createCheckoutSchema), billingController.createCheckout);

// GET /api/billing/history (Protected)
router.get('/history', protect, billingController.getHistory);

// POST /api/billing/webhook (Unprotected — verified via Stripe signature)
// NOTE: Raw body parsing is applied at the app level for this route
router.post('/webhook', billingController.stripeWebhook);

module.exports = router;
