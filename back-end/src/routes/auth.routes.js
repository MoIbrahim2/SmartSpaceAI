const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const { signupSchema, signinSchema, activateSellerSchema, resendSellerCodeSchema } = require('../validators/auth.validator');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/signin
router.post('/signin', validate(signinSchema), authController.signin);

// POST /api/auth/activate-seller
router.post('/activate-seller', validate(activateSellerSchema), authController.activateSeller);

// POST /api/auth/resend-seller-code
router.post('/resend-seller-code', validate(resendSellerCodeSchema), authController.resendSellerCode);

// POST /api/auth/logout
router.post('/logout', protect, authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

module.exports = router;
