const ApiError = require('./ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    const errorsList = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, errorsList, err.stack);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}. Please use another value.`;
    const errorsList = [{
      field,
      message: `${field} is already in use`
    }];
    error = new ApiError(HTTP_STATUS.CONFLICT, message, errorsList, err.stack);
  }

  // Handle Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for field ${err.path}: ${err.value}`;
    const errorsList = [{
      field: err.path,
      message: `Invalid format`
    }];
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, errorsList, err.stack);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, [], err.stack);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN, [], err.stack);
  }

  // If not already an ApiError, make it one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || MESSAGES.GENERAL.SERVER_ERROR;
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Prepare response payload
  const response = {
    success: false,
    message: error.message,
    errors: error.errors && error.errors.length > 0 ? error.errors : [error.message]
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = globalErrorHandler;
