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
    const errorDetails = error.details.map((detail) => {
      const fieldKey = detail.path.join('.');
      
      // Translate the field label if it exists in locales/fields
      const translatedField = req.t 
        ? req.t(`fields.${fieldKey}`, { defaultValue: fieldKey }) 
        : fieldKey;
      
      // Convert dotted type to underscore type (e.g. "any.required" -> "any_required")
      const typeKey = detail.type.replace(/\./g, '_');
      const translationKey = `validation.${typeKey}`;
      
      const options = {
        field: translatedField,
        limit: detail.context?.limit,
        ref: detail.context?.peer || detail.context?.ref,
        defaultValue: detail.message.replace(/['"]/g, '')
      };

      // Translate validation message using localized rules
      const message = req.t 
        ? req.t(translationKey, options) 
        : detail.message.replace(/['"]/g, '');

      return {
        field: fieldKey,
        message
      };
    });

    const failedMessage = req.t ? req.t('validation.failed') : 'Validation failed';
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, failedMessage, errorDetails));
  }

  // Replace request body with validated/formatted values
  req.body = value;
  next();
};

module.exports = validate;
