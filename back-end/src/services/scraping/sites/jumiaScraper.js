/**
 * Jumia Egypt Scraper
 *
 * Scrapes furniture products from Jumia Egypt catalog pages using HTML parsing with Cheerio.
 */

const cheerio = require('cheerio');
const { getRequestHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapHtmlScrapedProduct } = require('../productMapper');

/**
 * Scrapes products from Jumia Egypt search results.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeJumia = async (query) => {
  const config = SITE_CONFIGS.jumia;
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
      console.warn(`[Scraper:Jumia] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    $('article.prd, article.c-prd').each((_, el) => {
      const $el = $(el);

      const title = $el.find('h3.name, div.name').text().trim();
      const relativeUrl = $el.find('a.core').attr('href');
      const productUrl = relativeUrl ? `https://www.jumia.com.eg${relativeUrl}` : null;

      const priceText = $el.find('div.prc').first().text().replace(/[^\d.]/g, '');
      const priceVal = priceText ? parseFloat(priceText) : 0;

      const oldPriceText = $el.find('div.old').first().text().replace(/[^\d.]/g, '');
      const originalPrice = oldPriceText ? parseFloat(oldPriceText) : priceVal;

      const imageUrl = $el.find('img.img').attr('data-src') || $el.find('img.img').attr('src');

      const ratingText = $el.find('.stars._s').text().trim();
      const ratingMatch = ratingText.match(/([\d.]+)\s*out of/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

      if (title && priceVal > 0 && productUrl) {
        const mapped = mapHtmlScrapedProduct(
          {
            title,
            price: priceVal,
            originalPrice,
            imageUrl,
            productUrl,
            rating,
            currency: 'EGP',
          },
          config
        );
        if (mapped) products.push(mapped);
      }
    });

    console.log(`[Scraper:Jumia] Found ${products.length} products for "${query}"`);
    return products;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:Jumia] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:Jumia] Error: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeJumia,
};
