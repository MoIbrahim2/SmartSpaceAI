const Room = require('../models/room.model');
const Apartment = require('../models/apartment.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');

/**
 * Create a new room
 * @param {string} userId - Owner ID (must own the apartment)
 * @param {Object} roomData - Room details (apartmentId, name, roomType, dimensions, etc.)
 * @param {Array} files - Uploaded source images
 * @returns {Promise<Object>} Created room document
 */
const createRoom = async (userId, roomData, files = []) => {
  const { apartmentId, name, roomType, description, dimensions, status } = roomData;

  // Verify apartment ownership
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'apartment.not_found');
  }

  if (apartment.ownerId.toString() !== userId.toString()) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'apartment.forbidden');
  }

  const sourceImages = files.map(file => ({
    url: `uploads/rooms/${file.filename}`,
    storageProvider: 'local',
    fileName: file.filename,
    uploadedAt: new Date()
  }));

  const room = new Room({
    apartmentId,
    name,
    roomType,
    description,
    dimensions,
    status: status || 'ACTIVE',
    sourceImages
  });

  // Default coverImageId to the first source image if not provided
  if (sourceImages.length > 0) {
    room.coverImageId = room.sourceImages[0]._id;
  }

  await room.save();
  return room;
};

/**
 * Fetch rooms with query filters and pagination for apartments owned by the user
 * @param {string} userId - Requesting user ID
 * @param {Object} query - Express query params
 * @returns {Promise<Object>} Paginated rooms list
 */
const getRooms = async (userId, query = {}) => {
  const filter = {};

  // Fetch all apartments owned by the user
  const userApartments = await Apartment.find({ ownerId: userId }).select('_id');
  const userApartmentIds = userApartments.map(apt => apt._id);

  if (query.apartmentId) {
    // If apartmentId is provided, verify ownership
    if (!userApartmentIds.map(id => id.toString()).includes(query.apartmentId.toString())) {
      return {
        rooms: [],
        pagination: {
          total: 0,
          page: parseInt(query.page, 10) || 1,
          limit: parseInt(query.limit, 10) || 10,
          pages: 0
        }
      };
    }
    filter.apartmentId = query.apartmentId;
  } else {
    // Restrict to only apartments owned by the user
    filter.apartmentId = { $in: userApartmentIds };
  }

  if (query.roomType) {
    filter.roomType = query.roomType;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.search) {
    const escapedSearch = query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    filter.name = { $regex: escapedSearch, $options: 'i' };
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const rooms = await Room.find(filter)
    .populate({
      path: 'apartmentId',
      select: 'name ownerId'
    })
    .populate('selectedGenerationId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Room.countDocuments(filter);

  return {
    rooms,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Fetch a single room by ID, enforcing ownership
 * @param {string} userId - Requesting user ID
 * @param {string} roomId
 * @returns {Promise<Object>} Room document
 */
const getRoomById = async (userId, roomId) => {
  const room = await Room.findById(roomId)
    .populate({
      path: 'apartmentId',
      select: 'name ownerId'
    })
    .populate('selectedGenerationId');

  if (!room) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }

  // Verify apartment ownership
  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
  }

  return room;
};

/**
 * Update room details
 * @param {string} userId - Requesting user ID (must be apartment owner)
 * @param {string} roomId
 * @param {Object} updateFields
 * @param {Array} files - New uploaded source images to append
 * @returns {Promise<Object>} Updated room document
 */
const updateRoom = async (userId, roomId, updateFields, files = []) => {
  const room = await Room.findById(roomId).populate('apartmentId');
  if (!room) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }

  // Verify apartment ownership
  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    if (files) files.forEach(file => fs.unlink(file.path, () => {}));
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
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
      for (const img of room.sourceImages) {
        if (deleteIds.includes(img._id.toString())) {
          // Delete file from disk
          const filePath = path.join(process.cwd(), 'uploads', 'rooms', img.fileName);
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete room source image: ${err.message}`);
          });
        } else {
          keptImages.push(img);
        }
      }
      room.sourceImages = keptImages;
    }
  }

  // Handle appending new uploads
  if (files && files.length > 0) {
    const newImages = files.map(file => ({
      url: `uploads/rooms/${file.filename}`,
      storageProvider: 'local',
      fileName: file.filename,
      uploadedAt: new Date()
    }));
    room.sourceImages.push(...newImages);
  }

  // Update text fields
  if (updateFields.name !== undefined) room.name = updateFields.name;
  if (updateFields.roomType !== undefined) room.roomType = updateFields.roomType;
  if (updateFields.description !== undefined) room.description = updateFields.description;
  if (updateFields.status !== undefined) room.status = updateFields.status;

  if (updateFields.selectedGenerationId !== undefined) {
    if (updateFields.selectedGenerationId === null || updateFields.selectedGenerationId === '') {
      room.selectedGenerationId = undefined;
    } else {
      const Generation = require('../models/generation.model');
      const generation = await Generation.findById(updateFields.selectedGenerationId);
      if (!generation) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'generation.not_found');
      }
      if (generation.roomId.toString() !== roomId.toString() || generation.ownerId.toString() !== userId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid selectedGenerationId: must belong to the same room and owner');
      }
      room.selectedGenerationId = updateFields.selectedGenerationId;
    }
  }

  // Update dimensions
  if (updateFields.dimensions) {
    const dim = typeof updateFields.dimensions === 'string' ? JSON.parse(updateFields.dimensions) : updateFields.dimensions;
    if (dim.width !== undefined) room.dimensions.width = dim.width;
    if (dim.length !== undefined) room.dimensions.length = dim.length;
    if (dim.height !== undefined) room.dimensions.height = dim.height;
    if (dim.unit !== undefined) room.dimensions.unit = dim.unit;
  }

  // Update coverImageId (verify it exists in updated sourceImages)
  if (updateFields.coverImageId) {
    const exists = room.sourceImages.some(img => img._id.toString() === updateFields.coverImageId.toString());
    if (exists) {
      room.coverImageId = updateFields.coverImageId;
    } else {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid coverImageId: does not match any source image');
    }
  } else if (room.sourceImages.length > 0 && (!room.coverImageId || !room.sourceImages.some(img => img._id.toString() === room.coverImageId.toString()))) {
    // Default to the first if invalid or missing
    room.coverImageId = room.sourceImages[0]._id;
  } else if (room.sourceImages.length === 0) {
    room.coverImageId = undefined;
  }

  await room.save();
  return room;
};

/**
 * Delete a room
 * @param {string} userId - Requesting user ID (must be apartment owner)
 * @param {string} roomId
 * @returns {Promise<Object>} Deleted room document
 */
const deleteRoom = async (userId, roomId) => {
  const room = await Room.findById(roomId).populate('apartmentId');
  if (!room) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'room.not_found');
  }

  // Verify apartment ownership
  if (!room.apartmentId || room.apartmentId.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'room.forbidden');
  }

  // Clean up source images
  if (room.sourceImages && room.sourceImages.length > 0) {
    room.sourceImages.forEach(img => {
      const filePath = path.join(process.cwd(), 'uploads', 'rooms', img.fileName);
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete room source image: ${err.message}`);
      });
    });
  }

  await room.deleteOne();
  return room;
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom
};
