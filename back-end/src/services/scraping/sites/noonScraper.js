/**
 * Noon Egypt Scraper
 *
 * Scrapes furniture products from Noon Egypt search results using HTML parsing with Cheerio.
 */

const cheerio = require('cheerio');
const { getRequestHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapHtmlScrapedProduct } = require('../productMapper');

/**
 * Scrapes products from Noon Egypt search results.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeNoon = async (query) => {
  const config = SITE_CONFIGS.noon;
  if (!config || !config.enabled) return [];

  const url = config.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      headers: {
        ...getRequestHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper:Noon] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    // Search product links/cards in Noon's HTML structure
    $('a[href*="/p/"]').each((_, el) => {
      const $el = $(el);

      const relativeUrl = $el.attr('href');
      if (!relativeUrl) return;
      const productUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://www.noon.com${relativeUrl}`;

      const title = $el.find('[data-qa="product-name"], [class*="productTitle"], [class*="name"]').text().trim() || $el.attr('title');

      const priceText = $el.find('[data-qa="product-price"], [class*="amount"], [class*="price"]').first().text().replace(/[^\d.]/g, '');
      const priceVal = priceText ? parseFloat(priceText) : 0;

      const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');

      if (title && priceVal > 0 && productUrl) {
        const mapped = mapHtmlScrapedProduct(
          {
            title,
            price: priceVal,
            originalPrice: priceVal,
            imageUrl,
            productUrl,
            currency: 'EGP',
          },
          config
        );
        if (mapped) products.push(mapped);
      }
    });

    // Deduplicate products by productUrl
    const uniqueProducts = Array.from(
      new Map(products.map((p) => [p.source.productUrl, p])).values()
    );

    console.log(`[Scraper:Noon] Found ${uniqueProducts.length} products for "${query}"`);
    return uniqueProducts;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:Noon] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:Noon] Error: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeNoon,
};
