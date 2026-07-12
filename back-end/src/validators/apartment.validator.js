const Joi = require('joi');

const locationSchema = Joi.object({
  country: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  district: Joi.string().trim().allow('').optional(),
  street: Joi.string().trim().allow('').optional(),
  building: Joi.string().trim().allow('').optional(),
  floor: Joi.number().integer().optional(),
  apartmentNumber: Joi.string().trim().allow('').optional()
});

const createApartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().allow('').max(1000).optional(),
  location: locationSchema.required(),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED').optional()
});

const updateApartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().allow('').max(1000).optional(),
  location: Joi.object({
    country: Joi.string().trim().optional(),
    city: Joi.string().trim().optional(),
    district: Joi.string().trim().allow('').optional(),
    street: Joi.string().trim().allow('').optional(),
    building: Joi.string().trim().allow('').optional(),
    floor: Joi.number().integer().optional(),
    apartmentNumber: Joi.string().trim().allow('').optional()
  }).optional(),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED').optional()
});

module.exports = {
  createApartmentSchema,
  updateApartmentSchema
};
