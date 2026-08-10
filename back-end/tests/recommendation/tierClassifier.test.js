/**
 * Unit Tests — Tier Classifier
 */

const {
  classifyTiers,
  selectRecommendation,
} = require('../../src/services/recommendation/tierClassifier');

// Helper to create a mock scored product
const mockProduct = (price, score, name = 'Test Product') => ({
  _id: `${name}-${price}`,
  basic: { name },
  pricing: { currentPrice: price, currency: 'EGP', originalPrice: price, discountPercentage: 0 },
  classification: { styles: [], materials: [], colors: [] },
  dimensions: { width: 100, height: 50, length: 60 },
  images: [],
  source: {},
  processing: {},
  score,
  scoreBreakdown: {},
});

describe('classifyTiers', () => {
  const unitTarget = 10000;

  test('correctly classifies CHEAPER (< 0.45)', () => {
    const products = [mockProduct(4000, 80)];
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.cheaper.length).toBe(1);
    expect(tiers.balanced.length).toBe(0);
    expect(tiers.premium.length).toBe(0);
  });

  test('correctly classifies BALANCED (0.45–0.75)', () => {
    const products = [mockProduct(6000, 90)]; // ratio = 0.6
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.balanced.length).toBe(1);
  });

  test('correctly classifies PREMIUM (0.75–1.00)', () => {
    const products = [mockProduct(9000, 85)]; // ratio = 0.9
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.premium.length).toBe(1);
  });

  test('fallbacks to populating premium tier if all products exceed target ratio', () => {
    const products = [mockProduct(11000, 85)]; // ratio = 1.1, beyond target ratio
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.cheaper.length).toBe(0);
    expect(tiers.balanced.length).toBe(0);
    expect(tiers.premium.length).toBe(1);
  });

  test('limits balanced and premium tiers to 3 products', () => {
    const products = [
      mockProduct(6000, 95),
      mockProduct(6100, 90),
      mockProduct(6200, 85),
      mockProduct(6300, 80), // 4th balanced — should be cut
      mockProduct(6500, 75), // 5th balanced — should be cut
    ];
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.balanced.length).toBe(3);
    // Top 3 by score
    expect(tiers.balanced[0].score).toBe(95);
    expect(tiers.balanced[1].score).toBe(90);
    expect(tiers.balanced[2].score).toBe(85);
  });

  test('allows up to 15 products for cheaper tier', () => {
    const cheaperProducts = Array.from({ length: 20 }, (_, i) =>
      mockProduct(3000, 100 - i, `Cheap Product ${i + 1}`)
    );
    const tiers = classifyTiers(cheaperProducts, unitTarget);
    expect(tiers.cheaper.length).toBe(15);
    expect(tiers.cheaper[0].score).toBe(100);
    expect(tiers.cheaper[14].score).toBe(86);
  });

  test('adds quantity and totalPriceForQuantity', () => {
    const products = [mockProduct(1600, 80)];
    const tiers = classifyTiers(products, 3200, 2);
    const product = tiers.balanced[0];
    expect(product.quantity).toBe(2);
    expect(product.totalPriceForQuantity).toBe(3200);
  });

  test('boundary: ratio = 0.45 → BALANCED', () => {
    const products = [mockProduct(4500, 80)];
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.balanced.length).toBe(1);
  });

  test('boundary: ratio = 0.75 → BALANCED', () => {
    const products = [mockProduct(7500, 80)];
    const tiers = classifyTiers(products, unitTarget);
    expect(tiers.balanced.length).toBe(1);
  });

  test('empty products → empty tiers', () => {
    const tiers = classifyTiers([], unitTarget);
    expect(tiers.cheaper.length).toBe(0);
    expect(tiers.balanced.length).toBe(0);
    expect(tiers.premium.length).toBe(0);
  });
});

describe('selectRecommendation', () => {
  test('prefers BALANCED tier', () => {
    const tiers = {
      cheaper: [{ name: 'Cheap', score: 85, tier: 'CHEAPER' }],
      balanced: [{ name: 'Balanced', score: 90, tier: 'BALANCED' }],
      premium: [{ name: 'Premium', score: 80, tier: 'PREMIUM' }],
    };
    const rec = selectRecommendation(tiers);
    expect(rec.tier).toBe('BALANCED');
  });

  test('falls back to CHEAPER when BALANCED empty', () => {
    const tiers = {
      cheaper: [{ name: 'Cheap', score: 85, tier: 'CHEAPER' }],
      balanced: [],
      premium: [{ name: 'Premium', score: 80, tier: 'PREMIUM' }],
    };
    const rec = selectRecommendation(tiers);
    expect(rec.tier).toBe('CHEAPER');
  });

  test('falls back to PREMIUM when BALANCED and CHEAPER empty', () => {
    const tiers = {
      cheaper: [],
      balanced: [],
      premium: [{ name: 'Premium', score: 80, tier: 'PREMIUM' }],
    };
    const rec = selectRecommendation(tiers);
    expect(rec.tier).toBe('PREMIUM');
  });

  test('returns null when all tiers empty', () => {
    const tiers = { cheaper: [], balanced: [], premium: [] };
    expect(selectRecommendation(tiers)).toBeNull();
  });
});
