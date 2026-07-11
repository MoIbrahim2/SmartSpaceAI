const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');
const { verifyAccessToken } = require('../helpers/token');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Middleware to protect routes and verify JWT Access Token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check if token exists in authorization headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.UNAUTHORIZED));
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user and ensure they still exist in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.USER.NOT_FOUND));
    }

    // Attach user instance to request object
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN));
  }
});

module.exports = protect;
