/**
 * Budget Optimizer
 *
 * Deterministic greedy optimizer that ensures the total recommendation
 * cost does not exceed the user's totalBudget.
 *
 * Strategy:
 * - Downgrade OPTIONAL_ADHOC categories first
 * - Then OPTIONAL → SECONDARY → CORE (last resort)
 * - Within each role: Premium → Balanced, Balanced → Cheaper
 * - If no valid combination exists: return closest feasible + notice
 */

const { ROLE_DOWNGRADE_ORDER } = require('../../config/recommendation.config');

/**
 * Optimize the total budget by downgrading recommendations if they exceed totalBudget.
 *
 * @param {Array} categoryResults - Array of per-category recommendation results
 * @param {number} totalBudget - User's total budget in EGP
 * @returns {{ optimized: Array, totalCost: number, notices: Array, wasOptimized: boolean }}
 */
const optimizeBudget = (categoryResults, totalBudget) => {
  if (!categoryResults?.length || !totalBudget || totalBudget <= 0) {
    return { optimized: [], totalCost: 0, notices: [], wasOptimized: false };
  }

  // Clone to avoid mutating input
  const results = categoryResults.map((r) => ({ ...r }));
  const notices = [];

  let totalCost = computeTotalCost(results);

  // If within budget, no optimization needed
  if (totalCost <= totalBudget) {
    return { optimized: results, totalCost, notices, wasOptimized: false };
  }

  // Greedy downgrade loop
  let optimized = false;
  for (const role of ROLE_DOWNGRADE_ORDER) {
    if (totalCost <= totalBudget) break;

    // Get categories of this role, sorted by priority descending (lowest priority first)
    const eligibleIndices = results
      .map((r, i) => ({ index: i, ...r }))
      .filter((r) => r.role === role && r.recommendedProduct)
      .sort((a, b) => b.priority - a.priority); // Lowest priority = highest number = downgrade first

    for (const item of eligibleIndices) {
      if (totalCost <= totalBudget) break;

      const idx = item.index;
      const current = results[idx];

      // Try downgrade: Premium → Balanced → Cheaper
      const downgraded = attemptDowngrade(current);
      if (downgraded) {
        const oldCost = (current.recommendedProduct?.unitPrice || 0) * (current.resolvedQuantity || 1);
        const newCost = downgraded.unitPrice * (current.resolvedQuantity || 1);
        const savings = oldCost - newCost;

        results[idx] = {
          ...current,
          recommendedProduct: downgraded,
        };

        totalCost -= savings;
        optimized = true;

        notices.push({
          type: 'BUDGET_DOWNGRADE',
          category: current.resolvedCategory || current.category,
          from: current.recommendedProduct?.tier,
          to: downgraded.tier,
          savings,
          message: `Downgraded '${current.resolvedCategory || current.category}' from ${current.recommendedProduct?.tier} to ${downgraded.tier} to fit budget (saved ${savings} EGP).`,
        });
      }
    }
  }

  // If still over budget after all downgrades
  if (totalCost > totalBudget) {
    notices.push({
      type: 'BUDGET_EXCEEDED',
      totalCost,
      totalBudget,
      overage: totalCost - totalBudget,
      message: `Total recommendation cost (${totalCost} EGP) exceeds budget (${totalBudget} EGP) by ${totalCost - totalBudget} EGP. This is the closest feasible configuration.`,
    });
  }

  return { optimized: results, totalCost, notices, wasOptimized: optimized };
};

/**
 * Attempt to downgrade a category's recommendation to a cheaper tier.
 *
 * @param {Object} categoryResult - Category result with tieredAlternatives
 * @returns {Object|null} The downgraded product, or null if no downgrade possible
 */
const attemptDowngrade = (categoryResult) => {
  const currentTier = categoryResult.recommendedProduct?.tier;
  const alternatives = categoryResult.tieredAlternatives || {};

  if (currentTier === 'PREMIUM') {
    // Try Balanced first, then Cheaper
    if (alternatives.balanced?.length > 0) return alternatives.balanced[0];
    if (alternatives.cheaper?.length > 0) return alternatives.cheaper[0];
  }

  if (currentTier === 'BALANCED') {
    // Try Cheaper
    if (alternatives.cheaper?.length > 0) return alternatives.cheaper[0];
  }

  return null; // Already at cheapest or no alternatives
};

/**
 * Compute total cost of all recommendations.
 *
 * @param {Array} categoryResults
 * @returns {number} Total cost in EGP
 */
const computeTotalCost = (categoryResults) => {
  return categoryResults.reduce((sum, r) => {
    if (!r.recommendedProduct) return sum;
    return sum + (r.recommendedProduct.unitPrice || 0) * (r.resolvedQuantity || 1);
  }, 0);
};

module.exports = {
  optimizeBudget,
  attemptDowngrade,
  computeTotalCost,
};
