const rateLimit = require('express-rate-limit');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Builds a standard rate limiter handler that returns a consistent JSON error response.
 * @param {string} translationKey - i18n key for the message (falls back to defaultMsg)
 * @param {string} defaultMsg     - English fallback message
 */
const buildHandler = (translationKey, defaultMsg) => (req, res, next, options) => {
  const msg = req.t ? req.t(translationKey) : defaultMsg;
  res.status(options.statusCode).json({
    success: false,
    message: msg,
    errors: [msg]
  });
};

/**
 * General Limiter — applied globally to /api/*
 * Protects the entire API surface from abuse.
 * 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many requests, please try again later.')
});

/**
 * Auth Limiter — applied to /api/auth/* routes
 * Strict limit to defend against brute-force attacks on login, signup, etc.
 * 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many authentication attempts, please try again later.')
});

/**
 * AI Limiter — applied to the generate-image endpoint
 * Tightly controls expensive Gemini API calls to prevent abuse and control costs.
 * 5 requests per 30 minutes per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'AI generation limit reached, please try again after an hour.')
});

/**
 * Contact Limiter — applied to /api/contact/* routes
 * Prevents spam submissions on the contact form.
 * 5 requests per 60 minutes per IP.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many contact requests, please try again later.')
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  contactLimiter
};
