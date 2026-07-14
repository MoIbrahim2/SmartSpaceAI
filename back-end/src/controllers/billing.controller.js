const Stripe = require('stripe');
const billingService = require('../services/billing.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout Session for credit top-up
 */
const createCheckout = asyncHandler(async (req, res) => {
  const { tier } = req.body;
  const result = await billingService.createCheckoutSession(req.user._id, tier);
  return sendSuccess(res, 'billing.checkout_created', result, HTTP_STATUS.OK);
});

/**
 * Retrieve payment history for the authenticated user
 */
const getHistory = asyncHandler(async (req, res) => {
  const result = await billingService.getPaymentHistory(req.user._id, req.query);
  return sendSuccess(res, 'billing.history_fetched', result, HTTP_STATUS.OK);
});

/**
 * Handle incoming Stripe webhook events
 * NOTE: This endpoint receives raw body (not JSON-parsed) for signature verification
 */
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_KEY
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    await billingService.handleWebhookEvent(event);
  } catch (err) {
    console.error(`Webhook handler error: ${err.message}`);
  }

  // Always return 200 to Stripe to acknowledge receipt
  res.status(200).json({ received: true });
};

module.exports = {
  createCheckout,
  getHistory,
  stripeWebhook
};
