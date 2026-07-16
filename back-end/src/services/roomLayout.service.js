const RoomLayout = require('../models/roomLayout.model');
const Room = require('../models/room.model');
const Apartment = require('../models/apartment.model');
const { validateRoomImage } = require('./aiService');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');

/**
 * Validate a room image via AI and, if valid, save/update the RoomLayout document.
 * Links the layout to a specific Room via roomId.
 *
 * @param {string} userId - Authenticated user ID (for ownership verification)
 * @param {Object} layoutData - { roomId, length_cm, width_cm, height_cm, budget_egp }
 * @param {Object} file - Multer file object (req.file)
 * @returns {Promise<Object>} The saved RoomLayout document and AI analysis
 * @throws {ApiError} 400 if no image uploaded or AI rejects the image
 */
const validateAndCreateRoomLayout = async (userId, layoutData, file, language = 'en') => {
  if (!file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'An image file is required.');
  }

  const { roomId, length_cm, width_cm, height_cm, budget_egp } = layoutData;

  // Verify room exists and user owns it (via apartment)
  const room = await Room.findById(roomId).populate('apartmentId');
  if (!room) {
    fs.unlink(file.path, () => {});
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }
  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    fs.unlink(file.path, () => {});
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
  }

  // Build the relative image path stored in DB
  const imagePath = `uploads/room-layouts/${file.filename}`;

  let aiResult;
  try {
    // Call Gemini AI for image validation
    aiResult = await validateRoomImage(file.path, file.mimetype);
  } catch (error) {
    // If AI call fails, clean up the uploaded file and re-throw
    fs.unlink(file.path, () => {});
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `AI validation service error: ${error.message}`
    );
  }

  // If AI deems the image invalid, delete it and return 400
  if (!aiResult.is_valid) {
    fs.unlink(file.path, () => {});
    const rejectionReason = (language && language.toLowerCase().startsWith('ar'))
      ? (aiResult.rejection_reason_ar || aiResult.rejection_reason || 'لم تجتز الصورة فحص الذكاء الاصطناعي.')
      : (aiResult.rejection_reason || 'Image did not pass AI validation.');

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, rejectionReason, [
      {
        field: 'image',
        message: rejectionReason
      }
    ]);
  }

  // Check if a previous layout exists for this room — if so, replace it
  const existingLayout = await RoomLayout.findOne({ roomId });
  if (existingLayout) {
    // Delete old image file
    if (existingLayout.room_image_path && typeof existingLayout.room_image_path === 'string') {
      const oldImagePath = path.join(process.cwd(), existingLayout.room_image_path);
      fs.unlink(oldImagePath, () => {});
    }
    await existingLayout.deleteOne();
  }

  // AI approved — save to MongoDB
  const roomLayout = await RoomLayout.create({
    roomId,
    length_cm: Number(length_cm),
    width_cm: Number(width_cm),
    height_cm: Number(height_cm),
    budget_egp: Number(budget_egp),
    room_image_path: imagePath,
    ai_analysis: {
      is_corner_shot: aiResult.is_corner_shot,
      lighting_quality: aiResult.lighting_quality,
      is_empty_enough: aiResult.is_empty_enough,
      is_valid: aiResult.is_valid
    }
  });

  return {
    roomLayout,
    aiAnalysis: {
      is_corner_shot: aiResult.is_corner_shot,
      lighting_quality: aiResult.lighting_quality,
      is_empty_enough: aiResult.is_empty_enough,
      is_valid: aiResult.is_valid
    }
  };
};

/**
 * Fetch the existing validated RoomLayout for a given room.
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} roomId - Room ObjectId
 * @returns {Promise<Object|null>} The RoomLayout document or null
 */
const getRoomLayoutByRoomId = async (userId, roomId) => {
  // Verify room exists and user owns it
  const room = await Room.findById(roomId).populate('apartmentId');
  if (!room) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }
  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
  }

  const layout = await RoomLayout.findOne({ roomId });
  return layout;
};

module.exports = {
  validateAndCreateRoomLayout,
  getRoomLayoutByRoomId
};
