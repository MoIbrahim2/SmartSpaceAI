const commissionService = require('../../services/admin/commission.service');
const { sendSuccess } = require('../../utils/responseHelper');
const HTTP_STATUS = require('../../constants/statusCodes');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Handle fetching monthly commission report breakdown
 */
const getMonthlyCommissionReports = asyncHandler(async (req, res) => {
  const result = await commissionService.getMonthlyCommissionReports(req.query);
  return sendSuccess(res, 'commission.fetched_reports', result, HTTP_STATUS.OK);
});

/**
 * Handle marking a month as paid for a seller
 */
const markMonthAsPaid = asyncHandler(async (req, res) => {
  const payout = await commissionService.markMonthAsPaid(req.user._id, req.body);
  return sendSuccess(res, 'commission.marked_paid', { payout }, HTTP_STATUS.CREATED);
});

/**
 * Handle fetching single seller commission history
 */
const getSellerCommissionHistory = asyncHandler(async (req, res) => {
  const result = await commissionService.getSellerCommissionHistory(req.params.sellerId);
  return sendSuccess(res, 'commission.fetched_history', result, HTTP_STATUS.OK);
});

module.exports = {
  getMonthlyCommissionReports,
  markMonthAsPaid,
  getSellerCommissionHistory
};
