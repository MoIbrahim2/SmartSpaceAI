const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema
} = require('../validators/seller.validator');

const ROLES = require('../constants/roles');

// All seller routes require authentication and seller role verification
router.use(protect, protect.restrictTo(ROLES.SELLER, ROLES.ADMIN));

// Inventory management routes
router.route('/products')
  .get(sellerController.getProducts)
  .post(validate(createProductSchema), sellerController.createProduct);

router.route('/products/:id')
  .get(sellerController.getProduct)
  .patch(validate(updateProductSchema), sellerController.updateProduct)
  .delete(sellerController.deleteProduct);

// Fulfillment routes
router.get('/buy-requests', sellerController.getOrders);
router.patch('/buy-requests/:id/status', validate(updateOrderStatusSchema), sellerController.updateOrderStatus);

// Financial auditing routes
router.get('/earnings', sellerController.getEarnings);

module.exports = router;
