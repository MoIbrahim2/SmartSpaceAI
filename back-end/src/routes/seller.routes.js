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

// All seller routes require authentication and seller role verification
router.use(protect);
router.use(protect.restrictTo('seller', 'admin'));

// Inventory management routes
router.route('/products')
  .get(sellerController.getProducts)
  .post(validate(createProductSchema), sellerController.createProduct);

router.route('/products/:id')
  .patch(validate(updateProductSchema), sellerController.updateProduct)
  .delete(sellerController.deleteProduct);

// Fulfillment routes
router.get('/buy-requests', sellerController.getOrders);
router.patch('/buy-requests/:id/status', validate(updateOrderStatusSchema), sellerController.updateOrderStatus);

// Financial auditing routes
router.get('/earnings', sellerController.getEarnings);

module.exports = router;
