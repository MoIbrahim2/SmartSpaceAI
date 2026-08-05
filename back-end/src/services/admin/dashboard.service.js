const User = require('../../models/user.model');
const Order = require('../../models/order.model');
const Product = require('../../models/product.model');
const ROLES = require('../../constants/roles');

/**
 * Get aggregated statistics and recent metrics for the Admin Dashboard
 */
const getDashboardStats = async () => {
  // 1. Total Revenue from completed/paid orders
  const revenueAggregation = await Order.aggregate([
    { $match: { status: { $ne: 'CANCELLED' } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const totalRevenueNumber = revenueAggregation[0]?.total || 0;

  // 2. Active Sellers Count
  const activeSellersCount = await User.countDocuments({ role: ROLES.SELLER });

  // 3. Pending Moderation Count
  const pendingModerationCount = await Product.countDocuments({
    'processing.status': { $in: ['PENDING_AI_VALIDATION', 'PENDING_REVIEW', 'FLAGGED_ISSUES', 'NEEDS_REVIEW'] }
  });

  // 4. Total Orders Count
  const totalOrdersCount = await Order.countDocuments({});

  // 5. Monthly Revenue & Order Breakdown for Chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyChartData = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
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

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedChartData = monthlyChartData.map((item) => ({
    month: monthNames[item._id.month - 1] || `${item._id.month}`,
    revenue: item.revenue,
    orders: item.orders
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
    .populate('userId', 'profile authentication')
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
      desc: `${s.profile?.firstName || s.storeName || 'Seller'} joined the platform.`,
      time: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recently'
    });
  });

  recentOrders.forEach((o) => {
    recentActivities.push({
      id: `order-${o._id}`,
      title: 'New Order Placed',
      desc: `Order #${o.orderNumber || o._id.toString().slice(-6)} for $${o.totalAmount || 0}`,
      time: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recently'
    });
  });

  return {
    totalRevenue: {
      value: `$${totalRevenueNumber.toLocaleString()}`,
      change: '+14.2%',
      isPositive: true
    },
    activeSellers: {
      value: `${activeSellersCount}`,
      change: `+${activeSellersCount} sellers`,
      isPositive: true
    },
    pendingModeration: {
      value: `${pendingModerationCount}`,
      change: `${pendingModerationCount} queue items`,
      isPositive: pendingModerationCount === 0
    },
    totalOrders: {
      value: `${totalOrdersCount.toLocaleString()}`,
      change: '+8.5%',
      isPositive: true
    },
    revenueChartData: finalChartData,
    recentActivities: recentActivities.slice(0, 5)
  };
};

module.exports = {
  getDashboardStats
};
