const mongoose = require('mongoose');
const Stripe = require('stripe');
const Product = require('../models/product.model');
const BuyRequest = require('../models/buyRequest.model');
const User = require('../models/user.model');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Process furniture checkout order.
 * @param {string} buyerId
 * @param {Object} payload - { items, customer, paymentMethod }
 * @returns {Promise<Object>}
 */
const checkout = async (buyerId, payload) => {
  const { items, customer, paymentMethod = 'stripe' } = payload;

  if (!items || items.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cart must contain at least one item');
  }

  // 1. Validate all products in DB & resolve pricing + sellerId
  const validatedItems = [];
  for (const item of items) {
    let product = null;
    if (mongoose.Types.ObjectId.isValid(item.productId)) {
      product = await Product.findById(item.productId);
    }
    if (!product && item.name) {
      product = await Product.findOne({ 'basic.name': item.name });
    }

    const price = Number(item.price) || product?.pricing?.currentPrice || product?.price || 0;
    const name = item.name || product?.basic?.name || 'Furniture Item';
    const image = item.image || product?.images?.[0]?.url || product?.images?.[0] || null;

    if (price <= 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid product price for ${name}`);
    }

    // Resolve seller ID (fall back to item.sellerId, product.sellerId, or active default seller)
    let sellerId = (item.sellerId && mongoose.Types.ObjectId.isValid(item.sellerId)) ? item.sellerId : (product?.sellerId || product?.source?.sellerId);
    if (!sellerId) {
      const defaultSeller = await User.findOne({ role: 'SELLER', status: 'ACTIVE' });
      sellerId = defaultSeller ? defaultSeller._id : buyerId;
    }

    validatedItems.push({
      product,
      productId: product ? product._id : item.productId,
      sellerId,
      name,
      image,
      price,
      quantity: item.quantity || 1,
      totalPrice: price * (item.quantity || 1)
    });
  }

  // 2. Group validated items by sellerId and create EXACTLY 1 BuyRequest per seller
  const itemsBySeller = {};
  for (const item of validatedItems) {
    const sId = item.sellerId.toString();
    if (!itemsBySeller[sId]) {
      itemsBySeller[sId] = {
        sellerId: item.sellerId,
        items: [],
        grossTotalAmount: 0
      };
    }
    itemsBySeller[sId].items.push(item);
    itemsBySeller[sId].grossTotalAmount += item.totalPrice;
  }

  const createdOrders = [];
  for (const sId of Object.keys(itemsBySeller)) {
    const sellerGroup = itemsBySeller[sId];
    const seller = await User.findById(sellerGroup.sellerId);
    const commissionRate = seller?.sellerProfile?.commissionRate || 0.12;
    const grossTotalAmount = sellerGroup.grossTotalAmount;
    const amountOwed = Math.round(grossTotalAmount * commissionRate);

    const firstItem = sellerGroup.items[0];

    const buyRequest = new BuyRequest({
      buyerId,
      sellerId: sellerGroup.sellerId,
      productId: firstItem.productId,
      quantity: firstItem.quantity,
      unitPriceAtPurchase: firstItem.price,
      items: sellerGroup.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        image: i.product?.images?.[0]?.url || i.product?.images?.[0] || i.product?.imageUrl || null,
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice
      })),
      grossTotalAmount,
      status: 'PENDING',
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: {
          country: customer.address.country || 'Egypt',
          city: customer.address.city,
          district: customer.address.district || customer.address.city,
          street: customer.address.street
        }
      },
      commission: {
        appliedRate: commissionRate,
        amountOwed,
        isCommissionPaid: false
      }
    });

    await buyRequest.save();
    createdOrders.push(buyRequest);
  }

  // 3. Handle Stripe Payment Method
  if (paymentMethod === 'stripe' && stripe) {
    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: 'egp',
        product_data: {
          name: item.name,
          description: `Furniture order for ${customer.name} (${customer.phone})`
        },
        unit_amount: Math.round(item.price * 100) // Convert EGP to piasters
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: undefined,
      metadata: {
        type: 'furniture_order',
        buyerId: buyerId.toString(),
        orderIds: createdOrders.map((o) => o._id.toString()).join(',')
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orders?session_id={CHECKOUT_SESSION_ID}&orderSuccess=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/cart`
    });

    return {
      orders: createdOrders,
      checkoutUrl: session.url,
      stripeSessionId: session.id
    };
  }

  // Cash on Delivery
  return {
    orders: createdOrders,
    checkoutUrl: null
  };
};

/**
 * List orders placed by authenticated buyer.
 * @param {string} buyerId
 * @returns {Promise<Array>}
 */
const getBuyerOrders = async (buyerId) => {
  const orders = await BuyRequest.find({ buyerId })
    .populate({
      path: 'productId',
      select: 'basic.name images pricing'
    })
    .populate({
      path: 'sellerId',
      select: 'profile.firstName profile.lastName sellerProfile.businessName'
    })
    .sort({ createdAt: -1 });

  return orders;
};

/**
 * Get single order details for buyer.
 * @param {string} buyerId
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
const getOrderById = async (buyerId, orderId) => {
  const order = await BuyRequest.findOne({ _id: orderId, buyerId })
    .populate({
      path: 'productId',
      select: 'basic.name images pricing classification dimensions'
    })
    .populate({
      path: 'sellerId',
      select: 'profile.firstName profile.lastName sellerProfile.businessName sellerProfile.phone'
    });

  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Order not found');
  }

  return order;
};

module.exports = {
  checkout,
  getBuyerOrders,
  getOrderById
};
