/**
 * Product Model
 *
 * Mongoose schema for the products collection.
 * This mirrors the actual MongoDB document structure produced by the
 * data pipeline (scraper → normalizer → classification).
 *
 * IMPORTANT: This schema is read-only from the recommendation engine's
 * perspective. We never modify product documents — only query them.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  externalId: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId },

  source: {
    marketplace: { type: String },
    productUrl: { type: String },
    country: { type: String },
    scrapedAt: { type: Date },
    lastUpdated: { type: Date },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
  },

  basic: {
    name: { type: String },
    brand: { type: String },
    description: { type: String },
    sku: { type: String },
  },

  classification: {
    canonicalCategory: { type: String, index: true },
    roomTypes: [{ type: String }],
    styles: [{ type: String }],
    materials: [{ type: String }],
    colors: [{ type: String }],
    tags: [{ type: String }],
  },

  pricing: {
    currency: { type: String, default: 'EGP' },
    currentPrice: { type: Number },
    originalPrice: { type: Number },
    discountPercentage: { type: Number },
  },

  dimensions: {
    width: { type: Number },
    height: { type: Number },
    length: { type: Number },
    dimensionUnit: { type: String, default: 'cm' },
    weight: { type: Number },
    weightUnit: { type: String },
  },

  images: [{
    url: { type: String },
    isPrimary: { type: Boolean, default: false },
  }],

  availability: {
    inStock: { type: Boolean, default: true },
    stockStatus: { type: String },
  },

  rating: {
    average: { type: Number },
    reviews: { type: Number },
  },

  ai: {
    embeddingText: { type: String },
    styleLabels: [{ type: String }],
    dominantColors: [{ type: String }],
    roomCompatibility: [{ type: String }],
    keywords: [{ type: String }],
  },

  processing: {
    status: { type: String, default: 'ACCEPTED' },
    categoryConfidence: { type: Number },
    qualityScore: { type: Number },
    issues: [{ type: String }],
    normalizationVersion: { type: String },
  },
}, {
  timestamps: false, // Products are managed by the data pipeline, not this app
  collection: 'products', // Explicit collection name
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
