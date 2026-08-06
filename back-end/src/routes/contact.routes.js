const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const validate = require('../middlewares/validation.middleware');
const { contactLimiter } = require('../middlewares/rateLimiter.middleware');
const { createContactSchema } = require('../validators/contact.validator');

// POST /api/contact
router.post('/', contactLimiter, validate(createContactSchema), contactController.createMessage);

module.exports = router;
