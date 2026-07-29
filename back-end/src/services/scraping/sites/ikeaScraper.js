/**
 * IKEA Egypt Scraper
 *
 * Scrapes products from IKEA Egypt using the SIK (Search In IKEA) API.
 * This is a public JSON API that returns structured product data.
 */

const { getJsonHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapIkeaProduct } = require('../productMapper');

/**
 * Fetches products from IKEA Egypt's search API.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeIkea = async (query) => {
  const config = SITE_CONFIGS.ikea;
  if (!config || !config.enabled) return [];

  const url = config.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      headers: {
        ...getJsonHeaders(),
        'Origin': 'https://www.ikea.com',
        'Referer': 'https://www.ikea.com/',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper:IKEA] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const data = await response.json();

    // Navigate to the product items in the response structure
    const items = data?.searchResultPage?.products?.main?.items || [];

    if (items.length === 0) {
      return [];
    }

    // Map each item to the canonical schema
    const mapped = items
      .map((item) => mapIkeaProduct(item))
      .filter(Boolean)
      .filter((p) => p.pricing.currentPrice > 0);

    console.log(`[Scraper:IKEA] Found ${mapped.length} products for "${query}"`);
    return mapped;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:IKEA] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:IKEA] Error: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeIkea,
};
