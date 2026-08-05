const mongoose = require('mongoose');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const CommissionPayout = require('../../models/commissionPayout.model');
const ApiError = require('../../errors/ApiError');
const HTTP_STATUS = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');

/**
 * Fetch monthly commission report breakdown across sellers
 * @param {Object} query - Filtering (year, month, sellerId, status, search, page, limit)
 * @returns {Promise<Object>} Monthly commission report list and summary stats
 */
const getMonthlyCommissionReports = async (query = {}) => {
  const currentDate = new Date();
  const year = parseInt(query.year, 10) || currentDate.getFullYear();
  const month = parseInt(query.month, 10) || (currentDate.getMonth() + 1);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Match orders for given month/year excluding cancelled/rejected
  const matchFilter = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ['CANCELLED', 'REJECTED'] }
  };

  if (query.sellerId && mongoose.Types.ObjectId.isValid(query.sellerId)) {
    matchFilter.sellerId = new mongoose.Types.ObjectId(query.sellerId);
  }

  // Aggregate order earnings per seller
  const orderAggregations = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$sellerId',
        totalOrders: { $sum: 1 },
        grossSales: { $sum: '$totalAmount' },
        commissionAmount: { $sum: '$commissionAmount' },
        netSellerAmount: { $sum: '$netSellerAmount' }
      }
    }
  ]);

  const aggMap = new Map();
  orderAggregations.forEach(item => {
    aggMap.set(item._id.toString(), item);
  });

  // Fetch all sellers matching search criteria
  const sellerFilter = { role: ROLES.SELLER };
  if (query.sellerId && mongoose.Types.ObjectId.isValid(query.sellerId)) {
    sellerFilter._id = query.sellerId;
  }
  if (query.search) {
    const escapedSearch = query.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    sellerFilter.$or = [
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex },
      { 'authentication.email': searchRegex }
    ];
  }

  const sellers = await User.find(sellerFilter);
  const sellerIds = sellers.map(s => s._id);

  // Fetch payout records for this year and month
  const payouts = await CommissionPayout.find({
    sellerId: { $in: sellerIds },
    year,
    month
  });

  const payoutMap = new Map();
  payouts.forEach(p => {
    payoutMap.set(p.sellerId.toString(), p);
  });

  // Build report items
  let reportItems = sellers.map(seller => {
    const sId = seller._id.toString();
    const agg = aggMap.get(sId) || { totalOrders: 0, grossSales: 0, commissionAmount: 0, netSellerAmount: 0 };
    const payout = payoutMap.get(sId);

    const grossSales = Number(agg.grossSales.toFixed(2));
    const commissionAmount = Number(agg.commissionAmount.toFixed(2));
    const netSellerAmount = Number(agg.netSellerAmount.toFixed(2));
    const status = payout ? 'PAID' : 'UNPAID';

    return {
      seller: {
        _id: seller._id,
        firstName: seller.profile?.firstName,
        lastName: seller.profile?.lastName,
        email: seller.authentication?.email,
        base_commission_percentage: seller.base_commission_percentage ?? 10
      },
      year,
      month,
      totalOrders: agg.totalOrders,
      grossSales,
      commissionAmount,
      netSellerAmount,
      status,
      payoutDetails: payout ? {
        paidAt: payout.paidAt,
        paidBy: payout.paidBy,
        notes: payout.notes
      } : null
    };
  });

  // Filter by status if requested
  if (query.status) {
    const targetStatus = query.status.toUpperCase();
    reportItems = reportItems.filter(item => item.status === targetStatus);
  }

  // Summary statistics across filtered report items
  const summary = reportItems.reduce((acc, curr) => {
    acc.totalOrders += curr.totalOrders;
    acc.totalGrossSales += curr.grossSales;
    acc.totalCommissionEarned += curr.commissionAmount;
    acc.totalNetSellerPayout += curr.netSellerAmount;
    return acc;
  }, { totalOrders: 0, totalGrossSales: 0, totalCommissionEarned: 0, totalNetSellerPayout: 0 });

  summary.totalGrossSales = Number(summary.totalGrossSales.toFixed(2));
  summary.totalCommissionEarned = Number(summary.totalCommissionEarned.toFixed(2));
  summary.totalNetSellerPayout = Number(summary.totalNetSellerPayout.toFixed(2));

  // Pagination
  const page = parseInt(query.page, 10) > 0 ? parseInt(query.page, 10) : 1;
  const limit = parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 10;
  const total = reportItems.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedReports = reportItems.slice((page - 1) * limit, page * limit);

  return {
    period: { year, month },
    summary,
    reports: paginatedReports,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Mark a seller's month commission as PAID
 * @param {string} adminId - Authenticated admin user ID
 * @param {Object} payoutData - sellerId, month, year, notes
 * @returns {Promise<Object>} Created CommissionPayout document
 */
const markMonthAsPaid = async (adminId, payoutData) => {
  const { sellerId, month, year, notes } = payoutData;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  // Check if payout already exists for this seller/month/year
  const existingPayout = await CommissionPayout.findOne({ sellerId, month, year });
  if (existingPayout) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'commission.already_paid');
  }

  // Calculate actual order earnings for specified month/year
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const orderAgg = await Order.aggregate([
    {
      $match: {
        sellerId: seller._id,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['CANCELLED', 'REJECTED'] }
      }
    },
    {
      $group: {
        _id: null,
        grossSales: { $sum: '$totalAmount' },
        commissionAmount: { $sum: '$commissionAmount' },
        netSellerAmount: { $sum: '$netSellerAmount' }
      }
    }
  ]);

  const totals = orderAgg[0] || { grossSales: 0, commissionAmount: 0, netSellerAmount: 0 };

  const payout = await CommissionPayout.create({
    sellerId,
    month,
    year,
    grossSales: Number(totals.grossSales.toFixed(2)),
    commissionAmount: Number(totals.commissionAmount.toFixed(2)),
    netSellerAmount: Number(totals.netSellerAmount.toFixed(2)),
    status: 'PAID',
    paidAt: new Date(),
    paidBy: adminId,
    notes
  });

  return payout;
};

/**
 * Fetch detailed monthly commission history for a single seller
 * @param {string} sellerId
 * @returns {Promise<Object>} Seller commission history
 */
const getSellerCommissionHistory = async (sellerId) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'seller.invalid_id');
  }

  const seller = await User.findOne({ _id: sellerId, role: ROLES.SELLER });
  if (!seller) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'seller.not_found');
  }

  const [payouts, orderAggregations] = await Promise.all([
    CommissionPayout.find({ sellerId }).sort({ year: -1, month: -1 }),
    Order.aggregate([
      {
        $match: {
          sellerId: seller._id,
          status: { $nin: ['CANCELLED', 'REJECTED'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          grossSales: { $sum: '$totalAmount' },
          commissionAmount: { $sum: '$commissionAmount' },
          netSellerAmount: { $sum: '$netSellerAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ])
  ]);

  const sellerObj = seller.toObject();

  return {
    seller: sellerObj,
    payoutHistory: payouts,
    monthlyBreakdown: orderAggregations.map(item => ({
      year: item._id.year,
      month: item._id.month,
      totalOrders: item.totalOrders,
      grossSales: Number(item.grossSales.toFixed(2)),
      commissionAmount: Number(item.commissionAmount.toFixed(2)),
      netSellerAmount: Number(item.netSellerAmount.toFixed(2))
    }))
  };
};

module.exports = {
  getMonthlyCommissionReports,
  markMonthAsPaid,
  getSellerCommissionHistory
};
