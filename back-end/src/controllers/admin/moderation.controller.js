const moderationService = require('../../services/admin/moderation.service');
const { sendSuccess } = require('../../utils/responseHelper');
const HTTP_STATUS = require('../../constants/statusCodes');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle fetching moderation items
 */
const getModerationItems = asyncHandler(async (req, res) => {
  const result = await moderationService.getModerationItems(req.query);
  return sendSuccess(res, 'admin.moderation_fetched', result, HTTP_STATUS.OK);
});

/**
 * Handle updating product moderation status
 */
const updateModerationStatus = asyncHandler(async (req, res) => {
  const updated = await moderationService.updateModerationStatus(
    req.params.id,
    req.body.status,
    req.body.notes
  );
  return sendSuccess(res, 'admin.moderation_updated', { product: updated }, HTTP_STATUS.OK);
});

module.exports = {
  getModerationItems,
  updateModerationStatus
};
