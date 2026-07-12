const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'fields.roomId']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'fields.ownerId']
  },
  styleId: {
    type: mongoose.Schema.Types.ObjectId
  },
  generationType: {
    type: String,
    enum: ['CREATE_FROM_SCRATCH', 'ENHANCE_EXISTING'],
    required: [true, 'fields.generationType']
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    required: [true, 'fields.status']
  },
  prompt: {
    type: String,
    trim: true
  },
  negativePrompt: {
    type: String,
    trim: true
  },
  creditsUsed: {
    type: Number
  },
  settings: {
    creativity: { type: Number },
    preserveLayout: { type: Boolean },
    colorPalette: { type: String },
    lighting: { type: String },
    quality: { type: String },
    aspectRatio: { type: String },
    seed: { type: String }
  },
  images: [{
    url: { type: String, required: true },
    thumbnail: { type: String },
    width: { type: Number },
    height: { type: Number },
    selected: { type: Boolean, default: false }
  }],
  ai: {
    provider: { type: String },
    model: { type: String },
    version: { type: String },
    generationTime: { type: Number }
  },
  completedAt: {
    type: Date
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

const Generation = mongoose.model('Generation', generationSchema);

module.exports = Generation;
