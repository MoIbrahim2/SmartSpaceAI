/**
 * Recommendation Controller
 *
 * Handles HTTP requests for the recommendation engine.
 */

const { generateRecommendations } = require('../services/recommendation/recommendationEngine');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');
const Generation = require('../models/generation.model');
const ApiError = require('../errors/ApiError');

/**
 * Generate recommendations for a generation.
 *
 * Expects either:
 * A) generationId — loads extractedPreferences from the existing Generation
 * B) Inline payload — roomType, budget, dimensions, extractedPreferences
 */
const recommend = asyncHandler(async (req, res) => {
  const {
    generationId,
    roomType,
    budget,
    length,
    width,
    height,
    extractedPreferences: inlinePreferences,
  } = req.body;

  let extractedPreferences;
  let resolvedRoomType = roomType;
  let resolvedBudget = budget;
  let resolvedLength = length;
  let resolvedWidth = width;
  let resolvedHeight = height;

  // If generationId provided, load preferences from the Generation
  if (generationId) {
    const generation = await Generation.findById(generationId);
    if (!generation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
    }

    // Authorization: only the owner can request recommendations
    if (generation.ownerId.toString() !== req.user._id.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
    }

    if (!generation.extractedPreferences) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Preferences have not been extracted yet. Run preference extraction first.'
      );
    }

    extractedPreferences = generation.extractedPreferences;

    // Use provided values or fall back to the request body
    // roomType, budget, and dimensions MUST be provided in the request
    // (they are not stored on the Generation)
  } else {
    extractedPreferences = inlinePreferences;
  }

  if (!extractedPreferences) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'extractedPreferences is required (either via generationId or inline).'
    );
  }

  if (!resolvedRoomType || !resolvedBudget || !resolvedLength || !resolvedWidth || !resolvedHeight) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'roomType, budget, length, width, and height are required.'
    );
  }

  const result = await generateRecommendations({
    roomType: resolvedRoomType,
    totalBudget: Number(resolvedBudget),
    length: Number(resolvedLength),
    width: Number(resolvedWidth),
    height: Number(resolvedHeight),
    extractedPreferences,
  });

  return sendSuccess(res, 'recommendation.success', { recommendation: result }, HTTP_STATUS.OK);
});

module.exports = {
  recommend,
};
