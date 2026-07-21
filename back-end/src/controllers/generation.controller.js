const generationService = require('../services/generation.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new generation
 */
const createGeneration = asyncHandler(async (req, res) => {
  const generation = await generationService.createGeneration(req.user._id, req.body, req.files);
  return sendSuccess(res, 'generation.create_success', { generation }, HTTP_STATUS.CREATED);
});

/**
 * Fetch all generations with query filters and pagination
 */
const getGenerations = asyncHandler(async (req, res) => {
  const result = await generationService.getGenerations(req.query);
  return sendSuccess(res, 'generation.fetch_success', result, HTTP_STATUS.OK);
});

/**
 * Fetch a single generation by ID
 */
const getGenerationById = asyncHandler(async (req, res) => {
  const generation = await generationService.getGenerationById(req.params.id);
  return sendSuccess(res, 'generation.fetch_success', { generation }, HTTP_STATUS.OK);
});

/**
 * Update a generation's details
 */
const updateGeneration = asyncHandler(async (req, res) => {
  const updatedGeneration = await generationService.updateGeneration(
    req.user._id,
    req.params.id,
    req.body,
    req.files
  );
  return sendSuccess(res, 'generation.update_success', { generation: updatedGeneration }, HTTP_STATUS.OK);
});

/**
 * Delete a generation
 */
const deleteGeneration = asyncHandler(async (req, res) => {
  await generationService.deleteGeneration(req.user._id, req.params.id);
  return sendSuccess(res, 'generation.delete_success', {}, HTTP_STATUS.OK);
});

/**
 * Extract user design preferences using Gemini AI
 */
const extractPreferences = asyncHandler(async (req, res) => {
  const result = await generationService.extractUserPreferences(req.user._id, req.body);
  return sendSuccess(res, 'generation.preferences_extracted', { generation: result.generation }, HTTP_STATUS.OK);
});

module.exports = {
  createGeneration,
  getGenerations,
  getGenerationById,
  updateGeneration,
  deleteGeneration,
  extractPreferences
};
