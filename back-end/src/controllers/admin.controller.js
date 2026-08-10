const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const ROLES = require('../constants/roles');
const { sendSuccess } = require('../utils/responseHelper');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

/**
 * Handle seller creation by Administrator
 */
const createSeller = asyncHandler(async (req, res) => {
  const { name, email, phone, commissionRate } = req.body;

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Check if email already exists
  const existingUser = await User.findOne({ 'authentication.email': normalizedEmail });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'auth.email_exists');
  }

  // Derive firstName and lastName from store/business name
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || 'Seller';

  // Generate a random secure temporary password that passes standard password requirements
  // (hex string + uppercase letter + lowercase letter + digit + special symbol)
  const tempPassword = crypto.randomBytes(12).toString('hex') + 'Aa1!';

  // Create new seller user
  const newSeller = await User.create({
    role: ROLES.SELLER,
    sellerProfile: {
      commissionRate: commissionRate / 100, // Store as decimal (e.g., 12% -> 0.12)
      businessName: name,
      phone: phone || ''
    },
    profile: {
      firstName,
      lastName,
      avatar: ''
    },
    authentication: {
      email: normalizedEmail,
      passwordHash: tempPassword, // Will be auto-hashed by pre-save hook
      provider: 'local',
      emailVerified: true
    }
  });

  return sendSuccess(res, 'admin.seller_created', { seller: newSeller }, HTTP_STATUS.CREATED);
});

/**
 * Retrieve all registered sellers along with product counts and total sales
 */
const getSellers = asyncHandler(async (req, res) => {
  const sellers = await User.find({ role: ROLES.SELLER }).sort({ createdAt: -1 }).lean();

  if (sellers.length === 0) {
    return sendSuccess(res, 'admin.sellers_fetched', { sellers: [] });
  }

  const sellerIds = sellers.map(s => s._id);

  // Group and count products for each seller
  const productCounts = await Product.aggregate([
    { $match: { sellerId: { $in: sellerIds } } },
    { $group: { _id: '$sellerId', count: { $sum: 1 } } }
  ]);

  // Group and sum total sales for each seller (only count DELIVERED orders)
  const totalSalesAgg = await Order.aggregate([
    { $match: { sellerId: { $in: sellerIds }, status: 'DELIVERED' } },
    { $group: { _id: '$sellerId', totalSales: { $sum: { $ifNull: ['$totalAmount', '$grossTotalAmount'] } } } }
  ]);

  // Create lookup maps
  const countMap = {};
  productCounts.forEach(p => {
    countMap[p._id.toString()] = p.count;
  });

  const salesMap = {};
  totalSalesAgg.forEach(s => {
    salesMap[s._id.toString()] = s.totalSales;
  });

  // Attach metadata to each seller
  const sellersWithStats = sellers.map(s => ({
    ...s,
    productsCount: countMap[s._id.toString()] || 0,
    totalSales: salesMap[s._id.toString()] || 0
  }));

  return sendSuccess(res, 'admin.sellers_fetched', { sellers: sellersWithStats });
});

/**
 * Update the commission rate for a specific seller
 */
const updateSellerCommission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { commissionRate } = req.body;

  const seller = await User.findOne({ _id: id, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  seller.sellerProfile.commissionRate = commissionRate / 100;
  await seller.save();

  return sendSuccess(res, 'admin.commission_updated', { seller });
});

/**
 * Permanently delete a seller account, its products, and verify no active orders exist
 */
const deleteSeller = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const seller = await User.findOne({ _id: id, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  // Check for active orders (pending, processing, shipped)
  const activeOrdersCount = await Order.countDocuments({
    sellerId: id,
    status: { $in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
  });

  if (activeOrdersCount > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Cannot delete seller with active pending, processing, or shipped orders'
    );
  }

  // Delete all products associated with this seller
  await Product.deleteMany({ sellerId: id });

  // Delete the user record
  await User.findByIdAndDelete(id);

  return sendSuccess(res, 'admin.seller_deleted', { id });
});

module.exports = {
  createSeller,
  getSellers,
  updateSellerCommission,
  deleteSeller
};

