const mongoose = require('mongoose');

const commissionPayoutSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020
  },
  grossSales: {
    type: Number,
    required: true,
    min: 0
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  netSellerAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PAID'],
    default: 'PAID'
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
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

// Ensure a seller can only have one payout record per month/year
commissionPayoutSchema.index({ sellerId: 1, month: 1, year: 1 }, { unique: true });

const CommissionPayout = mongoose.model('CommissionPayout', commissionPayoutSchema);

module.exports = CommissionPayout;
