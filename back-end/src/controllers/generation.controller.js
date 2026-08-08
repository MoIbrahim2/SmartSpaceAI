const generationService = require('../services/generation.service');
const spatialGuardrailService = require('../services/spatialGuardrail.service');
const Generation = require('../models/generation.model');
const Room = require('../models/room.model');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../errors/ApiError');

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

/**
 * Save selected products and step details for a generation
 */
const saveSelectedProducts = asyncHandler(async (req, res) => {
  const generation = await generationService.saveSelectedProducts(req.user._id, req.params.id, req.body);
  return sendSuccess(res, 'generation.products_saved', { generation }, HTTP_STATUS.OK);
});

/**
 * Save user prompt text to a generation (step 2 persistence)
 */
const saveUserPrompt = asyncHandler(async (req, res) => {
  const generation = await generationService.saveUserPrompt(req.user._id, req.params.id, req.body);
  return sendSuccess(res, 'generation.prompt_saved', { generation }, HTTP_STATUS.OK);
});

/**
 * Save resolution choice for a generation
 */
const saveResolution = asyncHandler(async (req, res) => {
  const generation = await generationService.saveResolution(req.user._id, req.params.id, req.body);
  return sendSuccess(res, 'generation.resolution_saved', { generation }, HTTP_STATUS.OK);
});

/**
 * Trigger AI image generation for a generation (accepts resolution in body)
 */
const generateRoomImage = asyncHandler(async (req, res) => {
  // Save resolution to generation before generating if provided
  if (req.body.resolution) {
    await generationService.saveResolution(req.user._id, req.params.id, req.body);
  }
  const generation = await generationService.generateRoomImage(req.user._id, req.params.id);
  return sendSuccess(res, 'generation.image_generated', { generation }, HTTP_STATUS.OK);
});

/**
 * Get the latest generation for a specific room
 */
const getLatestGenerationForRoom = asyncHandler(async (req, res) => {
  const generation = await generationService.getLatestGenerationForRoom(req.user._id, req.params.roomId);
  return sendSuccess(res, 'generation.fetch_success', { generation }, HTTP_STATUS.OK);
});

/**
 * Validate spatial applicability for a generation's selected products
 */
const validateSpatial = asyncHandler(async (req, res) => {
  const { generationId, selectedProducts: bodySelectedProducts, roomLayoutData } = req.body;
  console.log(`\n==================================================`);
  console.log(`[SpatialGuardrail Controller] 🚀 POST /validate-spatial received`);
  console.log(`[SpatialGuardrail Controller] Payload generationId: "${generationId}" | User: ${req.user?._id}`);

  if (!generationId) {
    console.warn(`[SpatialGuardrail Controller] ❌ Missing generationId in request body`);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'generationId is required.');
  }

  let generation = await Generation.findById(generationId);
  if (!generation) {
    console.warn(`[SpatialGuardrail Controller] ❌ Generation record not found: ${generationId}`);
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== req.user._id.toString()) {
    console.warn(`[SpatialGuardrail Controller] ❌ Forbidden: Owner ID mismatch`);
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  // If selectedProducts payload was sent, persist it FIRST before running validation
  if (Array.isArray(bodySelectedProducts) && bodySelectedProducts.length > 0) {
    console.log(`[SpatialGuardrail Controller] Saving ${bodySelectedProducts.length} new selected products to DB before validation...`);
    generation = await generationService.saveSelectedProducts(req.user._id, generationId, {
      selectedProducts: bodySelectedProducts,
      roomLayoutData
    });
  }

  // Load the associated room if it exists
  let room = null;
  if (generation.roomId) {
    room = await Room.findById(generation.roomId);
  }

  const selectedProducts = generation.selectedProducts || [];
  console.log(`[SpatialGuardrail Controller] Found ${selectedProducts.length} selected products for generation ${generationId}`);
  console.log(`[SpatialGuardrail Controller] Room layout: ${JSON.stringify(generation.roomLayoutData || room?.dimensions || {})}`);

  if (selectedProducts.length === 0) {
    console.warn(`[SpatialGuardrail Controller] ❌ No selected products found on generation document.`);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No products selected. Cannot validate spatial layout.');
  }

  const startTime = Date.now();
  const result = await spatialGuardrailService.validateSpatialApplicability(
    generation,
    room,
    selectedProducts,
    { force: true }
  );
  const durationMs = Date.now() - startTime;

  console.log(`[SpatialGuardrail Controller] ✅ Spatial validation completed in ${durationMs}ms`);
  console.log(`[SpatialGuardrail Controller] Result -> isApplicable: ${result?.isApplicable}, Violations: ${result?.spatialViolations?.length || 0}, Allocations: ${result?.layoutDiagram?.allocations?.length || 0}`);
  console.log(`==================================================\n`);

  return sendSuccess(res, 'generation.spatial_validated', {
    spatialGuardrail: result,
    generationId: generation._id
  }, HTTP_STATUS.OK);
});

module.exports = {
  createGeneration,
  getGenerations,
  getGenerationById,
  updateGeneration,
  deleteGeneration,
  extractPreferences,
  saveSelectedProducts,
  saveUserPrompt,
  saveResolution,
  generateRoomImage,
  getLatestGenerationForRoom,
  validateSpatial
};
