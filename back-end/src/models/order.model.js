const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  userId: {
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
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'Order must contain at least one item']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionPercentage: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  netSellerAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  shippingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true }
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

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
