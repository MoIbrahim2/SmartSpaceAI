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
    enum: ['CREATE_FROM_SCRATCH', 'ENHANCE_ROOM'],
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
  userPrompt: {
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
      quantity: { type: Number, default: null },
      preferredMaterial: { type: String, default: null },
      preferredColor: { type: String, default: null },
      preferredStyle: { type: String, default: null },
      preferredShape: { type: String, default: null },
      preferredSize: { type: String, default: null },
      budgetAdjustment: { type: String, default: null },
      importance: { type: String, default: null },
      action: { type: String, enum: ['REPLACE', 'ADD', 'KEEP', 'REMOVE', null], default: null }
    }],
    negativePreferences: {
      materialsToAvoid: [{ type: String }],
      colorsToAvoid: [{ type: String }],
      categoriesToAvoid: [{ type: String }]
    }
  },
  selectedProducts: [{
    category: { type: String, required: true },
    productId: { type: String },
    productData: { type: mongoose.Schema.Types.Mixed },
    isRecommended: { type: Boolean, default: false },
    price: { type: Number },
    quantity: { type: Number, default: 1 },
    action: { type: String, enum: ['REPLACE', 'ADD', 'KEEP', 'REMOVE', null], default: null }
  }],
  recommendationResult: {
    type: mongoose.Schema.Types.Mixed
  },
  roomLayoutData: {
    length_cm: { type: Number },
    width_cm: { type: Number },
    height_cm: { type: Number },
    budget_egp: { type: Number },
    room_image_path: { type: String }
  },
  generatedImage: {
    url: { type: String },
    promptUsed: { type: String },
    modelUsed: { type: String },
    generatedAt: { type: Date }
  },
  spatialGuardrail: {
    isApplicable: { type: Boolean, default: null },
    productsHash: { type: String, default: null },
    naturalLanguagePrompt: { type: String, default: '' },
    layoutDiagram: {
      roomDimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { type: String, default: 'cm' }
      },
      totalRoomArea: { type: Number },
      totalFurnitureFootprint: { type: Number },
      usableFloorPercentage: { type: Number },
      allocations: [{
        productId: { type: String },
        productName: { type: String },
        category: { type: String },
        position: {
          x: { type: Number },
          y: { type: Number },
          z: { type: Number }
        },
        dimensions: {
          length: { type: Number },
          width: { type: Number },
          height: { type: Number }
        },
        rotation: { type: Number },
        placedAgainstWall: { type: String, enum: ['NORTH', 'SOUTH', 'EAST', 'WEST', 'NONE'], default: 'NONE' },
        cameraVisibility: { type: String, enum: ['FULL', 'PARTIAL', 'HIDDEN_BEHIND_CAMERA'], default: 'FULL' },
        designRulesApplied: [{ type: String }]
      }]
    },
    spatialViolations: [{
      type: { type: String, enum: ['DIMENSION_OVERFLOW', 'WALKWAY_BLOCKAGE', 'DOOR_IMPACT', 'WINDOW_BLOCKAGE', 'DRAWER_CLEARANCE_BLOCKAGE'] },
      description: { type: String },
      conflictingProductIds: [{ type: String }]
    }],
    suggestedRemovals: [{ type: String }],
    validatedAt: { type: Date }
  },
  resolution: {
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 },
    label: { type: String, default: 'Standard (720p)' }
  },
  isGenerated: {
    type: Boolean,
    default: false
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
