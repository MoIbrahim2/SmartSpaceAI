const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
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
    default: 'CREATE_FROM_SCRATCH',
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
  extractedPreferences: {
    roomPreferences: {
      style: { type: String, default: null },
      theme: { type: String, default: null },
      mood: { type: String, default: null },
      lighting: { type: String, default: null },
      colorPalette: [{ type: String }]
    },
    categoryPreferences: [{
      category: { type: String, required: true },
      included: { type: Boolean, default: null },
      excluded: { type: Boolean, default: null },
      preferredMaterial: { type: String, default: null },
      preferredColor: { type: String, default: null },
      preferredStyle: { type: String, default: null },
      preferredShape: { type: String, default: null },
      preferredSize: { type: String, default: null },
      budgetAdjustment: { type: String, default: null },
      importance: { type: String, default: null }
    }],
    negativePreferences: {
      materialsToAvoid: [{ type: String }],
      colorsToAvoid: [{ type: String }],
      categoriesToAvoid: [{ type: String }]
    }
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
