const apartmentService = require('../services/apartment.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new apartment
 */
const createApartment = asyncHandler(async (req, res) => {
  const apartment = await apartmentService.createApartment(req.user._id, req.body, req.file);
  return sendSuccess(res, 'apartment.create_success', { apartment }, HTTP_STATUS.CREATED);
});

/**
 * Fetch all apartments with query filters and pagination
 */
const getApartments = asyncHandler(async (req, res) => {
  const result = await apartmentService.getApartments(req.query);
  return sendSuccess(res, 'apartment.fetch_success', result, HTTP_STATUS.OK);
});

/**
 * Fetch a single apartment by ID
 */
const getApartmentById = asyncHandler(async (req, res) => {
  const apartment = await apartmentService.getApartmentById(req.params.id);
  return sendSuccess(res, 'apartment.fetch_success', { apartment }, HTTP_STATUS.OK);
});

/**
 * Update an apartment's details
 */
const updateApartment = asyncHandler(async (req, res) => {
  const updatedApartment = await apartmentService.updateApartment(
    req.user._id,
    req.params.id,
    req.body,
    req.file
  );
  return sendSuccess(res, 'apartment.update_success', { apartment: updatedApartment }, HTTP_STATUS.OK);
});

/**
 * Delete an apartment
 */
const deleteApartment = asyncHandler(async (req, res) => {
  await apartmentService.deleteApartment(req.user._id, req.params.id);
  return sendSuccess(res, 'apartment.delete_success', {}, HTTP_STATUS.OK);
});

module.exports = {
  createApartment,
  getApartments,
  getApartmentById,
  updateApartment,
  deleteApartment
};
