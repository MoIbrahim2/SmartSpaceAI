/**
 * Category Resolver
 *
 * Resolves Gemini-extracted category names to canonical KB categories.
 *
 * Resolution precedence:
 * 1. EXACT        — Gemini name matches a KB category exactly (case-insensitive)
 * 2. NORMALIZED   — After normalization, matches a KB category
 * 3. SEMANTIC_ALIAS — Matches a configured semantic alias
 * 4. ADHOC        — Found in the products database under a matching canonicalCategory
 * 5. NOT_FOUND    — No match; generate notice and skip
 */

const { SEMANTIC_ALIASES, CATEGORY_ROLES, ADHOC_CATEGORY_DEFAULT_PERCENTAGE } = require('../../config/recommendation.config');
const { normalizeCategory } = require('./helpers');

/**
 * Resolve a single Gemini category name against the KB categories.
 * Does NOT query the database — that is done separately for ADHOC resolution.
 *
 * @param {string} requestedCategory - Category name from Gemini
 * @param {Array<Object>} kbCategories - KB budget template categories [{ category, role, priority, ... }]
 * @returns {{ requestedCategory, resolvedCategory, resolutionType, mappedFrom, notice }}
 */
const resolveCategory = (requestedCategory, kbCategories = []) => {
  if (!requestedCategory || typeof requestedCategory !== 'string') {
    return {
      requestedCategory: requestedCategory || '',
      resolvedCategory: null,
      resolutionType: 'NOT_FOUND',
      mappedFrom: null,
      notice: { type: 'INVALID_CATEGORY', message: 'Empty or invalid category name.' },
    };
  }

  const normalizedRequested = normalizeCategory(requestedCategory);

  // Build a lookup map of normalized KB category names → original category objects
  const kbMap = new Map();
  for (const kbCat of kbCategories) {
    kbMap.set(normalizeCategory(kbCat.category), kbCat);
  }

  // 1. EXACT match (case-insensitive via normalization)
  if (kbMap.has(normalizedRequested)) {
    const matched = kbMap.get(normalizedRequested);
    return {
      requestedCategory,
      resolvedCategory: matched.category,
      resolutionType: 'EXACT',
      mappedFrom: null,
      notice: null,
    };
  }

  // 2. NORMALIZED match (already covered above since we normalize both sides)
  //    This step is effectively merged with EXACT. Kept as a conceptual step.

  // 3. SEMANTIC_ALIAS
  const aliasTarget = SEMANTIC_ALIASES[normalizedRequested];
  if (aliasTarget) {
    const normalizedAlias = normalizeCategory(aliasTarget);
    if (kbMap.has(normalizedAlias)) {
      const matched = kbMap.get(normalizedAlias);
      return {
        requestedCategory,
        resolvedCategory: matched.category,
        resolutionType: 'SEMANTIC_ALIAS',
        mappedFrom: requestedCategory,
        notice: {
          type: 'SEMANTIC_ALIAS_APPLIED',
          requestedProduct: requestedCategory,
          mappedCategory: matched.category,
          message: `Mapped '${requestedCategory}' to '${matched.category}' for your room.`,
        },
      };
    }
  }

  // 4. ADHOC and 5. NOT_FOUND are handled externally (require DB access)
  return {
    requestedCategory,
    resolvedCategory: null,
    resolutionType: 'UNRESOLVED',
    mappedFrom: null,
    notice: null,
  };
};

/**
 * Attempt ad-hoc resolution by checking if the product catalog
 * has products matching this category name.
 *
 * @param {string} requestedCategory - Category name from Gemini
 * @param {Array<string>} catalogCategories - Distinct canonicalCategory values from DB
 * @returns {{ resolvedCategory, resolutionType, notice } | null}
 */
const resolveAdhocCategory = (requestedCategory, catalogCategories = []) => {
  if (!requestedCategory) return null;

  const normalizedRequested = normalizeCategory(requestedCategory);

  // Check if any catalog category matches (case-insensitive)
  const match = catalogCategories.find(
    (cat) => normalizeCategory(cat) === normalizedRequested
  );

  if (match) {
    return {
      resolvedCategory: match,
      resolutionType: 'ADHOC',
      notice: {
        type: 'ADHOC_CATEGORY_CREATED',
        requestedProduct: requestedCategory,
        mappedCategory: match,
        message: `'${requestedCategory}' matched products in our catalog and was added as an optional category.`,
      },
    };
  }

  return null;
};

/**
 * Create an ad-hoc category entry for categories found in the catalog
 * but not in the KB.
 *
 * @param {string} category - Resolved canonical category name
 * @param {number} nextPriority - Next available priority number
 * @returns {Object} Ad-hoc category config
 */
const createAdhocCategoryConfig = (category, nextPriority) => {
  return {
    category,
    role: CATEGORY_ROLES.OPTIONAL_ADHOC,
    priority: nextPriority,
    defaultPercentage: ADHOC_CATEGORY_DEFAULT_PERCENTAGE,
    minPercentage: 0,
    maxPercentage: ADHOC_CATEGORY_DEFAULT_PERCENTAGE * 2,
  };
};

/**
 * Resolve all Gemini category preferences against KB categories.
 * Returns resolved categories, notices, and unresolved categories that
 * need ad-hoc DB lookup.
 *
 * @param {Array<Object>} categoryPreferences - Gemini categoryPreferences array
 * @param {Array<Object>} kbCategories - KB budget template categories
 * @param {Array<Object>} kbCategoryRules - KB category rules (for quantity, budget, sizeRules)
 * @param {Object} negativePreferences - Gemini negativePreferences
 * @returns {{ resolvedCategories: Array, unresolvedCategories: Array, notices: Array }}
 */
const resolveAllCategories = (categoryPreferences = [], kbCategories = [], kbCategoryRules = [], negativePreferences = {}) => {
  const resolvedCategories = [];
  const unresolvedCategories = [];
  const notices = [];

  // Categories explicitly avoided
  const categoriesToAvoid = (negativePreferences.categoriesToAvoid || [])
    .map((c) => normalizeCategory(c));

  // Track all categories explicitly excluded (user excluded OR categoriesToAvoid)
  const explicitlyExcluded = new Set([...categoriesToAvoid]);

  for (const pref of categoryPreferences) {
    // Skip explicitly excluded categories and track them
    if (pref.excluded === true || pref.included === false) {
      // Resolve what this category maps to, so we exclude the resolved name too
      const resolution = resolveCategory(pref.category, kbCategories);
      if (resolution.resolvedCategory) {
        explicitlyExcluded.add(normalizeCategory(resolution.resolvedCategory));
      }
      explicitlyExcluded.add(normalizeCategory(pref.category));
      notices.push({
        type: 'CATEGORY_EXCLUDED',
        requestedProduct: pref.category,
        message: `'${pref.category}' was excluded per your preferences.`,
      });
      continue;
    }

    // Skip categories in the avoidance list
    if (categoriesToAvoid.includes(normalizeCategory(pref.category))) {
      notices.push({
        type: 'CATEGORY_EXCLUDED',
        requestedProduct: pref.category,
        message: `'${pref.category}' was excluded per your preferences.`,
      });
      continue;
    }

    const resolution = resolveCategory(pref.category, kbCategories);

    if (resolution.resolutionType === 'EXACT' || resolution.resolutionType === 'SEMANTIC_ALIAS') {
      // Find the matching KB rule for additional metadata
      const rule = kbCategoryRules.find(
        (r) => normalizeCategory(r.category) === normalizeCategory(resolution.resolvedCategory)
      );

      resolvedCategories.push({
        ...resolution,
        geminiPreference: pref,
        kbRule: rule || null,
        kbBudget: kbCategories.find(
          (c) => normalizeCategory(c.category) === normalizeCategory(resolution.resolvedCategory)
        ) || null,
        isUserRequested: pref.included === true || (pref.quantity && pref.quantity > 0) || true,
      });

      if (resolution.notice) {
        notices.push(resolution.notice);
      }
    } else {
      // UNRESOLVED — needs ad-hoc DB lookup
      unresolvedCategories.push({
        ...resolution,
        geminiPreference: pref,
        isUserRequested: true,
      });
    }
  }

  // Also add KB default-included categories that Gemini didn't mention
  const resolvedCategoryNames = new Set(
    resolvedCategories.map((r) => normalizeCategory(r.resolvedCategory))
  );
  const unresolvedCategoryNames = new Set(
    unresolvedCategories.map((u) => normalizeCategory(u.requestedCategory))
  );

  for (const kbCat of kbCategories) {
    const normalizedKbName = normalizeCategory(kbCat.category);

    // Skip if already resolved or in unresolved queue
    if (resolvedCategoryNames.has(normalizedKbName) || unresolvedCategoryNames.has(normalizedKbName)) {
      continue;
    }

    // Skip if explicitly excluded (user excluded or in avoidance list)
    if (explicitlyExcluded.has(normalizedKbName)) continue;

    // Find matching rule
    const rule = kbCategoryRules.find(
      (r) => normalizeCategory(r.category) === normalizedKbName
    );

    // Only add if defaultIncluded is true in the rule
    if (rule && rule.defaultIncluded) {
      resolvedCategories.push({
        requestedCategory: kbCat.category,
        resolvedCategory: kbCat.category,
        resolutionType: 'KB_DEFAULT',
        mappedFrom: null,
        notice: null,
        geminiPreference: { category: kbCat.category, included: false },
        kbRule: hasUserRequestedCategories ? { ...rule, role: 'OPTIONAL' } : rule,
        kbBudget: kbCat,
        isUserRequested: false,
      });
    }
  }

  return { resolvedCategories, unresolvedCategories, notices };
};

/**
 * Generate a NOT_FOUND notice for a category that could not be resolved.
 *
 * @param {string} requestedCategory
 * @returns {Object} Notice object
 */
const createNotFoundNotice = (requestedCategory) => {
  return {
    type: 'PRODUCT_NOT_FOUND',
    requestedProduct: requestedCategory,
    message: `We could not find '${requestedCategory}' in our product catalog, but we provided suitable alternatives for your room.`,
  };
};

module.exports = {
  resolveCategory,
  resolveAdhocCategory,
  createAdhocCategoryConfig,
  resolveAllCategories,
  createNotFoundNotice,
};
