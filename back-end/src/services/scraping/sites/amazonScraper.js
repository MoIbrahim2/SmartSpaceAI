/**
 * Amazon Egypt Scraper
 *
 * Scrapes furniture products from Amazon Egypt (amazon.eg) search results using HTML parsing with Cheerio.
 */

const cheerio = require('cheerio');
const { getRequestHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapHtmlScrapedProduct } = require('../productMapper');

/**
 * Scrapes products from Amazon Egypt search results.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeAmazon = async (query) => {
  const config = SITE_CONFIGS.amazon;
  if (!config || !config.enabled) return [];

  const url = config.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      headers: {
        ...getRequestHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Host': 'www.amazon.eg',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper:Amazon] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    $('[data-component-type="s-search-result"]').each((_, el) => {
      const $el = $(el);

      const title = $el.find('h2 a span').text().trim();
      const relativeUrl = $el.find('h2 a').attr('href');
      const productUrl = relativeUrl ? `https://www.amazon.eg${relativeUrl.split('?')[0]}` : null;

      const wholePrice = $el.find('.a-price-whole').first().text().replace(/[,.]/g, '').trim();
      const fractionPrice = $el.find('.a-price-fraction').first().text().trim();
      const priceVal = wholePrice ? parseFloat(`${wholePrice}.${fractionPrice || '00'}`) : 0;

      const rawRating = $el.find('.a-icon-alt').first().text().trim();
      const ratingMatch = rawRating.match(/([\d.]+)\s*out of/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

      const reviewCountText = $el.find('span.a-size-base.s-underline-text').first().text().replace(/,/g, '').trim();
      const reviewCount = reviewCountText ? parseInt(reviewCountText, 10) : null;

      const imageUrl = $el.find('img.s-image').attr('src');

      if (title && priceVal > 0 && productUrl) {
        const mapped = mapHtmlScrapedProduct(
          {
            title,
            price: priceVal,
            originalPrice: priceVal,
            imageUrl,
            productUrl,
            rating,
            reviewCount,
            currency: 'EGP',
          },
          config
        );
        if (mapped) products.push(mapped);
      }
    });

    console.log(`[Scraper:Amazon] Found ${products.length} products for "${query}"`);
    return products;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:Amazon] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:Amazon] Error: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeAmazon,
};
