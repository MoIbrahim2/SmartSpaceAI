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
    // Store relative path in DB (e.g., uploads/profile-12345.jpg)
    user.profile.avatar = `uploads/${file.filename}`;
  }

  // Update text fields
  if (updateFields.firstName !== undefined) user.profile.firstName = updateFields.firstName;
  if (updateFields.lastName !== undefined) user.profile.lastName = updateFields.lastName;
  if (updateFields.dateOfBirth !== undefined) user.profile.dateOfBirth = updateFields.dateOfBirth;

  // Save changes (triggers validators and returns updated user)
  const updatedUser = await user.save();
  return updatedUser;
};

module.exports = {
  getProfile,
  updateProfile
};
