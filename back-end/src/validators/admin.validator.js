const Joi = require('joi');

const createSellerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Store name is required',
      'string.min': 'Store name must be at least 2 characters',
      'string.max': 'Store name cannot exceed 100 characters'
    }),
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),
  phone: Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': 'Phone must be a string'
    }),
  commissionRate: Joi.number()
    .min(0)
    .max(50)
    .default(12)
    .messages({
      'number.min': 'Commission rate cannot be less than 0%',
      'number.max': 'Commission rate cannot exceed 50%'
    })
});

const updateCommissionSchema = Joi.object({
  commissionRate: Joi.number()
    .min(0)
    .max(50)
    .required()
    .messages({
      'any.required': 'Commission rate is required',
      'number.min': 'Commission rate cannot be less than 0%',
      'number.max': 'Commission rate cannot exceed 50%'
    })
});

module.exports = {
  createSellerSchema,
  updateCommissionSchema
};

