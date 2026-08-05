const dashboardService = require('../../services/admin/dashboard.service');
const { sendSuccess } = require('../../utils/responseHelper');
const HTTP_STATUS = require('../../constants/statusCodes');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle fetching aggregated admin dashboard metrics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  return sendSuccess(res, 'admin.dashboard_fetched', stats, HTTP_STATUS.OK);
});

module.exports = {
  getDashboardStats
};
