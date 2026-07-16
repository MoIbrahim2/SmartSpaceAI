const express = require('express');
const router = express.Router();
const roomLayoutController = require('../controllers/roomLayout.controller');
const protect = require('../middlewares/auth.middleware');
const { uploadRoomLayoutImage } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { validateRoomLayoutSchema } = require('../validators/roomLayout.validator');

/**
 * POST /api/v1/rooms/validate
 * Accepts multipart/form-data with room dimensions, budget, roomId, and a single image.
 * Validates the image using Gemini AI before saving to the database.
 */
router.post(
  '/validate',
  protect,
  uploadRoomLayoutImage,
  validate(validateRoomLayoutSchema),
  roomLayoutController.validateRoom
);

/**
 * GET /api/v1/rooms/:roomId/layout
 * Fetches existing validated layout for a room.
 */
router.get(
  '/:roomId/layout',
  protect,
  roomLayoutController.getRoomLayout
);

module.exports = router;
