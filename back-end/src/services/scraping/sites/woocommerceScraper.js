/**
 * WooCommerce Scraper
 *
 * Scrapes products from WooCommerce-based stores using the
 * WC Store API (public, no auth required).
 * Works for: Smart Furniture (smartfurniture.com.eg)
 */

const { getJsonHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapWooCommerceProduct } = require('../productMapper');

/**
 * Fetches products from Smart Furniture's WooCommerce Store API.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeSmartFurniture = async (query) => {
  const config = SITE_CONFIGS.smartfurniture;
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

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    // Map each product to the canonical schema
    const mapped = products
      .filter((p) => p.is_in_stock !== false && p.is_purchasable !== false)
      .map((p) => mapWooCommerceProduct(p, config))
      .filter(Boolean)
      .filter((p) => p.pricing.currentPrice > 0);

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

module.exports = {
  scrapeSmartFurniture,
};
