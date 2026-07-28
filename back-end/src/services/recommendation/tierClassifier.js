/**
 * Tier Classifier
 *
 * Classifies scored products into budget tiers (CHEAPER, BALANCED, PREMIUM)
 * based on their price relative to the unitTargetBudget.
 */

const {
  TIER_THRESHOLDS,
  MAX_PER_TIER,
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
    cheaper: cheaper.sort((a, b) => b.score - a.score).slice(0, MAX_PER_TIER),
    balanced: balanced.sort((a, b) => b.score - a.score).slice(0, MAX_PER_TIER),
    premium: premium.sort((a, b) => b.score - a.score).slice(0, MAX_PER_TIER),
  };
};

/**
 * Select the best recommended product using tier fallback order.
 *
 * @param {{ cheaper: Array, balanced: Array, premium: Array }} tieredProducts
 * @returns {Object|null} Best recommendation or null
 */
const selectRecommendation = (tieredProducts) => {
  for (const tierName of TIER_FALLBACK_ORDER) {
    const tier = tieredProducts[tierName.toLowerCase()];
    if (tier && tier.length > 0) {
      return tier[0]; // Top-scoring product in this tier
    }
  }
  return null;
};

/**
 * Format a product for the tier output.
 *
 * @param {Object} product - Scored product
 * @param {number} resolvedQuantity
 * @returns {Object}
 */
const formatTierProduct = (product, resolvedQuantity) => {
  const price = product.pricing?.currentPrice || 0;
  const primaryImage = (product.images || []).find(img => img.isPrimary) || (product.images || [])[0];

  return {
    _id: product._id,
    externalId: product.externalId || null,
    sellerId: product.sellerId || null,
    name: product.basic?.name || '',
    price,
    currency: product.pricing?.currency || 'EGP',
    originalPrice: product.pricing?.originalPrice || null,
    discountPercentage: product.pricing?.discountPercentage || 0,
    unitPrice: price,
    totalPriceForQuantity: price * resolvedQuantity,
    quantity: resolvedQuantity,
    dimensions: product.dimensions || null,
    materials: product.classification?.materials || [],
    colors: product.classification?.colors || [],
    styles: product.classification?.styles || [],
    primaryImage: primaryImage?.url || null,
    productUrl: product.source?.productUrl || null,
    score: product.score,
    scoreBreakdown: product.scoreBreakdown,
  };
};

module.exports = {
  classifyTiers,
  selectRecommendation,
  formatTierProduct,
};
