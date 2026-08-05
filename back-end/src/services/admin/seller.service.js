const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../../models/user.model');
const Product = require('../../models/product.model');
const Order = require('../../models/order.model');
const emailService = require('../email.service');
const ApiError = require('../../errors/ApiError');
const HTTP_STATUS = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');

/**
 * Create a new Seller (User with role = SELLER and status = PENDING_ACTIVATION)
 * @param {Object} sellerData
 * @returns {Promise<Object>} Created seller user object
 */
const createSeller = async (sellerData) => {
  let { firstName, lastName, email, base_commission_percentage, commissionRate, name } = sellerData;

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if ((!firstName || !firstName.trim()) && name && name.trim()) {
    const parts = name.trim().split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || parts[0];
  }

  firstName = (firstName || 'Seller').trim();
  lastName = (lastName || 'Store').trim();

  const finalCommission = base_commission_percentage !== undefined
    ? Number(base_commission_percentage)
    : (commissionRate !== undefined ? Number(commissionRate) : 10);

  // Check if email is already registered
  const existingUser = await User.findOne({ 'authentication.email': normalizedEmail });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'An account with this email address is already registered.');
  }

  // Generate 6-digit verification code OTP
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash code with SHA-256
  const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex');

  // Set 15-minute expiration
  const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Unset/placeholder password string for pending account
  const placeholderPassword = `UNACTIVATED_${crypto.randomBytes(16).toString('hex')}`;

  const seller = await User.create({
    role: ROLES.SELLER,
    status: 'PENDING_ACTIVATION',
    verificationCode: hashedCode,
    verificationCodeExpiresAt,
    profile: {
      firstName,
      lastName,
      avatar: ''
    },
    authentication: {
      email: normalizedEmail,
      passwordHash: placeholderPassword,
      provider: 'local',
      emailVerified: false
    },
    base_commission_percentage: finalCommission
  });

  // Send invitation email
  await emailService.sendSellerInvitationEmail({
    email: normalizedEmail,
    firstName,
    verificationCode: rawCode
  });

  return seller;
};

/**
 * Fetch paginated list of sellers with standard REST query parameters
 * Parameters: ?page=1&limit=10&search=term&sort=createdAt&order=desc
 * @param {Object} query
 * @returns {Promise<Object>} Sellers list with pagination metadata
 */
const getSellers = async (query = {}) => {
  const filter = { role: ROLES.SELLER };

  // Search filter across name and email
  if (query.search) {
    const escapedSearch = query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex },
      { 'authentication.email': searchRegex }
    ];
  }

  // Standard REST pagination params
  const page = parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 1;
  const limit = parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 10;
  const skip = (page - 1) * limit;

  // Standard REST sort params (?sort=createdAt&order=desc)
  const sortField = query.sort || query.sortBy || 'createdAt';
  const sortDirection = (query.order || query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDirection };

  const [sellers, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    sellers,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Fetch seller details by ID with calculated statistics
 * @param {string} sellerId
 * @returns {Promise<Object>} Seller details with statistics
 */
const getSellerById = async (sellerId) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  // Compute live statistics for this seller
  const [totalProducts, totalOrders, totalSalesAgg] = await Promise.all([
    Product.countDocuments({ sellerId: seller._id }),
    Order.countDocuments({ sellerId: seller._id }),
    Order.aggregate([
      { $match: { sellerId: seller._id, status: { $nin: ['CANCELLED', 'REJECTED'] } } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
    ])
  ]);

  const totalSales = totalSalesAgg.length > 0 ? totalSalesAgg[0].totalSales : 0;
  const sellerObj = seller.toObject();

  return {
    ...sellerObj,
    statistics: {
      totalProducts,
      totalOrders,
      totalSales,
      currentCommissionPercentage: seller.base_commission_percentage ?? 10
    }
  };
};

/**
 * Update seller base commission percentage
 * @param {string} sellerId
 * @param {number} base_commission_percentage
 * @returns {Promise<Object>} Updated seller object
 */
const updateSellerCommission = async (sellerId, base_commission_percentage) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  seller.base_commission_percentage = base_commission_percentage;
  await seller.save();

  return seller;
};

/**
 * Permanently delete seller account from users collection
 * @param {string} sellerId
 * @returns {Promise<Object>} Deleted seller user object
 */
const deleteSeller = async (sellerId) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOneAndDelete({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  return seller;
};

/**
 * Resend verification code for a seller pending activation
 * @param {string} sellerId
 * @returns {Promise<Object>} Seller user object
 */
const resendSellerVerificationCode = async (sellerId) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  if (seller.status === 'ACTIVE') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  // Generate new 6-digit verification code OTP
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex');

  seller.verificationCode = hashedCode;
  seller.verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await seller.save();

  // Send invitation email with new verification code
  await emailService.sendSellerInvitationEmail({
    email: seller.authentication.email,
    firstName: seller.profile?.firstName || 'Seller',
    verificationCode: rawCode
  });

  return seller;
};

module.exports = {
  createSeller,
  getSellers,
  getSellerById,
  updateSellerCommission,
  deleteSeller,
  resendSellerVerificationCode
};

