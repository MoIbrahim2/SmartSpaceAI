/**
 * Candidate Generator
 *
 * Builds and executes MongoDB queries to fetch product candidates
 * for a given category. Handles hard filters: status, category,
 * price ceiling, availability, and negative preferences.
 */

const Product = require('../../models/product.model');
const {
  ACCEPTED_STATUS,
  TIER_THRESHOLDS,
  MAX_CANDIDATES_FROM_DB,
  SCRAPING_ENABLED,
} = require('../../config/recommendation.config');
const { normalizeCategory } = require('./helpers');
const { scrapeForCategory } = require('../scraping/scraperService');
const { inferCategory } = require('../scraping/productMapper');

/**
 * Fetch candidate products for a given category from BOTH MongoDB and real-time website scrapers.
 *
 * Applies hard filters:
 * - processing.status = ACCEPTED (for DB) or SCRAPED (for live products)
 * - classification.canonicalCategory = resolved category
 * - pricing.currentPrice > 0 AND <= premiumCeiling (1.35 × unitTargetBudget)
 * - availability.inStock != false
 * - Excludes products whose materials/colors match negative preferences
 *
 * @param {Object} params
 * @param {string} params.resolvedCategory - Canonical category name
 * @param {number} params.unitTargetBudget - Per-unit target budget in EGP
 * @param {Object} params.negativePreferences - { materialsToAvoid, colorsToAvoid }
 * @param {boolean} [params.enableScraping=true] - Whether to include live scraped candidates
 * @returns {Promise<{ candidates: Array, diagnostics: Object }>}
 */
const fetchCandidates = async ({
  resolvedCategory,
  unitTargetBudget,
  negativePreferences = {},
  enableScraping = true,
}) => {
  const premiumCeiling = unitTargetBudget * TIER_THRESHOLDS.premiumMax;

  // Build the DB query (strictly requiring valid, non-Unsplash images)
  const query = {
    'processing.status': ACCEPTED_STATUS,
    'classification.canonicalCategory': resolvedCategory,
    'pricing.currentPrice': { $gt: 0 },
    'availability.inStock': { $ne: false },
    'images': { $exists: true, $not: { $size: 0 } },
    'images.url': { $not: /unsplash\.com/i },
  };

  // Apply price ceiling only if we have a valid budget
  if (unitTargetBudget > 0) {
    query['pricing.currentPrice'].$lte = premiumCeiling;
  }

  // Count total category matches before negative filters
  const totalCategoryMatches = await Product.countDocuments({
    'processing.status': ACCEPTED_STATUS,
    'classification.canonicalCategory': resolvedCategory,
  });

  // Apply negative preference exclusions to DB query
  const materialsToAvoid = negativePreferences.materialsToAvoid || [];
  const colorsToAvoid = negativePreferences.colorsToAvoid || [];

  if (materialsToAvoid.length > 0) {
    const materialRegexes = materialsToAvoid.map(
      (m) => new RegExp(`^${escapeRegex(m)}$`, 'i')
    );
    query['classification.materials'] = { $nin: materialRegexes };
  }

  if (colorsToAvoid.length > 0) {
    const colorRegexes = colorsToAvoid.map(
      (c) => new RegExp(`^${escapeRegex(c)}$`, 'i')
    );
    query['classification.colors'] = { $nin: colorRegexes };
  }

  // Execute DB query and real-time scrape CONCURRENTLY
  const dbPromise = Product.find(query)
    .select({
      'basic.name': 1,
      'basic.brand': 1,
      'classification.canonicalCategory': 1,
      'classification.styles': 1,
      'classification.materials': 1,
      'classification.colors': 1,
      'classification.roomTypes': 1,
      'pricing.currentPrice': 1,
      'pricing.originalPrice': 1,
      'pricing.currency': 1,
      'pricing.discountPercentage': 1,
      'dimensions.width': 1,
      'dimensions.height': 1,
      'dimensions.length': 1,
      'dimensions.dimensionUnit': 1,
      'images': 1,
      'availability.inStock': 1,
      'rating.average': 1,
      'rating.reviews': 1,
      'processing.issues': 1,
      'processing.qualityScore': 1,
      'source.productUrl': 1,
      'source.marketplace': 1,
      'externalId': 1,
      'sellerId': 1,
    })
    .sort({ 'pricing.currentPrice': 1 })
    .limit(MAX_CANDIDATES_FROM_DB)
    .lean();

  const shouldScrape = SCRAPING_ENABLED && enableScraping;
  const scrapePromise = shouldScrape
    ? scrapeForCategory(resolvedCategory, unitTargetBudget)
    : Promise.resolve({ products: [], diagnostics: { skipped: true } });

  // Await both sources simultaneously
  const [dbResult, scrapeResult] = await Promise.all([dbPromise, scrapePromise]);

  let dbCandidates = dbResult || [];
  const rawScrapedProducts = scrapeResult?.products || [];

  // Fallback: If strict budget ceiling returned 0 DB candidates, but catalog products exist for this category,
  // fetch the cheapest available DB candidates for this category.
  if (dbCandidates.length === 0 && totalCategoryMatches > 0) {
    const relaxedQuery = { ...query };
    delete relaxedQuery['pricing.currentPrice'].$lte;

    dbCandidates = await Product.find(relaxedQuery)
      .select({
        'basic.name': 1,
        'basic.brand': 1,
        'classification.canonicalCategory': 1,
        'classification.styles': 1,
        'classification.materials': 1,
        'classification.colors': 1,
        'classification.roomTypes': 1,
        'pricing.currentPrice': 1,
        'pricing.originalPrice': 1,
        'pricing.currency': 1,
        'pricing.discountPercentage': 1,
        'dimensions.width': 1,
        'dimensions.height': 1,
        'dimensions.length': 1,
        'dimensions.dimensionUnit': 1,
        'images': 1,
        'availability.inStock': 1,
        'rating.average': 1,
        'rating.reviews': 1,
        'processing.issues': 1,
        'processing.qualityScore': 1,
        'source.productUrl': 1,
        'source.marketplace': 1,
        'externalId': 1,
        'sellerId': 1,
      })
      .sort({ 'pricing.currentPrice': 1 })
      .limit(MAX_CANDIDATES_FROM_DB)
      .lean();
  }

  // Filter scraped products against negative preferences, budget ceiling, image validity, and category match
  const filteredScraped = rawScrapedProducts.filter((p) => {
    const price = p.pricing?.currentPrice || 0;
    if (price <= 0) return false;
    if (unitTargetBudget > 0 && price > premiumCeiling) return false;

    // Verify that the scraped product belongs to the requested category
    const normReqCat = normalizeCategory(resolvedCategory);
    const pCat = p.classification?.canonicalCategory || '';
    const normScrapedCat = normalizeCategory(pCat);

    if (normScrapedCat && normScrapedCat !== 'furniture' && normScrapedCat !== normReqCat) {
      return false;
    }

    const title = p.basic?.name || p.title || p.name || '';
    const inferredCat = inferCategory(title, pCat, []);
    const normInferredCat = normalizeCategory(inferredCat);
    if (normInferredCat && normInferredCat !== 'furniture' && normInferredCat !== normReqCat) {
      return false;
    }

    // Check image validity
    const imgs = p.images || [];
    const hasValidImage = imgs.some((img) => {
      const u = typeof img === 'string' ? img : img?.url || '';
      return u && typeof u === 'string' && u.trim() && !u.includes('unsplash.com');
    });
    const fallbackImage = p.primaryImage?.url || p.imageUrl || p.img || p.image;
    const hasAnyValid = hasValidImage || (fallbackImage && !fallbackImage.includes('unsplash.com'));
    if (!hasAnyValid) return false;

    // Check negative materials
    if (materialsToAvoid.length > 0) {
      const pMaterials = (p.classification?.materials || []).map((m) => m.toLowerCase());
      const hasAvoidedMaterial = materialsToAvoid.some((m) => pMaterials.includes(m.toLowerCase()));
      if (hasAvoidedMaterial) return false;
    }

    // Check negative colors
    if (colorsToAvoid.length > 0) {
      const pColors = (p.classification?.colors || []).map((c) => c.toLowerCase());
      const hasAvoidedColor = colorsToAvoid.some((c) => pColors.includes(c.toLowerCase()));
      if (hasAvoidedColor) return false;
    }

    return true;
  });

  // Merge DB and scraped candidates (scraped products get mapped IDs if needed)
  const mergedCandidates = [...dbCandidates, ...filteredScraped];

  const diagnostics = {
    category: resolvedCategory,
    databaseMatches: totalCategoryMatches,
    dbCandidatesReturned: dbCandidates.length,
    scrapedCandidatesReturned: filteredScraped.length,
    scrapedTotalCollected: rawScrapedProducts.length,
    premiumCeiling: Math.round(premiumCeiling),
    candidatesReturned: mergedCandidates.length,
    scrapingDiagnostics: scrapeResult?.diagnostics || null,
  };

  return { candidates: mergedCandidates, diagnostics };
};

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  fetchCandidates,
};
