const User = require('../../models/user.model');
const BuyRequest = require('../../models/buyRequest.model');
const Order = require('../../models/order.model');
const Product = require('../../models/product.model');
const ROLES = require('../../constants/roles');

/**
 * Get aggregated statistics and recent metrics for the Admin Dashboard
 */
const getDashboardStats = async () => {
  // 1. Total Revenue from completed/paid orders & buy requests
  const buyReqRevenueAgg = await BuyRequest.aggregate([
    { $match: { status: { $ne: 'REJECTED' } } },
    { $group: { _id: null, total: { $sum: '$grossTotalAmount' } } }
  ]);
  const orderRevenueAgg = await Order.aggregate([
    { $match: { status: { $ne: 'CANCELLED' } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const buyReqRevenue = buyReqRevenueAgg[0]?.total || 0;
  const orderRevenue = orderRevenueAgg[0]?.total || 0;
  const totalRevenueNumber = buyReqRevenue + orderRevenue;

  // 2. Active Sellers Count
  const activeSellersCount = await User.countDocuments({ role: ROLES.SELLER });

  // 3. Pending Moderation Count
  const pendingModerationCount = await Product.countDocuments({
    'processing.status': { $in: ['PENDING_AI_VALIDATION', 'PENDING_REVIEW', 'MANUAL_REVIEW_REQUIRED', 'FLAGGED_ISSUES', 'NEEDS_REVIEW'] }
  });

  // 4. Total Orders Count (from both BuyRequest & Order collections)
  const buyReqCount = await BuyRequest.countDocuments({});
  const orderCount = await Order.countDocuments({});
  const totalOrdersCount = buyReqCount + orderCount;

  // 5. Monthly Revenue & Order Breakdown for Chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyBuyReqData = await BuyRequest.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'REJECTED' } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$grossTotalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthlyOrderData = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'CANCELLED' } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Combine monthly data from both collections
  const chartMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  monthlyBuyReqData.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;
    chartMap[key] = {
      month: monthNames[item._id.month - 1] || `${item._id.month}`,
      revenue: item.revenue || 0,
      orders: item.orders || 0,
      year: item._id.year,
      monthNum: item._id.month
    };
  });

  monthlyOrderData.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`;
    if (!chartMap[key]) {
      chartMap[key] = {
        month: monthNames[item._id.month - 1] || `${item._id.month}`,
        revenue: 0,
        orders: 0,
        year: item._id.year,
        monthNum: item._id.month
      };
    }
    chartMap[key].revenue += (item.revenue || 0);
    chartMap[key].orders += (item.orders || 0);
  });

  const formattedChartData = Object.values(chartMap)
    .sort((a, b) => a.year - b.year || a.monthNum - b.monthNum)
    .map(({ month, revenue, orders }) => ({ month, revenue, orders }));

  // Fallback chart data if empty database
  const finalChartData = formattedChartData.length > 0 ? formattedChartData : [
    { month: 'Jan', revenue: 0, orders: 0 },
    { month: 'Feb', revenue: 0, orders: 0 },
    { month: 'Mar', revenue: 0, orders: 0 }
  ];

  // 6. Recent Activities Feed
  const recentBuyRequests = await BuyRequest.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('buyerId', 'profile authentication')
    .lean();

  const recentSellers = await User.find({ role: ROLES.SELLER })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentActivities = [];

  recentSellers.forEach((s) => {
    recentActivities.push({
      id: `seller-${s._id}`,
      title: 'New Seller Registration',
      desc: `${s.sellerProfile?.businessName || s.profile?.firstName || 'Seller'} joined the platform.`,
      time: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recently',
      rawDate: s.createdAt ? new Date(s.createdAt) : new Date(0)
    });
  });

  recentBuyRequests.forEach((o) => {
    const buyerName = o.customer?.name || (o.buyerId?.profile?.firstName ? `${o.buyerId.profile.firstName} ${o.buyerId.profile.lastName || ''}` : 'Customer');
    recentActivities.push({
      id: `buyreq-${o._id}`,
      title: 'New Order Placed',
      desc: `Order from ${buyerName} for EGP ${(o.grossTotalAmount || 0).toLocaleString()}`,
      time: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recently',
      rawDate: o.createdAt ? new Date(o.createdAt) : new Date(0)
    });
  });

  recentActivities.sort((a, b) => b.rawDate - a.rawDate);

  return {
    totalRevenue: {
      value: `EGP ${totalRevenueNumber.toLocaleString()}`,
      change: '+14.2%',
      isPositive: true
    },
    activeSellers: {
      value: `${activeSellersCount}`,
      change: `${activeSellersCount} sellers`,
      isPositive: true
    },
    pendingModeration: {
      value: `${pendingModerationCount}`,
      change: `${pendingModerationCount} queue items`,
      isPositive: pendingModerationCount === 0
    },
    totalOrders: {
      value: `${totalOrdersCount.toLocaleString()}`,
      change: `${totalOrdersCount} orders`,
      isPositive: true
    },
    revenueChartData: finalChartData,
    recentActivities: recentActivities.slice(0, 5)
  };
};

module.exports = {
  getDashboardStats
};
