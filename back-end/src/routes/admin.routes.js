const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createSellerSchema } = require('../validators/admin.validator');

// Protect all admin routes and restrict them to administrators
router.use(protect);
router.use(protect.restrictTo('admin'));

// POST /api/admin/sellers
router.post('/sellers', validate(createSellerSchema), adminController.createSeller);

module.exports = router;
