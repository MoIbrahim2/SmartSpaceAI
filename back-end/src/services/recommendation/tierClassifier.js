/**
 * Tier Classifier
 *
 * Classifies scored products into budget tiers (CHEAPER, BALANCED, PREMIUM)
 * based on their price relative to the unitTargetBudget.
 */

const {
  TIER_THRESHOLDS,
  MAX_PER_TIER,
  MAX_CHEAPER_PER_TIER,
  TIER_FALLBACK_ORDER,
} = require('../../config/recommendation.config');

/**
 * Classify scored products into 3 budget tiers.
 *
 * CHEAPER:  price < 0.85 × unitTargetBudget
 * BALANCED: 0.85 ≤ ratio ≤ 1.15
 * PREMIUM:  1.15 < ratio ≤ 1.35
 *
 * Products beyond 1.35 are excluded (should already be filtered by candidate generation).
 *
 * @param {Array} scoredProducts - Products with score and scoreBreakdown
 * @param {number} unitTargetBudget - Per-unit target budget in EGP
 * @param {number} resolvedQuantity - Number of units (for totalPriceForQuantity)
 * @returns {{ cheaper: Array, balanced: Array, premium: Array }}
 */
const classifyTiers = (scoredProducts, unitTargetBudget, resolvedQuantity = 1) => {
  const cheaper = [];
  const balanced = [];
  const premium = [];

  for (const product of scoredProducts) {
    const price = product.pricing?.currentPrice || 0;
    if (price <= 0 || unitTargetBudget <= 0) continue;

    const ratio = price / unitTargetBudget;

    // Defensive: skip if beyond premium ceiling
    if (ratio > TIER_THRESHOLDS.premiumMax) continue;

    const tierProduct = formatTierProduct(product, resolvedQuantity);

    if (ratio < TIER_THRESHOLDS.cheaperMax) {
      cheaper.push({ ...tierProduct, tier: 'CHEAPER' });
    } else if (ratio <= TIER_THRESHOLDS.balancedMax) {
      balanced.push({ ...tierProduct, tier: 'BALANCED' });
    } else {
      premium.push({ ...tierProduct, tier: 'PREMIUM' });
    }
  }

  // Sort each tier by score descending, take top N
  return {
    cheaper: cheaper.sort((a, b) => b.score - a.score).slice(0, MAX_CHEAPER_PER_TIER),
    balanced: balanced.sort((a, b) => b.score - a.score).slice(0, MAX_PER_TIER),
    premium: premium.sort((a, b) => b.score - a.score).slice(0, MAX_PER_TIER),
  };
};

/**
 * Select top N recommendations up to requested quantity.
 *
 * @param {{ cheaper: Array, balanced: Array, premium: Array }} tieredProducts
 * @param {number} quantity - Number of recommended products needed
 * @returns {Array} List of recommended products
 */
const selectRecommendations = (tieredProducts, quantity = 1) => {
  const pool = [];
  for (const tierName of TIER_FALLBACK_ORDER) {
    const tier = tieredProducts[tierName.toLowerCase()] || [];
    pool.push(...tier);
  }

  // Deduplicate by _id / externalId
  const uniquePool = [];
  const seenIds = new Set();
  for (const prod of pool) {
    const idStr = String(prod._id || prod.externalId || prod.name);
    if (!seenIds.has(idStr)) {
      seenIds.add(idStr);
      uniquePool.push(prod);
    }
  }

  // Sort by score descending and take up to quantity
  uniquePool.sort((a, b) => (b.score || 0) - (a.score || 0));
  return uniquePool.slice(0, Math.max(1, quantity));
};

/**
 * Select the best single recommended product using tier fallback order.
 *
 * @param {{ cheaper: Array, balanced: Array, premium: Array }} tieredProducts
 * @returns {Object|null} Best recommendation or null
 */
const selectRecommendation = (tieredProducts) => {
  const list = selectRecommendations(tieredProducts, 1);
  return list.length > 0 ? list[0] : null;
};

/**
 * Format a product for the tier output.
 *
 * @param {Object} product - Scored product
 * @param {number} resolvedQuantity
 * @returns {Object}
 */
const formatTierProduct = (product, resolvedQuantity) => {
  const price = product.pricing?.currentPrice || product.price || 0;
  const primaryImageObj = (product.images || []).find(img => img && (img.isPrimary || img.primary)) || (product.images || [])[0];

  const primaryImageUrl = typeof primaryImageObj === 'string'
    ? primaryImageObj
    : (primaryImageObj?.url || primaryImageObj?.src || product.imageUrl || product.image || product.primaryImage || null);

  return {
    _id: product._id,
    externalId: product.externalId || null,
    sellerId: product.sellerId || null,
    name: product.basic?.name || product.name || product.title || '',
    brand: product.basic?.brand || product.brand || product.source?.marketplace || '',
    price,
    currency: product.pricing?.currency || product.currency || 'EGP',
    originalPrice: product.pricing?.originalPrice || product.originalPrice || null,
    discountPercentage: product.pricing?.discountPercentage || product.discountPercentage || 0,
    unitPrice: price,
    totalPriceForQuantity: price * resolvedQuantity,
    quantity: resolvedQuantity,
    dimensions: product.dimensions || null,
    materials: product.classification?.materials || product.materials || [],
    colors: product.classification?.colors || product.colors || [],
    styles: product.classification?.styles || product.styles || [],
    primaryImage: primaryImageUrl,
    images: product.images || (primaryImageUrl ? [{ url: primaryImageUrl, isPrimary: true }] : []),
    productUrl: product.source?.productUrl || product.productUrl || null,
    source: product.source || null,
    score: product.score,
    scoreBreakdown: product.scoreBreakdown,
  };
};

module.exports = {
  classifyTiers,
  selectRecommendation,
  selectRecommendations,
  formatTierProduct,
};
