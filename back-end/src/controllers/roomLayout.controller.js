const roomLayoutService = require('../services/roomLayout.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/rooms/validate
 * Validates room dimensions, budget, and image quality via AI,
 * then saves a RoomLayout document if the image passes validation.
 */
const validateRoom = asyncHandler(async (req, res) => {
  const result = await roomLayoutService.validateAndCreateRoomLayout(
    req.user._id,
    req.body,
    req.file,
    req.language
  );

  return sendSuccess(
    res,
    'Room image validated and layout saved successfully.',
    {
      roomLayoutId: result.roomLayout._id,
      roomLayout: result.roomLayout,
      aiAnalysis: result.aiAnalysis
    },
    HTTP_STATUS.CREATED
  );
});

/**
 * GET /api/v1/rooms/:roomId/layout
 * Fetches the existing validated layout for a room (if any).
 */
const getRoomLayout = asyncHandler(async (req, res) => {
  const layout = await roomLayoutService.getRoomLayoutByRoomId(
    req.user._id,
    req.params.roomId
  );

  return sendSuccess(
    res,
    layout ? 'Room layout found.' : 'No layout found for this room.',
    { roomLayout: layout },
    HTTP_STATUS.OK
  );
});

module.exports = {
  validateRoom,
  getRoomLayout
};
