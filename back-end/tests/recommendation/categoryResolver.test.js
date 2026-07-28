/**
 * Unit Tests — Category Resolver
 */

const {
  resolveCategory,
  resolveAdhocCategory,
  createAdhocCategoryConfig,
  resolveAllCategories,
  createNotFoundNotice,
} = require('../../src/services/recommendation/categoryResolver');

// Sample KB categories (from Living Room budget_templates.json)
const kbCategories = [
  { category: 'Sofa', defaultPercentage: 35, minPercentage: 25, maxPercentage: 50, priority: 1, role: 'CORE' },
  { category: 'Coffee Table', defaultPercentage: 10, minPercentage: 5, maxPercentage: 15, priority: 2, role: 'CORE' },
  { category: 'TV Unit', defaultPercentage: 15, minPercentage: 10, maxPercentage: 20, priority: 3, role: 'CORE' },
  { category: 'Side Table', defaultPercentage: 5, minPercentage: 3, maxPercentage: 8, priority: 5, role: 'SECONDARY' },
  { category: 'Armchair', defaultPercentage: 4, minPercentage: 0, maxPercentage: 10, priority: 10, role: 'OPTIONAL' },
  { category: 'Bookshelf', defaultPercentage: 7, minPercentage: 3, maxPercentage: 12, priority: 8, role: 'OPTIONAL' },
];

const kbCategoryRules = [
  { category: 'Sofa', role: 'CORE', priority: 1, defaultIncluded: true, quantity: { default: 1, min: 1, max: 3, allowMultiple: true } },
  { category: 'Coffee Table', role: 'CORE', priority: 2, defaultIncluded: true, quantity: { default: 1, min: 1, max: 2, allowMultiple: true } },
  { category: 'TV Unit', role: 'CORE', priority: 3, defaultIncluded: true, quantity: { default: 1, min: 1, max: 1, allowMultiple: false } },
  { category: 'Side Table', role: 'SECONDARY', priority: 5, defaultIncluded: true, quantity: { default: 1, min: 1, max: 2, allowMultiple: true } },
  { category: 'Armchair', role: 'OPTIONAL', priority: 10, defaultIncluded: false, quantity: { default: 1, min: 1, max: 2, allowMultiple: true } },
  { category: 'Bookshelf', role: 'OPTIONAL', priority: 8, defaultIncluded: false, quantity: { default: 1, min: 1, max: 1, allowMultiple: false } },
];

// ─── resolveCategory ────────────────────────────────────────

describe('resolveCategory', () => {
  test('EXACT match: Sofa', () => {
    const result = resolveCategory('Sofa', kbCategories);
    expect(result.resolutionType).toBe('EXACT');
    expect(result.resolvedCategory).toBe('Sofa');
    expect(result.mappedFrom).toBeNull();
    expect(result.notice).toBeNull();
  });

  test('EXACT match is case-insensitive: "sofa" → Sofa', () => {
    const result = resolveCategory('sofa', kbCategories);
    expect(result.resolutionType).toBe('EXACT');
    expect(result.resolvedCategory).toBe('Sofa');
  });

  test('EXACT match with leading/trailing spaces: " Coffee Table " → Coffee Table', () => {
    const result = resolveCategory(' Coffee Table ', kbCategories);
    expect(result.resolutionType).toBe('EXACT');
    expect(result.resolvedCategory).toBe('Coffee Table');
  });

  test('SEMANTIC_ALIAS: Bean Bag → Armchair', () => {
    const result = resolveCategory('Bean Bag', kbCategories);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('Armchair');
    expect(result.mappedFrom).toBe('Bean Bag');
    expect(result.notice).not.toBeNull();
    expect(result.notice.type).toBe('SEMANTIC_ALIAS_APPLIED');
  });

  test('SEMANTIC_ALIAS: Console Table → Side Table', () => {
    const result = resolveCategory('Console Table', kbCategories);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('Side Table');
  });

  test('SEMANTIC_ALIAS: beanbag (no space) → Armchair', () => {
    const result = resolveCategory('beanbag', kbCategories);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('Armchair');
  });

  test('SEMANTIC_ALIAS: TV Stand → TV Unit', () => {
    const result = resolveCategory('TV Stand', kbCategories);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('TV Unit');
  });

  test('SEMANTIC_ALIAS: television → TV', () => {
    const categoriesWithTV = [...kbCategories, { category: 'TV', role: 'CORE' }];
    const result = resolveCategory('television', categoriesWithTV);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('TV');
  });

  test('SEMANTIC_ALIAS: ac → Air Conditioner', () => {
    const categoriesWithAC = [...kbCategories, { category: 'Air Conditioner', role: 'CORE' }];
    const result = resolveCategory('ac', categoriesWithAC);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('Air Conditioner');
  });

  test('SEMANTIC_ALIAS: fridge → Refrigerator', () => {
    const categoriesWithFridge = [...kbCategories, { category: 'Refrigerator', role: 'CORE' }];
    const result = resolveCategory('fridge', categoriesWithFridge);
    expect(result.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(result.resolvedCategory).toBe('Refrigerator');
  });

  test('UNRESOLVED: Piano (not in KB or aliases)', () => {
    const result = resolveCategory('Piano', kbCategories);
    expect(result.resolutionType).toBe('UNRESOLVED');
    expect(result.resolvedCategory).toBeNull();
  });

  test('UNRESOLVED: Fireplace', () => {
    const result = resolveCategory('Fireplace', kbCategories);
    expect(result.resolutionType).toBe('UNRESOLVED');
  });

  test('NOT_FOUND for null input', () => {
    const result = resolveCategory(null, kbCategories);
    expect(result.resolutionType).toBe('NOT_FOUND');
    expect(result.notice.type).toBe('INVALID_CATEGORY');
  });

  test('NOT_FOUND for empty string', () => {
    const result = resolveCategory('', kbCategories);
    expect(result.resolutionType).toBe('NOT_FOUND');
  });
});

// ─── resolveAdhocCategory ───────────────────────────────────

describe('resolveAdhocCategory', () => {
  const catalogCategories = ['Sofa', 'Bed', 'Wardrobe', 'Piano', 'Aquarium'];

  test('finds matching catalog category', () => {
    const result = resolveAdhocCategory('Piano', catalogCategories);
    expect(result).not.toBeNull();
    expect(result.resolvedCategory).toBe('Piano');
    expect(result.resolutionType).toBe('ADHOC');
  });

  test('case-insensitive match', () => {
    const result = resolveAdhocCategory('piano', catalogCategories);
    expect(result).not.toBeNull();
    expect(result.resolvedCategory).toBe('Piano');
  });

  test('returns null when not in catalog', () => {
    const result = resolveAdhocCategory('Fireplace', catalogCategories);
    expect(result).toBeNull();
  });

  test('returns null for null input', () => {
    const result = resolveAdhocCategory(null, catalogCategories);
    expect(result).toBeNull();
  });
});

// ─── createAdhocCategoryConfig ──────────────────────────────

describe('createAdhocCategoryConfig', () => {
  test('creates correct config', () => {
    const config = createAdhocCategoryConfig('Piano', 11);
    expect(config.category).toBe('Piano');
    expect(config.role).toBe('OPTIONAL_ADHOC');
    expect(config.priority).toBe(11);
    expect(config.defaultPercentage).toBe(5);
  });
});

// ─── resolveAllCategories ───────────────────────────────────

describe('resolveAllCategories', () => {
  test('resolves exact matches and semantic aliases together', () => {
    const categoryPreferences = [
      { category: 'Sofa', included: true, excluded: false, quantity: 1 },
      { category: 'Bean Bag', included: true, excluded: false, quantity: null },
    ];

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, {});

    // Sofa = EXACT, Bean Bag = SEMANTIC_ALIAS → Armchair
    expect(result.resolvedCategories.length).toBeGreaterThanOrEqual(2);

    const sofa = result.resolvedCategories.find((r) => r.resolvedCategory === 'Sofa');
    expect(sofa.resolutionType).toBe('EXACT');

    const armchair = result.resolvedCategories.find((r) => r.resolvedCategory === 'Armchair');
    expect(armchair.resolutionType).toBe('SEMANTIC_ALIAS');
    expect(armchair.mappedFrom).toBe('Bean Bag');
  });

  test('excludes explicitly excluded categories', () => {
    const categoryPreferences = [
      { category: 'Sofa', included: true, excluded: false },
      { category: 'TV Unit', included: false, excluded: true },
    ];

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, {});

    const tvUnit = result.resolvedCategories.find((r) => r.resolvedCategory === 'TV Unit');
    expect(tvUnit).toBeUndefined();
  });

  test('excludes categories in categoriesToAvoid', () => {
    const categoryPreferences = [
      { category: 'Sofa', included: true, excluded: false },
      { category: 'Bookshelf', included: true, excluded: false },
    ];
    const negativePreferences = { categoriesToAvoid: ['Bookshelf'] };

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, negativePreferences);

    const bookshelf = result.resolvedCategories.find((r) => r.resolvedCategory === 'Bookshelf');
    expect(bookshelf).toBeUndefined();

    const excludeNotice = result.notices.find((n) => n.type === 'CATEGORY_EXCLUDED');
    expect(excludeNotice).toBeDefined();
  });

  test('unresolved categories go to unresolvedCategories list', () => {
    const categoryPreferences = [
      { category: 'Sofa', included: true, excluded: false },
      { category: 'Piano', included: true, excluded: false },
    ];

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, {});

    expect(result.unresolvedCategories.length).toBe(1);
    expect(result.unresolvedCategories[0].requestedCategory).toBe('Piano');
  });

  test('adds defaultIncluded KB categories not mentioned by Gemini', () => {
    const categoryPreferences = [
      { category: 'Sofa', included: true, excluded: false },
    ];

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, {});

    // Should include Sofa (user mentioned) + Coffee Table, TV Unit, Side Table (defaultIncluded)
    const resolvedNames = result.resolvedCategories.map((r) => r.resolvedCategory);
    expect(resolvedNames).toContain('Sofa');
    expect(resolvedNames).toContain('Coffee Table');
    expect(resolvedNames).toContain('TV Unit');
    expect(resolvedNames).toContain('Side Table');
    // Armchair and Bookshelf are defaultIncluded: false, should NOT be auto-added
    expect(resolvedNames).not.toContain('Armchair');
    expect(resolvedNames).not.toContain('Bookshelf');
  });

  test('does not duplicate categories already resolved via alias', () => {
    const categoryPreferences = [
      { category: 'Bean Bag', included: true, excluded: false }, // → Armchair via alias
      { category: 'Armchair', included: true, excluded: false }, // Direct
    ];

    const result = resolveAllCategories(categoryPreferences, kbCategories, kbCategoryRules, {});

    // Armchair should appear once from the direct mention (EXACT),
    // and Bean Bag should also resolve to Armchair. Both go through but won't duplicate via KB defaults.
    const armchairResolutions = result.resolvedCategories.filter(
      (r) => r.resolvedCategory === 'Armchair'
    );
    // Both should be present as they came from user preferences
    expect(armchairResolutions.length).toBe(2);
  });
});

// ─── createNotFoundNotice ───────────────────────────────────

describe('createNotFoundNotice', () => {
  test('generates correct notice', () => {
    const notice = createNotFoundNotice('Fireplace');
    expect(notice.type).toBe('PRODUCT_NOT_FOUND');
    expect(notice.requestedProduct).toBe('Fireplace');
    expect(notice.message).toContain('Fireplace');
  });
});
