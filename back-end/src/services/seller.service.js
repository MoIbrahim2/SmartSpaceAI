const Product = require('../models/product.model');
const BuyRequest = require('../models/buyRequest.model');
const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const ROLES = require('../constants/roles');
const { validateSellerProductSubmission } = require('./aiService');

/**
 * List products owned by a seller.
 * @param {string} sellerId
 * @param {Object} queryParams
 * @returns {Promise<Array>} Products list
 */
const listSellerProducts = async (sellerId, queryParams = {}) => {
  const query = { sellerId };

  if (queryParams.status) {
    query['processing.status'] = queryParams.status;
  }

  if (queryParams.search) {
    query['basic.name'] = { $regex: queryParams.search, $options: 'i' };
  }

  // Return products sorted newest first
  return await Product.find(query).sort({ _id: -1 });
};

/**
 * Get a single product owned by a seller.
 * @param {string} sellerId
 * @param {string} productId
 * @returns {Promise<Object>} Product document
 */
const getSellerProduct = async (sellerId, productId) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Product not found or not authorized');
  }
  return product;
};

/**
 * Create a new seller product, and trigger AI vision validation.
 * @param {string} sellerId
 * @param {Object} productData
 * @returns {Promise<Object>} Created product
 */
const createSellerProduct = async (sellerId, productData) => {
  // Ensure the user actually exists and is a seller
  const seller = await User.findById(sellerId);
  if (!seller || (seller.role || '').toUpperCase() !== ROLES.SELLER) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'user.unauthorized_seller_role');
  }

  if (seller.status === 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'user.seller_not_activated');
  }

  if (seller.status === 'SUSPENDED') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.suspended');
  }

  const product = new Product({
    ...productData,
    sellerId,
    processing: {
      status: 'PENDING_AI_VALIDATION',
      issues: []
    }
  });

  await product.save();

  // Run the AI vision pipeline asynchronously
  validateSellerProductSubmission(product._id).catch(err => {
    console.error(`[Seller Service] Asynchronous product AI validation error for ${product._id}:`, err);
  });

  return product;
};

/**
 * Update an existing seller product.
 * @param {string} sellerId
 * @param {string} productId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated product
 */
const updateSellerProduct = async (sellerId, productId, updateData) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Product not found or not authorized');
  }

  // Determine if a re-validation is required
  // AI validation is re-run if name, description, categories, materials, colors, dimensions, or images are modified
  let triggerValidation = false;
  if (updateData.basic || updateData.classification || updateData.images || updateData.dimensions) {
    triggerValidation = true;
  }

  // Update properties selectively
  if (updateData.basic) {
    product.basic = { ...product.basic, ...updateData.basic };
  }
  if (updateData.classification) {
    product.classification = { ...product.classification, ...updateData.classification };
  }
  if (updateData.pricing) {
    product.pricing = { ...product.pricing, ...updateData.pricing };
  }
  if (updateData.dimensions) {
    product.dimensions = { ...product.dimensions, ...updateData.dimensions };
  }
  if (updateData.images) {
    product.images = updateData.images;
  }
  if (updateData.availability) {
    product.availability = { ...product.availability, ...updateData.availability };
  }

  if (triggerValidation) {
    product.processing = {
      status: 'PENDING_AI_VALIDATION',
      issues: []
    };
  }

  await product.save();

  if (triggerValidation) {
    validateSellerProductSubmission(product._id).catch(err => {
      console.error(`[Seller Service] Asynchronous product AI re-validation error for ${product._id}:`, err);
    });
  }

  return product;
};

/**
 * Delete a seller product.
 * @param {string} sellerId
 * @param {string} productId
 * @returns {Promise<boolean>} Success status
 */
const deleteSellerProduct = async (sellerId, productId) => {
  const product = await Product.findOne({ _id: productId, sellerId });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Product not found or not authorized');
  }

  // Prevent deletion if there are active fulfillment orders in PENDING or PROCESSING states
  const activeOrdersCount = await BuyRequest.countDocuments({
    productId,
    status: { $in: ['PENDING', 'PROCESSING'] }
  });

  if (activeOrdersCount > 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot delete product with active pending or processing orders');
  }

  await Product.deleteOne({ _id: productId });
  return true;
};

/**
 * Format order document into the structure expected by the frontend.
 * @param {Object} order - Mongoose order document
 * @returns {Object} Formatted order object
 */
const formatOrderForFrontend = (order) => {
  if (!order) return null;
  const orderObj = order.toObject ? order.toObject() : order;

  const price = orderObj.unitPriceAtPurchase || (orderObj.productId?.pricing?.currentPrice) || 0;
  const name = orderObj.productId?.basic?.name || 'Unknown Product';

  orderObj.items = [
    {
      product: {
        _id: orderObj.productId?._id || orderObj.productId,
        name,
        price
      },
      quantity: orderObj.quantity || 1
    }
  ];

  orderObj.totalAmount = orderObj.grossTotalAmount;
  return orderObj;
};

/**
 * List orders received by a seller.
 * @param {string} sellerId
 * @param {Object} queryParams
 * @returns {Promise<Array>} List of orders (BuyRequests)
 */
const listSellerOrders = async (sellerId, queryParams = {}) => {
  const query = { sellerId };

  if (queryParams.status) {
    query.status = queryParams.status;
  }

  const orders = await BuyRequest.find(query)
    .populate({
      path: 'productId',
      select: 'basic.name images pricing'
    })
    .populate({
      path: 'buyerId',
      select: 'profile.firstName profile.lastName authentication.email'
    })
    .sort({ createdAt: -1 });

  return orders.map(formatOrderForFrontend);
};

/**
 * Update the state/status of an order.
 * @param {string} sellerId
 * @param {string} orderId
 * @param {string} status - New status ('PROCESSING', 'DELIVERED', 'REJECTED')
 * @returns {Promise<Object>} Updated order (BuyRequest)
 */
const updateOrderStatus = async (sellerId, orderId, status) => {
  const order = await BuyRequest.findOne({ _id: orderId, sellerId });
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found or not authorized');
  }

  const currentStatus = order.status;

  // Enforce order state machine:
  // - PENDING -> PROCESSING or REJECTED
  // - PROCESSING -> DELIVERED
  if (currentStatus === 'PENDING') {
    if (status !== 'PROCESSING' && status !== 'REJECTED') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Pending orders can only transition to PROCESSING or REJECTED');
    }
  } else if (currentStatus === 'PROCESSING') {
    if (status !== 'DELIVERED') {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Processing orders can only transition to DELIVERED');
    }
  } else {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Cannot modify order status from its current state: ${currentStatus}`);
  }

  order.status = status;

  if (status === 'DELIVERED') {
    const seller = await User.findById(sellerId);
    const commissionRate = seller?.sellerProfile?.commissionRate || 0.12;

    order.commission.appliedRate = commissionRate;
    order.commission.amountOwed = Math.round(order.grossTotalAmount * commissionRate);
    order.commission.isCommissionPaid = false;
    
    const now = new Date();
    order.commission.settlementGroup = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  await order.save();

  // Populate references for clean controller responses
  const populated = await order.populate([
    { path: 'productId', select: 'basic.name images pricing' },
    { path: 'buyerId', select: 'profile.firstName profile.lastName authentication.email' }
  ]);

  return formatOrderForFrontend(populated);
};

/**
 * Retrieve aggregated financial analytics and ledgers.
 * @param {string} sellerId
 * @returns {Promise<Object>} Financial analytics summary
 */
const getSellerEarnings = async (sellerId) => {
  const seller = await User.findById(sellerId);
  const commissionRate = seller?.sellerProfile?.commissionRate || 0.12;

  const deliveredOrders = await BuyRequest.find({
    sellerId,
    status: 'DELIVERED'
  });

  const grossRevenue = deliveredOrders.reduce((sum, o) => sum + o.grossTotalAmount, 0);
  const platformFees = deliveredOrders.reduce((sum, o) => sum + (o.commission?.amountOwed || 0), 0);

  const outstandingFees = deliveredOrders
    .filter(o => !o.commission?.isCommissionPaid)
    .reduce((sum, o) => sum + (o.commission?.amountOwed || 0), 0);

  const paidFees = deliveredOrders
    .filter(o => o.commission?.isCommissionPaid)
    .reduce((sum, o) => sum + (o.commission?.amountOwed || 0), 0);

  // Group delivered orders into monthly ledgers
  const ledgerMap = {};
  deliveredOrders.forEach(o => {
    const date = new Date(o.createdAt);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const period = `${months[date.getMonth()]} ${date.getFullYear()}`;
    const statusKey = o.commission?.isCommissionPaid ? 'PAID' : 'UNPAID';
    const key = `${period}_${statusKey}`;

    if (!ledgerMap[key]) {
      ledgerMap[key] = {
        period,
        totalSales: 0,
        platformFee: 0,
        paymentStatus: statusKey,
        verificationDate: o.commission?.isCommissionPaid
          ? (o.updatedAt ? o.updatedAt.toISOString().split('T')[0] : '-')
          : '-'
      };
    }

    ledgerMap[key].totalSales += o.grossTotalAmount;
    ledgerMap[key].platformFee += (o.commission?.amountOwed || 0);
  });

  // Sort monthly ledgers descending
  const ledger = Object.values(ledgerMap).sort((a, b) => {
    return new Date(b.period) - new Date(a.period);
  });

  // Provide a default empty item if no ledger matches
  if (ledger.length === 0) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const date = new Date();
    const period = `${months[date.getMonth()]} ${date.getFullYear()}`;
    ledger.push({
      period,
      totalSales: 0,
      platformFee: 0,
      paymentStatus: 'UNPAID',
      verificationDate: '-'
    });
  }

  return {
    grossRevenue,
    commissionRate,
    platformFees,
    outstandingFees,
    paidFees,
    ledger
  };
};

module.exports = {
  listSellerProducts,
  getSellerProduct,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  listSellerOrders,
  updateOrderStatus,
  getSellerEarnings
};
