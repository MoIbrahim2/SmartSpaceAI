/**
 * Recommendation Engine — Main Orchestrator
 *
 * Orchestrates the full recommendation pipeline:
 * 1. Load KB rules + budget templates
 * 2. Resolve categories
 * 3. Allocate budgets
 * 4. For each category: fetch candidates → score → classify tiers
 * 5. Global budget optimization
 * 6. Assemble final output with diagnostics
 */

const fs = require('fs');
const path = require('path');
const { normalizeRoomType, calculateRoomArea, matchSizeRule, adjustDimensionsForQuantity, normalizeCategory } = require('./helpers');
const { resolveAllCategories, resolveAdhocCategory, createAdhocCategoryConfig, createNotFoundNotice } = require('./categoryResolver');
const { allocateBudgets } = require('./budgetAllocator');
const { fetchCandidates } = require('./candidateGenerator');
const { scoreAndRankCandidates } = require('./productScorer');
const { classifyTiers, selectRecommendation, selectRecommendations } = require('./tierClassifier');
const { optimizeBudget } = require('./budgetOptimizer');
const { MAX_PER_TIER, MAX_CHEAPER_PER_TIER } = require('../../config/recommendation.config');
const Product = require('../../models/product.model');

/**
 * Generate furniture recommendations for a room.
 *
 * @param {Object} params
 * @param {string} params.roomType - e.g. "bedroom", "Living Room"
 * @param {number} params.totalBudget - Total budget in EGP
 * @param {number} params.length - Room length in cm
 * @param {number} params.width - Room width in cm
 * @param {number} params.height - Room height in cm
 * @param {Object} params.extractedPreferences - Gemini output (roomPreferences, categoryPreferences, negativePreferences)
 * @returns {Promise<Object>} Full recommendation result
 */
const generateRecommendations = async ({
  roomType,
  totalBudget,
  length,
  width,
  height,
  extractedPreferences,
}) => {
  const startTime = Date.now();
  const allNotices = [];
  const diagnostics = {
    roomType,
    totalBudget,
    roomArea: null,
    categoriesRequested: 0,
    categoriesResolved: 0,
    categoriesWithProducts: 0,
    totalCandidatesFetched: 0,
    processingTimeMs: 0,
  };

  // ─── Step 1: Load KB Data ─────────────────────────────────
  const normalizedRoomType = normalizeRoomType(roomType);

  const categoryRulesPath = path.join(
    process.cwd(), 'knowledge_base', 'category_rules', `${normalizedRoomType}.json`
  );
  const budgetTemplatePath = path.join(
    process.cwd(), 'knowledge_base', 'budget_templates.json'
  );

  let categoryRules;
  let budgetTemplates;

  try {
    categoryRules = JSON.parse(fs.readFileSync(categoryRulesPath, 'utf-8'));
  } catch {
    throw new Error(`Unsupported room type: ${roomType}. No category rules found.`);
  }

  let templateList = [];
  try {
    const rawBudgetTemplates = JSON.parse(fs.readFileSync(budgetTemplatePath, 'utf-8'));
    templateList = Array.isArray(rawBudgetTemplates)
      ? rawBudgetTemplates
      : (rawBudgetTemplates.templates || []);
  } catch {
    throw new Error('Budget templates not found.');
  }

  // Find the budget template for this room type
  const roomTemplate = templateList.find(
    (t) => normalizeRoomType(t.roomType) === normalizedRoomType
  );

  if (!roomTemplate) {
    throw new Error(`No budget template found for room type: ${roomType}`);
  }

  // ─── Step 2: Calculate Room Area ──────────────────────────
  const roomArea = calculateRoomArea(length, width);
  diagnostics.roomArea = roomArea;

  // ─── Step 3: Resolve Categories ───────────────────────────
  const { roomPreferences, categoryPreferences, negativePreferences } = extractedPreferences || {};

  const kbBudgetCategories = roomTemplate.categories || [];
  const kbRules = categoryRules.rules || [];

  diagnostics.categoriesRequested = (categoryPreferences || []).length;

  const {
    resolvedCategories,
    unresolvedCategories,
    notices: resolutionNotices,
  } = resolveAllCategories(categoryPreferences || [], kbBudgetCategories, kbRules, negativePreferences || {});

  allNotices.push(...resolutionNotices);

  // ─── Step 3b: Attempt Ad-hoc Resolution ───────────────────
  if (unresolvedCategories.length > 0) {
    // Fetch distinct canonical categories from DB
    const catalogCategories = await Product.distinct('classification.canonicalCategory');
    let nextPriority = kbRules.length + 1;

    for (const unresolved of unresolvedCategories) {
      const adhocResult = resolveAdhocCategory(unresolved.requestedCategory, catalogCategories);

      if (adhocResult) {
        const adhocConfig = createAdhocCategoryConfig(adhocResult.resolvedCategory, nextPriority++);
        resolvedCategories.push({
          requestedCategory: unresolved.requestedCategory,
          resolvedCategory: adhocResult.resolvedCategory,
          resolutionType: 'ADHOC',
          mappedFrom: unresolved.requestedCategory,
          notice: adhocResult.notice,
          geminiPreference: unresolved.geminiPreference,
          kbRule: {
            category: adhocResult.resolvedCategory,
            role: adhocConfig.role,
            priority: adhocConfig.priority,
            defaultIncluded: false,
            quantity: { default: 1, min: 1, max: 2, allowMultiple: true },
          },
          kbBudget: adhocConfig,
        });
        if (adhocResult.notice) allNotices.push(adhocResult.notice);
      } else {
        allNotices.push(createNotFoundNotice(unresolved.requestedCategory));
      }
    }
  }

  diagnostics.categoriesResolved = resolvedCategories.length;

  // ─── Step 4: Allocate Budgets ─────────────────────────────
  const allocatedCategories = allocateBudgets(totalBudget, resolvedCategories);

  // ─── Step 5: Per-Category Pipeline ────────────────────────
  const categoryResults = [];

  for (const cat of allocatedCategories) {
    const categoryResult = await processCategory(cat, {
      roomArea,
      roomPreferences: roomPreferences || {},
      negativePreferences: negativePreferences || {},
    });

    categoryResults.push(categoryResult);

    if (categoryResult.diagnostics) {
      diagnostics.totalCandidatesFetched += categoryResult.diagnostics.candidatesReturned || 0;
    }
    if (categoryResult.candidates?.length > 0) {
      diagnostics.categoriesWithProducts++;
    }
  }

  // ─── Step 6: Global Budget Optimization ───────────────────
  const {
    optimized,
    totalCost,
    notices: optimizerNotices,
    wasOptimized,
  } = optimizeBudget(categoryResults, totalBudget);

  allNotices.push(...optimizerNotices);

  // ─── Step 7: Assemble Output ──────────────────────────────
  diagnostics.processingTimeMs = Date.now() - startTime;

  return {
    roomType,
    totalBudget,
    totalCost,
    wasOptimized,
    roomPreferences: roomPreferences || {},
    categories: optimized.map(formatCategoryOutput),
    notices: allNotices,
    diagnostics,
  };
};

/**
 * Process a single category through the candidate → score → tier pipeline.
 *
 * @param {Object} category - Allocated category with budget info
 * @param {Object} context - { roomArea, roomPreferences, negativePreferences }
 * @returns {Object} Category result with recommendation and alternatives
 */
const processCategory = async (category, { roomArea, roomPreferences, negativePreferences }) => {
  const { resolvedCategory, unitTargetBudget, resolvedQuantity, kbRule } = category;
  const geminiPref = category.geminiPreference || {};

  // Match size rule for this room area
  const sizeRule = matchSizeRule(kbRule?.sizeRules || [], roomArea);
  let recommendedDimensions = sizeRule?.recommendedDimensions || null;

  // Adjust dimensions for multi-item categories
  if (recommendedDimensions && kbRule?.quantity?.sizeMode) {
    recommendedDimensions = adjustDimensionsForQuantity(
      recommendedDimensions,
      kbRule.quantity.sizeMode,
      resolvedQuantity
    );
  }

  // Fetch candidates from MongoDB
  const { candidates, diagnostics } = await fetchCandidates({
    resolvedCategory,
    unitTargetBudget,
    negativePreferences,
  });

  // If no candidates found, return empty result
  if (candidates.length === 0) {
    return {
      resolvedCategory,
      role: kbRule?.role || 'OPTIONAL',
      priority: kbRule?.priority || 99,
      resolvedQuantity,
      allocatedBudget: category.allocatedBudget,
      unitTargetBudget,
      recommendedProduct: null,
      tieredAlternatives: { cheaper: [], balanced: [], premium: [] },
      candidates,
      diagnostics,
      notice: {
        type: 'NO_CANDIDATES',
        category: resolvedCategory,
        message: `No products found for '${resolvedCategory}' within the budget range.`,
      },
    };
  }

  // Score and rank candidates
  const scoredCandidates = scoreAndRankCandidates(candidates, {
    geminiPreference: geminiPref,
    roomPreferences,
    unitTargetBudget,
    recommendedDimensions,
  });

  // Classify into tiers
  const tieredProducts = classifyTiers(scoredCandidates, unitTargetBudget, resolvedQuantity);

  // Select best recommendations matching resolvedQuantity
  const recommendedProduct = selectRecommendation(tieredProducts);
  const recommendedProducts = selectRecommendations(tieredProducts, resolvedQuantity);

  return {
    resolvedCategory,
    role: kbRule?.role || 'OPTIONAL',
    isUserRequested: category.isUserRequested ?? (kbRule?.role ? kbRule.role !== 'OPTIONAL' : false),
    priority: kbRule?.priority || 99,
    resolvedQuantity,
    allocatedBudget: category.allocatedBudget,
    unitTargetBudget,
    recommendedProduct,
    recommendedProducts,
    tieredAlternatives: tieredProducts,
    candidates,
    diagnostics,
    quantityWasAdjusted: category.quantityWasAdjusted || false,
    quantityAdjustmentReason: category.quantityAdjustmentReason || null,
  };
};

/**
 * Format a category result for the API output.
 * Strips internal fields, keeps only what the frontend needs.
 *
 * @param {Object} categoryResult
 * @returns {Object}
 */
const formatCategoryOutput = (categoryResult) => {
  const notices = [];
  if (categoryResult.notice) notices.push(categoryResult.notice);
  if (categoryResult.quantityWasAdjusted) {
    notices.push({
      type: 'QUANTITY_ADJUSTED',
      message: categoryResult.quantityAdjustmentReason,
    });
  }

  return {
    category: categoryResult.resolvedCategory,
    role: categoryResult.role,
    isUserRequested: categoryResult.isUserRequested ?? (categoryResult.role !== 'OPTIONAL'),
    priority: categoryResult.priority,
    quantity: categoryResult.resolvedQuantity,
    allocatedBudget: categoryResult.allocatedBudget,
    unitTargetBudget: categoryResult.unitTargetBudget,
    recommendation: categoryResult.recommendedProduct,
    recommendations: categoryResult.recommendedProducts || [categoryResult.recommendedProduct].filter(Boolean),
    alternatives: {
      cheaper: (categoryResult.tieredAlternatives?.cheaper || []).slice(0, MAX_CHEAPER_PER_TIER),
      balanced: (categoryResult.tieredAlternatives?.balanced || []).slice(0, MAX_PER_TIER),
      premium: (categoryResult.tieredAlternatives?.premium || []).slice(0, MAX_PER_TIER),
    },
    notices,
  };
};

module.exports = {
  generateRecommendations,
  processCategory,
};
