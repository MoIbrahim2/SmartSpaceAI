const Product = require('../../models/product.model');
const ApiError = require('../../errors/ApiError');
const HTTP_STATUS = require('../../constants/statusCodes');

/**
 * Fetch products in the moderation queue (pending review, AI validation, flagged)
 */
const getModerationItems = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status && query.status !== 'ALL') {
    if (query.status === 'PENDING') {
      filter['processing.status'] = {
        $in: ['PENDING_AI_VALIDATION', 'PENDING_REVIEW', 'MANUAL_REVIEW_REQUIRED', 'FLAGGED_ISSUES', 'NEEDS_REVIEW']
      };
    } else {
      filter['processing.status'] = query.status;
    }
  }

  if (query.category && query.category !== 'ALL') {
    filter['classification.canonicalCategory'] = new RegExp(query.category, 'i');
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter['$or'] = [
      { 'basic.name': searchRegex },
      { 'basic.description': searchRegex },
      { 'basic.sku': searchRegex }
    ];
  }

  const [products, totalItems] = await Promise.all([
    Product.find(filter)
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  const items = products.map((prod) => ({
    id: prod._id,
    productTitle: prod.basic?.name || 'Untitled Product',
    sellerName: prod.basic?.brand || 'External Scraped Seller',
    category: prod.classification?.canonicalCategory || 'General',
    price: `EGP ${(prod.pricing?.currentPrice || 0).toLocaleString()}`,
    aiConfidence: typeof prod.processing?.confidence === 'number'
      ? `${Math.round(prod.processing.confidence * 100)}%`
      : (prod.processing?.categoryConfidence
        ? `${Math.round(prod.processing.categoryConfidence * 100)}%`
        : 'N/A'),
    qualityScore: prod.processing?.qualityScore
      ? `${prod.processing.qualityScore}`
      : 'A',
    submittedDate: prod.source?.scrapedAt
      ? new Date(prod.source.scrapedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: prod.processing?.status || 'Pending Review',
    detectedObject: prod.processing?.detectedObject || null,
    issues: prod.processing?.issues || [],
    images: (prod.images || []).map((img) => img.url),
    imageUrl: prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=300&auto=format&fit=crop&q=80',
    description: prod.basic?.description || 'No detailed description provided.',
    dimensions: `${prod.dimensions?.width || 0} x ${prod.dimensions?.length || 0} x ${prod.dimensions?.height || 0} ${prod.dimensions?.dimensionUnit || 'cm'}`,
    material: (prod.classification?.materials || []).join(', ') || 'N/A',
    style: (prod.classification?.styles || []).join(', ') || 'Modern'
  }));

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

/**
 * Update processing status for a moderation queue item (ACCEPTED, REJECTED, FLAGGED)
 */
const updateModerationStatus = async (productId, status, notes) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'product.not_found');
  }

  if (!product.processing) {
    product.processing = {};
  }

  product.processing.status = status;
  if (notes) {
    product.processing.issues = product.processing.issues || [];
    product.processing.issues.push(notes);
  }

  await product.save();
  return product;
};

module.exports = {
  getModerationItems,
  updateModerationStatus
};
