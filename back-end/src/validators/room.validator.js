const Joi = require('joi');

const dimensionsSchema = Joi.object({
  width: Joi.number().positive().required(),
  length: Joi.number().positive().required(),
  height: Joi.number().positive().required(),
  unit: Joi.string().trim().required()
});

const createRoomSchema = Joi.object({
  apartmentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  roomType: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').max(1000).optional(),
  dimensions: dimensionsSchema.required(),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED').optional(),
  coverImageId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  selectedGenerationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  roomType: Joi.string().trim().optional(),
  description: Joi.string().trim().allow('').max(1000).optional(),
  dimensions: Joi.object({
    width: Joi.number().positive().optional(),
    length: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
    unit: Joi.string().trim().optional()
  }).optional(),
  status: Joi.string().valid('ACTIVE', 'ARCHIVED').optional(),
  coverImageId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  selectedGenerationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

module.exports = {
  createRoomSchema,
  updateRoomSchema
};
