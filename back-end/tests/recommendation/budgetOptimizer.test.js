/**
 * Unit Tests — Budget Optimizer
 */

const {
  optimizeBudget,
  computeTotalCost,
  attemptDowngrade,
} = require('../../src/services/recommendation/budgetOptimizer');

const makeResult = (category, role, priority, unitPrice, tier, quantity = 1, alternatives = {}) => ({
  resolvedCategory: category,
  role,
  priority,
  resolvedQuantity: quantity,
  recommendedProduct: { unitPrice, tier },
  tieredAlternatives: alternatives,
});

describe('computeTotalCost', () => {
  test('sums unit prices × quantities', () => {
    const results = [
      makeResult('Sofa', 'CORE', 1, 18000, 'BALANCED'),
      makeResult('Table', 'CORE', 2, 5000, 'BALANCED'),
      makeResult('Nightstand', 'SECONDARY', 5, 3200, 'BALANCED', 2),
    ];
    expect(computeTotalCost(results)).toBe(18000 + 5000 + 6400);
  });

  test('skips categories with no recommendedProduct', () => {
    const results = [
      makeResult('Sofa', 'CORE', 1, 18000, 'BALANCED'),
      { resolvedCategory: 'Rug', role: 'OPTIONAL', recommendedProduct: null },
    ];
    expect(computeTotalCost(results)).toBe(18000);
  });
});

describe('attemptDowngrade', () => {
  test('Premium → Balanced when available', () => {
    const result = makeResult('Sofa', 'CORE', 1, 20000, 'PREMIUM', 1, {
      balanced: [{ unitPrice: 15000, tier: 'BALANCED' }],
      cheaper: [{ unitPrice: 10000, tier: 'CHEAPER' }],
    });
    const downgraded = attemptDowngrade(result);
    expect(downgraded.tier).toBe('BALANCED');
    expect(downgraded.unitPrice).toBe(15000);
  });

  test('Premium → Cheaper when no balanced', () => {
    const result = makeResult('Sofa', 'CORE', 1, 20000, 'PREMIUM', 1, {
      balanced: [],
      cheaper: [{ unitPrice: 10000, tier: 'CHEAPER' }],
    });
    const downgraded = attemptDowngrade(result);
    expect(downgraded.tier).toBe('CHEAPER');
  });

  test('Balanced → Cheaper', () => {
    const result = makeResult('Sofa', 'CORE', 1, 15000, 'BALANCED', 1, {
      cheaper: [{ unitPrice: 10000, tier: 'CHEAPER' }],
    });
    const downgraded = attemptDowngrade(result);
    expect(downgraded.tier).toBe('CHEAPER');
  });

  test('CHEAPER → null (already cheapest)', () => {
    const result = makeResult('Sofa', 'CORE', 1, 10000, 'CHEAPER', 1, {});
    expect(attemptDowngrade(result)).toBeNull();
  });
});

describe('optimizeBudget', () => {
  test('within budget → no optimization', () => {
    const results = [
      makeResult('Sofa', 'CORE', 1, 15000, 'BALANCED'),
      makeResult('Table', 'CORE', 2, 5000, 'BALANCED'),
    ];
    const { optimized, wasOptimized, totalCost } = optimizeBudget(results, 80000);
    expect(wasOptimized).toBe(false);
    expect(totalCost).toBe(20000);
  });

  test('over budget → downgrades OPTIONAL first', () => {
    const results = [
      makeResult('Sofa', 'CORE', 1, 25000, 'PREMIUM', 1, {
        balanced: [{ unitPrice: 18000, tier: 'BALANCED' }],
      }),
      makeResult('Rug', 'OPTIONAL', 8, 10000, 'PREMIUM', 1, {
        balanced: [{ unitPrice: 6000, tier: 'BALANCED' }],
        cheaper: [{ unitPrice: 3000, tier: 'CHEAPER' }],
      }),
    ];
    // Total = 35000, budget = 30000
    const { optimized, wasOptimized, notices } = optimizeBudget(results, 30000);
    expect(wasOptimized).toBe(true);

    // Rug (OPTIONAL) should be downgraded before Sofa (CORE)
    const rugResult = optimized.find((r) => r.resolvedCategory === 'Rug');
    expect(rugResult.recommendedProduct.tier).not.toBe('PREMIUM');
  });

  test('returns BUDGET_EXCEEDED notice when still over after all downgrades', () => {
    const results = [
      makeResult('Sofa', 'CORE', 1, 50000, 'BALANCED', 1, {}), // No alternatives
    ];
    const { notices } = optimizeBudget(results, 30000);
    const exceeded = notices.find((n) => n.type === 'BUDGET_EXCEEDED');
    expect(exceeded).toBeDefined();
    expect(exceeded.overage).toBe(20000);
  });

  test('empty input returns empty output', () => {
    const { optimized, totalCost, wasOptimized } = optimizeBudget([], 80000);
    expect(optimized).toEqual([]);
    expect(totalCost).toBe(0);
    expect(wasOptimized).toBe(false);
  });
});
