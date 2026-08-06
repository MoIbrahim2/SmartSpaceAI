const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Handle furniture order checkout (Stripe or Cash on Delivery)
 */
const checkout = asyncHandler(async (req, res) => {
  const result = await orderService.checkout(req.user._id, req.body);
  return sendSuccess(res, 'order.checkout_successful', result, HTTP_STATUS.CREATED);
});

/**
 * Get authenticated user's order history
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getBuyerOrders(req.user._id);
  return sendSuccess(res, 'order.list_fetched', { orders }, HTTP_STATUS.OK);
});

/**
 * Get single order details
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user._id, req.params.id);
  return sendSuccess(res, 'order.details_fetched', { order }, HTTP_STATUS.OK);
});

module.exports = {
  checkout,
  getMyOrders,
  getOrderById
};
