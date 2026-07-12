const roomService = require('../services/room.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new room
 */
const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.user._id, req.body, req.files);
  return sendSuccess(res, 'room.create_success', { room }, HTTP_STATUS.CREATED);
});

/**
 * Fetch all rooms with query filters and pagination
 */
const getRooms = asyncHandler(async (req, res) => {
  const result = await roomService.getRooms(req.query);
  return sendSuccess(res, 'room.fetch_success', result, HTTP_STATUS.OK);
});

/**
 * Fetch a single room by ID
 */
const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  return sendSuccess(res, 'room.fetch_success', { room }, HTTP_STATUS.OK);
});

/**
 * Update a room's details
 */
const updateRoom = asyncHandler(async (req, res) => {
  const updatedRoom = await roomService.updateRoom(
    req.user._id,
    req.params.id,
    req.body,
    req.files
  );
  return sendSuccess(res, 'room.update_success', { room: updatedRoom }, HTTP_STATUS.OK);
});

/**
 * Delete a room
 */
const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.user._id, req.params.id);
  return sendSuccess(res, 'room.delete_success', {}, HTTP_STATUS.OK);
});

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom
};
