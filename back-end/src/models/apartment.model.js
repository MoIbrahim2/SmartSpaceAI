const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'fields.ownerId']
  },
  name: {
    type: String,
    required: [true, 'fields.name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  coverImage: {
    url: { type: String },
    storageProvider: { type: String, default: 'local' },
    fileName: { type: String },
    uploadedAt: { type: Date }
  },
  location: {
    country: {
      type: String,
      required: [true, 'fields.country']
    },
    city: {
      type: String,
      required: [true, 'fields.city']
    },
    district: {
      type: String
    },
    street: {
      type: String
    },
    building: {
      type: String
    },
    floor: {
      type: Number
    },
    apartmentNumber: {
      type: String
    }
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

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;
