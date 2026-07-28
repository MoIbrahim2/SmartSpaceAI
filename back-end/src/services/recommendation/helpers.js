/**
 * Recommendation Engine — Core Domain Helpers
 *
 * Pure functions for category normalization, quantity resolution,
 * room area calculation, size rule matching, and budget computation.
 *
 * These functions are side-effect-free and independently testable.
 */

const {
  BUDGET_ADJUSTMENT_MAP,
  ADJUST_PER_ITEM_REDUCTION,
  DIMENSION_ISSUE_SEVERITY,
  DIMENSION_CONFIDENCE_MULTIPLIERS,
} = require('../../config/recommendation.config');

// ─── Category Normalization ────────────────────────────────

/**
 * Normalize a category name for case-insensitive comparison.
 * Trims whitespace, lowercases, and collapses multiple spaces.
 *
 * @param {string} name - Raw category name
 * @returns {string} Normalized category name
 */
const normalizeCategory = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
};

/**
 * Normalize a room type string to a filesystem-safe key.
 * e.g. "Living Room" → "living_room"
 *
 * @param {string} roomType - Raw room type
 * @returns {string} Normalized room type key
 */
const normalizeRoomType = (roomType) => {
  if (!roomType || typeof roomType !== 'string') return '';
  return roomType.trim().toLowerCase().replace(/\s+/g, '_');
};

// ─── Room Area Calculation ─────────────────────────────────

/**
 * Calculate room surface area in square meters from cm dimensions.
 *
 * @param {number} length_cm - Room length in centimeters
 * @param {number} width_cm - Room width in centimeters
 * @returns {number} Area in square meters, or 0 if inputs invalid
 */
const calculateRoomArea = (length_cm, width_cm) => {
  if (!length_cm || !width_cm || length_cm <= 0 || width_cm <= 0) return 0;
  return (length_cm * width_cm) / 10000;
};

// ─── Quantity Resolution ───────────────────────────────────

/**
 * Resolve the target quantity for a category.
 *
 * Precedence:
 * 1. If allowMultiple === false → always 1
 * 2. If userQuantity is a valid positive integer → clamp to [min, max]
 * 3. Otherwise → use rule default (or 1)
 *
 * @param {number|null} userQuantity - Gemini-extracted quantity (null if not specified)
 * @param {Object} quantityRule - KB quantity rule { default, min, max, allowMultiple }
 * @returns {{ resolvedQuantity: number, wasAdjusted: boolean, adjustmentReason: string|null }}
 */
const resolveQuantity = (userQuantity, quantityRule = {}) => {
  const qRule = {
    default: quantityRule.default || 1,
    min: quantityRule.min || 1,
    max: quantityRule.max || 10,
    allowMultiple: quantityRule.allowMultiple !== false, // defaults to true if not specified
  };

  // Rule 1: allowMultiple === false → forced single
  if (!qRule.allowMultiple) {
    const wasAdjusted = Number.isInteger(userQuantity) && userQuantity > 1;
    return {
      resolvedQuantity: 1,
      wasAdjusted,
      adjustmentReason: wasAdjusted
        ? `Quantity adjusted to 1: multiple items not allowed for this category.`
        : null,
    };
  }

  // Rule 2: User specified a quantity
  if (Number.isInteger(userQuantity) && userQuantity >= 1) {
    const clamped = Math.min(Math.max(userQuantity, qRule.min), qRule.max);
    const wasAdjusted = clamped !== userQuantity;
    return {
      resolvedQuantity: clamped,
      wasAdjusted,
      adjustmentReason: wasAdjusted
        ? `Quantity adjusted from ${userQuantity} to ${clamped} (allowed range: ${qRule.min}–${qRule.max}).`
        : null,
    };
  }

  // Rule 3: User did not specify → use default
  return {
    resolvedQuantity: qRule.default,
    wasAdjusted: false,
    adjustmentReason: null,
  };
};

// ─── Size Rule Matching ────────────────────────────────────

/**
 * Find the matching size rule bracket for a given room area.
 *
 * @param {Array} sizeRules - Array of { roomArea: { min, max }, recommendedDimensions }
 * @param {number} area_sqm - Room area in square meters
 * @returns {Object|null} Matched size rule or null
 */
const matchSizeRule = (sizeRules, area_sqm) => {
  if (!Array.isArray(sizeRules) || sizeRules.length === 0 || !area_sqm || area_sqm <= 0) {
    return null;
  }

  // Try exact bracket match
  const match = sizeRules.find(
    (sr) => area_sqm >= sr.roomArea.min && area_sqm <= sr.roomArea.max
  );

  if (match) return match;

  // Fallback: if area is below the smallest bracket, use smallest
  // If area is above the largest bracket, use largest
  const sorted = [...sizeRules].sort((a, b) => a.roomArea.min - b.roomArea.min);

  if (area_sqm < sorted[0].roomArea.min) return sorted[0];
  if (area_sqm > sorted[sorted.length - 1].roomArea.max) return sorted[sorted.length - 1];

  return null;
};

/**
 * Adjust recommended dimensions for multi-item categories.
 * When sizeMode === "ADJUST_PER_ITEM" and quantity > 1,
 * reduces each item's target dimensions.
 *
 * @param {Object} recommendedDimensions - { width: { min, max }, depth: { min, max }, ... }
 * @param {string} sizeMode - "STANDARD", "ADJUST_PER_ITEM", or "PER_TARGET"
 * @param {number} quantity - Resolved quantity
 * @returns {Object} Adjusted dimensions (or original if no adjustment needed)
 */
const adjustDimensionsForQuantity = (recommendedDimensions, sizeMode, quantity) => {
  if (!recommendedDimensions || sizeMode !== 'ADJUST_PER_ITEM' || quantity <= 1) {
    return recommendedDimensions || null;
  }

  const reduction = 1 - ADJUST_PER_ITEM_REDUCTION;
  const adjusted = {};

  for (const [key, value] of Object.entries(recommendedDimensions)) {
    if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
      adjusted[key] = {
        min: Math.round(value.min * reduction),
        max: Math.round(value.max * reduction),
      };
    } else {
      // Preserve non-range properties (e.g. "note", "widthMultiplier")
      adjusted[key] = value;
    }
  }

  return adjusted;
};

// ─── Budget Computation ────────────────────────────────────

/**
 * Resolve the effective budget percentage for a category based on
 * the Gemini budgetAdjustment signal.
 *
 * @param {string|null} budgetAdjustment - "premium" | "budget-friendly" | "mid-range" | null
 * @param {Object} budgetRule - KB budget rule { defaultPercentage, minPercentage, maxPercentage }
 * @returns {number} Effective percentage
 */
const resolveBudgetPercentage = (budgetAdjustment, budgetRule = {}) => {
  const defaultPct = budgetRule.defaultPercentage || 0;
  const minPct = budgetRule.minPercentage || 0;
  const maxPct = budgetRule.maxPercentage || defaultPct;

  if (!budgetAdjustment) return defaultPct;

  const adjustmentKey = BUDGET_ADJUSTMENT_MAP[budgetAdjustment.toLowerCase()];

  if (!adjustmentKey) return defaultPct;

  return budgetRule[adjustmentKey] || defaultPct;
};

/**
 * Calculate the allocated budget for a category in EGP.
 *
 * @param {number} totalBudget - Total room budget in EGP
 * @param {number} effectivePercentage - Resolved percentage (0–100)
 * @returns {number} Allocated category budget in EGP
 */
const calculateCategoryBudget = (totalBudget, effectivePercentage) => {
  if (!totalBudget || totalBudget <= 0 || !effectivePercentage || effectivePercentage <= 0) {
    return 0;
  }
  return Math.round(totalBudget * (effectivePercentage / 100));
};

/**
 * Calculate the per-unit target budget.
 *
 * @param {number} categoryBudget - Allocated category budget in EGP
 * @param {number} resolvedQuantity - Number of units
 * @returns {number} Per-unit target budget in EGP
 */
const calculateUnitTargetBudget = (categoryBudget, resolvedQuantity) => {
  if (!categoryBudget || categoryBudget <= 0 || !resolvedQuantity || resolvedQuantity <= 0) {
    return 0;
  }
  return Math.round(categoryBudget / resolvedQuantity);
};

/**
 * Apply the additionalItemBudgetBoost when quantity > 1.
 * Adds extra percentage points to the category's allocation.
 *
 * @param {number} basePercentage - Base effective percentage
 * @param {number} boost - Additional percentage points (e.g. 5)
 * @param {number} resolvedQuantity - Resolved quantity
 * @returns {number} Boosted percentage
 */
const applyBudgetBoost = (basePercentage, boost, resolvedQuantity) => {
  if (!boost || resolvedQuantity <= 1) return basePercentage;
  return basePercentage + boost;
};

// ─── Dimension Confidence ──────────────────────────────────

/**
 * Determine dimension data confidence based on processing.issues.
 *
 * Returns the WORST confidence level found among dimension-related issues.
 * Non-dimension issues (missing_materials, generic_brand, etc.) are ignored.
 *
 * @param {Array<string>} issues - Product processing issues
 * @returns {string} Confidence level: "HIGH", "MEDIUM", "LOW", or "NONE"
 */
const getDimensionConfidence = (issues) => {
  if (!Array.isArray(issues) || issues.length === 0) return 'HIGH';

  let worstLevel = 'HIGH';
  const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };

  for (const issue of issues) {
    const severity = DIMENSION_ISSUE_SEVERITY[issue];
    // Skip non-dimension issues (severity === 'NONE' or unknown)
    if (!severity || severity === 'NONE') continue;

    if (severityRank[severity] > severityRank[worstLevel]) {
      worstLevel = severity;
    }
  }

  return worstLevel;
};

/**
 * Get the confidence multiplier for a given confidence level.
 *
 * @param {string} confidenceLevel - "HIGH", "MEDIUM", "LOW", or "NONE"
 * @returns {number} Multiplier (0.0 to 1.0)
 */
const getConfidenceMultiplier = (confidenceLevel) => {
  return DIMENSION_CONFIDENCE_MULTIPLIERS[confidenceLevel] || DIMENSION_CONFIDENCE_MULTIPLIERS.NONE;
};

module.exports = {
  normalizeCategory,
  normalizeRoomType,
  calculateRoomArea,
  resolveQuantity,
  matchSizeRule,
  adjustDimensionsForQuantity,
  resolveBudgetPercentage,
  calculateCategoryBudget,
  calculateUnitTargetBudget,
  applyBudgetBoost,
  getDimensionConfidence,
  getConfidenceMultiplier,
};
