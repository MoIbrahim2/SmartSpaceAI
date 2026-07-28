/**
 * Product Scorer
 *
 * Computes an explainable weighted match score (0–100) for each
 * product candidate against user preferences and room constraints.
 *
 * Scoring signals: style, material, color, price, size
 * Each signal produces a raw score [0, 1] which is then multiplied
 * by its configured weight.
 */

const {
  SCORING_WEIGHTS,
  TOP_SCORED_FOR_TIERING,
} = require('../../config/recommendation.config');
const { getDimensionConfidence, getConfidenceMultiplier } = require('./helpers');

/**
 * Score a single product candidate.
 *
 * @param {Object} product - Lean product document from MongoDB
 * @param {Object} params
 * @param {Object} params.geminiPreference - Per-category Gemini preference
 * @param {Object} params.roomPreferences - Room-level Gemini preferences
 * @param {number} params.unitTargetBudget - Per-unit budget target in EGP
 * @param {Object|null} params.recommendedDimensions - From matched size rule
 * @returns {Object} { score, scoreBreakdown, product }
 */
const scoreProduct = (product, {
  geminiPreference = {},
  roomPreferences = {},
  unitTargetBudget = 0,
  recommendedDimensions = null,
}) => {
  const styleScore = computeStyleScore(product, geminiPreference, roomPreferences);
  const materialScore = computeMaterialScore(product, geminiPreference);
  const colorScore = computeColorScore(product, geminiPreference, roomPreferences);
  const priceScore = computePriceScore(product, unitTargetBudget);
  const { score: sizeRaw, confidence } = computeSizeScore(product, recommendedDimensions);

  const confidenceMultiplier = getConfidenceMultiplier(confidence);
  const adjustedSizeRaw = sizeRaw * confidenceMultiplier;

  const weighted = {
    style: styleScore * SCORING_WEIGHTS.style,
    material: materialScore * SCORING_WEIGHTS.material,
    color: colorScore * SCORING_WEIGHTS.color,
    price: priceScore * SCORING_WEIGHTS.price,
    size: adjustedSizeRaw * SCORING_WEIGHTS.size,
  };

  const totalScore = Object.values(weighted).reduce((sum, w) => sum + w, 0);

  return {
    score: Math.round(totalScore * 10) / 10, // 1 decimal place
    scoreBreakdown: {
      style: { raw: round(styleScore), weighted: round(weighted.style) },
      material: { raw: round(materialScore), weighted: round(weighted.material) },
      color: { raw: round(colorScore), weighted: round(weighted.color) },
      price: { raw: round(priceScore), weighted: round(weighted.price) },
      size: { raw: round(sizeRaw), weighted: round(weighted.size), confidence },
    },
  };
};

/**
 * Score all candidates and return the top N sorted by score descending.
 *
 * @param {Array} candidates - Array of lean product documents
 * @param {Object} scoringParams - Parameters for scoring
 * @param {number} topN - Max candidates to return (default: TOP_SCORED_FOR_TIERING)
 * @returns {Array} Scored and sorted candidates
 */
const scoreAndRankCandidates = (candidates, scoringParams, topN = TOP_SCORED_FOR_TIERING) => {
  const scored = candidates.map((product) => {
    const { score, scoreBreakdown } = scoreProduct(product, scoringParams);
    return {
      ...product,
      score,
      scoreBreakdown,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
};

// ─── Individual Signal Scorers ──────────────────────────────

/**
 * Style matching score.
 * Compares product styles against user's preferred style and room style.
 */
const computeStyleScore = (product, geminiPref, roomPref) => {
  const productStyles = (product.classification?.styles || []).map(s => s.toLowerCase());
  if (productStyles.length === 0) return 0.3; // No style data → low neutral

  const targets = [];
  if (geminiPref?.preferredStyle) targets.push(geminiPref.preferredStyle.toLowerCase());
  if (roomPref?.style) targets.push(roomPref.style.toLowerCase());

  if (targets.length === 0) return 0.5; // No preference → neutral

  // Check for any word overlap between product styles and target styles
  let bestMatch = 0;
  for (const target of targets) {
    const targetWords = target.split(/\s+/);
    for (const pStyle of productStyles) {
      const styleWords = pStyle.split(/\s+/);
      // Exact match
      if (pStyle === target) {
        bestMatch = Math.max(bestMatch, 1.0);
        continue;
      }
      // Partial word match
      const overlap = targetWords.filter(tw => styleWords.includes(tw)).length;
      if (overlap > 0) {
        bestMatch = Math.max(bestMatch, 0.5 + (0.5 * overlap / targetWords.length));
      }
    }
  }

  return bestMatch || 0.2; // No match at all → low score
};

/**
 * Material matching score.
 * Compares product materials against user's preferred material.
 */
const computeMaterialScore = (product, geminiPref) => {
  const productMaterials = (product.classification?.materials || []).map(m => m.toLowerCase());
  if (productMaterials.length === 0) return 0.3; // No material data

  if (!geminiPref?.preferredMaterial) return 0.5; // No preference → neutral

  const target = geminiPref.preferredMaterial.toLowerCase();
  const targetWords = target.split(/\s+/);

  // Exact match
  if (productMaterials.includes(target)) return 1.0;

  // Partial match: check if any target word appears in product materials
  for (const mat of productMaterials) {
    const matWords = mat.split(/\s+/);
    const overlap = targetWords.filter(tw => matWords.includes(tw)).length;
    if (overlap > 0) return 0.6 + (0.4 * overlap / targetWords.length);
  }

  return 0.2; // No match
};

/**
 * Color matching score.
 * Compares product colors against user's preferred color and room color palette.
 */
const computeColorScore = (product, geminiPref, roomPref) => {
  const productColors = (product.classification?.colors || []).map(c => c.toLowerCase());
  if (productColors.length === 0) return 0.3; // No color data

  const targets = [];
  if (geminiPref?.preferredColor) targets.push(geminiPref.preferredColor.toLowerCase());
  if (roomPref?.colorPalette) {
    targets.push(...roomPref.colorPalette.map(c => c.toLowerCase()));
  }

  if (targets.length === 0) return 0.5; // No preference → neutral

  let bestMatch = 0;
  for (const target of targets) {
    const targetWords = target.split(/\s+/);
    for (const pColor of productColors) {
      const colorWords = pColor.split(/\s+/);
      // Exact match
      if (pColor === target) {
        bestMatch = Math.max(bestMatch, 1.0);
        continue;
      }
      // Partial word match
      const overlap = targetWords.filter(tw => colorWords.includes(tw)).length;
      if (overlap > 0) {
        bestMatch = Math.max(bestMatch, 0.4 + (0.6 * overlap / targetWords.length));
      }
    }
  }

  return bestMatch || 0.2;
};

/**
 * Price proximity score.
 * Scores how close the product price is to the target budget.
 * Bell curve centered on unitTargetBudget.
 */
const computePriceScore = (product, unitTargetBudget) => {
  const price = product.pricing?.currentPrice;
  if (!price || price <= 0 || !unitTargetBudget || unitTargetBudget <= 0) return 0.5;

  const ratio = price / unitTargetBudget;

  // Perfect match at ratio = 1.0, score = 1.0
  // Score decreases as ratio moves away from 1.0
  // Using a Gaussian-like curve: e^(-k*(ratio-1)^2)
  const k = 4; // Controls curve width
  const score = Math.exp(-k * Math.pow(ratio - 1, 2));

  return Math.max(0, Math.min(1, score));
};

/**
 * Size/dimension matching score.
 * Compares product dimensions against recommended dimensions from the KB.
 */
const computeSizeScore = (product, recommendedDimensions) => {
  const dims = product.dimensions || {};
  const issues = product.processing?.issues || [];
  const confidence = getDimensionConfidence(issues);

  if (!recommendedDimensions) {
    // No size rule for this category → neutral
    return { score: 0.5, confidence };
  }

  const scores = [];

  // Check width
  if (recommendedDimensions.width && dims.width) {
    scores.push(dimensionFitScore(dims.width, recommendedDimensions.width));
  }

  // Check depth (mapped from product length for most furniture)
  if (recommendedDimensions.depth && dims.length) {
    scores.push(dimensionFitScore(dims.length, recommendedDimensions.depth));
  }

  // Check length (if the rule uses length, e.g. beds)
  if (recommendedDimensions.length && dims.length) {
    scores.push(dimensionFitScore(dims.length, recommendedDimensions.length));
  }

  // Check height (if specified in the rule)
  if (recommendedDimensions.height && dims.height) {
    scores.push(dimensionFitScore(dims.height, recommendedDimensions.height));
  }

  if (scores.length === 0) {
    // No applicable dimension comparisons → neutral
    return { score: 0.5, confidence: 'NONE' };
  }

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return { score: avgScore, confidence };
};

/**
 * Score how well a single dimension fits within a recommended range.
 *
 * @param {number} actual - Actual product dimension
 * @param {{ min: number, max: number }} recommended - Recommended range
 * @returns {number} Score [0, 1]
 */
const dimensionFitScore = (actual, recommended) => {
  if (!actual || !recommended || !recommended.min || !recommended.max) return 0.5;

  const { min, max } = recommended;
  const midpoint = (min + max) / 2;
  const range = max - min;

  // Perfect fit: within range → 1.0
  if (actual >= min && actual <= max) return 1.0;

  // Outside range: score decreases with distance
  const distance = actual < min ? min - actual : actual - max;
  const tolerance = range * 0.5; // Allow 50% outside range before score drops significantly

  return Math.max(0, 1 - (distance / (tolerance || 1)));
};

/**
 * Round a number to 2 decimal places.
 */
const round = (n) => Math.round(n * 100) / 100;

module.exports = {
  scoreProduct,
  scoreAndRankCandidates,
  // Export individual scorers for testing
  computeStyleScore,
  computeMaterialScore,
  computeColorScore,
  computePriceScore,
  computeSizeScore,
  dimensionFitScore,
};
