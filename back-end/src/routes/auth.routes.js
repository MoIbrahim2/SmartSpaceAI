const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const { signupSchema, signinSchema } = require('../validators/auth.validator');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/signin
router.post('/signin', validate(signinSchema), authController.signin);

// POST /api/auth/logout
router.post('/logout', protect, authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

module.exports = router;
