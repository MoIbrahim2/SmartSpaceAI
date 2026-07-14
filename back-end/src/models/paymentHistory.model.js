const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'egp'
  },
  creditsAdded: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

const PaymentHistory = mongoose.model('PaymentHistory', paymentHistorySchema);

module.exports = PaymentHistory;
