const userService = require('../services/user.service');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get profile of current authenticated user
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user._id);
  return sendSuccess(res, 'user.profile_fetched', { user: profile }, HTTP_STATUS.OK);
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
  return sendSuccess(res, 'user.profile_updated', { user: updatedProfile }, HTTP_STATUS.OK);
});

/**
 * Change password of current authenticated user
 */
const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  return sendSuccess(res, 'user.password_changed', {}, HTTP_STATUS.OK);
});

/**
 * Get current credit balance for authenticated user
 */
const getCredits = asyncHandler(async (req, res) => {
  const credits = await userService.getCredits(req.user._id);
  return sendSuccess(res, 'user.credits_fetched', { credits }, HTTP_STATUS.OK);
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getCredits
};
