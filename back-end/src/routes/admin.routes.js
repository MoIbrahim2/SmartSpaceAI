const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/auth.middleware');
const ROLES = require('../constants/roles');
const { sendSuccess } = require('../utils/responseHelper');
const HTTP_STATUS = require('../constants/statusCodes');
const validate = require('../middlewares/validation.middleware');

// Import controllers and validators from dedicated admin module folders
const sellerController = require('../controllers/admin/seller.controller');
const orderController = require('../controllers/admin/order.controller');
const commissionController = require('../controllers/admin/commission.controller');
const dashboardController = require('../controllers/admin/dashboard.controller');
const moderationController = require('../controllers/admin/moderation.controller');

const { createSellerSchema, updateCommissionSchema } = require('../validators/admin/seller.validator');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/admin/order.validator');
const { getMonthlyReportSchema, markPaidSchema } = require('../validators/admin/commission.validator');

// Protect all admin routes: Requires authentication AND ADMIN role
router.use(protect, authorizeRoles(ROLES.ADMIN));

/**
 * @route   GET /api/admin/health
 * @desc    Health check for admin router
 * @access  Private (ADMIN)
 */
router.get('/health', (req, res) => {
  return sendSuccess(res, 'admin.health_ok', {
    message: 'Admin access granted',
    user: req.user
  }, HTTP_STATUS.OK);
});

/**
 * @route   GET /api/admin/dashboard
 * @desc    Fetch aggregated dashboard metrics and analytics
 * @access  Private (ADMIN)
 */
router.get('/dashboard', dashboardController.getDashboardStats);

/**
 * @route   GET /api/admin/moderation
 * @desc    Fetch moderation queue items
 * @access  Private (ADMIN)
 */
router.get('/moderation', moderationController.getModerationItems);

/**
 * @route   PATCH /api/admin/moderation/:id
 * @desc    Update product moderation status
 * @access  Private (ADMIN)
 */
router.patch('/moderation/:id', moderationController.updateModerationStatus);

/* ==========================================================================
   Seller Management Routes
   ========================================================================== */

/**
 * @route   POST /api/admin/sellers
 * @desc    Create a new seller account
 * @access  Private (ADMIN)
 */
router.post('/sellers', validate(createSellerSchema), sellerController.createSeller);

/**
 * @route   GET /api/admin/sellers
 * @desc    Fetch paginated list of sellers (with search, sort, filter)
 * @access  Private (ADMIN)
 */
router.get('/sellers', sellerController.getSellers);

/**
 * @route   GET /api/admin/sellers/:id
 * @desc    Fetch seller details and calculated statistics
 * @access  Private (ADMIN)
 */
router.get('/sellers/:id', sellerController.getSellerById);

/**
 * @route   PATCH /api/admin/sellers/:id/commission
 * @desc    Update seller base commission percentage
 * @access  Private (ADMIN)
 */
router.patch('/sellers/:id/commission', validate(updateCommissionSchema), sellerController.updateSellerCommission);

/**
 * @route   DELETE /api/admin/sellers/:id
 * @desc    Permanently delete seller account from users collection
 * @access  Private (ADMIN)
 */
router.delete('/sellers/:id', sellerController.deleteSeller);

/**
 * @route   POST /api/admin/sellers/:id/resend-code
 * @desc    Resend 6-digit verification code to pending seller
 * @access  Private (ADMIN)
 */
router.post('/sellers/:id/resend-code', sellerController.resendSellerVerificationCode);


/* ==========================================================================
   Order / Buy Request Management Routes
   ========================================================================== */

/**
 * @route   GET /api/admin/orders
 * @desc    Fetch paginated list of all orders across sellers
 * @access  Private (ADMIN)
 */
router.get('/orders', orderController.getOrders);

/**
 * @route   POST /api/admin/orders
 * @desc    Create a new order / buy request
 * @access  Private (ADMIN)
 */
router.post('/orders', validate(createOrderSchema), orderController.createOrder);

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Fetch single order details
 * @access  Private (ADMIN)
 */
router.get('/orders/:id', orderController.getOrderById);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update status of an order
 * @access  Private (ADMIN)
 */
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);

/* ==========================================================================
   Commission Reports Routes
   ========================================================================== */

/**
 * @route   GET /api/admin/commission/monthly
 * @desc    Fetch monthly commission reports and aggregations
 * @access  Private (ADMIN)
 */
router.get('/commission/monthly', commissionController.getMonthlyCommissionReports);

/**
 * @route   GET /api/admin/commission/sellers/:sellerId
 * @desc    Fetch seller commission breakdown and payout history
 * @access  Private (ADMIN)
 */
router.get('/commission/sellers/:sellerId', commissionController.getSellerCommissionHistory);

/**
 * @route   POST /api/admin/commission/mark-paid
 * @desc    Mark a seller's monthly commission as paid
 * @access  Private (ADMIN)
 */
router.post('/commission/mark-paid', validate(markPaidSchema), commissionController.markMonthAsPaid);

module.exports = router;
