const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: [true, 'fields.apartmentId']
  },
  name: {
    type: String,
    required: [true, 'fields.name'],
    trim: true
  },
  roomType: {
    type: String,
    required: [true, 'fields.roomType'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dimensions: {
    width: {
      type: Number,
      required: [true, 'fields.width']
    },
    length: {
      type: Number,
      required: [true, 'fields.length']
    },
    height: {
      type: Number,
      required: [true, 'fields.height']
    },
    unit: {
      type: String,
      required: [true, 'fields.unit']
    }
  },
  sourceImages: [{
    url: { type: String, required: true },
    storageProvider: { type: String, default: 'local' },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  coverImageId: {
    type: mongoose.Schema.Types.ObjectId
  },
  selectedGenerationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Generation'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE'
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

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
