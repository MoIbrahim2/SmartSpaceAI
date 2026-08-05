const orderService = require('../../services/admin/order.service');
const { sendSuccess } = require('../../utils/responseHelper');
const HTTP_STATUS = require('../../constants/statusCodes');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle creation of an order / buy request
 */
const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  return sendSuccess(res, 'order.created', { order }, HTTP_STATUS.CREATED);
});

/**
 * Handle fetching list of orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getOrders(req.query);
  return sendSuccess(res, 'order.fetched_list', result, HTTP_STATUS.OK);
});

/**
 * Handle fetching single order details by ID
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  return sendSuccess(res, 'order.fetched_details', { order }, HTTP_STATUS.OK);
});

/**
 * Handle updating order status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.body.notes
  );
  return sendSuccess(res, 'order.status_updated', { order }, HTTP_STATUS.OK);
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
