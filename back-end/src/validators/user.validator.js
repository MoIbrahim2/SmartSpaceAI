const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.base': 'Please provide a valid date of birth',
      'date.max': 'Date of birth cannot be in the future'
    })
});

module.exports = {
  updateProfileSchema
};
