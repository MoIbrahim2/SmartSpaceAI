const Joi = require('joi');

const settingsSchema = Joi.object({
  creativity: Joi.number().integer().min(0).max(100).optional(),
  preserveLayout: Joi.boolean().optional(),
  colorPalette: Joi.string().trim().allow('').optional(),
  lighting: Joi.string().trim().allow('').optional(),
  quality: Joi.string().trim().allow('').optional(),
  aspectRatio: Joi.string().trim().allow('').optional(),
  seed: Joi.string().trim().allow('').optional()
});

const aiSchema = Joi.object({
  provider: Joi.string().trim().optional(),
  model: Joi.string().trim().optional(),
  version: Joi.string().trim().optional(),
  generationTime: Joi.number().positive().optional()
});

const createGenerationSchema = Joi.object({
  roomId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  styleId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  generationType: Joi.string().valid('CREATE_FROM_SCRATCH', 'ENHANCE_EXISTING').required(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED').optional(),
  prompt: Joi.string().trim().allow('').optional(),
  negativePrompt: Joi.string().trim().allow('').optional(),
  creditsUsed: Joi.number().integer().min(0).optional(),
  settings: settingsSchema.optional(),
  ai: aiSchema.optional()
});

const updateGenerationSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED').optional(),
  prompt: Joi.string().trim().allow('').optional(),
  negativePrompt: Joi.string().trim().allow('').optional(),
  creditsUsed: Joi.number().integer().min(0).optional(),
  settings: settingsSchema.optional(),
  ai: aiSchema.optional(),
  completedAt: Joi.date().optional(),
  deleteImageIds: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  selectedImageId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

const extractPreferencesSchema = Joi.object({
  roomType: Joi.string().trim().required(),
  budget: Joi.number().positive().required(),
  length: Joi.number().positive().required(),
  width: Joi.number().positive().required(),
  height: Joi.number().positive().required(),
  prompt: Joi.string().trim().min(10).max(2000).required(),
  generationType: Joi.string().valid('CREATE_FROM_SCRATCH', 'ENHANCE_EXISTING').optional().default('CREATE_FROM_SCRATCH'),
  roomId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  generationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

module.exports = {
  createGenerationSchema,
  updateGenerationSchema,
  extractPreferencesSchema
};
