const Generation = require('../models/generation.model');
const Room = require('../models/room.model');
const RoomLayout = require('../models/roomLayout.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');
const promptBuilder = require('./promptBuilder.service');
const aiService = require('./aiService');
const spatialGuardrailService = require('./spatialGuardrail.service');

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

  let generation;
  if (generationId) {
    generation = await Generation.findById(generationId);
    if (!generation) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
    }
    if (generation.ownerId.toString() !== userId.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
    }

    if (generation.prompt === prompt && generation.recommendationResult) {
      return {
        generation,
        extractedPreferences: generation.extractedPreferences,
        recommendationResult: generation.recommendationResult
      };
    }
  }

  // 1. Load category rules from knowledge base
  const categoryRules = promptBuilder.loadCategoryRules(roomType);

  // 2. Extract available categories
  const availableCategories = promptBuilder.extractAvailableCategories(categoryRules);
  const categoryNames = availableCategories.map((c) => c.category);

  // 3. Build prompts
  const systemPrompt = promptBuilder.buildSystemPrompt(availableCategories, generationType);
  const userPrompt = promptBuilder.buildUserPrompt(
    { roomType, length, width, height, budget },
    prompt,
    availableCategories,
    generationType
  );

  // 4. Call Gemini to extract preferences
  const extractedPreferences = await aiService.extractPreferences(
    systemPrompt,
    userPrompt,
    categoryNames
  );

  // 5. Generate furniture recommendations using Recommendation Engine
  let recommendationResult = null;
  try {
    const { generateRecommendations } = require('./recommendation/recommendationEngine');
    recommendationResult = await generateRecommendations({
      roomType,
      totalBudget: Number(budget || 75000),
      length: Number(length || 400),
      width: Number(width || 350),
      height: Number(height || 280),
      extractedPreferences
    });
  } catch (recErr) {
    console.error('[GenerationService] Error running recommendation engine:', recErr.message);
  }

  // 6. Create or update Generation document
  if (generation) {
    // Update existing generation
    generation.extractedPreferences = extractedPreferences;
    generation.prompt = prompt;
    generation.userPrompt = prompt;
    if (recommendationResult) {
      generation.recommendationResult = recommendationResult;
    }
    if (generationType) {
      generation.generationType = generationType;
    }

    if (roomId && (!generation.roomLayoutData || !generation.roomLayoutData.room_image_path)) {
      const layout = await RoomLayout.findOne({ roomId });
      if (layout) {
        generation.roomLayoutData = {
          length_cm: layout.length_cm,
          width_cm: layout.width_cm,
          height_cm: layout.height_cm,
          budget_egp: layout.budget_egp,
          room_image_path: layout.room_image_path
        };
      }
    }
    await generation.save();
  } else {
    const generationData = {
      ownerId: userId,
      prompt,
      userPrompt: prompt,
      generationType: generationType || 'CREATE_FROM_SCRATCH',
      status: 'PENDING',
      extractedPreferences,
      recommendationResult
    };

    // Only set roomId if provided
    if (roomId) {
      generationData.roomId = roomId;
      const layout = await RoomLayout.findOne({ roomId });
      if (layout) {
        generationData.roomLayoutData = {
          length_cm: layout.length_cm,
          width_cm: layout.width_cm,
          height_cm: layout.height_cm,
          budget_egp: layout.budget_egp,
          room_image_path: layout.room_image_path
        };
      }
    }

    generation = await Generation.create(generationData);
  }

  return {
    generation,
    extractedPreferences,
    recommendationResult
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

/**
 * Save selected products and step data for a generation.
 * @param {string} userId
 * @param {string} generationId
 * @param {Object} payload - { selectedProducts, recommendationResult, roomLayoutData }
 * @returns {Promise<Object>} Updated generation
 */
const saveSelectedProducts = async (userId, generationId, payload) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  const { selectedProducts, recommendationResult, roomLayoutData } = payload;

  if (selectedProducts && Array.isArray(selectedProducts)) {
    generation.selectedProducts = selectedProducts.map((p, idx) => {
      let pData = p.productData || p;
      if (pData && typeof pData === 'object') {
        try {
          pData = JSON.parse(JSON.stringify(pData._doc || pData));
        } catch (e) {
          pData = { _id: String(p.productId || idx), name: p.title || 'Furniture Item' };
        }
      }

      let category = p.category || pData?.category || pData?.categoryName || 'Furniture';
      if (!category || typeof category !== 'string' || !category.trim()) {
        category = 'Furniture';
      }

      const rawId = p.productId || pData?._id || pData?.id || String(idx);
      const productId = typeof rawId === 'object' ? String(rawId._id || rawId.id || idx) : String(rawId);

      const price = Number(p.price || pData?.pricing?.currentPrice || pData?.price || pData?.numericPrice || 0) || 0;
      const quantity = Number(p.quantity || 1) || 1;
      const isRecommended = Boolean(p.isRecommended || pData?.isRecommended);

      return {
        category: category.trim(),
        productId,
        productData: pData,
        isRecommended,
        price,
        quantity
      };
    });
  }

  if (recommendationResult) generation.recommendationResult = recommendationResult;

  if (roomLayoutData) {
    let imagePath = roomLayoutData.room_image_path || generation.roomLayoutData?.room_image_path;
    if (!imagePath && generation.roomId) {
      const layout = await RoomLayout.findOne({ roomId: generation.roomId });
      if (layout?.room_image_path) {
        imagePath = layout.room_image_path;
      }
    }

    generation.roomLayoutData = {
      length_cm: Number(roomLayoutData.length_cm || generation.roomLayoutData?.length_cm || 400),
      width_cm: Number(roomLayoutData.width_cm || generation.roomLayoutData?.width_cm || 350),
      height_cm: Number(roomLayoutData.height_cm || generation.roomLayoutData?.height_cm || 280),
      budget_egp: Number(roomLayoutData.budget_egp || generation.roomLayoutData?.budget_egp || 75000),
      room_image_path: imagePath
    };
  } else if (!generation.roomLayoutData?.room_image_path && generation.roomId) {
    const layout = await RoomLayout.findOne({ roomId: generation.roomId });
    if (layout) {
      generation.roomLayoutData = {
        length_cm: layout.length_cm,
        width_cm: layout.width_cm,
        height_cm: layout.height_cm,
        budget_egp: layout.budget_egp,
        room_image_path: layout.room_image_path
      };
    }
  }

  await generation.save();
  return generation;
};

/**
 * Trigger AI image generation for a generation using Qwen Multimodal.
 * @param {string} userId
 * @param {string} generationId
 * @returns {Promise<Object>} Generation with generated image
 */
const generateRoomImage = async (userId, generationId) => {
  const generation = await Generation.findById(generationId)
    .populate('roomId')
    .populate('selectedProducts.productId');
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  generation.status = 'PROCESSING';
  await generation.save();

  try {
    const roomType = generation.roomId?.roomType || 'room';

    // ── Spatial Guardrail Verification ──────────────────────────────────
    // Spatial guardrail validation was already executed when clicking Next on Step 3.
    // Verify existing guardrail status stored on the generation document without re-triggering guardrail service.
    if (generation.spatialGuardrail?.isApplicable === false) {
      generation.status = 'FAILED';
      await generation.save();
      const violations = (generation.spatialGuardrail.spatialViolations || [])
        .map(v => v.description)
        .join('; ');
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        `Spatial validation failed: ${violations || 'Selected products do not fit in the room.'}`
      );
    }
    // ── End Spatial Guardrail ──────────────────────────────────────────

    // Retrieve original room_image_path from generation.roomLayoutData or RoomLayout model
    let originalRoomImageUrl = generation.roomLayoutData?.room_image_path;
    if (!originalRoomImageUrl && generation.roomId) {
      const layout = await RoomLayout.findOne({ roomId: generation.roomId._id || generation.roomId });
      if (layout?.room_image_path) {
        originalRoomImageUrl = layout.room_image_path;
      }
    }
    if (!originalRoomImageUrl) {
      originalRoomImageUrl = generation.roomId?.sourceImages?.[0]?.url || '';
    }

    // Always use the original room layout image uploaded by the user in both modes (no room widening)
    const roomImageUrl = originalRoomImageUrl;
    const roomDimensions = {
      length_cm: generation.roomLayoutData?.length_cm,
      width_cm: generation.roomLayoutData?.width_cm,
      height_cm: generation.roomLayoutData?.height_cm,
    };

    // Extract JSON spatial layout diagram from DeepSeek spatial guardrail result
    let spatialDirectives = '';
    if (generation.spatialGuardrail) {
      const layoutData = generation.spatialGuardrail.layoutDiagram || generation.spatialGuardrail;
      const plainData = typeof layoutData?.toObject === 'function' ? layoutData.toObject() : layoutData;
      spatialDirectives = typeof plainData === 'object' ? JSON.stringify(plainData, null, 2) : String(plainData || '');
    }

    const userPrompt = generation.userPrompt || generation.prompt || '';

    const maskDataBase64 = generation.spatialGuardrail?.maskDataBase64 || null;
    const maskImageUrl = generation.spatialGuardrail?.maskImageUrl || null;

    const imageResult = await aiService.generateRoomCompositeImage({
      roomImageUrl,
      selectedProducts: generation.selectedProducts || [],
      prompt: userPrompt,
      spatialDirectives,
      roomDimensions,
      roomType,
      generationType: generation.generationType || 'CREATE_FROM_SCRATCH',
      resolution: generation.resolution || { width: 1280, height: 720 },
      maskDataBase64,
      maskImageUrl,
    });

    const generatedImageObj = {
      url: imageResult.url,
      promptUsed: imageResult.promptUsed,
      modelUsed: imageResult.modelUsed,
      generatedAt: new Date(),
    };

    generation.generatedImage = generatedImageObj;
    generation.status = 'COMPLETED';
    generation.isGenerated = true;
    generation.completedAt = new Date();

    // Push to images array if not already present
    generation.images.push({
      url: imageResult.url,
      thumbnail: imageResult.url,
      width: 1920,
      height: 1080,
      selected: true,
    });

    await generation.save();

    // Link this generation as the selected active generation on the Room model
    if (generation.roomId) {
      await Room.findByIdAndUpdate(generation.roomId._id || generation.roomId, {
        selectedGenerationId: generation._id,
      });
    }

    await generation.populate('roomId');
    return generation;
  } catch (err) {
    generation.status = 'FAILED';
    await generation.save();
    throw err;
  }
};

/**
 * Save user prompt text to a generation (step 2 persistence).
 * @param {string} userId
 * @param {string} generationId
 * @param {Object} payload - { userPrompt }
 * @returns {Promise<Object>} Updated generation
 */
const saveUserPrompt = async (userId, generationId, payload) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  generation.userPrompt = payload.userPrompt || payload.prompt || '';
  generation.prompt = payload.userPrompt || payload.prompt || generation.prompt;
  await generation.save();
  return generation;
};

/**
 * Save selected resolution to a generation.
 * @param {string} userId
 * @param {string} generationId
 * @param {Object} payload - { resolution: { width, height, label } }
 * @returns {Promise<Object>} Updated generation
 */
const saveResolution = async (userId, generationId, payload) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  if (payload.resolution) {
    if (typeof payload.resolution === 'string') {
      const resKey = payload.resolution.toLowerCase();
      let width = 1920, height = 1080, label = '1080p (FHD)';
      if (resKey.includes('720')) { width = 1280; height = 720; label = '720p (HD)'; }
      else if (resKey.includes('1440') || resKey.includes('2k') || resKey.includes('qhd')) { width = 2560; height = 1440; label = '1440p (QHD)'; }
      else if (resKey.includes('4k') || resKey.includes('2160') || resKey.includes('uhd')) { width = 3840; height = 2160; label = '4K (Ultra HD)'; }
      generation.resolution = { width, height, label };
    } else {
      generation.resolution = {
        width: Number(payload.resolution.width) || 1280,
        height: Number(payload.resolution.height) || 720,
        label: payload.resolution.label || '1080p (FHD)'
      };
    }
  }
  await generation.save();
  return generation;
};

/**
 * Get the latest generation for a room.
 * @param {string} userId
 * @param {string} roomId
 * @returns {Promise<Object|null>} Latest generation or null
 */
const getLatestGenerationForRoom = async (userId, roomId) => {
  const generation = await Generation.findOne({ roomId, ownerId: userId })
    .sort({ createdAt: -1 });
  return generation;
};

/**
 * Refine an existing generated room image based on a spatial prompt.
 * @param {string} userId
 * @param {string} generationId
 * @param {Object} payload - { prompt, resolution }
 * @returns {Promise<Object>} Updated generation record
 */
const refineRoomImage = async (userId, generationId, payload) => {
  const generation = await Generation.findById(generationId);
  if (!generation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
  }
  if (generation.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'generation.forbidden');
  }

  const previousImageUrl = generation.generatedImage?.url;
  if (!previousImageUrl) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No previous generated image exists to refine.');
  }

  const prompt = payload.prompt?.trim();
  if (!prompt) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Refinement prompt is required.');
  }

  generation.status = 'PROCESSING';
  await generation.save();

  try {
    const resolution = generation.resolution || { width: 1280, height: 720 };

    const imageResult = await aiService.refineRoomImage({
      previousImageUrl,
      prompt,
      resolution
    });

    const generatedImageObj = {
      url: imageResult.url,
      promptUsed: imageResult.promptUsed,
      modelUsed: imageResult.modelUsed,
      generatedAt: new Date()
    };

    generation.generatedImage = generatedImageObj;
    generation.status = 'COMPLETED';
    generation.isGenerated = true;
    generation.completedAt = new Date();

    if (!generation.images) generation.images = [];
    generation.images.push({
      url: imageResult.url,
      promptUsed: imageResult.promptUsed,
      generatedAt: new Date()
    });

    await generation.save();
    return generation;
  } catch (err) {
    generation.status = 'FAILED';
    await generation.save();
    console.error('[GenerationService] Refine room image failed:', err.message);
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Failed to refine room image: ${err.message}`);
  }
};

module.exports = {
  createGeneration,
  extractUserPreferences,
  getGenerations,
  getGenerationById,
  updateGeneration,
  deleteGeneration,
  saveSelectedProducts,
  generateRoomImage,
  refineRoomImage,
  saveUserPrompt,
  saveResolution,
  getLatestGenerationForRoom
};

