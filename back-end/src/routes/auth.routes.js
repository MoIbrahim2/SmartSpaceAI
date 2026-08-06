const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const {
  signupSchema,
  signinSchema,
  activateSellerSchema,
  resendSellerCodeSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// POST /api/auth/resend-verification-code
router.post('/resend-verification-code', validate(resendCodeSchema), authController.resendUserVerificationCode);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

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

