const sellerService = require('../../services/admin/seller.service');
const { sendSuccess } = require('../../utils/responseHelper');
const HTTP_STATUS = require('../../constants/statusCodes');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle admin creation of a seller
 */
const createSeller = asyncHandler(async (req, res) => {
  const seller = await sellerService.createSeller(req.body);
  return sendSuccess(res, 'seller.created', { seller }, HTTP_STATUS.CREATED);
});

/**
 * Handle fetching list of sellers
 */
const getSellers = asyncHandler(async (req, res) => {
  const result = await sellerService.getSellers(req.query);
  return sendSuccess(res, 'seller.fetched_list', result, HTTP_STATUS.OK);
});

/**
 * Handle fetching seller details by ID
 */
const getSellerById = asyncHandler(async (req, res) => {
  const seller = await sellerService.getSellerById(req.params.id);
  return sendSuccess(res, 'seller.fetched_details', { seller }, HTTP_STATUS.OK);
});

/**
 * Handle updating seller commission
 */
const updateSellerCommission = asyncHandler(async (req, res) => {
  const seller = await sellerService.updateSellerCommission(
    req.params.id,
    req.body.base_commission_percentage
  );
  return sendSuccess(res, 'seller.commission_updated', { seller }, HTTP_STATUS.OK);
});

module.exports = {
  createSeller,
  getSellers,
  getSellerById,
  updateSellerCommission
};
