/**
 * Helper utility to parse MongoDB product documents and API recommendation objects.
 * Normalizes title, brand, price, images, description, dimensions, and styling properties.
 */

/** Path to the generic "no image" placeholder SVG */
export const NO_IMAGE_PLACEHOLDER = "/img/no-product-image.svg";

export const getUniqueFallbackImage = (_product, _category = "") => {
  return NO_IMAGE_PLACEHOLDER;
};

export const getProductImage = (product, category = "") => {
  if (!product) return "";
  const pData = product.productData || product;

  // 1. Direct primaryImage string or object
  if (typeof pData.primaryImage === 'string' && pData.primaryImage.trim()) return pData.primaryImage.trim();
  if (pData.primaryImage?.url && typeof pData.primaryImage.url === 'string' && pData.primaryImage.url.trim()) return pData.primaryImage.url.trim();

  // 2. Direct URL strings
  if (typeof pData.imageUrl === 'string' && pData.imageUrl.trim()) return pData.imageUrl.trim();
  if (typeof pData.img === 'string' && pData.img.trim()) return pData.img.trim();
  if (typeof pData.mainImageUrl === 'string' && pData.mainImageUrl.trim()) return pData.mainImageUrl.trim();
  if (typeof pData.image === 'string' && pData.image.trim()) return pData.image.trim();
  if (typeof pData.image_url === 'string' && pData.image_url.trim()) return pData.image_url.trim();

  // 3. Images Array (e.g. from MongoDB product schema: [{ url: "...", isPrimary: true }])
  const images = pData.images || (pData.productData && pData.productData.images);
  if (Array.isArray(images) && images.length > 0) {
    const primary = images.find((i) => i && (i.isPrimary || i.primary));
    if (primary) {
      if (typeof primary === 'string' && primary.trim()) return primary.trim();
      if (primary.url && primary.url.trim()) return primary.url.trim();
      if (primary.src && primary.src.trim()) return primary.src.trim();
    }
    const first = images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && first.url && first.url.trim()) return first.url.trim();
    if (first && first.src && first.src.trim()) return first.src.trim();
  }

  // 4. Fallback check for nested productData
  if (pData.productData && pData.productData !== pData) {
    return getProductImage(pData.productData, category);
  }

  return getUniqueFallbackImage(product, category);
};

/**
 * Central, single-source-of-truth function for extracting a unique product ID.
 *
 * The recommendation engine's formatTierProduct() flattens MongoDB documents
 * into plain objects. DB products keep their `_id` (ObjectId), but scraped
 * products never have `_id` — they only have `externalId` or `name`.
 * This helper walks a reliable fallback chain so every product gets a
 * non-empty, consistent string identifier.
 *
 * Fallback chain: _id → id → externalId → sellerId → name → index-based
 */
export const getProductId = (product) => {
  if (!product) return "";
  const pData = product.productData || product;

  // Walk through all possible ID fields (prioritize actual product ID over array subdocument _id)
  const candidates = [
    product.productId,
    pData.productId,
    pData._id,
    pData.id,
    product.externalId,
    pData.externalId,
    product.id,
    product._id,
    product.sellerId,
    pData.sellerId,
  ];

  for (const c of candidates) {
    if (c != null && typeof c !== "object" && String(c).trim() !== "") return String(c);
    if (c != null && typeof c === "object" && (c._id || c.id)) {
      const sub = String(c._id || c.id).trim();
      if (sub) return sub;
    }
  }

  // Last resort: use the product name + price as a deterministic key
  const name = pData.basic?.name || pData.name || pData.title || product.name || product.title || "";
  const price = pData.pricing?.currentPrice || pData.price || product.price || 0;
  if (name) return `${name}__${price}`;

  return "";
};

export const parseProductDetails = (product, activeCategory = "Furniture") => {
  if (!product) return {};
  const pData = product.productData || product;

  const id = getProductId(product);
  
  const title =
    pData.basic?.name ||
    pData.title ||
    pData.name ||
    product.title ||
    product.name ||
    `${activeCategory.replace("_", " ")} Item`;

  const brand =
    pData.basic?.brand ||
    pData.brand ||
    pData.source?.marketplace ||
    pData.provider ||
    pData.merchant ||
    "Partner Store";

  const price =
    pData.pricing?.currentPrice ||
    pData.price ||
    pData.numericPrice ||
    product.numericPrice ||
    0;

  const originalPrice =
    pData.pricing?.originalPrice ||
    pData.originalPrice ||
    price;

  const description =
    pData.basic?.description ||
    pData.description ||
    product.description ||
    "High quality furniture piece designed to fit your room perfectly.";

  const fallbackImg = getUniqueFallbackImage(product, activeCategory);
  const img = getProductImage(product, activeCategory);

  const externalUrl = getExternalStoreUrl(product);
  const storeUrl =
    externalUrl ||
    pData.source?.productUrl ||
    pData.productUrl ||
    product.productUrl ||
    pData.storeUrl ||
    pData.url ||
    "#";

  // Dimensions
  const dimensions = pData.dimensions || product.dimensions || {};
  const width = dimensions.width || 120;
  const length = dimensions.length || dimensions.depth || 200;
  const height = dimensions.height || 85;

  // Styling & classification attributes
  const classification = pData.classification || product.classification || {};
  const style = (classification.styles && classification.styles[0]) || pData.style || "Modern";
  const material = (classification.materials && classification.materials[0]) || pData.material || "Wood & Fabric";
  const color = (classification.colors && classification.colors[0]) || pData.color || "Neutral";

  // An internal product is one without an external store URL that belongs to a registered seller
  const isInternal = !externalUrl && !!(pData.sellerId || product.sellerId);

  return {
    id,
    title,
    brand,
    price,
    originalPrice,
    description,
    img,
    fallbackImg,
    storeUrl,
    isInternal,
    sellerId: pData.sellerId || product.sellerId || null,
    dimensions: { width, length, height },
    attributes: { style, material, color },
    raw: product
  };
};

/**
 * Helper to clean product name for store search queries.
 * Removes size brackets like (180x77 cm), "Edition", SKU codes, etc.
 */
export const cleanSearchQuery = (name = "") => {
  if (!name) return "";
  return name
    .replace(/\s*-\s*[A-Za-z0-9\s]+Edition\s*\([^)]*\)/gi, "")
    .replace(/\s*\([^)]*cm\)/gi, "")
    .replace(/\s*\([^)]*mm\)/gi, "")
    .replace(/\|\s*[^|]+$/g, "")
    .replace(/العلامة التجارية:\s*/gi, "")
    .trim();
};

/**
 * Get external retail store URL for live-scraped or DB catalog products.
 * If raw productUrl is synthetic/broken/dummy (e.g. sofa-aug-sofa-0002, /p/..., DUMMY_...),
 * generates a working store search URL for the retailer (IKEA, Amazon, Noon, Jumia, Homzmart, Kabbani, etc.)
 */
export const getExternalStoreUrl = (product) => {
  if (!product) return null;
  const pData = product.productData || product;

  const marketplace = (
    pData.source?.marketplace ||
    product.source?.marketplace ||
    ""
  ).toLowerCase();

  const brand = (
    pData.basic?.brand ||
    pData.brand ||
    product.brand ||
    ""
  ).toLowerCase();

  const candidates = [
    product.productUrl,
    product.source?.productUrl,
    pData.productUrl,
    pData.source?.productUrl,
    product.storeUrl,
    pData.storeUrl,
    product.url,
    pData.url,
  ];

  let rawUrl = null;
  for (const u of candidates) {
    if (u && typeof u === "string" && u.trim() !== "" && u.trim() !== "#") {
      rawUrl = u.trim();
      break;
    }
  }

  // If this is an internal SmartSpace seller product with no external retail marketplace, return null so it uses internal cart
  const hasSellerId = !!(pData.sellerId || product.sellerId);
  const isSmartSpaceBrand = brand.includes("smartspace") || marketplace.includes("smartspace") || (!marketplace && !brand);

  if (hasSellerId && isSmartSpaceBrand && (!rawUrl || rawUrl.includes("smartspace.ai") || rawUrl.includes("DUMMY_"))) {
    return null;
  }

  const title = pData.basic?.name || pData.name || pData.title || product.name || product.title || "";
  const query = cleanSearchQuery(title);

  // Check if rawUrl is synthetic/dummy/broken
  const isSynthetic =
    !rawUrl ||
    rawUrl.includes("smartspace.ai") ||
    rawUrl.includes("DUMMY_") ||
    /\/p\/[a-z0-9-]{8,}$/i.test(rawUrl) ||
    rawUrl.includes("sofa-aug-sofa") ||
    rawUrl.includes("coffee-table-aug") ||
    rawUrl.includes("example.com");

  // Genuine non-synthetic URL (e.g. real Amazon /dp/..., real Noon URL)
  if (rawUrl && !isSynthetic) {
    return rawUrl;
  }

  // Construct direct search URL for retailer store if query exists
  if (query) {
    const encodedQuery = encodeURIComponent(query);

    if (marketplace.includes("ikea") || brand.includes("ikea")) {
      return `https://www.ikea.com/eg/en/search/?q=${encodedQuery}`;
    }
    if (marketplace.includes("amazon") || brand.includes("amazon")) {
      return `https://www.amazon.eg/s?k=${encodedQuery}`;
    }
    if (marketplace.includes("noon") || brand.includes("noon")) {
      return `https://www.noon.com/egypt-en/search/?q=${encodedQuery}`;
    }
    if (marketplace.includes("jumia") || brand.includes("jumia")) {
      return `https://www.jumia.com.eg/catalog/?q=${encodedQuery}`;
    }
    if (marketplace.includes("homzmart") || brand.includes("homzmart")) {
      return `https://homzmart.com/en/search?q=${encodedQuery}`;
    }
    if (marketplace.includes("kabbani") || brand.includes("kabbani")) {
      return `https://www.kabbani.com/search?q=${encodedQuery}`;
    }
    if (marketplace.includes("hub") || brand.includes("hub")) {
      return `https://www.hubfurniture.com/search?q=${encodedQuery}`;
    }
    if (marketplace.includes("inhouse") || brand.includes("inhouse")) {
      return `https://www.inhouse.com/search?q=${encodedQuery}`;
    }

    const storeName = pData.basic?.brand || pData.brand || pData.source?.marketplace || "";
    if (storeName && !storeName.toLowerCase().includes("smartspace")) {
      return `https://www.google.com/search?q=${encodeURIComponent(query + " " + storeName)}`;
    }
  }

  return rawUrl && !isSynthetic ? rawUrl : null;
};

/**
 * Check if a product is an internal seller product that can be added to the cart
 */
export const isInternalProduct = (product) => {
  if (!product) return false;
  const externalUrl = getExternalStoreUrl(product);
  if (externalUrl) return false; // External products have external URL, not internal cart
  const pData = product.productData || product;
  return !!(pData.sellerId || product.sellerId);
};
