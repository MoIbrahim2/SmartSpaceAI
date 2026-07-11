const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const MESSAGES = require('../constants/messages');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get profile of current authenticated user
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user._id);
  return sendSuccess(res, MESSAGES.USER.PROFILE_FETCHED, { user: profile }, HTTP_STATUS.OK);
});

/**
 * Update profile fields of current authenticated user
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedProfile = await userService.updateProfile(
    req.user._id,
    req.body,
    req.file
  );
  return sendSuccess(res, MESSAGES.USER.PROFILE_UPDATED, { user: updatedProfile }, HTTP_STATUS.OK);
});

module.exports = {
  getProfile,
  updateProfile
};
