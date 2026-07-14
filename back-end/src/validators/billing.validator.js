const Joi = require('joi');

const createCheckoutSchema = Joi.object({
  tier: Joi.number()
    .valid(500, 2000, 5000)
    .required()
    .messages({
      'any.only': 'billing.invalid_tier',
      'any.required': 'billing.tier_required'
    })
});

module.exports = {
  createCheckoutSchema
};
