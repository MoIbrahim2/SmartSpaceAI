const User = require('../../models/user.model');
const Order = require('../../models/order.model');
const Product = require('../../models/product.model');
const ROLES = require('../../constants/roles');

/**
 * Get aggregated statistics and recent metrics for the Admin Dashboard
 */
const getDashboardStats = async () => {
  // 1. Total Revenue from completed/paid orders
  const orderRevenueAgg = await Order.aggregate([
    { $match: { status: { $nin: ['REJECTED', 'CANCELLED'] } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', '$grossTotalAmount'] } } } }
  ]);

  const totalRevenueNumber = orderRevenueAgg[0]?.total || 0;

  // 2. Active Sellers Count
  const activeSellersCount = await User.countDocuments({ role: ROLES.SELLER });

  // 3. Pending Moderation Count
  const pendingModerationCount = await Product.countDocuments({
    'processing.status': { $in: ['PENDING_AI_VALIDATION', 'PENDING_REVIEW', 'MANUAL_REVIEW_REQUIRED', 'FLAGGED_ISSUES', 'NEEDS_REVIEW'] }
  });

  // 4. Total Orders Count
  const totalOrdersCount = await Order.countDocuments({});

  // 5. Monthly Revenue & Order Breakdown for Chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyOrderData = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $nin: ['REJECTED', 'CANCELLED'] } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: { $ifNull: ['$totalAmount', '$grossTotalAmount'] } },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedChartData = monthlyOrderData.map((item) => ({
    month: monthNames[item._id.month - 1] || `${item._id.month}`,
    revenue: item.revenue || 0,
    orders: item.orders || 0
  }));

  // Fallback chart data if empty database
  const finalChartData = formattedChartData.length > 0 ? formattedChartData : [
    { month: 'Jan', revenue: 0, orders: 0 },
    { month: 'Feb', revenue: 0, orders: 0 },
    { month: 'Mar', revenue: 0, orders: 0 }
  ];

  // 6. Recent Activities Feed
  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('buyerId userId', 'profile authentication')
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

  recentOrders.forEach((o) => {
    const buyerName = o.customer?.name || (o.buyerId?.profile?.firstName ? `${o.buyerId.profile.firstName} ${o.buyerId.profile.lastName || ''}` : 'Customer');
    const revenueAmount = o.totalAmount || o.grossTotalAmount || 0;
    recentActivities.push({
      id: `order-${o._id}`,
      title: 'New Order Placed',
      desc: `Order from ${buyerName} for EGP ${revenueAmount.toLocaleString()}`,
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

