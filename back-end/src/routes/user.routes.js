const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const protect = require('../middlewares/auth.middleware');
const uploadProfileImage = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { updateProfileSchema } = require('../validators/user.validator');

// All user routes are protected
router.use(protect);

// GET /api/users/profile
router.get('/profile', userController.getProfile);

// PATCH /api/users/profile
// Note: uploadProfileImage must run before Joi validation so that Multer parses req.body
router.patch('/profile', uploadProfileImage, validate(updateProfileSchema), userController.updateProfile);

module.exports = router;
