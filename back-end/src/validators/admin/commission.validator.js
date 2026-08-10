const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const getMonthlyReportSchema = Joi.object({
  year: Joi.alternatives().try(Joi.number().integer().min(2020).max(2100), Joi.string().valid('All', 'all', '')).optional(),
  month: Joi.alternatives().try(Joi.number().integer().min(1).max(12), Joi.string().valid('All', 'all', '')).optional(),
  sellerId: Joi.string().regex(objectIdPattern).optional(),
  status: Joi.string().valid('PAID', 'UNPAID', 'Paid', 'Unpaid', 'All', 'all', '').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().allow('').optional(),
  sort: Joi.string().trim().optional(),
  order: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional()
});

const markPaidSchema = Joi.object({
  sellerId: Joi.string().regex(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid seller ID format',
    'any.required': 'Seller ID is required'
  }),
  month: Joi.number().integer().min(1).max(12).required().messages({
    'number.min': 'Month must be between 1 and 12',
    'number.max': 'Month must be between 1 and 12',
    'any.required': 'Month is required'
  }),
  year: Joi.number().integer().min(2020).max(2100).required().messages({
    'number.min': 'Year must be 2020 or later',
    'any.required': 'Year is required'
  }),
  notes: Joi.string().trim().optional()
});

module.exports = {
  getMonthlyReportSchema,
  markPaidSchema
};
