const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
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
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.unauthorized'));
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user and ensure they still exist in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'user.not_found'));
    }

    // Attach user instance to request object
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_token'));
  }
});

/**
 * Middleware to authorize user roles
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'SELLER')
 */
const authorizeRoles = (...roles) => {
  const normalizedRoles = roles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.unauthorized'));
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!normalizedRoles.includes(userRole)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.forbidden'));
    }

    next();
  };
};

protect.restrictTo = authorizeRoles;
protect.authorizeRoles = authorizeRoles;

module.exports = protect;
module.exports.protect = protect;
module.exports.authorizeRoles = authorizeRoles;
module.exports.authorize = authorizeRoles;
module.exports.restrictTo = authorizeRoles;

