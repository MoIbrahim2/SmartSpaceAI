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
  image: {
    type: String,
    default: null
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
    trim: true,
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  // Single product fields kept for backward compatibility
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  quantity: {
    type: Number
  },
  unitPriceAtPurchase: {
    type: Number
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  grossTotalAmount: {
    type: Number
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
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  customer: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: {
      country: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      street: { type: String, trim: true }
    }
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

// Auto-sync aliases and defaults before saving
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.userId && this.buyerId) {
    this.userId = this.buyerId;
  }
  if (!this.buyerId && this.userId) {
    this.buyerId = this.userId;
  }
  if (this.grossTotalAmount === undefined && this.totalAmount !== undefined) {
    this.grossTotalAmount = this.totalAmount;
  }
  if (this.totalAmount === undefined && this.grossTotalAmount !== undefined) {
    this.totalAmount = this.grossTotalAmount;
  }
  if (this.customer && !this.shippingAddress) {
    this.shippingAddress = {
      street: this.customer.address?.street,
      city: this.customer.address?.city,
      country: this.customer.address?.country,
      phone: this.customer.phone
    };
  }
  if (this.shippingAddress && !this.customer) {
    this.customer = {
      name: 'Customer',
      phone: this.shippingAddress.phone || '',
      address: {
        country: this.shippingAddress.country || 'Egypt',
        city: this.shippingAddress.city || '',
        district: this.shippingAddress.city || '',
        street: this.shippingAddress.street || ''
      }
    };
  }
  if (typeof next === 'function') {
    next();
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

