/**
 * Recommendation Engine Configuration
 *
 * Centralized configuration for scoring weights, tier thresholds,
 * semantic aliases, dimension confidence, and budget rules.
 *
 * IMPORTANT: Do not scatter magic numbers throughout the codebase.
 * All tunable parameters live here.
 */

// ─── Scoring Weights ────────────────────────────────────────
// Must sum to 100
const SCORING_WEIGHTS = {
  style: 25,
  material: 20,
  color: 20,
  price: 20,
  size: 15,
};

// ─── Tier Thresholds ────────────────────────────────────────
// As ratios of price / unitTargetBudget
const TIER_THRESHOLDS = {
  cheaperMax: 0.45,       // price < 0.85 * unitTarget  → CHEAPER
  balancedMax: 0.75,      // 0.85 <= ratio <= 1.15      → BALANCED
  premiumMax: 1.00,       // 1.15 < ratio <= 1.35       → PREMIUM
};

// Maximum candidates per tier in final output
const MAX_PER_TIER = 3;
const MAX_CHEAPER_PER_TIER = 15;

// Tier fallback priority (first available wins)
const TIER_FALLBACK_ORDER = ['BALANCED', 'CHEAPER', 'PREMIUM'];

// ─── Semantic Aliases ───────────────────────────────────────
// Maps non-standard Gemini category names → canonical KB categories
// Keys MUST be lowercase for case-insensitive lookup
const SEMANTIC_ALIASES = {
  'bean bag': 'Armchair',
  'beanbag': 'Armchair',
  'console table': 'Side Table',
  'pouffe': 'Armchair',
  'ottoman': 'Armchair',
  'accent chair': 'Armchair',
  'end table': 'Side Table',
  'bedside table': 'Nightstand',
  'tv stand': 'TV Unit',
  'tv cabinet': 'TV Unit',
  'media console': 'TV Unit',
  'writing desk': 'Office Desk',
  'work desk': 'Office Desk',
  'display cabinet': 'Bookshelf',
  'bookcase': 'Bookshelf',
  'lounge chair': 'Armchair',
  'recliner': 'Armchair',
  'footstool': 'Armchair',
  'stool': 'Bar Stool',
  'area rug': 'Rug',
  'carpet': 'Rug',
  'pendant light': 'Chandelier',
  'ceiling light': 'Chandelier',
  'hanging light': 'Chandelier',
  // Electronics & Appliances Aliases
  'television': 'TV',
  'smart tv': 'TV',
  'flat screen': 'TV',
  'flatscreen': 'TV',
  'led tv': 'TV',
  'oled tv': 'TV',
  '4k tv': 'TV',
  'ac': 'Air Conditioner',
  'aircon': 'Air Conditioner',
  'air-conditioner': 'Air Conditioner',
  'ac unit': 'Air Conditioner',
  'split ac': 'Air Conditioner',
  'fridge': 'Refrigerator',
  'refrigerator': 'Refrigerator',
  'freezer': 'Refrigerator',
  'fridge freezer': 'Refrigerator',
  'stove': 'Oven / Cooktop',
  'cooktop': 'Oven / Cooktop',
  'oven': 'Oven / Cooktop',
  'range': 'Oven / Cooktop',
  'hob': 'Oven / Cooktop',
  'range hood': 'Range Hood',
  'exhaust hood': 'Range Hood',
  'kitchen hood': 'Range Hood',
  'extractor hood': 'Range Hood',
  'micro wave': 'Microwave',
  'dish washer': 'Washing Machine', // dish washer vs dishwasher
  'dishwasher': 'Dishwasher',
  'washing machine': 'Washing Machine',
  'washer': 'Washing Machine',
  'laundry machine': 'Washing Machine',
  'water heater': 'Water Heater',
  'boiler': 'Water Heater',
  'geyser': 'Water Heater',
  'monitor': 'Computer Monitor',
  'pc monitor': 'Computer Monitor',
  'display monitor': 'Computer Monitor',
  'computer screen': 'Computer Monitor',
  'screen': 'Computer Monitor',
  'printer': 'Printer',
  'copier': 'Printer',
  'scanner': 'Printer',
  'outdoor heater': 'Outdoor Fan / Heater',
  'outdoor fan': 'Outdoor Fan / Heater',
  'patio heater': 'Outdoor Fan / Heater',
};

// ─── Dimension Confidence ───────────────────────────────────
// Maps processing.issues values to confidence severity levels.
// Only DIMENSION-related issues affect dimension confidence.
// Non-dimension issues (missing_materials, generic_brand, etc.) are ignored.
const DIMENSION_ISSUE_SEVERITY = {
  // Issues that degrade dimension confidence
  'swapped_width_length': 'LOW',
  'package_dimensions_detected': 'LOW',
  'ambiguous_dimensions': 'LOW',
  'height_out_of_bounds': 'LOW',
  'incomplete_dimensions': 'LOW',
  'swapped_width_depth': 'LOW',

  // MEDIUM confidence issues
  'reparsed_from_title': 'MEDIUM',
  'dimensions_imputed_realistic': 'MEDIUM',

  // Issues unrelated to dimensions (do not affect dimension confidence)
  'missing_materials': 'NONE',
  'generic_brand': 'NONE',
  'short_or_missing_description': 'NONE',
};

// Multiplier applied to the raw sizeScore based on dimension confidence
const DIMENSION_CONFIDENCE_MULTIPLIERS = {
  HIGH: 1.0,     // No dimension issues → full weight
  MEDIUM: 0.5,   // Minor dimension issues → reduced weight
  LOW: 0.25,     // Serious dimension issues → heavily reduced weight
  NONE: 0.5,     // Missing dimensions entirely → neutral (not penalized)
};

// ─── Budget Configuration ───────────────────────────────────
// Default percentage for ad-hoc categories not in KB
const ADHOC_CATEGORY_DEFAULT_PERCENTAGE = 5;

// Budget adjustment mapping:
// "premium"         → use maxPercentage from KB rule
// "budget-friendly" → use minPercentage from KB rule
// "mid-range"/null  → use defaultPercentage from KB rule
const BUDGET_ADJUSTMENT_MAP = {
  'premium': 'maxPercentage',
  'high': 'maxPercentage',
  'budget-friendly': 'minPercentage',
  'low': 'minPercentage',
  'mid-range': 'defaultPercentage',
  'medium': 'defaultPercentage',
};

// ─── Size Mode Dimension Reduction ──────────────────────────
// When sizeMode === "ADJUST_PER_ITEM" and quantity > 1,
// reduce each item's target dimensions by this factor
const ADJUST_PER_ITEM_REDUCTION = 0.20; // 20% reduction

// ─── Candidate Generation ───────────────────────────────────
// Maximum candidates to bring into memory for scoring
const MAX_CANDIDATES_FROM_DB = 200;

// Top N scored candidates to send into tier classification
const TOP_SCORED_FOR_TIERING = 50;

// ─── Processing Status Filter ───────────────────────────────
const ACCEPTED_STATUS = 'ACCEPTED';

// ─── Category Roles ─────────────────────────────────────────
const CATEGORY_ROLES = {
  CORE: 'CORE',
  SECONDARY: 'SECONDARY',
  OPTIONAL: 'OPTIONAL',
  OPTIONAL_ADHOC: 'OPTIONAL_ADHOC',
};

// Role priority for budget optimization (downgrade in this order)
const ROLE_DOWNGRADE_ORDER = ['OPTIONAL_ADHOC', 'OPTIONAL', 'SECONDARY', 'CORE'];

// ─── Real-Time Scraping Configuration ──────────────────────
const SCRAPING_ENABLED = true;
const SCRAPING_TIMEOUT_MS = 10000;
const SCRAPING_CACHE_TTL_SECONDS = 1800; // 30 minutes
const MAX_SCRAPED_PER_SITE = 10;
const USD_TO_EGP_RATE = 50; // Exchange rate for Amazon US listings

module.exports = {
  SCORING_WEIGHTS,
  TIER_THRESHOLDS,
  MAX_PER_TIER,
  MAX_CHEAPER_PER_TIER,
  TIER_FALLBACK_ORDER,
  SEMANTIC_ALIASES,
  DIMENSION_ISSUE_SEVERITY,
  DIMENSION_CONFIDENCE_MULTIPLIERS,
  ADHOC_CATEGORY_DEFAULT_PERCENTAGE,
  BUDGET_ADJUSTMENT_MAP,
  ADJUST_PER_ITEM_REDUCTION,
  MAX_CANDIDATES_FROM_DB,
  TOP_SCORED_FOR_TIERING,
  ACCEPTED_STATUS,
  CATEGORY_ROLES,
  ROLE_DOWNGRADE_ORDER,
  SCRAPING_ENABLED,
  SCRAPING_TIMEOUT_MS,
  SCRAPING_CACHE_TTL_SECONDS,
  MAX_SCRAPED_PER_SITE,
  USD_TO_EGP_RATE,
};
