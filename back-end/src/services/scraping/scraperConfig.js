/**
 * Scraper Configuration
 *
 * Central configuration for all site scrapers: base URLs, search term mappings,
 * user-agent rotation, timeouts, and per-site settings.
 */

/**
 * Maps canonical product categories to search terms for external sites.
 * Each category has an array of search queries to try (the first result set wins).
 */
const CATEGORY_SEARCH_TERMS = {
  // Living Room
  sofa: ['sofa', 'couch', 'living room sofa'],
  'l-shape sofa': ['L-shape sofa', 'corner sofa', 'sectional sofa'],
  'sofa bed': ['sofa bed', 'sleeper sofa'],
  armchair: ['armchair', 'accent chair', 'lounge chair'],
  'coffee table': ['coffee table', 'center table'],
  'tv unit': ['tv unit', 'tv stand', 'tv cabinet', 'entertainment unit'],
  bookshelf: ['bookshelf', 'bookcase', 'shelving unit'],
  'side table': ['side table', 'end table'],
  rug: ['rug', 'carpet', 'area rug'],
  'floor lamp': ['floor lamp', 'standing lamp'],
  curtains: ['curtains', 'drapes', 'window curtains'],

  // Bedroom
  bed: ['bed', 'bed frame', 'king bed', 'queen bed'],
  mattress: ['mattress'],
  wardrobe: ['wardrobe', 'closet', 'armoire'],
  dresser: ['dresser', 'chest of drawers'],
  nightstand: ['nightstand', 'bedside table'],
  'vanity table': ['vanity table', 'dressing table', 'makeup table'],
  mirror: ['mirror', 'wall mirror', 'full length mirror'],

  // Dining Room
  'dining table': ['dining table'],
  'dining chair': ['dining chair'],
  'dining set': ['dining set', 'dining table set'],
  buffet: ['buffet', 'sideboard', 'credenza'],
  'bar cabinet': ['bar cabinet', 'wine cabinet'],

  // Office
  'office desk': ['office desk', 'computer desk', 'writing desk'],
  'office chair': ['office chair', 'desk chair', 'ergonomic chair'],
  'filing cabinet': ['filing cabinet', 'storage cabinet'],

  // Kitchen
  'kitchen cabinet': ['kitchen cabinet'],
  'kitchen table': ['kitchen table'],
  'bar stool': ['bar stool', 'counter stool'],

  // Bathroom
  'bathroom cabinet': ['bathroom cabinet', 'bathroom vanity'],
  'bathroom mirror': ['bathroom mirror'],

  // Kids
  'kids bed': ['kids bed', 'children bed', 'bunk bed'],
  'kids desk': ['kids desk', 'study desk'],
  'kids wardrobe': ['kids wardrobe', 'children wardrobe'],

  // Outdoor
  'outdoor sofa': ['outdoor sofa', 'garden sofa', 'patio sofa'],
  'outdoor table': ['outdoor table', 'garden table', 'patio table'],
  'outdoor chair': ['outdoor chair', 'garden chair'],
};

/**
 * Returns search terms for a given canonical category.
 * Falls back to the category name itself if no mapping exists.
 *
 * @param {string} canonicalCategory
 * @returns {string[]}
 */
const getSearchTerms = (canonicalCategory) => {
  const normalized = canonicalCategory.toLowerCase().trim();

  // Try exact match first
  if (CATEGORY_SEARCH_TERMS[normalized]) {
    return CATEGORY_SEARCH_TERMS[normalized];
  }

  // Try partial match
  for (const [key, terms] of Object.entries(CATEGORY_SEARCH_TERMS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return terms;
    }
  }

  // Fallback to the category name itself
  return [normalized];
};

/**
 * Rotating user-agent strings to avoid detection.
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
];

/**
 * Returns a random user-agent string.
 * @returns {string}
 */
const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

/**
 * Returns common HTTP headers for scraping requests.
 * @returns {Object}
 */
const getRequestHeaders = () => ({
  'User-Agent': getRandomUserAgent(),
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
});

/**
 * Returns JSON-specific HTTP headers for API requests.
 * @returns {Object}
 */
const getJsonHeaders = () => ({
  'User-Agent': getRandomUserAgent(),
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
});

/**
 * Per-site scraper configurations.
 */
const SITE_CONFIGS = {
  amazon: {
    name: 'Amazon Egypt',
    enabled: true,
    baseUrl: 'https://www.amazon.eg',
    searchUrl: (query) => `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`,
    timeout: 10000,
    type: 'html',
    currency: 'EGP',
  },
  noon: {
    name: 'Noon',
    enabled: true,
    baseUrl: 'https://www.noon.com',
    searchUrl: (query) => `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(query)}`,
    timeout: 10000,
    type: 'html',
    currency: 'EGP',
  },
  jumia: {
    name: 'Jumia',
    enabled: true,
    baseUrl: 'https://www.jumia.com.eg',
    searchUrl: (query) => `https://www.jumia.com.eg/catalog/?q=${encodeURIComponent(query)}`,
    timeout: 10000,
    type: 'html',
    currency: 'EGP',
  },
  ikea: {
    name: 'IKEA Egypt',
    enabled: true,
    searchUrl: (query) => `https://sik.search.blue.cdtapps.com/eg/en/search-result-page?q=${encodeURIComponent(query)}&size=10&subcategories-style=tree-navigation&sort=RELEVANCE`,
    timeout: 10000,
    type: 'json-api',
    currency: 'EGP',
  },
  homzmart: {
    name: 'Homzmart',
    enabled: true,
    baseUrl: 'https://homzmart.com',
    searchUrl: (query) => `https://homzmart.com/en/search/${encodeURIComponent(query)}`,
    timeout: 10000,
    type: 'html',
    currency: 'EGP',
  },
  kabbani: {
    name: 'Kabbani Furniture',
    enabled: true,
    baseUrl: 'https://www.kabbanifurniture.com',
    searchUrl: (query) => `https://www.kabbanifurniture.com/en/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`,
    timeout: 10000,
    type: 'shopify',
    currency: 'EGP',
  },
  smartfurniture: {
    name: 'Smart Furniture',
    enabled: true,
    baseUrl: 'https://smartfurniture.com.eg',
    searchUrl: (query) => `https://smartfurniture.com.eg/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=10`,
    timeout: 10000,
    type: 'woocommerce',
    currency: 'EGP',
  },
  manzzeli: {
    name: 'Manzzeli',
    enabled: true,
    baseUrl: 'https://manzzeli.com',
    searchUrl: (query) => `https://manzzeli.com/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`,
    timeout: 10000,
    type: 'shopify',
    currency: 'EGP',
  },
  ariika: {
    name: 'Ariika',
    enabled: true,
    baseUrl: 'https://ariika.com',
    searchUrl: (query) => `https://ariika.com/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=10`,
    timeout: 10000,
    type: 'shopify',
    currency: 'EGP',
  },
  chichomz: {
    name: 'Chic Homz',
    enabled: true,
    baseUrl: 'https://chichomz.com',
    searchUrl: (query) => `https://chichomz.com/search?type=product&q=${encodeURIComponent(query)}`,
    timeout: 10000,
    type: 'shopify-html', // Shopify but API returns 417, use HTML fallback
    currency: 'EGP',
  },
};

module.exports = {
  CATEGORY_SEARCH_TERMS,
  getSearchTerms,
  USER_AGENTS,
  getRandomUserAgent,
  getRequestHeaders,
  getJsonHeaders,
  SITE_CONFIGS,
};
