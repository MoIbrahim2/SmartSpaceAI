const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const validate = require('../middlewares/validation.middleware');
const { createContactSchema } = require('../validators/contact.validator');

// POST /api/contact
router.post('/', validate(createContactSchema), contactController.createMessage);

module.exports = router;
