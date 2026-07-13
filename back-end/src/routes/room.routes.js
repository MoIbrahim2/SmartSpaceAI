const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const protect = require('../middlewares/auth.middleware');
const { uploadRoomSourceImages } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validation.middleware');
const { createRoomSchema, updateRoomSchema } = require('../validators/room.validator');

/**
 * Middleware to parse stringified dimensions object if submitted via multipart/form-data
 */
const parseRoomBody = (req, res, next) => {
  if (req.body.dimensions && typeof req.body.dimensions === 'string') {
    try {
      req.body.dimensions = JSON.parse(req.body.dimensions);
    } catch (err) {
      // Let validator catch any parsing formatting errors
    }
  }
  next();
};

// Protected retrieval routes
router.get('/', protect, roomController.getRooms);
router.get('/:id', protect, roomController.getRoomById);

// Protected mutation routes
router.post('/', protect, uploadRoomSourceImages, parseRoomBody, validate(createRoomSchema), roomController.createRoom);
router.patch('/:id', protect, uploadRoomSourceImages, parseRoomBody, validate(updateRoomSchema), roomController.updateRoom);
router.delete('/:id', protect, roomController.deleteRoom);

module.exports = router;
