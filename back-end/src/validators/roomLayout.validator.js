const Joi = require('joi');

const validateRoomLayoutSchema = Joi.object({
  roomId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'roomId must be a valid MongoDB ObjectId',
      'any.required': 'roomId is required'
    }),
  length_cm: Joi.number().positive().required()
    .messages({
      'number.base': 'length_cm must be a number',
      'number.positive': 'length_cm must be a positive number',
      'any.required': 'length_cm is required'
    }),
  width_cm: Joi.number().positive().required()
    .messages({
      'number.base': 'width_cm must be a number',
      'number.positive': 'width_cm must be a positive number',
      'any.required': 'width_cm is required'
    }),
  height_cm: Joi.number().positive().required()
    .messages({
      'number.base': 'height_cm must be a number',
      'number.positive': 'height_cm must be a positive number',
      'any.required': 'height_cm is required'
    }),
  budget_egp: Joi.number().positive().required()
    .messages({
      'number.base': 'budget_egp must be a number',
      'number.positive': 'budget_egp must be a positive number',
      'any.required': 'budget_egp is required'
    })
});

module.exports = {
  validateRoomLayoutSchema
};
