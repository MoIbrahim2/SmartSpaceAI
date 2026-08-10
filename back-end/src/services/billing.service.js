const Stripe = require('stripe');
const User = require('../models/user.model');
const PaymentHistory = require('../models/paymentHistory.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Tier configuration: base credits → { price in piasters, total credits (with bonus) }
 * Price = tier × 0.75 EGP (converted to piasters for Stripe)
 */
const TIER_CONFIG = {
  500:  { amountPiasters: 37500,  creditsAdded: 500,  label: '500 Credits' },
  2000: { amountPiasters: 150000, creditsAdded: 2300, label: '2,000 + 300 FREE Credits' },
  5000: { amountPiasters: 375000, creditsAdded: 6000, label: '5,000 + 1,000 FREE Credits' }
};

/**
 * Create a Stripe Checkout Session and log the intent
 * @param {string} userId - Authenticated user's ID
 * @param {number} tier - Requested tier (500, 2000, or 5000)
 * @returns {Promise<Object>} { checkoutUrl }
 */
const createCheckoutSession = async (userId, tier) => {
  const config = TIER_CONFIG[tier];
  if (!config) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'billing.invalid_tier');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'egp',
        product_data: {
          name: config.label,
          description: `Top up your SmartSpace AI account with ${config.label}`
        },
        unit_amount: config.amountPiasters
      },
      quantity: 1
    }],
    metadata: {
      userId: userId.toString(),
      creditsAdded: config.creditsAdded.toString()
    },
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/credits`
  });

  // Log payment intent
  await PaymentHistory.create({
    userId,
    stripeSessionId: session.id,
    amountPaid: config.amountPiasters,
    currency: 'egp',
    creditsAdded: config.creditsAdded,
    status: 'pending'
  });

  return { checkoutUrl: session.url };
};

/**
 * Retrieve payment history for a specific user
 * @param {string} userId
 * @param {Object} query - Pagination params
 * @returns {Promise<Object>} Paginated payment history
 */
const getPaymentHistory = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { userId, status: 'completed' };

  const payments = await PaymentHistory.find(filter)
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PaymentHistory.countDocuments(filter);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Handle Stripe webhook events
 * @param {Object} event - Verified Stripe event object
 */
const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const stripeSessionId = session.id;

      // Check if this checkout session is for a furniture order
      if (session.metadata?.type === 'furniture_order') {
        const orderIds = (session.metadata.orderIds || '').split(',').filter(Boolean);
        if (orderIds.length > 0) {
          const Order = require('../models/order.model');
          await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status: 'PENDING' } }
          );
          console.log(`Webhook: Confirmed payment for furniture orders ${orderIds.join(', ')}`);
        }
        return;
      }

      const userId = session.metadata?.userId;
      const creditsAdded = parseInt(session.metadata?.creditsAdded, 10);

      // Idempotency: check if already processed
      const payment = await PaymentHistory.findOne({ stripeSessionId });
      if (!payment) {
        console.warn(`Webhook: No payment record found for session ${stripeSessionId}`);
        return;
      }

      if (payment.status === 'completed') {
        console.log(`Webhook: Session ${stripeSessionId} already completed, skipping.`);
        return;
      }

      // Mark payment as completed
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      // Atomically increment user credits
      if (userId && !isNaN(creditsAdded)) {
        await User.findByIdAndUpdate(userId, {
          $inc: { credits: creditsAdded }
        });
        console.log(`Webhook: Added ${creditsAdded} credits to user ${userId}`);
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const stripeSessionId = session.id;

      // Hard-delete the abandoned payment record if present
      await PaymentHistory.deleteOne({ stripeSessionId });
      console.log(`Webhook: Deleted expired session record ${stripeSessionId}`);
      break;
    }

    default:
      console.log(`Webhook: Unhandled event type ${event.type}`);
  }
};

/**
 * Verify a Stripe checkout session directly with Stripe API and fulfill credits.
 * Acts as a fail-safe fallback for local development or missed webhooks.
 * @param {string} userId - Authenticated user ID
 * @param {string} sessionId - Stripe checkout session ID (cs_...)
 * @returns {Promise<Object>}
 */
const verifyCheckoutSession = async (userId, sessionId) => {
  if (!sessionId) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'billing.missing_session_id');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'billing.session_not_found');
  }

  if (session.payment_status !== 'paid') {
    return { paid: false, status: session.payment_status };
  }

  const creditsAdded = parseInt(session.metadata?.creditsAdded, 10);
  const sessionUserId = session.metadata?.userId || userId;

  let payment = await PaymentHistory.findOne({ stripeSessionId: sessionId });

  if (payment && payment.status === 'completed') {
    const updatedUser = await User.findById(sessionUserId);
    return { paid: true, credits: updatedUser ? updatedUser.credits : 0, user: updatedUser, alreadyProcessed: true };
  }

  if (!payment) {
    payment = new PaymentHistory({
      userId: sessionUserId,
      stripeSessionId: sessionId,
      amountPaid: session.amount_total,
      currency: session.currency || 'egp',
      creditsAdded: isNaN(creditsAdded) ? 0 : creditsAdded,
      status: 'pending'
    });
  }

  payment.status = 'completed';
  payment.completedAt = new Date();
  await payment.save();

  let updatedUser = null;
  if (sessionUserId && !isNaN(creditsAdded) && creditsAdded > 0) {
    updatedUser = await User.findByIdAndUpdate(
      sessionUserId,
      { $inc: { credits: creditsAdded } },
      { new: true }
    );
    console.log(`VerifySession Fallback: Added ${creditsAdded} credits to user ${sessionUserId}`);
  } else {
    updatedUser = await User.findById(sessionUserId);
  }

  return {
    paid: true,
    credits: updatedUser ? updatedUser.credits : 0,
    user: updatedUser
  };
};

module.exports = {
  createCheckoutSession,
  getPaymentHistory,
  handleWebhookEvent,
  verifyCheckoutSession
};
