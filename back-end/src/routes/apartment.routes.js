const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartment.controller');
const protect = require('../middlewares/auth.middleware');
const { uploadCoverImage } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createApartmentSchema, updateApartmentSchema } = require('../validators/apartment.validator');

/**
 * Middleware to parse stringified location object if submitted via multipart/form-data
 */
const parseLocationBody = (req, res, next) => {
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (err) {
      // Let validator catch any parsing formatting errors
    }
  }
  next();
};

// Protected retrieval routes
router.get('/', protect, apartmentController.getApartments);
router.get('/:id', protect, apartmentController.getApartmentById);

// Protected mutation routes
router.post('/', protect, uploadCoverImage, parseLocationBody, validate(createApartmentSchema), apartmentController.createApartment);
router.patch('/:id', protect, uploadCoverImage, parseLocationBody, validate(updateApartmentSchema), apartmentController.updateApartment);
router.delete('/:id', protect, apartmentController.deleteApartment);

module.exports = router;
