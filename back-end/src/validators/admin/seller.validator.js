const Joi = require('joi');

const createSellerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .allow('', null)
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .allow('', null)
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'any.required': 'Email is required',
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  base_commission_percentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Commission percentage must be a number',
      'number.min': 'Commission percentage cannot be less than 0',
      'number.max': 'Commission percentage cannot exceed 100'
    }),
  name: Joi.string().optional().allow('', null),
  phone: Joi.string().optional().allow('', null)
});

const updateCommissionSchema = Joi.object({
  base_commission_percentage: Joi.number()
    .min(0)
    .max(100)
    .required()
    .messages({
      'any.required': 'Commission percentage is required',
      'number.base': 'Commission percentage must be a number',
      'number.min': 'Commission percentage cannot be less than 0',
      'number.max': 'Commission percentage cannot exceed 100'
    })
});

module.exports = {
  createSellerSchema,
  updateCommissionSchema
};
