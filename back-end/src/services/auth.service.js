const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../helpers/token');

/**
 * Utility to hash a token using SHA-256
 * @param {string} token
 * @returns {string} Hex-encoded hash
 */
const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Securely compare two hashes using constant-time check to prevent timing attacks
 * @param {string} storedHash
 * @param {string} incomingHash
 * @returns {boolean} True if they match
 */
const compareHash = (storedHash, incomingHash) => {
  if (!storedHash || !incomingHash) return false;
  const a = Buffer.from(storedHash, 'hex');
  const b = Buffer.from(incomingHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * Register a new user in the database
 * @param {Object} userData - User sign up details
 * @returns {Promise<Object>} The registered User instance
 */
const signUp = async (userData) => {
  const { firstName, lastName, email, dateOfBirth, password } = userData;

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Check if email already exists
  const existingUser = await User.findOne({ 'authentication.email': normalizedEmail });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'auth.email_exists');
  }

  // Create new user (password is automatically hashed by pre-save hook)
  const newUser = await User.create({
    profile: {
      firstName,
      lastName,
      dateOfBirth,
      avatar: ''
    },
    authentication: {
      email: normalizedEmail,
      passwordHash: password,
      provider: 'local',
      emailVerified: false
    }
  });

  return newUser;
};

/**
 * Authenticate a user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User instance, accessToken, refreshToken
 */
const signIn = async (email, password) => {
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Explicitly select password field to perform verification
  const user = await User.findOne({ 'authentication.email': normalizedEmail }).select('+authentication.passwordHash');
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_credentials');
  }

const ROLES = require('../constants/roles');
const emailService = require('./email.service');

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_credentials');
  }

  // Check user status
  if (user.status === 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.pending_activation');
  }
  if (user.status === 'SUSPENDED') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.suspended');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash the refresh token before storing it in the database
  user.authentication.refreshToken = hashToken(refreshToken);
  user.authentication.lastLogin = new Date();
  await user.save();

  // Convert mongoose document to plain object and remove password/refresh token
  const userObj = user.toObject();

  return {
    user: userObj,
    accessToken,
    refreshToken
  };
};

/**
 * Activate a seller account using 6-digit OTP verification code and set password
 * @param {Object} activationData - email, verificationCode, password, confirmPassword
 */
const activateSeller = async (activationData) => {
  const { email, verificationCode, password, confirmPassword } = activationData;
  const normalizedEmail = email.toLowerCase();

  if (password !== confirmPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.password_mismatch');
  }

  // Find user and explicitly select verificationCode and passwordHash
  const user = await User.findOne({
    'authentication.email': normalizedEmail,
    role: ROLES.SELLER
  }).select('+verificationCode +authentication.passwordHash');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  if (user.status !== 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.forbidden');
  }

  // Verify code expiration
  if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.code_expired');
  }

  // Hash incoming code and compare
  const incomingHash = crypto.createHash('sha256').update(verificationCode.trim()).digest('hex');
  if (!user.verificationCode || user.verificationCode !== incomingHash) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.invalid_code');
  }

  // Activate account and set password
  user.authentication.passwordHash = password;
  user.authentication.emailVerified = true;
  user.status = 'ACTIVE';
  user.activatedAt = new Date();
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;

  await user.save();

  return user;
};

/**
 * Resend a 6-digit OTP verification code for seller activation
 * @param {Object} data - email
 */
const resendSellerCode = async (data) => {
  const { email } = data;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    'authentication.email': normalizedEmail,
    role: ROLES.SELLER
  }).select('+verificationCode');

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  if (user.status === 'ACTIVE') {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.already_activated');
  }

  if (user.status !== 'PENDING_ACTIVATION') {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'auth.forbidden');
  }

  // Generate new code
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto.createHash('sha256').update(rawCode).digest('hex');

  user.verificationCode = hashedCode;
  user.verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // Send new email
  await emailService.sendSellerInvitationEmail({
    email: normalizedEmail,
    firstName: user.profile?.firstName || 'Seller',
    verificationCode: rawCode
  });

  return { email: normalizedEmail };
};

/**
 * Invalidate the user refresh token upon logout
 * @param {string} userId
 */
const logout = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  // Remove refresh token from database
  user.authentication.refreshToken = null;
  await user.save();
};

/**
 * Verify refresh token and generate a new access token (and fresh refresh token)
 * @param {string} token - The incoming refresh token
 * @returns {Promise<Object>} New tokens and user details
 */
const refresh = async (token) => {
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
  }

  try {
    // Verify refresh token signature and validity
    const decoded = verifyRefreshToken(token);

    // Fetch user and select the stored hashed refreshToken
    const user = await User.findById(decoded.id).select('+authentication.refreshToken');
    const hashedIncoming = hashToken(token);

    if (!user || !compareHash(user.authentication.refreshToken, hashedIncoming)) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Store the new hashed refresh token
    user.authentication.refreshToken = hashToken(newRefreshToken);
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toObject()
    };
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_refresh');
  }
};

module.exports = {
  signUp,
  signIn,
  logout,
  refresh,
  activateSeller,
  resendSellerCode
};
