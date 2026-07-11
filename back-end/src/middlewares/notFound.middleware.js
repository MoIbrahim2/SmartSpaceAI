const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');

/**
 * Middleware to handle unregistered routes (404 Not Found)
 */
const notFound = (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.GENERAL.ROUTE_NOT_FOUND));
};

module.exports = notFound;
