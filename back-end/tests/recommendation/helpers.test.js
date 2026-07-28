/**
 * Unit Tests — Recommendation Engine Core Helpers
 */

const {
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
} = require('../../src/services/recommendation/helpers');

// ─── normalizeCategory ─────────────────────────────────────

describe('normalizeCategory', () => {
  test('lowercases and trims', () => {
    expect(normalizeCategory('  Coffee Table  ')).toBe('coffee table');
  });

  test('collapses multiple spaces', () => {
    expect(normalizeCategory('TV   Unit')).toBe('tv unit');
  });

  test('handles empty/null input', () => {
    expect(normalizeCategory('')).toBe('');
    expect(normalizeCategory(null)).toBe('');
    expect(normalizeCategory(undefined)).toBe('');
  });

  test('handles single word', () => {
    expect(normalizeCategory('Sofa')).toBe('sofa');
  });
});

// ─── normalizeRoomType ──────────────────────────────────────

describe('normalizeRoomType', () => {
  test('converts to snake_case', () => {
    expect(normalizeRoomType('Living Room')).toBe('living_room');
  });

  test('handles already normalized input', () => {
    expect(normalizeRoomType('bedroom')).toBe('bedroom');
  });

  test('handles multiple spaces', () => {
    expect(normalizeRoomType('Kids   Room')).toBe('kids_room');
  });

  test('trims whitespace', () => {
    expect(normalizeRoomType('  Dining Room  ')).toBe('dining_room');
  });

  test('handles empty/null input', () => {
    expect(normalizeRoomType('')).toBe('');
    expect(normalizeRoomType(null)).toBe('');
  });
});

// ─── calculateRoomArea ──────────────────────────────────────

describe('calculateRoomArea', () => {
  test('500cm × 400cm = 20 sqm', () => {
    expect(calculateRoomArea(500, 400)).toBe(20);
  });

  test('300cm × 300cm = 9 sqm', () => {
    expect(calculateRoomArea(300, 300)).toBe(9);
  });

  test('1000cm × 600cm = 60 sqm', () => {
    expect(calculateRoomArea(1000, 600)).toBe(60);
  });

  test('returns 0 for zero dimensions', () => {
    expect(calculateRoomArea(0, 400)).toBe(0);
    expect(calculateRoomArea(500, 0)).toBe(0);
  });

  test('returns 0 for negative dimensions', () => {
    expect(calculateRoomArea(-100, 400)).toBe(0);
  });

  test('returns 0 for null/undefined', () => {
    expect(calculateRoomArea(null, 400)).toBe(0);
    expect(calculateRoomArea(500, undefined)).toBe(0);
  });
});

// ─── resolveQuantity ────────────────────────────────────────

describe('resolveQuantity', () => {
  const nightstandRule = { default: 2, min: 1, max: 2, allowMultiple: true };
  const bedRule = { default: 1, min: 1, max: 1, allowMultiple: false };
  const sofaRule = { default: 1, min: 1, max: 3, allowMultiple: true };

  test('user requests 2 nightstands (allowed)', () => {
    const result = resolveQuantity(2, nightstandRule);
    expect(result.resolvedQuantity).toBe(2);
    expect(result.wasAdjusted).toBe(false);
    expect(result.adjustmentReason).toBeNull();
  });

  test('user does not specify → uses default', () => {
    const result = resolveQuantity(null, nightstandRule);
    expect(result.resolvedQuantity).toBe(2); // nightstand default is 2
    expect(result.wasAdjusted).toBe(false);
  });

  test('user requests 2 beds but allowMultiple=false → forced to 1', () => {
    const result = resolveQuantity(2, bedRule);
    expect(result.resolvedQuantity).toBe(1);
    expect(result.wasAdjusted).toBe(true);
    expect(result.adjustmentReason).toContain('not allowed');
  });

  test('user requests 5 sofas but max=3 → clamped to 3', () => {
    const result = resolveQuantity(5, sofaRule);
    expect(result.resolvedQuantity).toBe(3);
    expect(result.wasAdjusted).toBe(true);
    expect(result.adjustmentReason).toContain('adjusted from 5 to 3');
  });

  test('user requests 0 → uses default (invalid quantity)', () => {
    const result = resolveQuantity(0, sofaRule);
    expect(result.resolvedQuantity).toBe(1); // default
  });

  test('handles missing rule gracefully', () => {
    const result = resolveQuantity(null, {});
    expect(result.resolvedQuantity).toBe(1); // default fallback
  });

  test('handles undefined rule', () => {
    const result = resolveQuantity(null);
    expect(result.resolvedQuantity).toBe(1);
  });

  test('user requests 1 with allowMultiple=false → no adjustment', () => {
    const result = resolveQuantity(1, bedRule);
    expect(result.resolvedQuantity).toBe(1);
    expect(result.wasAdjusted).toBe(false);
  });

  test('user requests quantity below min → clamped up', () => {
    const ruleWithMin2 = { default: 2, min: 2, max: 4, allowMultiple: true };
    const result = resolveQuantity(1, ruleWithMin2);
    expect(result.resolvedQuantity).toBe(2);
    expect(result.wasAdjusted).toBe(true);
  });
});

// ─── matchSizeRule ──────────────────────────────────────────

describe('matchSizeRule', () => {
  const sizeRules = [
    { roomArea: { min: 8, max: 12 }, recommendedDimensions: { width: { min: 160, max: 200 } } },
    { roomArea: { min: 12, max: 18 }, recommendedDimensions: { width: { min: 180, max: 240 } } },
    { roomArea: { min: 18, max: 25 }, recommendedDimensions: { width: { min: 220, max: 280 } } },
    { roomArea: { min: 25, max: 40 }, recommendedDimensions: { width: { min: 260, max: 340 } } },
  ];

  test('20 sqm matches the 18-25 bracket', () => {
    const result = matchSizeRule(sizeRules, 20);
    expect(result.roomArea.min).toBe(18);
    expect(result.roomArea.max).toBe(25);
    expect(result.recommendedDimensions.width.min).toBe(220);
  });

  test('10 sqm matches the 8-12 bracket', () => {
    const result = matchSizeRule(sizeRules, 10);
    expect(result.roomArea.min).toBe(8);
  });

  test('area below smallest bracket → falls back to smallest', () => {
    const result = matchSizeRule(sizeRules, 5);
    expect(result.roomArea.min).toBe(8);
  });

  test('area above largest bracket → falls back to largest', () => {
    const result = matchSizeRule(sizeRules, 50);
    expect(result.roomArea.min).toBe(25);
  });

  test('exact boundary (18 sqm) matches first containing bracket (12-18)', () => {
    const result = matchSizeRule(sizeRules, 18);
    expect(result.roomArea.min).toBe(12);
    expect(result.roomArea.max).toBe(18);
  });

  test('returns null for empty rules', () => {
    expect(matchSizeRule([], 20)).toBeNull();
  });

  test('returns null for null rules', () => {
    expect(matchSizeRule(null, 20)).toBeNull();
  });

  test('returns null for invalid area', () => {
    expect(matchSizeRule(sizeRules, 0)).toBeNull();
    expect(matchSizeRule(sizeRules, -5)).toBeNull();
  });
});

// ─── adjustDimensionsForQuantity ────────────────────────────

describe('adjustDimensionsForQuantity', () => {
  const dims = {
    width: { min: 220, max: 280 },
    depth: { min: 90, max: 110 },
  };

  test('ADJUST_PER_ITEM with Q=2 reduces by 20%', () => {
    const result = adjustDimensionsForQuantity(dims, 'ADJUST_PER_ITEM', 2);
    expect(result.width.min).toBe(176); // 220 * 0.8
    expect(result.width.max).toBe(224); // 280 * 0.8
    expect(result.depth.min).toBe(72);  // 90 * 0.8
    expect(result.depth.max).toBe(88);  // 110 * 0.8
  });

  test('STANDARD sizeMode returns unchanged', () => {
    const result = adjustDimensionsForQuantity(dims, 'STANDARD', 2);
    expect(result).toEqual(dims);
  });

  test('ADJUST_PER_ITEM with Q=1 returns unchanged', () => {
    const result = adjustDimensionsForQuantity(dims, 'ADJUST_PER_ITEM', 1);
    expect(result).toEqual(dims);
  });

  test('null dimensions returns null', () => {
    expect(adjustDimensionsForQuantity(null, 'ADJUST_PER_ITEM', 2)).toBeNull();
  });

  test('preserves non-range properties like note', () => {
    const dimsWithNote = { ...dims, note: 'Queen' };
    const result = adjustDimensionsForQuantity(dimsWithNote, 'ADJUST_PER_ITEM', 2);
    expect(result.note).toBe('Queen');
  });
});

// ─── resolveBudgetPercentage ────────────────────────────────

describe('resolveBudgetPercentage', () => {
  const budgetRule = { defaultPercentage: 35, minPercentage: 25, maxPercentage: 50 };

  test('premium → maxPercentage', () => {
    expect(resolveBudgetPercentage('premium', budgetRule)).toBe(50);
  });

  test('budget-friendly → minPercentage', () => {
    expect(resolveBudgetPercentage('budget-friendly', budgetRule)).toBe(25);
  });

  test('mid-range → defaultPercentage', () => {
    expect(resolveBudgetPercentage('mid-range', budgetRule)).toBe(35);
  });

  test('null → defaultPercentage', () => {
    expect(resolveBudgetPercentage(null, budgetRule)).toBe(35);
  });

  test('unknown adjustment → defaultPercentage', () => {
    expect(resolveBudgetPercentage('luxury', budgetRule)).toBe(35);
  });

  test('case insensitive', () => {
    expect(resolveBudgetPercentage('Premium', budgetRule)).toBe(50);
    expect(resolveBudgetPercentage('BUDGET-FRIENDLY', budgetRule)).toBe(25);
  });

  test('missing budget rule defaults to 0', () => {
    expect(resolveBudgetPercentage(null, {})).toBe(0);
  });
});

// ─── calculateCategoryBudget ────────────────────────────────

describe('calculateCategoryBudget', () => {
  test('80,000 × 10% = 8,000', () => {
    expect(calculateCategoryBudget(80000, 10)).toBe(8000);
  });

  test('80,000 × 35% = 28,000', () => {
    expect(calculateCategoryBudget(80000, 35)).toBe(28000);
  });

  test('rounds to nearest integer', () => {
    expect(calculateCategoryBudget(80000, 7)).toBe(5600);
  });

  test('0 budget returns 0', () => {
    expect(calculateCategoryBudget(0, 10)).toBe(0);
  });

  test('negative budget returns 0', () => {
    expect(calculateCategoryBudget(-5000, 10)).toBe(0);
  });

  test('0 percentage returns 0', () => {
    expect(calculateCategoryBudget(80000, 0)).toBe(0);
  });
});

// ─── calculateUnitTargetBudget ──────────────────────────────

describe('calculateUnitTargetBudget', () => {
  test('6,400 / 2 = 3,200 (nightstand example)', () => {
    expect(calculateUnitTargetBudget(6400, 2)).toBe(3200);
  });

  test('28,000 / 1 = 28,000 (single item)', () => {
    expect(calculateUnitTargetBudget(28000, 1)).toBe(28000);
  });

  test('9,000 / 3 = 3,000', () => {
    expect(calculateUnitTargetBudget(9000, 3)).toBe(3000);
  });

  test('0 budget returns 0', () => {
    expect(calculateUnitTargetBudget(0, 2)).toBe(0);
  });

  test('0 quantity returns 0', () => {
    expect(calculateUnitTargetBudget(6400, 0)).toBe(0);
  });
});

// ─── applyBudgetBoost ──────────────────────────────────────

describe('applyBudgetBoost', () => {
  test('adds boost when Q > 1', () => {
    expect(applyBudgetBoost(35, 5, 2)).toBe(40);
  });

  test('no boost when Q = 1', () => {
    expect(applyBudgetBoost(35, 5, 1)).toBe(35);
  });

  test('no boost when boost is 0', () => {
    expect(applyBudgetBoost(35, 0, 2)).toBe(35);
  });

  test('no boost when boost is null', () => {
    expect(applyBudgetBoost(35, null, 2)).toBe(35);
  });

  test('handles fractional boost', () => {
    expect(applyBudgetBoost(10, 2.5, 3)).toBe(12.5);
  });
});

// ─── getDimensionConfidence ─────────────────────────────────

describe('getDimensionConfidence', () => {
  test('no issues → HIGH', () => {
    expect(getDimensionConfidence([])).toBe('HIGH');
  });

  test('only non-dimension issues → HIGH', () => {
    expect(getDimensionConfidence(['missing_materials', 'generic_brand'])).toBe('HIGH');
  });

  test('reparsed_from_title → MEDIUM', () => {
    expect(getDimensionConfidence(['reparsed_from_title'])).toBe('MEDIUM');
  });

  test('swapped_width_length → LOW', () => {
    expect(getDimensionConfidence(['swapped_width_length'])).toBe('LOW');
  });

  test('mixed: takes worst (MEDIUM + LOW → LOW)', () => {
    expect(getDimensionConfidence(['reparsed_from_title', 'ambiguous_dimensions'])).toBe('LOW');
  });

  test('non-dimension + dimension issue → correct severity', () => {
    expect(getDimensionConfidence(['missing_materials', 'package_dimensions_detected'])).toBe('LOW');
  });

  test('null/undefined → HIGH', () => {
    expect(getDimensionConfidence(null)).toBe('HIGH');
    expect(getDimensionConfidence(undefined)).toBe('HIGH');
  });

  test('unknown issue type → HIGH (ignored)', () => {
    expect(getDimensionConfidence(['some_unknown_issue'])).toBe('HIGH');
  });
});

// ─── getConfidenceMultiplier ────────────────────────────────

describe('getConfidenceMultiplier', () => {
  test('HIGH → 1.0', () => {
    expect(getConfidenceMultiplier('HIGH')).toBe(1.0);
  });

  test('MEDIUM → 0.5', () => {
    expect(getConfidenceMultiplier('MEDIUM')).toBe(0.5);
  });

  test('LOW → 0.25', () => {
    expect(getConfidenceMultiplier('LOW')).toBe(0.25);
  });

  test('NONE → 0.5', () => {
    expect(getConfidenceMultiplier('NONE')).toBe(0.5);
  });

  test('unknown → falls back to NONE multiplier', () => {
    expect(getConfidenceMultiplier('UNKNOWN')).toBe(0.5);
  });
});
