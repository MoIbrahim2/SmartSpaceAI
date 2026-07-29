/**
 * Homzmart Scraper
 *
 * Scrapes furniture products from Homzmart search results using HTML parsing with Cheerio.
 * Also includes fallback HTML scraping for Chic Homz.
 */

const cheerio = require('cheerio');
const { getRequestHeaders, SITE_CONFIGS } = require('../scraperConfig');
const { mapHtmlScrapedProduct } = require('../productMapper');

/**
 * Scrapes products from Homzmart search results.
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeHomzmart = async (query) => {
  const config = SITE_CONFIGS.homzmart;
  if (!config || !config.enabled) return [];

  const url = config.searchUrl(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      headers: {
        ...getRequestHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Host': 'homzmart.com',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper:Homzmart] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    // Attempt 1: Extract from Next.js __NEXT_DATA__ JSON script tag
    const nextDataRaw = $('#__NEXT_DATA__').html();
    if (nextDataRaw) {
      try {
        const nextData = JSON.parse(nextDataRaw);
        const items = nextData?.props?.pageProps?.initialData?.products?.items || [];

        for (const item of items) {
          const title = item.name;
          const finalPrice = item.price_range?.minimum_price?.final_price?.value;
          const regularPrice = item.price_range?.minimum_price?.regular_price?.value || finalPrice;

          const urlKey = item.url_key || item.url_category_to_product;
          const productUrl = urlKey
            ? (urlKey.startsWith('http') ? urlKey : `https://homzmart.com/en/product/${urlKey}`)
            : null;

          const imageUrl = item.image?.url;

          const ratingSummary = item.rating_summary || 0;
          const rating = ratingSummary > 0 ? (ratingSummary / 100) * 5 : null;
          const reviewCount = item.review_count ? parseInt(item.review_count, 10) : null;

          if (title && finalPrice > 0 && productUrl) {
            const mapped = mapHtmlScrapedProduct(
              {
                title,
                price: finalPrice,
                originalPrice: regularPrice,
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
        }
      } catch (parseErr) {
        console.warn(`[Scraper:Homzmart] Failed to parse __NEXT_DATA__: ${parseErr.message}`);
      }
    }

    // Attempt 2: Fallback to Cheerio HTML DOM parsing if __NEXT_DATA__ yielded nothing
    if (products.length === 0) {
      $('[class*="productCard"], [class*="product-card"], a[href*="/product/"]').each((_, el) => {
        const $el = $(el);

        const title = $el.find('[class*="title"], [class*="name"], h3, h2').text().trim() || $el.attr('title');
        const relativeUrl = $el.attr('href') || $el.find('a').attr('href');
        const productUrl = relativeUrl
          ? (relativeUrl.startsWith('http') ? relativeUrl : `https://homzmart.com${relativeUrl}`)
          : null;

        const priceText = $el.find('[class*="price"], [class*="amount"]').first().text().replace(/[^\d.]/g, '');
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
    }

    const uniqueProducts = Array.from(
      new Map(products.map((p) => [p.source.productUrl, p])).values()
    );

    console.log(`[Scraper:Homzmart] Found ${uniqueProducts.length} products for "${query}"`);
    return uniqueProducts;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:Homzmart] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:Homzmart] Error: ${error.message}`);
    }
    return [];
  }
};

/**
 * Scrapes products from Chic Homz (Shopify store HTML fallback).
 *
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Array of Product-schema-compatible objects
 */
const scrapeChichomz = async (query) => {
  const config = SITE_CONFIGS.chichomz;
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
      console.warn(`[Scraper:ChicHomz] HTTP ${response.status} for query "${query}"`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    // Parse Shopify product grid items
    $('.product-card, .product-item, grid__item').each((_, el) => {
      const $el = $(el);

      const title = $el.find('.product-card__title, .card__heading, a[href*="/products/"]').text().trim();
      const relativeUrl = $el.find('a[href*="/products/"]').attr('href');
      const productUrl = relativeUrl
        ? (relativeUrl.startsWith('http') ? relativeUrl : `https://chichomz.com${relativeUrl.split('?')[0]}`)
        : null;

      const priceText = $el.find('.price-item--sale, .price-item--regular, .price').first().text().replace(/[^\d.]/g, '');
      const priceVal = priceText ? parseFloat(priceText) : 0;

      const imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('srcset')?.split(' ')[0];
      const fullImageUrl = imageUrl
        ? (imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl)
        : null;

      if (title && priceVal > 0 && productUrl) {
        const mapped = mapHtmlScrapedProduct(
          {
            title,
            price: priceVal,
            originalPrice: priceVal,
            imageUrl: fullImageUrl,
            productUrl,
            currency: 'EGP',
          },
          config
        );
        if (mapped) products.push(mapped);
      }
    });

    const uniqueProducts = Array.from(
      new Map(products.map((p) => [p.source.productUrl, p])).values()
    );

    console.log(`[Scraper:ChicHomz] Found ${uniqueProducts.length} products for "${query}"`);
    return uniqueProducts;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Scraper:ChicHomz] Timeout for query "${query}"`);
    } else {
      console.warn(`[Scraper:ChicHomz] Error: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeHomzmart,
  scrapeChichomz,
};
