const mongoose = require('mongoose');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const CommissionPayout = require('../../models/commissionPayout.model');
const ApiError = require('../../errors/ApiError');
const HTTP_STATUS = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');
const { generatePayoutPdf } = require('./payoutPdf.service');
const { sendPayoutCompletedEmail } = require('../email.service');

/**
 * Fetch monthly commission report breakdown across sellers
 * @param {Object} query - Filtering (year, month, sellerId, status, search, page, limit)
 * @returns {Promise<Object>} Monthly commission report list and summary stats
 */
const getMonthlyCommissionReports = async (query = {}) => {
  const currentDate = new Date();
  const year = query.year && query.year !== 'All' ? parseInt(query.year, 10) : currentDate.getFullYear();
  const month = query.month && query.month !== 'All' ? parseInt(query.month, 10) : (currentDate.getMonth() + 1);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const orderMatch = {
    status: { $nin: ['CANCELLED', 'REJECTED'] }
  };

  if (query.year && query.year !== 'All' && query.month && query.month !== 'All') {
    orderMatch.createdAt = { $gte: startDate, $lte: endDate };
  }

  if (query.sellerId && mongoose.Types.ObjectId.isValid(query.sellerId)) {
    orderMatch.sellerId = new mongoose.Types.ObjectId(query.sellerId);
  }

  // Aggregate Orders per seller
  const orderAggregations = await Order.aggregate([
    { $match: orderMatch },
    {
      $group: {
        _id: '$sellerId',
        totalOrders: { $sum: 1 },
        grossSales: { $sum: { $ifNull: ['$totalAmount', '$grossTotalAmount'] } },
        commissionAmount: { $sum: { $ifNull: ['$commissionAmount', '$commission.amountOwed'] } },
        netSellerAmount: { $sum: { $ifNull: ['$netSellerAmount', 0] } }
      }
    }
  ]);

  const aggMap = new Map();

  orderAggregations.forEach(item => {
    const sId = item._id.toString();
    const gross = item.grossSales || 0;
    const comm = item.commissionAmount || 0;
    aggMap.set(sId, {
      totalOrders: item.totalOrders || 0,
      grossSales: gross,
      commissionAmount: comm,
      netSellerAmount: item.netSellerAmount || (gross - comm)
    });
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
      { 'authentication.email': searchRegex },
      { 'sellerProfile.businessName': searchRegex }
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
    let commissionAmount = Number(agg.commissionAmount.toFixed(2));
    const commRate = seller.base_commission_percentage ?? (seller.sellerProfile?.commissionRate ? Math.round(seller.sellerProfile.commissionRate * 100) : 10);

    if (commissionAmount === 0 && grossSales > 0) {
      commissionAmount = Number((grossSales * (commRate / 100)).toFixed(2));
    }
    const netSellerAmount = Number((grossSales - commissionAmount).toFixed(2));
    const status = payout ? 'Paid' : 'Unpaid';

    return {
      seller: {
        _id: seller._id,
        firstName: seller.profile?.firstName || seller.sellerProfile?.businessName || 'Seller',
        lastName: seller.profile?.lastName || '',
        email: seller.authentication?.email || '',
        base_commission_percentage: commRate
      },
      sellerName: seller.sellerProfile?.businessName || (seller.profile?.firstName ? `${seller.profile.firstName} ${seller.profile.lastName || ''}`.trim() : 'Seller'),
      sellerEmail: seller.authentication?.email || '',
      year,
      month,
      period: `${month}/${year}`,
      totalOrders: agg.totalOrders,
      transactionsCount: agg.totalOrders,
      grossSales,
      commissionRate: commRate,
      commissionAmount,
      earnedCommission: commissionAmount,
      netSellerAmount,
      payoutStatus: status,
      status,
      payoutDate: payout && payout.paidAt ? new Date(payout.paidAt).toISOString().split('T')[0] : 'Pending',
      payoutDetails: payout ? {
        paidAt: payout.paidAt,
        paidBy: payout.paidBy,
        notes: payout.notes
      } : null
    };
  });

  // Filter by status if requested
  if (query.status && query.status !== 'All') {
    const targetStatus = query.status.toUpperCase();
    reportItems = reportItems.filter(item => item.status.toUpperCase() === targetStatus || item.payoutStatus.toUpperCase() === targetStatus);
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
    items: paginatedReports,
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

  const existingPayout = await CommissionPayout.findOne({ sellerId, month, year });
  if (existingPayout) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'commission.already_paid');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch all orders for this seller in the period to extract sold products and total sales
  const orders = await Order.find({
    sellerId: seller._id,
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $nin: ['CANCELLED', 'REJECTED'] }
  });

  const productMap = new Map();
  let grossSales = 0;
  let commissionAmount = 0;

  orders.forEach(order => {
    const orderGross = order.totalAmount ?? order.grossTotalAmount ?? 0;
    const orderComm = order.commissionAmount ?? order.commission?.amountOwed ?? 0;
    grossSales += orderGross;
    commissionAmount += orderComm;

    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach(item => {
        const key = item.productId ? item.productId.toString() : (item.name || 'Product');
        const existing = productMap.get(key) || {
          name: item.name || 'Product',
          quantity: 0,
          unitPrice: item.price || 0,
          totalAmount: 0
        };
        existing.quantity += (item.quantity || 1);
        existing.totalAmount += (item.totalPrice || ((item.quantity || 1) * (item.price || 0)));
        productMap.set(key, existing);
      });
    } else if (order.productId || orderGross > 0) {
      const key = order.productId ? order.productId.toString() : 'Product';
      const existing = productMap.get(key) || {
        name: 'Product',
        quantity: 0,
        unitPrice: order.unitPriceAtPurchase || orderGross || 0,
        totalAmount: 0
      };
      const qty = order.quantity || 1;
      existing.quantity += qty;
      existing.totalAmount += orderGross;
      productMap.set(key, existing);
    }
  });

  const commRate = seller.base_commission_percentage ?? (seller.sellerProfile?.commissionRate ? Math.round(seller.sellerProfile.commissionRate * 100) : 10);

  if (commissionAmount === 0 && grossSales > 0) {
    commissionAmount = Math.round(grossSales * (commRate / 100));
  }
  const netSellerAmount = grossSales - commissionAmount;

  const payout = await CommissionPayout.create({
    sellerId,
    month,
    year,
    grossSales: Number(grossSales.toFixed(2)),
    commissionAmount: Number(commissionAmount.toFixed(2)),
    netSellerAmount: Number(netSellerAmount.toFixed(2)),
    status: 'PAID',
    paidAt: new Date(),
    paidBy: adminId,
    notes
  });

  const soldProducts = Array.from(productMap.values()).map(p => ({
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.quantity > 0 ? Number((p.totalAmount / p.quantity).toFixed(2)) : p.unitPrice,
    totalAmount: Number(p.totalAmount.toFixed(2))
  }));

  const formattedPayoutDate = payout.paidAt.toISOString().split('T')[0];
  const reportId = `COM-${payout._id.toString().slice(-4).toUpperCase()}`;
  const sellerName = seller.sellerProfile?.businessName || (seller.profile?.firstName ? `${seller.profile.firstName} ${seller.profile.lastName || ''}`.trim() : 'Seller');
  const sellerEmail = seller.authentication?.email || seller.email || '';

  // Generate PDF report
  let pdfBuffer = null;
  try {
    pdfBuffer = await generatePayoutPdf({
      sellerName,
      sellerEmail,
      reportId,
      period: `${month}/${year}`,
      payoutDate: formattedPayoutDate,
      payoutStatus: 'Paid',
      soldProducts,
      grossSales: Number(grossSales.toFixed(2)),
      commissionRate: commRate,
      commissionAmount: Number(commissionAmount.toFixed(2)),
      netSellerAmount: Number(netSellerAmount.toFixed(2))
    });
  } catch (pdfErr) {
    console.error('Failed to generate PDF payout report:', pdfErr);
  }

  // Send Email Notification with PDF attachment
  if (sellerEmail) {
    try {
      await sendPayoutCompletedEmail({
        email: sellerEmail,
        sellerName,
        amount: Number(netSellerAmount.toFixed(2)),
        period: `${month}/${year}`,
        payoutDate: formattedPayoutDate,
        reportId,
        pdfBuffer
      });
    } catch (emailErr) {
      console.error('Failed to send payout completed email:', emailErr);
    }
  }

  return {
    ...payout.toObject(),
    payoutDate: formattedPayoutDate,
    status: 'Paid',
    payoutStatus: 'Paid',
    reportId,
    soldProducts
  };
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
          grossSales: { $sum: { $ifNull: ['$totalAmount', '$grossTotalAmount'] } },
          commissionAmount: { $sum: { $ifNull: ['$commissionAmount', '$commission.amountOwed'] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ])
  ]);

  const map = new Map();

  orderAggregations.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    const gross = item.grossSales || 0;
    const comm = item.commissionAmount || 0;
    map.set(key, {
      year: item._id.year,
      month: item._id.month,
      totalOrders: item.totalOrders || 0,
      grossSales: gross,
      commissionAmount: comm,
      netSellerAmount: gross - comm
    });
  });

  const sellerObj = seller.toObject();

  return {
    seller: sellerObj,
    payoutHistory: payouts,
    monthlyBreakdown: Array.from(map.values()).map(item => ({
      year: item.year,
      month: item.month,
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

