/**
 * Scraper Service — Main Orchestrator
 *
 * Coordinates concurrent scraping across all 10 furniture websites.
 * Uses node-cache for TTL-based caching to avoid hammering external sites.
 * Returns products normalized to the canonical Product schema.
 */

const NodeCache = require('node-cache');
const { getSearchTerms, SITE_CONFIGS } = require('./scraperConfig');
const { scrapeKabbani, scrapeManzzeli, scrapeAriika } = require('./sites/shopifyScraper');
const { scrapeSmartFurniture } = require('./sites/woocommerceScraper');
const { scrapeIkea } = require('./sites/ikeaScraper');
const { scrapeAmazon } = require('./sites/amazonScraper');
const { scrapeNoon } = require('./sites/noonScraper');
const { scrapeJumia } = require('./sites/jumiaScraper');
const { scrapeHomzmart, scrapeChichomz } = require('./sites/homzmartScraper');

const {
  SCRAPING_CACHE_TTL_SECONDS = 1800, // 30 minutes default
  MAX_SCRAPED_PER_SITE = 10,
} = require('../../config/recommendation.config');

// Initialize in-memory cache (stdTTL: 30 minutes, checkperiod: 2 minutes)
const scraperCache = new NodeCache({
  stdTTL: SCRAPING_CACHE_TTL_SECONDS,
  checkperiod: 120,
  useClones: false,
});

/**
 * List of all 10 site scraper functions with their keys.
 */
const ALL_SCRAPERS = [
  { key: 'kabbani', fn: scrapeKabbani },
  { key: 'manzzeli', fn: scrapeManzzeli },
  { key: 'ariika', fn: scrapeAriika },
  { key: 'smartfurniture', fn: scrapeSmartFurniture },
  { key: 'ikea', fn: scrapeIkea },
  { key: 'chichomz', fn: scrapeChichomz },
  { key: 'amazon', fn: scrapeAmazon },
  { key: 'noon', fn: scrapeNoon },
  { key: 'jumia', fn: scrapeJumia },
  { key: 'homzmart', fn: scrapeHomzmart },
];

/**
 * Scrapes real-time furniture products from all 10 sites for a given category.
 *
 * Implements concurrent execution via Promise.allSettled(), deduplication,
 * budget filtering, and in-memory TTL caching.
 *
 * @param {string} canonicalCategory - Resolved category (e.g. "Sofa", "L-Shape Sofa")
 * @param {number} [targetBudget=0] - Unit target budget in EGP
 * @param {Object} [options={}] - Options override
 * @param {boolean} [options.skipCache=false] - Force fresh scrape
 * @returns {Promise<{ products: Object[], diagnostics: Object }>}
 */
const scrapeForCategory = async (canonicalCategory, targetBudget = 0, options = {}) => {
  const startTime = Date.now();

  // Convert category to search query
  const searchTerms = getSearchTerms(canonicalCategory);
  const primaryQuery = searchTerms[0] || canonicalCategory;

  // Build cache key based on query and rounded budget tier
  const budgetTier = targetBudget > 0 ? Math.round(targetBudget / 5000) * 5000 : 0;
  const cacheKey = `scrape:${primaryQuery.toLowerCase()}:${budgetTier}`;

  // Check cache unless skipped
  if (!options.skipCache && scraperCache.has(cacheKey)) {
    const cachedData = scraperCache.get(cacheKey);
    console.log(`[ScraperService] Cache HIT for "${primaryQuery}" (${cachedData.products.length} products)`);
    return {
      products: cachedData.products,
      diagnostics: {
        ...cachedData.diagnostics,
        fromCache: true,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  console.log(`[ScraperService] Starting real-time scrape across 10 sites for category "${canonicalCategory}" (query: "${primaryQuery}")`);

  // Dispatch all scrapers concurrently
  const scraperPromises = ALL_SCRAPERS.map(async ({ key, fn }) => {
    const siteConfig = SITE_CONFIGS[key];
    if (!siteConfig || !siteConfig.enabled) {
      return { site: key, siteName: siteConfig?.name || key, products: [], status: 'disabled' };
    }

    try {
      const siteProducts = await fn(primaryQuery);
      return {
        site: key,
        siteName: siteConfig.name,
        products: siteProducts.slice(0, MAX_SCRAPED_PER_SITE),
        status: 'fulfilled',
      };
    } catch (error) {
      console.warn(`[ScraperService] Error in scraper '${key}':`, error.message);
      return {
        site: key,
        siteName: siteConfig?.name || key,
        products: [],
        status: 'rejected',
        error: error.message,
      };
    }
  });

  const results = await Promise.allSettled(scraperPromises);

  // Collect and aggregate products
  const allProducts = [];
  const siteDiagnostics = {};
  let successfulSites = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const { site, siteName, products, status, error } = result.value;
      siteDiagnostics[site] = {
        name: siteName,
        count: products.length,
        status: status || 'ok',
        error: error || null,
      };

      if (products.length > 0) {
        allProducts.push(...products);
        successfulSites++;
      }
    }
  }

  // Deduplicate products across sites by productUrl or (name + price)
  const uniqueMap = new Map();
  for (const product of allProducts) {
    const key = product.source.productUrl || `${product.basic.name}:${product.pricing.currentPrice}`;
    if (!uniqueMap.has(key)) {
      // Ensure classification matches the requested category
      product.classification.canonicalCategory = canonicalCategory;
      uniqueMap.set(key, product);
    }
  }

  const finalProducts = Array.from(uniqueMap.values());

  const diagnostics = {
    canonicalCategory,
    queryUsed: primaryQuery,
    totalScraped: allProducts.length,
    uniqueReturned: finalProducts.length,
    successfulSites,
    totalSites: ALL_SCRAPERS.length,
    siteBreakdown: siteDiagnostics,
    fromCache: false,
    processingTimeMs: Date.now() - startTime,
  };

  // Save to cache if we got results
  if (finalProducts.length > 0) {
    scraperCache.set(cacheKey, { products: finalProducts, diagnostics });
  }

  console.log(`[ScraperService] Completed scrape for "${canonicalCategory}": ${finalProducts.length} unique products collected from ${successfulSites}/${ALL_SCRAPERS.length} sites in ${diagnostics.processingTimeMs}ms`);

  return {
    products: finalProducts,
    diagnostics,
  };
};

/**
 * Clears the scraper cache completely.
 */
const clearCache = () => {
  scraperCache.flushAll();
  console.log('[ScraperService] Cache flushed.');
};

module.exports = {
  scrapeForCategory,
  clearCache,
  ALL_SCRAPERS,
};
