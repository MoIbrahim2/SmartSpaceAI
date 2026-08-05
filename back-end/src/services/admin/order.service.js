const mongoose = require('mongoose');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const ApiError = require('../../errors/ApiError');
const HTTP_STATUS = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');

/**
 * Create a new Order / Buy Request
 * @param {string} userId - Customer User ID
 * @param {Object} orderData - Seller ID, items array, shipping address
 * @returns {Promise<Object>} Created order document
 */
const createOrder = async (userId, orderData) => {
  const { sellerId, items, shippingAddress, notes } = orderData;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  // Ensure target seller exists and has role SELLER
  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  // Calculate items total prices
  let totalAmount = 0;
  const processedItems = items.map(item => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const itemTotal = Number((item.price * qty).toFixed(2));
    totalAmount += itemTotal;
    return {
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: qty,
      totalPrice: itemTotal
    };
  });

  totalAmount = Number(totalAmount.toFixed(2));

  // Snapshot commission percentage from seller profile
  const commissionPercentage = seller.base_commission_percentage !== undefined ? seller.base_commission_percentage : 10;
  const commissionAmount = Number((totalAmount * (commissionPercentage / 100)).toFixed(2));
  const netSellerAmount = Number((totalAmount - commissionAmount).toFixed(2));

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await Order.create({
    orderNumber,
    userId,
    sellerId,
    items: processedItems,
    totalAmount,
    commissionPercentage,
    commissionAmount,
    netSellerAmount,
    status: 'PENDING',
    shippingAddress,
    notes
  });

  return order;
};

/**
 * Fetch paginated list of orders with REST query parameters
 * Parameters: ?page=1&limit=10&search=term&sort=createdAt&order=desc&sellerId=&userId=&status=
 * @param {Object} query
 * @returns {Promise<Object>} Orders list with pagination metadata
 */
const getOrders = async (query = {}) => {
  const filter = {};

  if (query.sellerId && mongoose.Types.ObjectId.isValid(query.sellerId)) {
    filter.sellerId = query.sellerId;
  }

  if (query.userId && mongoose.Types.ObjectId.isValid(query.userId)) {
    filter.userId = query.userId;
  }

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.search) {
    const escapedSearch = query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { orderNumber: searchRegex },
      { 'shippingAddress.city': searchRegex },
      { 'items.name': searchRegex }
    ];
  }

  // Pagination parameters
  const page = parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 1;
  const limit = parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 10;
  const skip = (page - 1) * limit;

  // Sorting parameters
  const sortField = query.sort || query.sortBy || 'createdAt';
  const sortDirection = (query.order || query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'profile.firstName profile.lastName authentication.email')
      .populate('sellerId', 'profile.firstName profile.lastName authentication.email base_commission_percentage')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Fetch single order details by ID
 * @param {string} orderId
 * @returns {Promise<Object>} Order document with populated user/seller info
 */
const getOrderById = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'order.invalid_id');
  }

  const order = await Order.findById(orderId)
    .populate('userId', 'profile.firstName profile.lastName authentication.email')
    .populate('sellerId', 'profile.firstName profile.lastName authentication.email base_commission_percentage');

  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'order.not_found');
  }

  return order;
};

/**
 * Update status of an existing order
 * @param {string} orderId
 * @param {string} status
 * @param {string} [notes]
 * @returns {Promise<Object>} Updated order document
 */
const updateOrderStatus = async (orderId, status, notes) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'order.invalid_id');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'order.not_found');
  }

  order.status = status;
  if (notes) {
    order.notes = notes;
  }

  await order.save();
  return order;
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
