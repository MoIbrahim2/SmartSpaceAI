const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Middleware to handle unregistered routes (404 Not Found)
 */
const notFound = (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, 'general.route_not_found'));
};

module.exports = notFound;
