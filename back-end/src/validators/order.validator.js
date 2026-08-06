const Joi = require('joi');

const checkoutSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required().trim(),
      name: Joi.string().allow('', null).trim(),
      price: Joi.number().allow(null),
      image: Joi.string().allow('', null),
      sellerId: Joi.string().allow('', null).trim(),
      quantity: Joi.number().integer().min(1).default(1)
    }).unknown(true)
  ).min(1).required().messages({
    'array.min': 'Cart must contain at least one item'
  }),
  customer: Joi.object({
    name: Joi.string().required().trim(),
    phone: Joi.string().required().trim(),
    address: Joi.object({
      country: Joi.string().default('Egypt'),
      city: Joi.string().required().trim(),
      district: Joi.string().allow('', null).trim(),
      street: Joi.string().required().trim()
    }).required()
  }).required(),
  paymentMethod: Joi.string().valid('stripe', 'cod').default('stripe')
});

module.exports = {
  checkoutSchema
};
