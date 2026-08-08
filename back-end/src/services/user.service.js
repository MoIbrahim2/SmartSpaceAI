const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');
const fs = require('fs');
const path = require('path');

/**
 * Fetch user profile from database
 * @param {string} userId
 * @returns {Promise<Object>} User document
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }
  return user;
};

/**
 * Update user profile details
 * @param {string} userId
 * @param {Object} updateFields - Allowed text fields to update (firstName, lastName, dateOfBirth)
 * @param {Object} file - Uploaded file details from multer
 * @returns {Promise<Object>} Updated User document
 */
const updateProfile = async (userId, updateFields, file) => {
  const user = await User.findById(userId);
  if (!user) {
    // If a file was uploaded but user not found, delete the uploaded file
    if (file) {
      fs.unlink(file.path, () => {});
    }
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  // Initialize profile object if it does not exist
  if (!user.profile) {
    user.profile = {};
  }

  // Handle profile image upload
  if (file) {
    // Delete the previous profile image if it exists
    if (user.profile.avatar) {
      const oldImagePath = path.join(process.cwd(), user.profile.avatar);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error(`Failed to delete old profile image: ${err.message}`);
        }
      });
    }
    // Store relative path in DB (e.g., uploads/profiles/profile-12345.jpg)
    user.profile.avatar = `uploads/profiles/${file.filename}`;
  }

  // Update text fields
  if (updateFields.firstName !== undefined) user.profile.firstName = updateFields.firstName;
  if (updateFields.lastName !== undefined) user.profile.lastName = updateFields.lastName;
  if (updateFields.dateOfBirth !== undefined) {
    user.profile.dateOfBirth = updateFields.dateOfBirth ? updateFields.dateOfBirth : undefined;
  }

  // Save changes (triggers validators and returns updated user)
  const updatedUser = await user.save();
  return updatedUser;
};

/**
  * Change password for logged in user
  * @param {string} userId
  * @param {Object} passwordData - { currentPassword, newPassword, confirmPassword }
  */
const changePassword = async (userId, passwordData) => {
  const { currentPassword, newPassword, confirmPassword } = passwordData;

  if (newPassword !== confirmPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.password_mismatch');
  }

  const user = await User.findById(userId).select('+authentication.passwordHash');
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'auth.invalid_current_password');
  }

  user.authentication.passwordHash = newPassword;
  await user.save();

  return { success: true };
};

/**
 * Get the current credit balance for a user
 * @param {string} userId
 * @returns {Promise<number>} Credit balance
 */
const getCredits = async (userId) => {
  const user = await User.findById(userId).select('credits');
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
  }
  return user.credits;
};

/**
 * Resolution-based credit cost map
 */
const RESOLUTION_CREDIT_COSTS = {
  '720p':  9,
  '1080p': 12,
  '1440p': 17,
  '4k':    26,
};

/**
 * Atomically deduct credits for a given resolution.
 * Returns the updated user or throws if insufficient balance.
 * @param {string} userId
 * @param {string} resolutionKey - e.g. '720p', '1080p', '1440p', '4k'
 * @returns {Promise<{ user: Object, creditsDeducted: number }>}
 */
const deductCredits = async (userId, resolutionKey) => {
  const cost = RESOLUTION_CREDIT_COSTS[resolutionKey];
  if (!cost) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid resolution key: ${resolutionKey}`);
  }

  // Atomic decrement with a guard: credits must be >= cost
  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true }
  );

  if (!user) {
    // Either user not found or insufficient credits
    const existingUser = await User.findById(userId).select('credits');
    if (!existingUser) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'user.not_found');
    }
    throw new ApiError(
      HTTP_STATUS.PAYMENT_REQUIRED || 402,
      `Insufficient credits. You need ${cost} credits for ${resolutionKey} generation but only have ${existingUser.credits}.`
    );
  }

  return { user, creditsDeducted: cost };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getCredits,
  deductCredits,
  RESOLUTION_CREDIT_COSTS
};

