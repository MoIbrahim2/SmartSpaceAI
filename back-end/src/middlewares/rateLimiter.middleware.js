const rateLimit = require('express-rate-limit');
const MESSAGES = require('../constants/messages');
const HTTP_STATUS = require('../constants/statusCodes');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: MESSAGES.GENERAL.RATE_LIMIT_EXCEEDED,
    errors: [MESSAGES.GENERAL.RATE_LIMIT_EXCEEDED]
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = limiter;
