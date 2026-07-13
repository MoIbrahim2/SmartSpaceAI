const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'fields.name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'fields.email'],
    lowercase: true,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'fields.message'],
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWED', 'RESOLVED'],
    default: 'PENDING'
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

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
