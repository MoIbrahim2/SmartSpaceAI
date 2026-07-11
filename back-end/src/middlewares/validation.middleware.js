const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Validation middleware to validate request body against Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all validation errors, not just the first one
    allowUnknown: false, // Do not allow unknown fields
    stripUnknown: false // Do not strip unknown fields; fail instead
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, '')
    }));
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errorDetails));
  }

  // Replace request body with validated/formatted values
  req.body = value;
  next();
};

module.exports = validate;
