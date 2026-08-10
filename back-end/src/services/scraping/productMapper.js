/**
 * Product Mapper
 *
 * Normalizes raw scraped data from each site-specific format
 * into the canonical Product schema used by the recommendation engine.
 *
 * Each mapper extracts: name, brand, description, category, styles,
 * materials, colors, pricing, dimensions, images, and source info.
 */

const cheerio = require('cheerio');

// ─── Text Extraction Helpers ────────────────────────────────

/**
 * Strips HTML tags and returns plain text.
 * @param {string} html
 * @returns {string}
 */
const stripHtml = (html) => {
  if (!html) return '';
  const $ = cheerio.load(`<div>${html}</div>`);
  return $('div').text().trim();
};

/**
 * Extracts colors from text using common color keywords.
 * @param {string} text
 * @returns {string[]}
 */
const extractColors = (text) => {
  if (!text) return [];
  const colorKeywords = [
    'white', 'off-white', 'ivory', 'cream', 'beige', 'tan',
    'brown', 'chocolate', 'coffee', 'walnut', 'oak', 'espresso',
    'black', 'charcoal', 'dark',
    'grey', 'gray', 'silver', 'slate',
    'blue', 'navy', 'teal', 'turquoise', 'cyan', 'aqua',
    'green', 'olive', 'sage', 'mint', 'pistachio', 'emerald',
    'red', 'burgundy', 'maroon', 'crimson', 'wine',
    'pink', 'rose', 'blush', 'coral',
    'yellow', 'gold', 'mustard', 'amber',
    'orange', 'rust', 'copper', 'terracotta',
    'purple', 'violet', 'lavender', 'plum',
    'natural', 'wood', 'cashmere',
  ];
  const normalized = text.toLowerCase();
  return [...new Set(colorKeywords.filter((c) => normalized.includes(c)))];
};

/**
 * Extracts materials from text using common material keywords.
 * @param {string} text
 * @returns {string[]}
 */
const extractMaterials = (text) => {
  if (!text) return [];
  const materialKeywords = [
    'wood', 'beech', 'oak', 'walnut', 'pine', 'teak', 'bamboo', 'mdf',
    'metal', 'steel', 'iron', 'aluminum', 'brass', 'chrome',
    'leather', 'faux leather', 'pu leather',
    'fabric', 'linen', 'cotton', 'velvet', 'polyester', 'tweed', 'suede',
    'glass', 'tempered glass',
    'marble', 'granite', 'stone',
    'rattan', 'wicker', 'cane',
    'foam', 'memory foam', 'sponge',
    'plastic', 'acrylic', 'resin',
    'plywood', 'particle board', 'chipboard',
  ];
  const normalized = text.toLowerCase();
  return [...new Set(materialKeywords.filter((m) => normalized.includes(m)))];
};

/**
 * Extracts style labels from text.
 * @param {string} text
 * @returns {string[]}
 */
const extractStyles = (text) => {
  if (!text) return [];
  const styleKeywords = [
    'modern', 'contemporary', 'minimalist', 'scandinavian', 'mid-century',
    'industrial', 'rustic', 'bohemian', 'traditional', 'classic',
    'farmhouse', 'coastal', 'art deco', 'vintage', 'retro',
    'luxury', 'elegant', 'transitional',
  ];
  const normalized = text.toLowerCase();
  return [...new Set(styleKeywords.filter((s) => normalized.includes(s)))];
};

/**
 * Extracts dimension values from text (width, height, depth/length in cm).
 * @param {string} text
 * @returns {{ width: number|null, height: number|null, length: number|null }}
 */
const extractDimensions = (text) => {
  if (!text) return { width: null, height: null, length: null };

  const dims = { width: null, height: null, length: null };
  const normalized = text.toLowerCase();

  // Pattern: WxDxH or WxD H:H (common in furniture)
  // e.g., "240x105 H:80cm" or "320 x 195 H:80 cm"
  const wdhPattern = /(\d+)\s*x\s*(\d+)\s*(?:x\s*(\d+)|h[:\s]*(\d+))/i;
  const match = normalized.match(wdhPattern);
  if (match) {
    dims.width = parseInt(match[1], 10) || null;
    dims.length = parseInt(match[2], 10) || null;
    dims.height = parseInt(match[3] || match[4], 10) || null;
    return dims;
  }

  // Pattern: "Width: 300 cm" / "Depth: 200 cm" / "Height: 75 cm"
  const widthMatch = normalized.match(/width[:\s]*(\d+)\s*cm/i);
  const depthMatch = normalized.match(/depth[:\s]*(\d+)\s*cm/i);
  const heightMatch = normalized.match(/height[:\s]*(\d+)\s*cm/i);
  const lengthMatch = normalized.match(/length[:\s]*(\d+)\s*cm/i);

  if (widthMatch) dims.width = parseInt(widthMatch[1], 10);
  if (depthMatch) dims.length = parseInt(depthMatch[1], 10);
  if (heightMatch) dims.height = parseInt(heightMatch[1], 10);
  if (lengthMatch) dims.length = parseInt(lengthMatch[1], 10);

  return dims;
};

/**
 * Infers canonical category from product title, type, and tags.
 * @param {string} title
 * @param {string} type
 * @param {string[]} tags
 * @returns {string}
 */
const inferCategory = (title, type = '', tags = []) => {
  const searchText = `${title} ${type} ${tags.join(' ')}`.toLowerCase();

  const categoryPatterns = [
    { pattern: /air conditioner|split ac|aircon|\bac\b|hvac|مكيف/i, category: 'Air Conditioner' },
    { pattern: /refrigerator|fridge|freezer|ثلاجة/i, category: 'Refrigerator' },
    { pattern: /washing machine|laundry machine|washer|غسالة/i, category: 'Washing Machine' },
    { pattern: /dishwasher|غسالة أطباق/i, category: 'Dishwasher' },
    { pattern: /microwave|ميكروويف/i, category: 'Microwave' },
    { pattern: /\btv\b|television|smart tv|تلفزيون/i, category: 'TV' },
    { pattern: /l[- ]?shape|sectional|corner sofa/, category: 'L-Shape Sofa' },
    { pattern: /sofa bed|sleeper sofa/, category: 'Sofa Bed' },
    { pattern: /\bsofa\b|couch|settee/, category: 'Sofa' },
    { pattern: /armchair|accent chair|lounge chair/, category: 'Armchair' },
    { pattern: /coffee table|center table/, category: 'Coffee Table' },
    { pattern: /tv\s*(unit|stand|cabinet)|entertainment/, category: 'TV Unit' },
    { pattern: /bookshelf|bookcase|shelving/, category: 'Bookshelf' },
    { pattern: /side table|end table/, category: 'Side Table' },
    { pattern: /dining table/, category: 'Dining Table' },
    { pattern: /dining chair/, category: 'Dining Chair' },
    { pattern: /dining set/, category: 'Dining Set' },
    { pattern: /buffet|sideboard|credenza/, category: 'Buffet' },
    { pattern: /\bbed\b|bed frame/, category: 'Bed' },
    { pattern: /mattress/, category: 'Mattress' },
    { pattern: /wardrobe|closet|armoire/, category: 'Wardrobe' },
    { pattern: /dresser|chest of drawers/, category: 'Dresser' },
    { pattern: /nightstand|bedside/, category: 'Nightstand' },
    { pattern: /vanity|dressing table/, category: 'Vanity Table' },
    { pattern: /office desk|computer desk|writing desk/, category: 'Office Desk' },
    { pattern: /office chair|desk chair|ergonomic/, category: 'Office Chair' },
    { pattern: /bar stool|counter stool/, category: 'Bar Stool' },
    { pattern: /\brug\b|carpet/, category: 'Rug' },
    { pattern: /\blamp\b|lighting/, category: 'Lamp' },
    { pattern: /curtain|drape/, category: 'Curtains' },
    { pattern: /mirror/, category: 'Mirror' },
    { pattern: /\bdesk\b/, category: 'Desk' },
    { pattern: /\bchair\b/, category: 'Chair' },
    { pattern: /\btable\b/, category: 'Table' },
  ];

  for (const { pattern, category } of categoryPatterns) {
    if (pattern.test(searchText)) return category;
  }

  return type || 'Furniture';
};

// ─── Site-Specific Mappers ──────────────────────────────────

/**
 * Maps a Shopify suggest.json product to the Product schema.
 * Works for: Kabbani, Manzzeli, Ariika, Chichomz
 *
 * @param {Object} raw - Raw Shopify product object
 * @param {Object} siteConfig - Site configuration from scraperConfig
 * @returns {Object} Product-schema-compatible object
 */
const mapShopifyProduct = (raw, siteConfig) => {
  if (!raw || !raw.title) return null;

  const plainDescription = stripHtml(raw.body || '');
  const fullText = `${raw.title} ${plainDescription} ${(raw.tags || []).join(' ')}`;
  const dims = extractDimensions(plainDescription);

  const productUrl = raw.url
    ? `${siteConfig.baseUrl}${raw.url.split('?')[0]}`
    : siteConfig.baseUrl;

  return {
    source: {
      marketplace: siteConfig.name,
      productUrl,
      country: 'Egypt',
      scrapedAt: new Date(),
      lastUpdated: new Date(),
    },
    basic: {
      name: raw.title.trim(),
      brand: raw.vendor || siteConfig.name,
      description: plainDescription.substring(0, 500),
    },
    classification: {
      canonicalCategory: inferCategory(raw.title, raw.type, raw.tags || []),
      roomTypes: [],
      styles: extractStyles(fullText),
      materials: extractMaterials(fullText),
      colors: extractColors(fullText),
      tags: (raw.tags || []).slice(0, 15),
    },
    pricing: {
      currency: 'EGP',
      currentPrice: parseFloat(raw.price) || 0,
      originalPrice: parseFloat(raw.compare_at_price_max || raw.compare_at_price_min) || parseFloat(raw.price) || 0,
      discountPercentage: raw.compare_at_price_max && parseFloat(raw.compare_at_price_max) > parseFloat(raw.price)
        ? Math.round((1 - parseFloat(raw.price) / parseFloat(raw.compare_at_price_max)) * 100)
        : 0,
    },
    dimensions: {
      width: dims.width,
      height: dims.height,
      length: dims.length,
      dimensionUnit: 'cm',
    },
    images: raw.image ? [{
      url: raw.image.startsWith('//') ? `https:${raw.image}` : raw.image,
      isPrimary: true,
    }] : [],
    availability: {
      inStock: raw.available !== false,
      stockStatus: raw.available !== false ? 'IN_STOCK' : 'OUT_OF_STOCK',
    },
    rating: {
      average: null,
      reviews: null,
    },
    processing: {
      status: 'SCRAPED',
      qualityScore: 0.7,
      issues: [],
    },
  };
};

/**
 * Maps a WooCommerce Store API product to the Product schema.
 * Works for: Smart Furniture
 *
 * @param {Object} raw - Raw WooCommerce product object
 * @param {Object} siteConfig - Site configuration from scraperConfig
 * @returns {Object} Product-schema-compatible object
 */
const mapWooCommerceProduct = (raw, siteConfig) => {
  if (!raw || !raw.name) return null;

  const plainDescription = stripHtml(raw.short_description || raw.description || '');
  const fullText = `${raw.name} ${plainDescription}`;

  // WC Store API prices — currency_minor_unit tells us decimal places
  const minorUnit = raw.prices?.currency_minor_unit || 0;
  const divisor = Math.pow(10, minorUnit);
  const currentPrice = parseInt(raw.prices?.price || '0', 10) / divisor;
  const originalPrice = parseInt(raw.prices?.regular_price || raw.prices?.price || '0', 10) / divisor;

  // Build product URL from the store base
  const productUrl = raw.permalink || `${siteConfig.baseUrl}/product/${raw.slug || raw.id}`;

  // Map categories
  const categoryNames = (raw.categories || []).map((c) => c.name).filter(Boolean);

  // Get primary image
  const images = (raw.images || []).map((img, i) => ({
    url: img.src || img.thumbnail,
    isPrimary: i === 0,
  })).filter((img) => img.url);

  const dims = extractDimensions(plainDescription);

  return {
    source: {
      marketplace: siteConfig.name,
      productUrl,
      country: 'Egypt',
      scrapedAt: new Date(),
      lastUpdated: new Date(),
    },
    basic: {
      name: raw.name.trim(),
      brand: (raw.brands && raw.brands[0]?.name) || siteConfig.name,
      description: plainDescription.substring(0, 500),
    },
    classification: {
      canonicalCategory: inferCategory(raw.name, categoryNames.join(' '), categoryNames),
      roomTypes: [],
      styles: extractStyles(fullText),
      materials: extractMaterials(fullText),
      colors: extractColors(fullText),
      tags: categoryNames.slice(0, 15),
    },
    pricing: {
      currency: 'EGP',
      currentPrice,
      originalPrice,
      discountPercentage: originalPrice > currentPrice
        ? Math.round((1 - currentPrice / originalPrice) * 100)
        : 0,
    },
    dimensions: {
      width: dims.width,
      height: dims.height,
      length: dims.length,
      dimensionUnit: 'cm',
    },
    images,
    availability: {
      inStock: raw.is_in_stock !== false,
      stockStatus: raw.is_in_stock !== false ? 'IN_STOCK' : 'OUT_OF_STOCK',
    },
    rating: {
      average: parseFloat(raw.average_rating) || null,
      reviews: raw.review_count || null,
    },
    processing: {
      status: 'SCRAPED',
      qualityScore: 0.7,
      issues: [],
    },
  };
};

/**
 * Maps an IKEA SIK search API product to the Product schema.
 *
 * @param {Object} raw - Raw IKEA product item from the search API
 * @returns {Object} Product-schema-compatible object
 */
const mapIkeaProduct = (raw) => {
  if (!raw || !raw.product) return null;
  const p = raw.product;

  const name = p.name || '';
  const typeName = p.typeName || '';
  const fullName = `${name} ${typeName}`.trim();

  const description = p.description || typeName || '';
  const fullText = `${fullName} ${description}`;

  const currentPrice = p.salesPrice?.numeral || p.price?.numeral || 0;
  const originalPrice = p.price?.numeral || currentPrice;

  const imageUrl = p.mainImageUrl
    ? (p.mainImageUrl.startsWith('//') ? `https:${p.mainImageUrl}` : p.mainImageUrl)
    : null;

  const productUrl = p.pipUrl
    ? (p.pipUrl.startsWith('http') ? p.pipUrl : `https://www.ikea.com${p.pipUrl}`)
    : 'https://www.ikea.com/eg/en/';

  return {
    source: {
      marketplace: 'IKEA Egypt',
      productUrl,
      country: 'Egypt',
      scrapedAt: new Date(),
      lastUpdated: new Date(),
    },
    basic: {
      name: fullName,
      brand: 'IKEA',
      description: description.substring(0, 500),
    },
    classification: {
      canonicalCategory: inferCategory(fullName, typeName, []),
      roomTypes: [],
      styles: extractStyles(fullText),
      materials: extractMaterials(fullText),
      colors: extractColors(fullText),
      tags: [typeName].filter(Boolean),
    },
    pricing: {
      currency: 'EGP',
      currentPrice,
      originalPrice,
      discountPercentage: originalPrice > currentPrice
        ? Math.round((1 - currentPrice / originalPrice) * 100)
        : 0,
    },
    dimensions: {
      width: null,
      height: null,
      length: null,
      dimensionUnit: 'cm',
    },
    images: imageUrl ? [{ url: imageUrl, isPrimary: true }] : [],
    availability: {
      inStock: true,
      stockStatus: 'IN_STOCK',
    },
    rating: {
      average: p.rating?.value || null,
      reviews: p.rating?.count || null,
    },
    processing: {
      status: 'SCRAPED',
      qualityScore: 0.8,
      issues: [],
    },
  };
};

/**
 * Maps a generic HTML-scraped product to the Product schema.
 * Used for: Amazon, Noon, Jumia, Homzmart, Chichomz
 *
 * @param {Object} raw - { title, price, originalPrice, imageUrl, productUrl, rating, reviewCount, currency }
 * @param {Object} siteConfig - Site configuration
 * @param {number} [exchangeRate=1] - Currency exchange rate to EGP
 * @returns {Object} Product-schema-compatible object
 */
const mapHtmlScrapedProduct = (raw, siteConfig, exchangeRate = 1) => {
  if (!raw || !raw.title) return null;

  const currentPrice = (raw.price || 0) * exchangeRate;
  const originalPrice = (raw.originalPrice || raw.price || 0) * exchangeRate;

  return {
    source: {
      marketplace: siteConfig.name,
      productUrl: raw.productUrl || siteConfig.baseUrl,
      country: siteConfig.currency === 'USD' ? 'US' : 'Egypt',
      scrapedAt: new Date(),
      lastUpdated: new Date(),
    },
    basic: {
      name: raw.title.trim(),
      brand: raw.brand || siteConfig.name,
      description: (raw.description || '').substring(0, 500),
    },
    classification: {
      canonicalCategory: inferCategory(raw.title, '', []),
      roomTypes: [],
      styles: extractStyles(raw.title),
      materials: extractMaterials(`${raw.title} ${raw.description || ''}`),
      colors: extractColors(`${raw.title} ${raw.description || ''}`),
      tags: [],
    },
    pricing: {
      currency: 'EGP',
      currentPrice: Math.round(currentPrice * 100) / 100,
      originalPrice: Math.round(originalPrice * 100) / 100,
      discountPercentage: originalPrice > currentPrice
        ? Math.round((1 - currentPrice / originalPrice) * 100)
        : 0,
    },
    dimensions: {
      width: null,
      height: null,
      length: null,
      dimensionUnit: 'cm',
    },
    images: raw.imageUrl ? [{ url: raw.imageUrl, isPrimary: true }] : [],
    availability: {
      inStock: true,
      stockStatus: 'IN_STOCK',
    },
    rating: {
      average: raw.rating || null,
      reviews: raw.reviewCount || null,
    },
    processing: {
      status: 'SCRAPED',
      qualityScore: 0.6,
      issues: [],
    },
  };
};

module.exports = {
  mapShopifyProduct,
  mapWooCommerceProduct,
  mapIkeaProduct,
  mapHtmlScrapedProduct,
  // Expose helpers for testing
  stripHtml,
  extractColors,
  extractMaterials,
  extractStyles,
  extractDimensions,
  inferCategory,
};
