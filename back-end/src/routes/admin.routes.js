const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const protect = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createSellerSchema, updateCommissionSchema } = require('../validators/admin.validator');

// Protect all admin routes and restrict them to administrators
router.use(protect);
router.use(protect.restrictTo('admin'));

// POST /api/admin/sellers - Register a new seller
router.post('/sellers', validate(createSellerSchema), adminController.createSeller);

// GET /api/admin/sellers - Retrieve all sellers
router.get('/sellers', adminController.getSellers);

// PATCH /api/admin/sellers/:id/commission - Update seller commission rate
router.patch('/sellers/:id/commission', validate(updateCommissionSchema), adminController.updateSellerCommission);

// DELETE /api/admin/sellers/:id - Delete a seller account
router.delete('/sellers/:id', adminController.deleteSeller);

module.exports = router;

