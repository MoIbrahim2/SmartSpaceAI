const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../helpers/token');

/**
 * Register a new user in the database
 * @param {Object} userData - User sign up details
 * @returns {Promise<Object>} The registered User instance
 */
const signUp = async (userData) => {
  const { firstName, lastName, email, dateOfBirth, password } = userData;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, MESSAGES.AUTH.EMAIL_EXISTS);
  }

  // Create new user (password is automatically hashed by pre-save hook)
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    dateOfBirth,
    password
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
  // Explicitly select password field to perform verification
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in database (using select + field update)
  user.refreshToken = refreshToken;
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
    throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER.NOT_FOUND);
  }

  // Remove refresh token from database
  user.refreshToken = null;
  await user.save();
};

/**
 * Verify refresh token and generate a new access token (and fresh refresh token)
 * @param {string} token - The incoming refresh token
 * @returns {Promise<Object>} New tokens and user details
 */
const refresh = async (token) => {
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_REFRESH);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Fetch user and select the refreshToken field to match
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_REFRESH);
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Save the new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toObject()
    };
  } catch (error) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_REFRESH);
  }
};

module.exports = {
  signUp,
  signIn,
  logout,
  refresh
};
