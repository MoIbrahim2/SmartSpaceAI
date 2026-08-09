const Joi = require('joi');

const createProductSchema = Joi.object({
  basic: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    brand: Joi.string().trim().max(100).default('SmartSpace Seller'),
    description: Joi.string().trim().min(10).max(1000).required(),
    sku: Joi.string().trim().max(50).optional()
  }).required(),
  classification: Joi.object({
    canonicalCategory: Joi.string().trim().required(),
    roomTypes: Joi.array().items(Joi.string().trim()).min(1).required(),
    styles: Joi.array().items(Joi.string().trim()).optional(),
    materials: Joi.array().items(Joi.string().trim()).min(1).required(),
    colors: Joi.array().items(Joi.string().trim()).min(1).required()
  }).required(),
  pricing: Joi.object({
    currentPrice: Joi.number().positive().required(),
    currency: Joi.string().trim().default('EGP')
  }).required(),
  dimensions: Joi.object({
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
    length: Joi.number().positive().required(),
    dimensionUnit: Joi.string().trim().default('cm')
  }).required(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().optional(),
      isPrimary: Joi.boolean().default(false)
    })
  ).optional(),
  availability: Joi.object({
    inStock: Joi.boolean().default(true),
    stockStatus: Joi.string().trim().optional(),
    quantity: Joi.number().integer().min(0).default(0)
  }).optional()
});

const updateProductSchema = Joi.object({
  basic: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    brand: Joi.string().trim().max(100).optional(),
    description: Joi.string().trim().min(10).max(1000).optional(),
    sku: Joi.string().trim().max(50).optional()
  }).optional(),
  classification: Joi.object({
    canonicalCategory: Joi.string().trim().optional(),
    roomTypes: Joi.array().items(Joi.string().trim()).min(1).optional(),
    styles: Joi.array().items(Joi.string().trim()).optional(),
    materials: Joi.array().items(Joi.string().trim()).min(1).optional(),
    colors: Joi.array().items(Joi.string().trim()).min(1).optional()
  }).optional(),
  pricing: Joi.object({
    currentPrice: Joi.number().positive().optional(),
    currency: Joi.string().trim().optional()
  }).optional(),
  dimensions: Joi.object({
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
    length: Joi.number().positive().optional(),
    dimensionUnit: Joi.string().trim().optional()
  }).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().optional(),
      isPrimary: Joi.boolean().optional()
    })
  ).optional(),
  availability: Joi.object({
    inStock: Joi.boolean().optional(),
    stockStatus: Joi.string().trim().optional(),
    quantity: Joi.number().integer().min(0).optional()
  }).optional()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PROCESSING', 'DELIVERED', 'REJECTED').required()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema
};
