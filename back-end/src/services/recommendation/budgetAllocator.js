/**
 * Budget Allocator
 *
 * Allocates budget per category using KB percentages, Gemini
 * budgetAdjustment signals, and additionalItemBudgetBoost.
 * Enforces CORE category guardrails and normalizes if total exceeds 100%.
 */

const {
  resolveBudgetPercentage,
  calculateCategoryBudget,
  calculateUnitTargetBudget,
  applyBudgetBoost,
  resolveQuantity,
} = require('./helpers');

/**
 * Allocate budget across all resolved categories.
 *
 * @param {number} totalBudget - Total room budget in EGP
 * @param {Array} resolvedCategories - From categoryResolver.resolveAllCategories()
 * @returns {Array} Categories with allocatedBudget, unitTargetBudget, resolvedQuantity
 */
const allocateBudgets = (totalBudget, resolvedCategories) => {
  if (!totalBudget || totalBudget <= 0 || !resolvedCategories?.length) {
    return [];
  }

  // Step 1: Calculate raw percentages for each category
  const rawAllocations = resolvedCategories.map((cat) => {
    const budgetRule = cat.kbBudget || {};
    const quantityRule = cat.kbRule?.quantity || {};
    const geminiPref = cat.geminiPreference || {};

    // Resolve quantity
    const userQuantity = geminiPref.quantity !== undefined ? geminiPref.quantity : null;
    const quantityResult = resolveQuantity(userQuantity, quantityRule);

    // Resolve budget percentage
    let effectivePct = resolveBudgetPercentage(
      geminiPref.budgetAdjustment || null,
      geminiPref.importance || null,
      budgetRule
    );

    // Apply additionalItemBudgetBoost when Q > 1
    const boost = quantityRule.additionalItemBudgetBoost || 0;
    effectivePct = applyBudgetBoost(effectivePct, boost, quantityResult.resolvedQuantity);

    return {
      ...cat,
      effectivePercentage: effectivePct,
      resolvedQuantity: quantityResult.resolvedQuantity,
      quantityWasAdjusted: quantityResult.wasAdjusted,
      quantityAdjustmentReason: quantityResult.adjustmentReason,
    };
  });

  // Step 2: Enforce CORE guardrails (never below minPercentage)
  for (const alloc of rawAllocations) {
    const budgetRule = alloc.kbBudget || {};
    if (alloc.kbRule?.role === 'CORE' && budgetRule.minPercentage) {
      alloc.effectivePercentage = Math.max(alloc.effectivePercentage, budgetRule.minPercentage);
    }
  }

  // Step 3: Normalize if total exceeds 100%
  let totalPercentage = rawAllocations.reduce((sum, a) => sum + a.effectivePercentage, 0);

  if (totalPercentage > 100) {
    // Separate allocations by whether they were explicitly user-requested or KB optional defaults
    const unrequestedAllocations = rawAllocations.filter((a) => a.isUserRequested === false);
    if (unrequestedAllocations.length > 0) {
      const userReqTotal = rawAllocations
        .filter((a) => a.isUserRequested !== false)
        .reduce((sum, a) => sum + a.effectivePercentage, 0);

      if (userReqTotal <= 100) {
        const remainingForUnrequested = 100 - userReqTotal;
        const unreqTotal = unrequestedAllocations.reduce((sum, a) => sum + a.effectivePercentage, 0);
        if (unreqTotal > 0) {
          const unreqScale = remainingForUnrequested / unreqTotal;
          for (const alloc of unrequestedAllocations) {
            alloc.effectivePercentage = alloc.effectivePercentage * unreqScale;
          }
        }
      }
    }

    // Re-check total percentage and scale proportionally if still > 100
    totalPercentage = rawAllocations.reduce((sum, a) => sum + a.effectivePercentage, 0);
    if (totalPercentage > 100) {
      const scale = 100 / totalPercentage;
      for (const alloc of rawAllocations) {
        alloc.effectivePercentage = alloc.effectivePercentage * scale;
      }
    }
  }

  // Step 4: Calculate absolute budgets
  return rawAllocations.map((alloc) => {
    const allocatedBudget = calculateCategoryBudget(totalBudget, alloc.effectivePercentage);
    const unitTargetBudget = calculateUnitTargetBudget(allocatedBudget, alloc.resolvedQuantity);

    return {
      ...alloc,
      allocatedBudget,
      unitTargetBudget,
    };
  });
};

module.exports = {
  allocateBudgets,
};
