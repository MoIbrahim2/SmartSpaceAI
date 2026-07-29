/**
 * Shopify Scraper
 *
 * Scrapes products from Shopify-based stores using the predictive search
 * suggest.json API endpoint. Works for: Kabbani, Manzzeli, Ariika.
 *
 * The Shopify suggest API returns structured JSON with product data
 * including title, price, image, body (HTML description), tags, and type.
 */

const { getJsonHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapShopifyProduct } = require('../productMapper');

/**
 * Fetches products from a Shopify store's suggest API.
 *
 * @param {string} query - Search query
 * @param {string} siteKey - Key in SITE_CONFIGS (e.g., 'kabbani', 'ariika')
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeShopify = async (query, siteKey) => {
  const config = SITE_CONFIGS[siteKey];
  if (!config || !config.enabled) return [];

  const url = config.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      headers: getJsonHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper:${config.name}] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const data = await response.json();
    const products = data?.resources?.results?.products || [];

    if (products.length === 0) {
      return [];
    }

    // Map each product to the canonical schema
    const mapped = products
      .filter((p) => p.available !== false && parseFloat(p.price) > 0)
      .map((p) => mapShopifyProduct(p, config))
      .filter(Boolean);

    console.log(`[Scraper:${config.name}] Found ${mapped.length} products for "${query}"`);
    return mapped;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:${config.name}] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:${config.name}] Error: ${error.message}`);
    }
    return [];
  }
};

/**
 * Scrape from Kabbani Furniture (Shopify store).
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
const scrapeKabbani = (query) => scrapeShopify(query, 'kabbani');

/**
 * Scrape from Manzzeli (Shopify store).
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
const scrapeManzzeli = (query) => scrapeShopify(query, 'manzzeli');

/**
 * Scrape from Ariika (Shopify store).
 * @param {string} query
 * @returns {Promise<Object[]>}
 */
const scrapeAriika = (query) => scrapeShopify(query, 'ariika');

module.exports = {
  scrapeShopify,
  scrapeKabbani,
  scrapeManzzeli,
  scrapeAriika,
};
