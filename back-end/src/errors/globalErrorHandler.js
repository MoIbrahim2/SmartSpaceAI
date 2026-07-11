const ApiError = require('./ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Translation helper function
  const t = (key, options) => (req.t ? req.t(key, options) : key);

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errorsList = Object.values(err.errors).map((val) => {
      const fieldName = t(`fields.${val.path}`, { defaultValue: val.path });
      return {
        field: val.path,
        message: val.message
      };
    });
    const message = 'validation.failed';
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, errorsList, err.stack);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const translatedField = t(`fields.${field}`, { defaultValue: field });
    const message = 'database.duplicate_key';
    const errorsList = [{
      field,
      message: t('database.duplicate_key_field', { field: translatedField })
    }];
    error = new ApiError(HTTP_STATUS.CONFLICT, message, errorsList, err.stack);
  }

  // Handle Mongoose Cast Error (e.g. invalid format)
  if (err.name === 'CastError') {
    const field = err.path;
    const translatedField = t(`fields.${field}`, { defaultValue: field });
    const message = t('database.cast_error', { field: translatedField, value: err.value });
    const errorsList = [{
      field,
      message: t('database.invalid_format')
    }];
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message, errorsList, err.stack);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_token', [], err.stack);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_token', [], err.stack);
  }

  // If not already an ApiError, make it one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'general.server_error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Translate final response messages and error details
  const finalMessage = t(error.message);
  const finalErrors = error.errors && error.errors.length > 0
    ? error.errors.map((item) => {
        if (typeof item === 'string') {
          return t(item);
        }
        return {
          field: item.field,
          message: t(item.message)
        };
      })
    : [finalMessage];

  // Prepare response payload
  const response = {
    success: false,
    message: finalMessage,
    errors: finalErrors
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = globalErrorHandler;
