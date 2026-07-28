/**
 * Unit Tests — Budget Allocator
 */

const {
  allocateBudgets,
} = require('../../src/services/recommendation/budgetAllocator');

// Helper to create a resolved category
const makeCategory = (category, defaultPct, minPct, maxPct, role = 'CORE', defaultQty = 1, boost = 0, budgetAdj = null, userQty = null) => ({
  resolvedCategory: category,
  resolutionType: 'EXACT',
  geminiPreference: {
    category,
    budgetAdjustment: budgetAdj,
    quantity: userQty,
  },
  kbRule: {
    category,
    role,
    priority: 1,
    defaultIncluded: true,
    quantity: {
      default: defaultQty,
      min: 1,
      max: 4,
      allowMultiple: true,
      additionalItemBudgetBoost: boost,
    },
  },
  kbBudget: {
    category,
    defaultPercentage: defaultPct,
    minPercentage: minPct,
    maxPercentage: maxPct,
    role,
  },
});

describe('allocateBudgets', () => {
  test('basic allocation: Sofa 35% of 80,000 = 28,000', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50)];
    const result = allocateBudgets(80000, categories);

    expect(result.length).toBe(1);
    expect(result[0].allocatedBudget).toBe(28000);
    expect(result[0].unitTargetBudget).toBe(28000);
    expect(result[0].resolvedQuantity).toBe(1);
  });

  test('multi-item: Nightstand 8% of 80,000 = 6,400 / 2 = 3,200 per unit', () => {
    const categories = [makeCategory('Nightstand', 8, 5, 12, 'SECONDARY', 2)];
    const result = allocateBudgets(80000, categories);

    expect(result[0].allocatedBudget).toBe(6400);
    expect(result[0].unitTargetBudget).toBe(3200);
    expect(result[0].resolvedQuantity).toBe(2);
  });

  test('user quantity overrides default', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50, 'CORE', 1, 5, null, 2)];
    const result = allocateBudgets(80000, categories);

    expect(result[0].resolvedQuantity).toBe(2);
    // With boost: 35% + 5% = 40%
    expect(result[0].effectivePercentage).toBe(40);
    expect(result[0].allocatedBudget).toBe(32000);
    expect(result[0].unitTargetBudget).toBe(16000);
  });

  test('additionalItemBudgetBoost applies when Q > 1', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50, 'CORE', 1, 5, null, 2)];
    const result = allocateBudgets(80000, categories);
    // 35 + 5 = 40%
    expect(result[0].effectivePercentage).toBe(40);
  });

  test('budget-friendly adjustment uses minPercentage', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50, 'CORE', 1, 0, 'budget-friendly')];
    const result = allocateBudgets(80000, categories);
    expect(result[0].effectivePercentage).toBe(25);
    expect(result[0].allocatedBudget).toBe(20000);
  });

  test('premium adjustment uses maxPercentage', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50, 'CORE', 1, 0, 'premium')];
    const result = allocateBudgets(80000, categories);
    expect(result[0].effectivePercentage).toBe(50);
    expect(result[0].allocatedBudget).toBe(40000);
  });

  test('CORE guardrail: never below minPercentage', () => {
    // If budget-friendly puts it below min and it's CORE, raise to min
    const categories = [makeCategory('Sofa', 10, 25, 50, 'CORE', 1, 0, 'budget-friendly')];
    const result = allocateBudgets(80000, categories);
    // budget-friendly → minPercentage = 25, CORE guardrail ensures >= 25
    expect(result[0].effectivePercentage).toBe(25);
  });

  test('normalization when total exceeds 100%', () => {
    const categories = [
      makeCategory('Sofa', 50, 25, 60, 'CORE', 1, 0, 'premium'),    // 60%
      makeCategory('Table', 30, 15, 40, 'CORE', 1, 0, 'premium'),    // 40%
      makeCategory('Rug', 20, 10, 30, 'SECONDARY', 1, 0, 'premium'), // 30%
    ];
    // Total raw: 60 + 40 + 30 = 130%, should normalize

    const result = allocateBudgets(80000, categories);
    const totalPct = result.reduce((sum, r) => sum + r.effectivePercentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  test('returns empty for 0 budget', () => {
    const categories = [makeCategory('Sofa', 35, 25, 50)];
    const result = allocateBudgets(0, categories);
    expect(result).toEqual([]);
  });

  test('returns empty for empty categories', () => {
    const result = allocateBudgets(80000, []);
    expect(result).toEqual([]);
  });
});
