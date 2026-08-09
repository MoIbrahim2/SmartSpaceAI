const rateLimit = require('express-rate-limit');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Helper to convert a time duration string (e.g. '15m', '1h', '1d', '30s') into milliseconds.
 * Supports: seconds (s), minutes (m), hours (h), days (d), or raw milliseconds.
 * @param {string|number} timeStr - e.g. '15m', '1h', '1d', '30s', or 600000
 * @param {number} defaultMs - Default fallback in milliseconds
 * @returns {number} Time in milliseconds
 */
const parseTimeToMs = (timeStr, defaultMs) => {
  if (timeStr === undefined || timeStr === null || timeStr === '') return defaultMs;
  if (typeof timeStr === 'number') return timeStr;

  const str = String(timeStr).trim().toLowerCase();
  const match = str.match(/^(\d+)\s*([a-z]+)?$/);
  if (!match) return defaultMs;

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'ms';

  switch (unit) {
    case 's':
    case 'sec':
    case 'second':
    case 'seconds':
      return value * 1000;
    case 'm':
    case 'min':
    case 'minute':
    case 'minutes':
      return value * 60 * 1000;
    case 'h':
    case 'hr':
    case 'hour':
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'd':
    case 'day':
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    case 'ms':
      return value;
    default:
      return defaultMs;
  }
};

/**
 * Helper to parse maximum request count integer from environment variable
 */
const parseMaxRequests = (envVal, defaultMax) => {
  const parsed = parseInt(envVal, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultMax : parsed;
};

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
 * Configurable via RATE_LIMIT_GENERAL_WINDOW (e.g. '10m', '1h') and RATE_LIMIT_GENERAL_MAX (e.g. 100)
 */
const generalLimiter = rateLimit({
  windowMs: parseTimeToMs(process.env.RATE_LIMIT_GENERAL_WINDOW, 10 * 60 * 1000),
  max: parseMaxRequests(process.env.RATE_LIMIT_GENERAL_MAX, 100),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many requests, please try again later.')
});

/**
 * Auth Limiter — applied to /api/auth/* routes
 * Configurable via RATE_LIMIT_AUTH_WINDOW (e.g. '15m', '1h') and RATE_LIMIT_AUTH_MAX (e.g. 10)
 */
const authLimiter = rateLimit({
  windowMs: parseTimeToMs(process.env.RATE_LIMIT_AUTH_WINDOW, 15 * 60 * 1000),
  max: parseMaxRequests(process.env.RATE_LIMIT_AUTH_MAX, 10),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many authentication attempts, please try again later.')
});

/**
 * AI Limiter — applied to the generate-image endpoint
 * Configurable via RATE_LIMIT_AI_WINDOW (e.g. '30m', '1h') and RATE_LIMIT_AI_MAX (e.g. 5)
 */
const aiLimiter = rateLimit({
  windowMs: parseTimeToMs(process.env.RATE_LIMIT_AI_WINDOW, 30 * 60 * 1000),
  max: parseMaxRequests(process.env.RATE_LIMIT_AI_MAX, 5),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'AI generation limit reached, please try again after an hour.')
});

/**
 * Contact Limiter — applied to /api/contact/* routes
 * Configurable via RATE_LIMIT_CONTACT_WINDOW (e.g. '1h', '1d') and RATE_LIMIT_CONTACT_MAX (e.g. 5)
 */
const contactLimiter = rateLimit({
  windowMs: parseTimeToMs(process.env.RATE_LIMIT_CONTACT_WINDOW, 60 * 60 * 1000),
  max: parseMaxRequests(process.env.RATE_LIMIT_CONTACT_MAX, 5),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general.rate_limit_exceeded', 'Too many contact requests, please try again later.')
});

module.exports = {
  parseTimeToMs,
  generalLimiter,
  authLimiter,
  aiLimiter,
  contactLimiter
};
