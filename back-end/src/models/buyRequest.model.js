const mongoose = require('mongoose');

const buyRequestSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Items array for multi-item seller batch orders
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true }
  }],
  // Single product fields kept optional for backward compatibility
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  quantity: {
    type: Number,
    min: [1, 'Quantity must be at least 1']
  },
  unitPriceAtPurchase: {
    type: Number
  },
  grossTotalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'DELIVERED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      street: { type: String, required: true }
    }
  },
  commission: {
    appliedRate: {
      type: Number,
      default: 0.12,
      min: 0,
      max: 1
    },
    amountOwed: {
      type: Number,
      default: 0
    },
    isCommissionPaid: {
      type: Boolean,
      default: false,
      index: true
    },
    settlementGroup: {
      type: String,
      index: true
    }
  }
}, {
  timestamps: true,
  collection: 'buy_requests',
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

const BuyRequest = mongoose.model('BuyRequest', buyRequestSchema);

module.exports = BuyRequest;
