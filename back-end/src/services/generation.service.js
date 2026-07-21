const Generation = require('../models/generation.model');
const Room = require('../models/room.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');
const promptBuilder = require('./promptBuilder.service');
const aiService = require('./aiService');

/**
 * Create a new generation
 * @param {string} userId - Owner ID
 * @param {Object} generationData - Payload (roomId, prompt, generationType, settings, etc.)
 * @param {Array} files - Uploaded generation output images (if any)
 * @returns {Promise<Object>} Created generation document
 */
const createGeneration = async (userId, generationData, files = []) => {
  const { roomId, styleId, generationType, status, prompt, negativePrompt, creditsUsed, settings, ai } = generationData;

  // Verify room exists and belongs to user
  const room = await Room.findById(roomId).populate('apartmentId');
  if (!room) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }

  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
  }

  const images = files.map(file => ({
    url: `uploads/generations/${file.filename}`,
    thumbnail: `uploads/generations/${file.filename}`,
    width: 1024, // standard default
    height: 1024,
    selected: false
  }));

  const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
  const parsedAi = typeof ai === 'string' ? JSON.parse(ai) : ai;

  const generation = await Generation.create({
    roomId,
    ownerId: userId,
    styleId,
    generationType,
    status: status || 'PENDING',
    prompt,
    negativePrompt,
    creditsUsed,
    settings: parsedSettings,
    ai: parsedAi,
    images
  });

  return generation;
};

/**
 * Extract user design preferences using Gemini AI.
 * @param {string} userId - Owner ID
 * @param {Object} payload - { roomType, budget, length, width, height, prompt, roomId?, generationId? }
 * @returns {Promise<Object>} Object with { generation, extractedPreferences }
 */
const extractUserPreferences = async (userId, payload) => {
  const { roomType, budget, length, width, height, prompt, generationType, roomId, generationId } = payload;

  // If roomId is provided, verify it belongs to the user
  if (roomId) {
    const room = await Room.findById(roomId).populate('apartmentId');
    if (!room) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
    }
    if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
    }
  }

  // 1. Load category rules from knowledge base
  const categoryRules = promptBuilder.loadCategoryRules(roomType);

  // 2. Extract available categories
  const availableCategories = promptBuilder.extractAvailableCategories(categoryRules);
  const categoryNames = availableCategories.map((c) => c.category);

  // 3. Build prompts
  const systemPrompt = promptBuilder.buildSystemPrompt(availableCategories);
  const userPrompt = promptBuilder.buildUserPrompt(
    { roomType, length, width, height, budget },
    prompt,
    availableCategories
  );

  // 4. Call Gemini to extract preferences
  const extractedPreferences = await aiService.extractPreferences(
    systemPrompt,
    userPrompt,
    categoryNames
  );

  // 5. Create or update Generation document
  let generation;

  if (generationId) {
    // Update existing generation
    generation = await Generation.findById(generationId);
    if (!generation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
    }
    if (generation.ownerId.toString() !== userId.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
    }

    generation.extractedPreferences = extractedPreferences;
    generation.prompt = prompt;
    if (generationType) {
      generation.generationType = generationType;
    }
    await generation.save();
  } else {
    // Create new generation
    const generationData = {
      ownerId: userId,
      prompt,
      generationType: generationType || 'CREATE_FROM_SCRATCH',
      status: 'PENDING',
      extractedPreferences
    };

    // Only set roomId if provided
    if (roomId) {
      generationData.roomId = roomId;
    }

    generation = await Generation.create(generationData);
  }

  return {
    generation,
    extractedPreferences
  };
};

/**
 * Fetch generations with query filters and pagination
 * @param {Object} query - Express query params
 * @returns {Promise<Object>} Paginated generations list
 */
const getGenerations = async (query = {}) => {
  const filter = {};

  if (query.roomId) {
    filter.roomId = query.roomId;
  }
  if (query.ownerId) {
    filter.ownerId = query.ownerId;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.generationType) {
    filter.generationType = query.generationType;
  }
  if (query.search) {
    const escapedSearch = query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    filter.prompt = { $regex: escapedSearch, $options: 'i' };
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const generations = await Generation.find(filter)
    .populate('roomId', 'name roomType')
    .populate('ownerId', 'profile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Generation.countDocuments(filter);

  return {
    generations,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Fetch a single generation by ID
 * @param {string} generationId
 * @returns {Promise<Object>} Generation document
 */
const getGenerationById = async (generationId) => {
  const generation = await Generation.findById(generationId)
    .populate('roomId', 'name roomType')
    .populate('ownerId', 'profile');

  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  return generation;
};

/**
 * Update generation details
 * @param {string} userId - Requesting user ID
 * @param {string} generationId
 * @param {Object} updateFields
 * @param {Array} files - Optional uploaded output images to append
 * @returns {Promise<Object>} Updated generation document
 */
const updateGeneration = async (userId, generationId, updateFields, files = []) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }

  // Authorization check: Only the owner can update
  if (generation.ownerId.toString() !== userId.toString()) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  // Handle image deletions if specified
  if (updateFields.deleteImageIds) {
    let deleteIds = updateFields.deleteImageIds;
    if (typeof deleteIds === 'string') {
      try {
        deleteIds = JSON.parse(deleteIds);
      } catch (err) {}
    }

    if (Array.isArray(deleteIds) && deleteIds.length > 0) {
      const keptImages = [];
      for (const img of generation.images) {
        if (deleteIds.includes(img._id.toString())) {
          // Delete file from disk
          const filePath = path.join(process.cwd(), 'uploads', 'generations', img.fileName || path.basename(img.url));
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete generation image: ${err.message}`);
          });
        } else {
          keptImages.push(img);
        }
      }
      generation.images = keptImages;
    }
  }

  // Handle appending new uploads
  if (files && files.length > 0) {
    const newImages = files.map(file => ({
      url: `uploads/generations/${file.filename}`,
      thumbnail: `uploads/generations/${file.filename}`,
      width: 1024,
      height: 1024,
      selected: false
    }));
    generation.images.push(...newImages);
  }

  // Handle setting/toggling selected image ID
  if (updateFields.selectedImageId) {
    generation.images.forEach(img => {
      img.selected = img._id.toString() === updateFields.selectedImageId.toString();
    });
  }

  // Update text fields
  if (updateFields.status !== undefined) {
    generation.status = updateFields.status;
    if (updateFields.status === 'COMPLETED') {
      generation.completedAt = new Date();
    }
  }
  if (updateFields.prompt !== undefined) generation.prompt = updateFields.prompt;
  if (updateFields.negativePrompt !== undefined) generation.negativePrompt = updateFields.negativePrompt;
  if (updateFields.creditsUsed !== undefined) generation.creditsUsed = updateFields.creditsUsed;

  // Update complex objects
  if (updateFields.settings) {
    const settings = typeof updateFields.settings === 'string' ? JSON.parse(updateFields.settings) : updateFields.settings;
    generation.settings = { ...generation.settings, ...settings };
  }

  if (updateFields.ai) {
    const ai = typeof updateFields.ai === 'string' ? JSON.parse(updateFields.ai) : updateFields.ai;
    generation.ai = { ...generation.ai, ...ai };
  }

  if (updateFields.completedAt !== undefined) {
    generation.completedAt = updateFields.completedAt;
  }

  await generation.save();
  return generation;
};

/**
 * Delete a generation
 * @param {string} userId - Requesting user ID
 * @param {string} generationId
 * @returns {Promise<Object>} Deleted generation document
 */
const deleteGeneration = async (userId, generationId) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }

  // Verify ownership
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  // Clean up images
  if (generation.images && generation.images.length > 0) {
    generation.images.forEach(img => {
      const fileName = img.fileName || path.basename(img.url);
      const filePath = path.join(process.cwd(), 'uploads', 'generations', fileName);
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete generation image: ${err.message}`);
      });
    });
  }

  await generation.deleteOne();
  return generation;
};

module.exports = {
  createGeneration,
  extractUserPreferences,
  getGenerations,
  getGenerationById,
  updateGeneration,
  deleteGeneration
};

