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

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'auth.invalid_credentials');
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
  refresh
};
