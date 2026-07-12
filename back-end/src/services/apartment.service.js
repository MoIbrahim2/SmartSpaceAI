const Apartment = require('../models/apartment.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');

/**
 * Create a new apartment
 * @param {string} userId - Owner ID
 * @param {Object} apartmentData - Name, description, location details
 * @param {Object} file - Uploaded cover image file from multer
 * @returns {Promise<Object>} Created apartment document
 */
const createApartment = async (userId, apartmentData, file) => {
  const { name, description, location, status } = apartmentData;

  let coverImage = undefined;
  if (file) {
    coverImage = {
      url: `uploads/${file.filename}`,
      storageProvider: 'local',
      fileName: file.filename,
      uploadedAt: new Date()
    };
  }

  const apartment = await Apartment.create({
    ownerId: userId,
    name,
    description,
    location,
    status: status || 'ACTIVE',
    coverImage
  });

  return apartment;
};

/**
 * Fetch apartments with search, filters, and pagination
 * @param {Object} query - Express request query object
 * @returns {Promise<Object>} Paginated apartments list
 */
const getApartments = async (query = {}) => {
  const filter = {};

  if (query.ownerId) {
    filter.ownerId = query.ownerId;
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

  const apartments = await Apartment.find(filter)
    .populate('ownerId', 'profile')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Apartment.countDocuments(filter);

  return {
    apartments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Fetch a single apartment by ID
 * @param {string} apartmentId
 * @returns {Promise<Object>} Apartment document
 */
const getApartmentById = async (apartmentId) => {
  const apartment = await Apartment.findById(apartmentId).populate('ownerId', 'profile');
  if (!apartment) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'apartment.not_found');
  }
  return apartment;
};

/**
 * Update apartment details
 * @param {string} userId - Requesting user ID (must be owner)
 * @param {string} apartmentId
 * @param {Object} updateFields
 * @param {Object} file - New cover image
 * @returns {Promise<Object>} Updated apartment document
 */
const updateApartment = async (userId, apartmentId, updateFields, file) => {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    if (file) fs.unlink(file.path, () => {});
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'apartment.not_found');
  }

  // Authorization check: Only the owner can update
  if (apartment.ownerId.toString() !== userId.toString()) {
    if (file) fs.unlink(file.path, () => {});
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'apartment.forbidden');
  }

  // Handle cover image upload replacement
  if (file) {
    if (apartment.coverImage && apartment.coverImage.fileName) {
      const oldImagePath = path.join(process.cwd(), 'uploads', apartment.coverImage.fileName);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error(`Failed to delete old cover image: ${err.message}`);
      });
    }
    apartment.coverImage = {
      url: `uploads/${file.filename}`,
      storageProvider: 'local',
      fileName: file.filename,
      uploadedAt: new Date()
    };
  }

  // Update main text fields
  if (updateFields.name !== undefined) apartment.name = updateFields.name;
  if (updateFields.description !== undefined) apartment.description = updateFields.description;
  if (updateFields.status !== undefined) apartment.status = updateFields.status;

  // Update nested location fields
  if (updateFields.location) {
    const loc = updateFields.location;
    if (loc.country !== undefined) apartment.location.country = loc.country;
    if (loc.city !== undefined) apartment.location.city = loc.city;
    if (loc.district !== undefined) apartment.location.district = loc.district;
    if (loc.street !== undefined) apartment.location.street = loc.street;
    if (loc.building !== undefined) apartment.location.building = loc.building;
    if (loc.floor !== undefined) apartment.location.floor = loc.floor;
    if (loc.apartmentNumber !== undefined) apartment.location.apartmentNumber = loc.apartmentNumber;
  }

  const updatedApartment = await apartment.save();
  return updatedApartment;
};

/**
 * Delete an apartment
 * @param {string} userId - Requesting user ID (must be owner)
 * @param {string} apartmentId
 * @returns {Promise<Object>} Deleted apartment document
 */
const deleteApartment = async (userId, apartmentId) => {
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'apartment.not_found');
  }

  // Authorization check: Only the owner can delete
  if (apartment.ownerId.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'apartment.forbidden');
  }

  // Clean up cover image file
  if (apartment.coverImage && apartment.coverImage.fileName) {
    const imagePath = path.join(process.cwd(), 'uploads', apartment.coverImage.fileName);
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Failed to delete cover image: ${err.message}`);
    });
  }

  await apartment.deleteOne();
  return apartment;
};

module.exports = {
  createApartment,
  getApartments,
  getApartmentById,
  updateApartment,
  deleteApartment
};
