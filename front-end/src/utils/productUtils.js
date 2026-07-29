/**
 * Helper utility to parse MongoDB product documents and API recommendation objects.
 * Normalizes title, brand, price, images, description, dimensions, and styling properties.
 */

export const CATEGORY_IMAGE_POOLS = {
  sofa: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?w=800",
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800",
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800",
    "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800",
    "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800",
    "https://images.unsplash.com/photo-1506898667547-42e2b376e159?w=800"
  ],
  armchair: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800",
    "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
    "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800"
  ],
  coffee_table: [
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800",
    "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800",
    "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=800",
    "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800"
  ],
  tv_unit: [
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800"
  ],
  bed: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
  ],
  default: [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"
  ]
};

export const getUniqueFallbackImage = (product, category = "") => {
  const pData = (product && product.productData) || product || {};
  const idOrTitle = String(product?._id || product?.id || pData.title || pData.name || pData.basic?.name || Math.random());
  const hash = idOrTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const norm = String(category).toLowerCase().replace(/[\s-]+/g, '_');
  let pool = CATEGORY_IMAGE_POOLS.default;
  if (norm.includes('sofa')) pool = CATEGORY_IMAGE_POOLS.sofa;
  else if (norm.includes('armchair') || norm.includes('chair')) pool = CATEGORY_IMAGE_POOLS.armchair;
  else if (norm.includes('coffee') || norm.includes('table')) pool = CATEGORY_IMAGE_POOLS.coffee_table;
  else if (norm.includes('tv')) pool = CATEGORY_IMAGE_POOLS.tv_unit;
  else if (norm.includes('bed')) pool = CATEGORY_IMAGE_POOLS.bed;

  return pool[hash % pool.length];
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

export const parseProductDetails = (product, activeCategory = "Furniture") => {
  if (!product) return {};
  const pData = product.productData || product;

  const id = String(product._id || product.id || pData._id || pData.id || "");
  
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
    dimensions: { width, length, height },
    attributes: { style, material, color },
    raw: product
  };
};
