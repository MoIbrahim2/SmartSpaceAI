const express = require('express');
const router = express.Router();
const generationController = require('../controllers/generation.controller');
const protect = require('../middlewares/auth.middleware');
const { uploadGenerationImages } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createGenerationSchema, updateGenerationSchema, extractPreferencesSchema } = require('../validators/generation.validator');

/**
 * Middleware to parse stringified objects if submitted via multipart/form-data
 */
const parseGenerationBody = (req, res, next) => {
  if (req.body.settings && typeof req.body.settings === 'string') {
    try {
      req.body.settings = JSON.parse(req.body.settings);
    } catch (err) {
      // Let validator catch any parsing formatting errors
    }
  }
  if (req.body.ai && typeof req.body.ai === 'string') {
    try {
      req.body.ai = JSON.parse(req.body.ai);
    } catch (err) {
      // Let validator catch any parsing formatting errors
    }
  }
  next();
};

// Public retrieval routes
router.get('/', generationController.getGenerations);
router.get('/:id', generationController.getGenerationById);

// Protected mutation routes
router.post('/extract-preferences', protect, validate(extractPreferencesSchema), generationController.extractPreferences);
router.post('/', protect, uploadGenerationImages, parseGenerationBody, validate(createGenerationSchema), generationController.createGeneration);
router.patch('/:id', protect, uploadGenerationImages, parseGenerationBody, validate(updateGenerationSchema), generationController.updateGeneration);
router.delete('/:id', protect, generationController.deleteGeneration);

module.exports = router;
