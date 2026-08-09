const sellerService = require('../services/seller.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get products owned by authenticated seller
 */
const getProducts = asyncHandler(async (req, res) => {
  const products = await sellerService.listSellerProducts(req.user._id, req.query);
  return sendSuccess(res, 'seller.products_fetched', products, HTTP_STATUS.OK);
});

/**
 * Create a new product as a seller
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await sellerService.createSellerProduct(req.user._id, req.body, req.file);
  return sendSuccess(res, 'seller.product_created', product, HTTP_STATUS.CREATED);
});

/**
 * Get a single seller product
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await sellerService.getSellerProduct(req.user._id, req.params.id);
  return sendSuccess(res, 'seller.product_fetched', product, HTTP_STATUS.OK);
});

/**
 * Update a seller product
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await sellerService.updateSellerProduct(req.user._id, req.params.id, req.body, req.file);
  return sendSuccess(res, 'seller.product_updated', product, HTTP_STATUS.OK);
});

/**
 * Delete a seller product
 */
const deleteProduct = asyncHandler(async (req, res) => {
  await sellerService.deleteSellerProduct(req.user._id, req.params.id);
  return sendSuccess(res, 'seller.product_deleted', {}, HTTP_STATUS.OK);
});

/**
 * Get orders received by authenticated seller
 */
const getOrders = asyncHandler(async (req, res) => {
  const orders = await sellerService.listSellerOrders(req.user._id, req.query);
  return sendSuccess(res, 'seller.orders_fetched', orders, HTTP_STATUS.OK);
});

/**
 * Update status of an order
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await sellerService.updateOrderStatus(req.user._id, req.params.id, req.body.status);
  return sendSuccess(res, 'seller.order_status_updated', order, HTTP_STATUS.OK);
});

/**
 * Get seller earnings summary and ledgers
 */
const getEarnings = asyncHandler(async (req, res) => {
  const earnings = await sellerService.getSellerEarnings(req.user._id);
  return sendSuccess(res, 'seller.earnings_fetched', earnings, HTTP_STATUS.OK);
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getEarnings
};
