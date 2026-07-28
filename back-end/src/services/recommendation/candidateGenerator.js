/**
 * Candidate Generator
 *
 * Builds and executes MongoDB queries to fetch product candidates
 * for a given category. Handles hard filters: status, category,
 * price ceiling, availability, and negative preferences.
 */

const Product = require('../../models/product.model');
const {
  ACCEPTED_STATUS,
  TIER_THRESHOLDS,
  MAX_CANDIDATES_FROM_DB,
} = require('../../config/recommendation.config');
const { normalizeCategory } = require('./helpers');

/**
 * Fetch candidate products from MongoDB for a given category.
 *
 * Applies hard filters:
 * - processing.status = ACCEPTED
 * - classification.canonicalCategory = resolved category
 * - pricing.currentPrice > 0 AND <= premiumCeiling (1.35 × unitTargetBudget)
 * - availability.inStock != false
 * - Excludes products whose materials/colors match negative preferences
 *
 * @param {Object} params
 * @param {string} params.resolvedCategory - Canonical category name
 * @param {number} params.unitTargetBudget - Per-unit target budget in EGP
 * @param {Object} params.negativePreferences - { materialsToAvoid, colorsToAvoid }
 * @returns {Promise<{ candidates: Array, diagnostics: Object }>}
 */
const fetchCandidates = async ({
  resolvedCategory,
  unitTargetBudget,
  negativePreferences = {},
}) => {
  const premiumCeiling = unitTargetBudget * TIER_THRESHOLDS.premiumMax;

  // Build the query
  const query = {
    'processing.status': ACCEPTED_STATUS,
    'classification.canonicalCategory': resolvedCategory,
    'pricing.currentPrice': { $gt: 0 },
    'availability.inStock': { $ne: false },
  };

  // Apply price ceiling only if we have a valid budget
  if (unitTargetBudget > 0) {
    query['pricing.currentPrice'].$lte = premiumCeiling;
  }

  // Count total category matches before negative filters
  const totalCategoryMatches = await Product.countDocuments({
    'processing.status': ACCEPTED_STATUS,
    'classification.canonicalCategory': resolvedCategory,
  });

  // Apply negative preference exclusions
  const materialsToAvoid = negativePreferences.materialsToAvoid || [];
  const colorsToAvoid = negativePreferences.colorsToAvoid || [];

  if (materialsToAvoid.length > 0) {
    // Case-insensitive exclusion: exclude products that have ANY of the avoided materials
    const materialRegexes = materialsToAvoid.map(
      (m) => new RegExp(`^${escapeRegex(m)}$`, 'i')
    );
    query['classification.materials'] = { $nin: materialRegexes };
  }

  if (colorsToAvoid.length > 0) {
    const colorRegexes = colorsToAvoid.map(
      (c) => new RegExp(`^${escapeRegex(c)}$`, 'i')
    );
    query['classification.colors'] = { $nin: colorRegexes };
  }

  // Execute query with projection (don't fetch huge descriptions)
  const candidates = await Product.find(query)
    .select({
      'basic.name': 1,
      'basic.brand': 1,
      'classification.canonicalCategory': 1,
      'classification.styles': 1,
      'classification.materials': 1,
      'classification.colors': 1,
      'classification.roomTypes': 1,
      'pricing.currentPrice': 1,
      'pricing.originalPrice': 1,
      'pricing.currency': 1,
      'pricing.discountPercentage': 1,
      'dimensions.width': 1,
      'dimensions.height': 1,
      'dimensions.length': 1,
      'dimensions.dimensionUnit': 1,
      'images': 1,
      'availability.inStock': 1,
      'rating.average': 1,
      'rating.reviews': 1,
      'processing.issues': 1,
      'processing.qualityScore': 1,
      'source.productUrl': 1,
      'externalId': 1,
      'sellerId': 1,
    })
    .sort({ 'pricing.currentPrice': 1 }) // Sort by price for predictable results
    .limit(MAX_CANDIDATES_FROM_DB)
    .lean();

  // Count rejections
  const afterNegativeFilters = await Product.countDocuments({
    ...query,
    // Reset price filter to see how many were excluded by price vs negatives
  });

  const diagnostics = {
    category: resolvedCategory,
    databaseMatches: totalCategoryMatches,
    premiumCeiling: Math.round(premiumCeiling),
    afterNegativeFilters: candidates.length, // approximate
    candidatesReturned: candidates.length,
  };

  return { candidates, diagnostics };
};

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  fetchCandidates,
};
