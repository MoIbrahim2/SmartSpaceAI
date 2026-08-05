const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const orderItemJoiSchema = Joi.object({
  productId: Joi.string().regex(objectIdPattern).optional(),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Item name is required'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Item price must be a number',
    'number.min': 'Item price cannot be negative'
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Item quantity must be at least 1'
  })
});

const createOrderSchema = Joi.object({
  sellerId: Joi.string().regex(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid seller ID format',
    'any.required': 'Seller ID is required'
  }),
  items: Joi.array().items(orderItemJoiSchema).min(1).required().messages({
    'array.min': 'Order must contain at least one item',
    'any.required': 'Items are required'
  }),
  shippingAddress: Joi.object({
    street: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    country: Joi.string().trim().optional(),
    phone: Joi.string().trim().optional()
  }).optional(),
  notes: Joi.string().trim().optional()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Invalid order status value',
      'any.required': 'Order status is required'
    }),
  notes: Joi.string().trim().optional()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
};
