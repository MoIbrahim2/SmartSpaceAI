const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { checkoutSchema } = require('../validators/order.validator');

// All order routes require authentication
router.use(protect);

router.post('/checkout', validate(checkoutSchema), orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
