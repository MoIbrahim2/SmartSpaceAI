const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
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
    role: 'seller',
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

module.exports = {
  createSeller
};
