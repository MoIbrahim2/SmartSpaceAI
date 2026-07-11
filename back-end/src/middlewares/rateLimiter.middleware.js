const rateLimit = require('express-rate-limit');
const HTTP_STATUS = require('../constants/statusCodes');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const msg = req.t ? req.t('general.rate_limit_exceeded') : 'Too many requests, please try again later';
    res.status(options.statusCode).json({
      success: false,
      message: msg,
      errors: [msg]
    });
  }
});

module.exports = limiter;
