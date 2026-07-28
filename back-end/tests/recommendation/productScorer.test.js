/**
 * Unit Tests — Product Scorer
 */

const {
  scoreProduct,
  computeStyleScore,
  computeMaterialScore,
  computeColorScore,
  computePriceScore,
  computeSizeScore,
  dimensionFitScore,
} = require('../../src/services/recommendation/productScorer');

// ─── dimensionFitScore ──────────────────────────────────────

describe('dimensionFitScore', () => {
  test('within range → 1.0', () => {
    expect(dimensionFitScore(220, { min: 200, max: 250 })).toBe(1.0);
  });

  test('at min boundary → 1.0', () => {
    expect(dimensionFitScore(200, { min: 200, max: 250 })).toBe(1.0);
  });

  test('at max boundary → 1.0', () => {
    expect(dimensionFitScore(250, { min: 200, max: 250 })).toBe(1.0);
  });

  test('slightly below min → less than 1.0 but positive', () => {
    const score = dimensionFitScore(190, { min: 200, max: 250 });
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThan(0);
  });

  test('way outside range → approaches 0', () => {
    const score = dimensionFitScore(50, { min: 200, max: 250 });
    expect(score).toBeLessThan(0.1);
  });

  test('null values → 0.5', () => {
    expect(dimensionFitScore(null, { min: 200, max: 250 })).toBe(0.5);
    expect(dimensionFitScore(200, null)).toBe(0.5);
  });
});

// ─── computePriceScore ──────────────────────────────────────

describe('computePriceScore', () => {
  test('exact target price → close to 1.0', () => {
    const product = { pricing: { currentPrice: 10000 } };
    const score = computePriceScore(product, 10000);
    expect(score).toBeGreaterThan(0.95);
  });

  test('50% of target → lower score', () => {
    const product = { pricing: { currentPrice: 5000 } };
    const score = computePriceScore(product, 10000);
    expect(score).toBeLessThan(0.5);
  });

  test('1.35x target → still positive', () => {
    const product = { pricing: { currentPrice: 13500 } };
    const score = computePriceScore(product, 10000);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.7);
  });

  test('no price → 0.5', () => {
    const product = { pricing: {} };
    expect(computePriceScore(product, 10000)).toBe(0.5);
  });

  test('no target → 0.5', () => {
    const product = { pricing: { currentPrice: 5000 } };
    expect(computePriceScore(product, 0)).toBe(0.5);
  });
});

// ─── computeStyleScore ──────────────────────────────────────

describe('computeStyleScore', () => {
  test('exact style match → 1.0', () => {
    const product = { classification: { styles: ['Modern'] } };
    const score = computeStyleScore(product, { preferredStyle: 'Modern' }, {});
    expect(score).toBe(1.0);
  });

  test('case-insensitive match', () => {
    const product = { classification: { styles: ['modern'] } };
    const score = computeStyleScore(product, { preferredStyle: 'Modern' }, {});
    expect(score).toBe(1.0);
  });

  test('no style data → 0.3', () => {
    const product = { classification: { styles: [] } };
    const score = computeStyleScore(product, { preferredStyle: 'Modern' }, {});
    expect(score).toBe(0.3);
  });

  test('no preference → 0.5', () => {
    const product = { classification: { styles: ['Modern'] } };
    const score = computeStyleScore(product, {}, {});
    expect(score).toBe(0.5);
  });

  test('partial word match → intermediate score', () => {
    const product = { classification: { styles: ['Scandinavian'] } };
    const score = computeStyleScore(product, { preferredStyle: 'Modern Scandinavian' }, {});
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(1.0);
  });
});

// ─── computeMaterialScore ───────────────────────────────────

describe('computeMaterialScore', () => {
  test('exact match → 1.0', () => {
    const product = { classification: { materials: ['Fabric'] } };
    const score = computeMaterialScore(product, { preferredMaterial: 'Fabric' });
    expect(score).toBe(1.0);
  });

  test('no match → 0.2', () => {
    const product = { classification: { materials: ['Metal'] } };
    const score = computeMaterialScore(product, { preferredMaterial: 'Wood' });
    expect(score).toBe(0.2);
  });

  test('no preference → 0.5', () => {
    const product = { classification: { materials: ['Wood'] } };
    const score = computeMaterialScore(product, {});
    expect(score).toBe(0.5);
  });

  test('partial match (Oak Wood vs Wood)', () => {
    const product = { classification: { materials: ['Oak Wood'] } };
    const score = computeMaterialScore(product, { preferredMaterial: 'Wood' });
    expect(score).toBeGreaterThan(0.5);
  });
});

// ─── computeColorScore ──────────────────────────────────────

describe('computeColorScore', () => {
  test('exact color match → 1.0', () => {
    const product = { classification: { colors: ['Off-White'] } };
    const score = computeColorScore(product, { preferredColor: 'Off-White' }, {});
    expect(score).toBe(1.0);
  });

  test('matches room palette', () => {
    const product = { classification: { colors: ['Sage Green'] } };
    const score = computeColorScore(product, {}, { colorPalette: ['Sage Green', 'Off-White'] });
    expect(score).toBe(1.0);
  });

  test('no color data → 0.3', () => {
    const product = { classification: { colors: [] } };
    const score = computeColorScore(product, { preferredColor: 'Blue' }, {});
    expect(score).toBe(0.3);
  });
});

// ─── computeSizeScore ───────────────────────────────────────

describe('computeSizeScore', () => {
  test('within recommended range → high score', () => {
    const product = {
      dimensions: { width: 220, length: 95, height: 85 },
      processing: { issues: [] },
    };
    const recDims = { width: { min: 200, max: 250 }, depth: { min: 90, max: 110 } };
    const { score, confidence } = computeSizeScore(product, recDims);
    expect(score).toBe(1.0);
    expect(confidence).toBe('HIGH');
  });

  test('no recommended dimensions → neutral', () => {
    const product = { dimensions: { width: 220 }, processing: { issues: [] } };
    const { score } = computeSizeScore(product, null);
    expect(score).toBe(0.5);
  });

  test('dimension issues reduce confidence', () => {
    const product = {
      dimensions: { width: 220, length: 95 },
      processing: { issues: ['swapped_width_length'] },
    };
    const recDims = { width: { min: 200, max: 250 }, depth: { min: 90, max: 110 } };
    const { confidence } = computeSizeScore(product, recDims);
    expect(confidence).toBe('LOW');
  });
});

// ─── scoreProduct (integration) ─────────────────────────────

describe('scoreProduct', () => {
  test('produces a score between 0 and 100', () => {
    const product = {
      classification: { styles: ['Modern'], materials: ['Fabric'], colors: ['Off-White'] },
      pricing: { currentPrice: 17500 },
      dimensions: { width: 230, length: 95, height: 85 },
      processing: { issues: [] },
    };

    const { score, scoreBreakdown } = scoreProduct(product, {
      geminiPreference: { preferredStyle: 'Modern', preferredMaterial: 'Fabric', preferredColor: 'Off-White' },
      roomPreferences: { style: 'Modern Scandinavian', colorPalette: ['Off-White'] },
      unitTargetBudget: 18000,
      recommendedDimensions: { width: { min: 220, max: 280 }, depth: { min: 90, max: 110 } },
    });

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);

    // Verify breakdown structure
    expect(scoreBreakdown).toHaveProperty('style.raw');
    expect(scoreBreakdown).toHaveProperty('style.weighted');
    expect(scoreBreakdown).toHaveProperty('size.confidence');
  });

  test('high-scoring product has high individual signals', () => {
    const product = {
      classification: { styles: ['Modern'], materials: ['Fabric'], colors: ['Off-White'] },
      pricing: { currentPrice: 18000 },
      dimensions: { width: 240, length: 100, height: 85 },
      processing: { issues: [] },
    };

    const { score, scoreBreakdown } = scoreProduct(product, {
      geminiPreference: { preferredStyle: 'Modern', preferredMaterial: 'Fabric', preferredColor: 'Off-White' },
      roomPreferences: {},
      unitTargetBudget: 18000,
      recommendedDimensions: { width: { min: 220, max: 280 }, depth: { min: 90, max: 110 } },
    });

    expect(score).toBeGreaterThan(80);
    expect(scoreBreakdown.style.raw).toBeGreaterThan(0.8);
    expect(scoreBreakdown.material.raw).toBe(1.0);
    expect(scoreBreakdown.price.raw).toBeGreaterThan(0.9);
  });
});
