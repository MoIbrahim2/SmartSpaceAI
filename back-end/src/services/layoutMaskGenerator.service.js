const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Category to Color Map for Semantic Segmentation Masking
 */
const CATEGORY_COLOR_MAP = {
  bed: '#805AD5',          // Purple
  sofa: '#2B6CB0',         // Blue
  couch: '#2B6CB0',
  'tv unit': '#C53030',     // Red
  'tv console': '#C53030',
  'media unit': '#C53030',
  table: '#2F855A',        // Green
  'dining table': '#2F855A',
  'coffee table': '#319795',// Teal
  nightstand: '#ED8936',   // Orange
  'bedside table': '#ED8936',
  wardrobe: '#D69E2E',     // Yellow / Gold
  armoire: '#D69E2E',
  closet: '#D69E2E',
  desk: '#38A169',         // Emerald
  chair: '#DD6B20',        // Deep Orange
  armchair: '#DD6B20',
  bookshelf: '#805AD5',
  cabinet: '#4A5568',      // Slate
  storage: '#718096',
  mirror: '#E2E8F0',
  lamp: '#F6E05E',
  lighting: '#F6E05E',
  rug: '#9F7AEA',          // Lavender
  carpet: '#9F7AEA',
  decor: '#CBD5E0'
};

/**
 * Fallback deterministic color generator for custom database categories
 *
 * @param {string} str - Category name string
 * @returns {string} HSL color string
 */
const stringToColor = (str) => {
  if (!str) return '#718096';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

/**
 * Get display color for a furniture category
 *
 * @param {string} category - Category string
 * @returns {string} Color string (Hex or HSL)
 */
const getCategoryColor = (category) => {
  if (!category) return '#718096';
  const clean = String(category).trim().toLowerCase();
  if (CATEGORY_COLOR_MAP[clean]) {
    return CATEGORY_COLOR_MAP[clean];
  }
  // Check partial key matches
  for (const [key, val] of Object.entries(CATEGORY_COLOR_MAP)) {
    if (clean.includes(key)) return val;
  }
  return stringToColor(clean);
};

/**
 * Generate 1024x1024 2D Floorplan Mask PNG
 *
 * @param {Object} layoutDiagram - Spatial layout diagram containing allocations and roomDimensions
 * @param {Object} roomMetrics - Room dimensions and structural elements (doors/windows)
 * @returns {Promise<{ maskDataBase64: string, maskImageUrl: string, colorLegend: Array }>}
 */
const generateLayoutMask = async (layoutDiagram, roomMetrics = {}) => {
  const CANVAS_SIZE = 1024;
  const MARGIN = 64;
  const RENDER_AREA = CANVAS_SIZE - 2 * MARGIN;

  const roomWidth = Number(
    layoutDiagram?.roomDimensions?.width ||
    layoutDiagram?.roomDimensions?.width_cm ||
    roomMetrics?.width ||
    400
  );
  const roomLength = Number(
    layoutDiagram?.roomDimensions?.length ||
    layoutDiagram?.roomDimensions?.length_cm ||
    roomMetrics?.length ||
    350
  );

  // Compute scale to fit room into 1024x1024 canvas
  const scale = Math.min(RENDER_AREA / roomWidth, RENDER_AREA / roomLength);

  const renderW = roomWidth * scale;
  const renderH = roomLength * scale;

  const offsetX = (CANVAS_SIZE - renderW) / 2;
  const offsetY = (CANVAS_SIZE - renderH) / 2;

  const doors = roomMetrics.doors || [];
  const windows = roomMetrics.windows || [];

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
    <!-- Background Canvas -->
    <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#0F172A" />

    <!-- Grid Lines (Subtle scale guide) -->
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="url(#grid)" />

    <!-- Room Floor Blueprint -->
    <rect x="${offsetX}" y="${offsetY}" width="${renderW}" height="${renderH}" fill="#1E293B" stroke="#475569" stroke-width="8" rx="8" />
  `;

  // Draw Structural Elements: Doors (White #FFFFFF)
  doors.forEach((door, idx) => {
    const wall = (door.wall || 'SOUTH').toUpperCase();
    const dWidth = Number(door.width || 90) * scale;
    const dX = Number(door.x || 0) * scale;
    const dY = Number(door.y || 0) * scale;

    let doorRectX = offsetX;
    let doorRectY = offsetY;
    let doorW = dWidth;
    let doorH = 16;

    if (wall === 'SOUTH') {
      doorRectX = offsetX + dX;
      doorRectY = offsetY + renderH - 8;
      doorW = dWidth;
      doorH = 16;
    } else if (wall === 'NORTH') {
      doorRectX = offsetX + dX;
      doorRectY = offsetY - 8;
      doorW = dWidth;
      doorH = 16;
    } else if (wall === 'WEST') {
      doorRectX = offsetX - 8;
      doorRectY = offsetY + (renderH - dY - dWidth);
      doorW = 16;
      doorH = dWidth;
    } else if (wall === 'EAST') {
      doorRectX = offsetX + renderW - 8;
      doorRectY = offsetY + (renderH - dY - dWidth);
      doorW = 16;
      doorH = dWidth;
    }

    svgContent += `
      <!-- Door ${idx + 1} (${wall}) -->
      <rect x="${doorRectX}" y="${doorRectY}" width="${doorW}" height="${doorH}" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2" rx="4" />
      <text x="${doorRectX + doorW / 2}" y="${doorRectY + (doorH > 16 ? doorH / 2 : -6)}" fill="#FFFFFF" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle">DOOR</text>
    `;
  });

  // Draw Structural Elements: Windows (Cyan #00FFFF)
  windows.forEach((win, idx) => {
    const wall = (win.wall || 'NORTH').toUpperCase();
    const wWidth = Number(win.width || 120) * scale;
    const wX = Number(win.x || 0) * scale;
    const wY = Number(win.y || 0) * scale;

    let winRectX = offsetX;
    let winRectY = offsetY;
    let winW = wWidth;
    let winH = 12;

    if (wall === 'NORTH') {
      winRectX = offsetX + wX;
      winRectY = offsetY - 6;
      winW = wWidth;
      winH = 12;
    } else if (wall === 'SOUTH') {
      winRectX = offsetX + wX;
      winRectY = offsetY + renderH - 6;
      winW = wWidth;
      winH = 12;
    } else if (wall === 'WEST') {
      winRectX = offsetX - 6;
      winRectY = offsetY + (renderH - wY - wWidth);
      winW = 12;
      winH = wWidth;
    } else if (wall === 'EAST') {
      winRectX = offsetX + renderW - 6;
      winRectY = offsetY + (renderH - wY - wWidth);
      winW = 12;
      winH = wWidth;
    }

    svgContent += `
      <!-- Window ${idx + 1} (${wall}) -->
      <rect x="${winRectX}" y="${winRectY}" width="${winW}" height="${winH}" fill="#00FFFF" stroke="#0284C7" stroke-width="2" rx="2" />
      <text x="${winRectX + winW / 2}" y="${winRectY - 6}" fill="#00FFFF" font-size="11" font-weight="bold" font-family="sans-serif" text-anchor="middle">WINDOW</text>
    `;
  });

  // Collect color legend
  const colorLegendMap = new Map();

  // Draw Furniture Allocations
  const allocations = layoutDiagram?.allocations || [];
  allocations.forEach((alloc, idx) => {
    const category = alloc.category || 'Furniture';
    const color = getCategoryColor(category);

    colorLegendMap.set(category, color);

    const pos = alloc.position || { x: roomWidth / 2, y: roomLength / 2 };
    const dims = alloc.dimensions || { width: 80, length: 60 };

    const cx = Number(pos.x || 0);
    const cy = Number(pos.y || 0);
    const rawW = Number(dims.width || dims.width_cm || 80);
    const rawL = Number(dims.length || dims.length_cm || 60);

    const rotation = Number(alloc.rotation || 0);

    // Swap width and length for 90 / 270 degree rotations
    const effectiveWidth = (rotation === 90 || rotation === 270) ? rawL : rawW;
    const effectiveLength = (rotation === 90 || rotation === 270) ? rawW : rawL;

    // Convert LLM center coordinates (X, Y cm) to SVG top-left pixel coordinates
    const pixelCenterX = offsetX + cx * scale;
    const pixelCenterY = offsetY + (roomLength - cy) * scale;

    const itemW_px = effectiveWidth * scale;
    const itemH_px = effectiveLength * scale;

    const pixelX = pixelCenterX - itemW_px / 2;
    const pixelY = pixelCenterY - itemH_px / 2;

    const name = alloc.productName || category;

    svgContent += `
      <!-- Item ${idx + 1}: ${name} (${category}) -->
      <g>
        <rect x="${pixelX}" y="${pixelY}" width="${itemW_px}" height="${itemH_px}" fill="${color}" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="2" rx="6" />
        ${(itemW_px > 35 && itemH_px > 25) ? `
          <text x="${pixelCenterX}" y="${pixelCenterY + 4}" fill="#FFFFFF" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle" style="pointer-events:none;">
            ${category.toUpperCase()}
          </text>` : ''}
      </g>
    `;
  });

  // Watermark / Brand Header
  svgContent += `
    <text x="${offsetX + 16}" y="${offsetY + 32}" fill="#94A3B8" font-size="14" font-weight="bold" font-family="sans-serif">SmartSpace AI — 2D Spatial Layout Mask</text>
    </svg>
  `;

  // Convert SVG string to PNG Buffer via sharp
  const svgBuffer = Buffer.from(svgContent);
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  const maskDataBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;

  // Save mask PNG to static uploads folder
  let maskImageUrl = null;
  try {
    const uploadDir = path.join(__dirname, '../../uploads/generations/masks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `mask_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, pngBuffer);
    maskImageUrl = `/uploads/generations/masks/${filename}`;
  } catch (err) {
    console.warn('[LayoutMaskGenerator] Could not write mask file to disk:', err.message);
  }

  const colorLegend = Array.from(colorLegendMap.entries()).map(([category, color]) => ({
    category,
    color
  }));

  return {
    maskDataBase64,
    maskImageUrl,
    colorLegend
  };
};

module.exports = {
  generateLayoutMask,
  getCategoryColor,
  CATEGORY_COLOR_MAP
};
