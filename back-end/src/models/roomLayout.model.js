const mongoose = require('mongoose');

const roomLayoutSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  length_cm: {
    type: Number,
    required: [true, 'Room length in cm is required']
  },
  width_cm: {
    type: Number,
    required: [true, 'Room width in cm is required']
  },
  height_cm: {
    type: Number,
    required: [true, 'Room height in cm is required']
  },
  budget_egp: {
    type: Number,
    required: [true, 'Budget in EGP is required']
  },
  room_image_path: {
    type: String,
    required: [true, 'Room image path is required']
  },
  ai_analysis: {
    is_corner_shot: { type: Boolean },
    lighting_quality: { type: String, enum: ['poor', 'good', 'excellent'] },
    is_empty_enough: { type: Boolean },
    is_valid: { type: Boolean }
  },
  is_processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('RoomLayout', roomLayoutSchema);
