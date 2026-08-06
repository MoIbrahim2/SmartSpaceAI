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

  // Walk through all possible ID fields
  const candidates = [
    product._id,
    product.id,
    product.productId,
    pData._id,
    pData.id,
    pData.productId,
    product.externalId,
    pData.externalId,
    product.sellerId,
    pData.sellerId,
  ];

  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c);
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

  const storeUrl =
    pData.source?.productUrl ||
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

  const isInternal = !!(pData.sellerId || product.sellerId || (pData._id && !pData.source?.productUrl));

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
 * Get external retail store URL for live-scraped products (Amazon, Noon, etc.)
 */
export const getExternalStoreUrl = (product) => {
  if (!product) return null;
  const pData = product.productData || product;

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

  for (const u of candidates) {
    if (u && typeof u === "string" && u.trim() !== "" && u.trim() !== "#") {
      return u.trim();
    }
  }

  return null;
};

/**
 * Check if a product is an internal seller product that can be added to the cart
 */
export const isInternalProduct = (product) => {
  if (!product) return false;
  const externalUrl = getExternalStoreUrl(product);
  if (externalUrl) return false; // Scraped products have external URL, not internal cart
  const pData = product.productData || product;
  return !!(pData.sellerId || product.sellerId || pData._id || product._id || product.productId);
};
