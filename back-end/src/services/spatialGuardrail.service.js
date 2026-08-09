const crypto = require('crypto');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Spatial Guardrail Service
 *
 * Validates whether selected products physically fit within the designated room
 * while adhering to interior design ergonomic principles. If the configuration
 * is viable, generates a 2D Layout Allocation Diagram (JSON Coordinate Map).
 *
 * Uses DeepSeek v3.2 via AWS Bedrock for spatial reasoning.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Deterministic Hash Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to normalize selected product objects for spatial processing & hashing
 */
const normalizeProductsForSpatial = (selectedProducts) => {
  return (selectedProducts || []).map((p) => {
    const pData = p.productData || p;
    const dims = pData.dimensions || pData.specifications?.dimensions || {};

    let w = Math.round(Number(dims.width || dims.w || 80));
    let d = Math.round(Number(dims.length || dims.depth || dims.d || dims.l || 60));
    let h = Math.round(Number(dims.height || dims.h || 80));

    const category = p.category || pData.classification?.canonicalCategory || pData.category || 'Furniture';
    const rawTitle = pData.basic?.name || pData.name || pData.title || category || 'Unknown';
    let title = String(rawTitle).trim()
      .replace(/^(Enjoy free delivery|Free shipping|Buy now and pay later|Get \d+% off|Special offer|Limited time offer)[^.]*\.\s*/i, '')
      .replace(/^(Enjoy free delivery|Free shipping|Buy now and pay later)[^.]*\s+/i, '');
    if (title.length > 90) {
      const short = title.slice(0, 85);
      const lastSpace = short.lastIndexOf(' ');
      title = (lastSpace > 30 ? short.slice(0, lastSpace) : short) + '…';
    }
    const catLower = category.toLowerCase();
    const titleLower = title.toLowerCase();

    // Data entry anomaly auto-correction for tall furniture items (Wardrobes, Bookshelves, Cabinets, Dressers, Armoires)
    // Scraped database records sometimes swap Depth/Length and Height (e.g., Depth 120cm, Height 40cm).
    const isTallItem = catLower.includes('wardrobe') || catLower.includes('armoire') ||
                       catLower.includes('bookshelf') || catLower.includes('cabinet') ||
                       catLower.includes('dresser') || titleLower.includes('wardrobe') ||
                       titleLower.includes('armoire');

    if (isTallItem) {
      // If height < depth or height < 100cm, height and depth were inverted in data entry
      if (h < d || h < 100) {
        const temp = h;
        h = d;
        d = temp;
      }
      // If depth is still excessively deep for a wardrobe (> 80cm) and height is standard (>= 120cm), sanitize depth to standard wardrobe depth (60cm)
      if (d > 80 && h >= 120) {
        d = 60;
      }
      // Ensure wardrobe/tall item has realistic minimum height if still below 150cm
      if (h < 150) {
        h = 200;
      }
    }

    return {
      productId: p.productId ? (p.productId._id ? String(p.productId._id) : String(p.productId)) : (pData._id ? String(pData._id) : ''),
      title,
      category,
      dimensions: {
        width: w,
        length: d,
        height: h
      },
      quantity: p.quantity || 1,
      action: p.action || pData.action || null,
      isCoreItem: ['Sofa', 'Bed', 'Dining Table', 'Desk', 'TV Unit', 'Wardrobe'].includes(
        category
      )
    };
  });
};

/**
 * Compute deterministic hash of selected products and room ID to detect layout changes.
 *
 * @param {string|Object} roomId - Room ID or Room object
 * @param {Array<Object>} selectedProducts - Selected products array
 * @returns {string} SHA-256 hex digest
 */
const computeProductsHash = (roomId, selectedProducts) => {
  const cleanRoomId = (typeof roomId === 'object' && roomId !== null)
    ? String(roomId._id || roomId.id || '')
    : String(roomId || '');

  const normalized = normalizeProductsForSpatial(selectedProducts);

  const entries = normalized
    .map((p) => `cat:${p.category}_id:${p.productId}_qty:${p.quantity}_act:${p.action || ''}_w:${p.dimensions?.width || ''}_l:${p.dimensions?.length || ''}`)
    .sort();

  const str = `roomId:${cleanRoomId}|${entries.join('|')}`;
  return crypto.createHash('sha256').update(str).digest('hex');
};

// ─────────────────────────────────────────────────────────────────────────────
// 1b. Violation Normalizer (sanitize AI model output for Mongoose schema)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize spatialViolations array entries to always match the Mongoose embedded schema:
 *   { type: String, description: String, conflictingProductIds: [String] }
 * AI models sometimes return plain strings or objects with missing/extra fields.
 */
const normalizeSpatialViolations = (violations) => {
  if (!Array.isArray(violations)) return [];
  return violations.map((v) => {
    if (typeof v === 'string') {
      return { type: 'WALKWAY_BLOCKAGE', description: v, conflictingProductIds: [] };
    }
    if (typeof v === 'object' && v !== null) {
      return {
        type: typeof v.type === 'string' ? v.type : 'WALKWAY_BLOCKAGE',
        description: typeof v.description === 'string' ? v.description : JSON.stringify(v),
        conflictingProductIds: Array.isArray(v.conflictingProductIds)
          ? v.conflictingProductIds.map(String)
          : []
      };
    }
    return { type: 'WALKWAY_BLOCKAGE', description: String(v), conflictingProductIds: [] };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. System Prompt Builder for DeepSeek v3.2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the system prompt that instructs DeepSeek v3.2 to act as an
 * Expert Architectural Spatial Planner & Ergonomics Engine.
 *
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {string} System prompt text
 */
const buildSpatialSystemPrompt = (generationType = 'CREATE_FROM_SCRATCH') => {
  const isEnhance = generationType === 'ENHANCE_ROOM' || generationType === 'ENHANCE_EXISTING';
  const enhanceDirectives = isEnhance
    ? `\n## ENHANCE_ROOM MODE DIRECTIVES:
- SPECIAL MODE: ENHANCE_ROOM (Room Enhancement & Restyling)
- The room ALREADY CONTAINS existing furniture.
- Products have actions attached:
  * 'ADD': New item to be placed into available empty floor space.
  * 'REPLACE': Swapping an existing furniture piece for this new item (the old item is removed, freeing up its spot).
  * 'KEEP': An item already present in the room layout that remains.
  * 'REMOVE': An existing item slated for removal (frees up floor space).
- EVALUATION RULES FOR ENHANCE_ROOM:
  1. Only evaluate new items (action 'ADD' or 'REPLACE') to ensure they fit in available floor space or replace existing furniture without overlapping other items.
  2. Items with action 'REMOVE' expand available floor space and free up floor capacity.
  3. Items with action 'KEEP' already exist in the room; do NOT flag them as violating space unless a new 'ADD' item literally overlaps them.
`
    : '';

  return `You are an Expert Architectural Spatial Planner & Ergonomics Engine.
Your EXCLUSIVE task is to evaluate whether a set of furniture products physically fit inside a room with specific dimensions and structural elements (doors and windows), and if they do, compute a 2D floor layout with exact coordinates.
${enhanceDirectives}
## STRUCTURAL ELEMENTS & CLEARANCES (DOORS & WINDOWS):
1. DOOR CLEARANCE (CRITICAL RULE):
   - You MUST maintain at least 80cm of clear, unobstructed space in front of all doors (door swing zone and entry path).
   - NEVER place any floor-standing furniture overlapping a door's bounding box or within 80cm directly in front of a door.
   - If furniture blocks a door, set "isApplicable": false and flag "DOOR_IMPACT" in spatialViolations.

2. WINDOW ACCESSIBILITY & HEIGHT CLEARANCE:
   - Do NOT place tall furniture (height > 90cm, such as wardrobes, tall bookcases, or tall dressers) directly in front of window bounding boxes.
   - Low-profile furniture (height <= 90cm, such as low beds, nightstands, or low desks) may be placed under windows if wall space requires.
   - If tall furniture blocks a window, set "isApplicable": false and flag "WINDOW_BLOCKAGE" in spatialViolations.

## Physical Dimension Fitting & Placement Directives
1. Viability First (isApplicable):
   - A layout is VALID (isApplicable = true) as long as all floor-standing furniture items physically fit inside the room boundary perimeter WITHOUT literally overlapping each other's 2D bounding boxes, extending past walls, or blocking doors/windows.
   - Multiple items of the same category (e.g. 2 beds, 3 nightstands) are ALLOWED if their combined dimensions physically fit inside the room.
   - If items truly cannot fit without overlapping, set "isApplicable": false with spatialViolations.

2. ITEMS THAT NEVER CAUSE VIOLATIONS:
   - Rugs, carpets, and floor mats lie FLAT on the floor under furniture. They NEVER cause clearance blockages, walkway obstructions, or spatial conflicts. Do NOT include them in violations or suggestedRemovals.
   - Lamps, pillows, cushions, vases, and small decor items sit ON TOP of other furniture surfaces. They NEVER cause spatial violations.
   - Curtains, blinds, and wall art hang on walls or windows. They NEVER cause floor walkway blockages.
   - Nightstands placed beside a bed is the standard expected configuration — NOT a violation.

3. MULTIPLE ITEMS (Quantity > 1):
   - If placing identical items (e.g., 2 nightstands, 2 curtains, 4 chairs), they MUST have completely different X or Y center coordinates. NEVER place two items at the exact same (X, Y) point.

4. FULL 4-WALL DIRECTIONAL PLACEMENT (NORTH, WEST, SOUTH, EAST):
   - You MUST utilize ALL FOUR ROOM WALL DIRECTIONS (NORTH, WEST, SOUTH, EAST) to create a balanced, spacious architectural room layout. Do NOT cluster all furniture items against only 1 or 2 walls!
   - Wall Direction Definitions:
     * NORTH WALL (Back Wall, Y = roomLength cm): Primary focal wall for main central items (e.g. Bed headboard, TV Console).
     * WEST WALL (Left Wall, X = 0 cm): Active placement wall for side items, dressers, desks, nightstands, or secondary seating.
     * EAST WALL (Right Wall, X = roomWidth cm): Active placement wall for wardrobes, storage units, armoires, tall cabinets, or accent mirrors.
     * SOUTH WALL (Front/Foreground Wall, Y = 0 cm): Foreground wall area; place lower-profile side items (e.g. storage bench, ottoman, side chair, console table) ensuring clear entry pathways.
   - Position wardrobes flat against any of the available walls where space allows, avoiding doors and windows.

5. VIOLATION CRITERIA (ONLY flag these as violations):
   - Mark "isApplicable": false ONLY if:
     a) Any single item's width or length exceeds the room wall it would be placed against.
     b) Two floor-standing furniture items (NOT rugs/lamps/curtains) literally overlap in 2D bounding-box space.
     c) Total floor-standing furniture footprint (EXCLUDING rugs/lamps/decor/curtains) exceeds 70% of total floor area.
     d) Any floor-standing furniture blocks a door boundary or is within 80cm of front door swing area.
     e) Any tall furniture (height > 90cm) is placed directly in front of a window bounding box.

## FUNCTIONAL ZONING & RELATIONAL RULES (MANDATORY):
The layout MUST make logical sense for human use and ergonomics. You must identify the "Primary Anchor" of the room (e.g., Sofa, Bed, Dining Table, Desk) and logically organize all other items around it.

1. PRIMARY ANCHOR PLACEMENT & CLEARANCE:
   - Identify the primary functional item (e.g., the Bed in a bedroom, the main Sofa in a living room, the Dining Table in a dining room, the Desk in an office).
   - Center this anchor item along a primary solid wall (or the center of the room for dining tables).
   - You MUST maintain at least 60cm of clear walking space on all active sides of the anchor (e.g., both sides of a bed, the front and sides of a sofa, all around a dining table). NEVER push these items flush into side corners.

2. SYMMETRY & FLANKING (SUPPORT ITEMS):
   - Items designed to support the anchor (e.g., Nightstands, End Tables, Side Tables) MUST be placed immediately adjacent to the anchor.
   - If there are two identical support items (e.g., 2 nightstands, 2 end tables), they MUST perfectly flank the anchor symmetrically on the left and right.
   - FLANKING MATH: Left Item Center X = (Anchor X) - (Anchor Width / 2) - (Item Width / 2). Right Item Center X = (Anchor X) + (Anchor Width / 2) + (Item Width / 2). They must share the anchor's Y coordinate.

3. DIRECT LINE OF SIGHT & STANDALONE TV WALL MOUNTING:
   - Focal units (e.g., TV Consoles, Media Units, TV Screens) MUST be placed on the wall directly OPPOSITE the primary seating/sleeping anchor (Bed or Sofa).
   - If a Television / TV Screen is present WITHOUT a TV Unit/Console, it MUST be wall-mounted on the wall directly opposite the Bed or Sofa at eye level (Z = 120cm - 150cm).
   - The TV / Focal Unit's center axis MUST match the primary anchor's center axis (X or Y) so a human lying on the bed or sitting on the sofa looks directly straight at it.
   - NEVER place a TV on the same wall as the sofa/bed, float it in mid-air without wall mounting, or place it at an awkward viewing angle.
   - Place coffee tables exactly in the center space between the Sofa and the TV Unit/Screen.

4. TALL STORAGE & BULKY ITEMS:
   - Tall items (Wardrobes, Bookcases, Display Cabinets, Filing Cabinets) must be placed in corners or along secondary side walls.
   - They must NEVER block windows, doors, or the direct line of sight between the Primary Anchor and the Focal Unit.

## Coordinate Plane & Origin
- Define (0, 0, 0) as the bottom-left floor corner of the room.
- X-axis = Room Width (0 to roomWidth cm).
- Y-axis = Room Length (0 to roomLength cm).
- Z-axis = Room Height (0 to roomHeight cm).
- All position values represent the CENTER of the item in centimeters.

## CRITICAL SPATIAL MATH FORMULAS (YOU MUST USE THESE):
1. Bounding Box Collision Check:
   An item's physical footprint spans from [X - (width/2)] to [X + (width/2)] and [Y - (length/2)] to [Y + (length/2)]. You MUST verify that these ranges do not intersect with any other floor-standing item, door area, or window boundary.

2. Wall Anchoring Formulas:
   To place an item flush against a wall, its center coordinate MUST be calculated using its dimensions:
   - WEST WALL (Left): X = (width / 2)
   - EAST WALL (Right): X = roomWidth - (width / 2)
   - SOUTH WALL (Front): Y = (length / 2)
   - NORTH WALL (Back): Y = roomLength - (length / 2)

3. Rotation Logic:
   If an item is rotated 90 or 270 degrees, its physical Width and Length SWAP. You must use the SWAPPED dimensions when checking wall boundaries and bounding box overlaps.

## Camera Frustum Calculation
- Assume room photo perspective is shot from a top corner (e.g., X=10, Y=10, Z=170, angled at 45°).
- Evaluate if items fall behind the camera or are clipped by the frame.
- Mark items accordingly: FULL, PARTIAL, or HIDDEN_BEHIND_CAMERA.

## Output Requirements
You MUST return STRICT JSON ONLY matching the exact schema below.
Do NOT include any markdown wrapping, code fences, conversational text, or explanations.
Return ONLY the raw JSON object.

### JSON Schema:
{
  "isApplicable": boolean,
  "layoutDiagram": {
    "roomDimensions": { "length": number, "width": number, "height": number, "unit": "cm" },
    "totalRoomArea": number,
    "totalFurnitureFootprint": number,
    "usableFloorPercentage": number,
    "allocations": [
      {
        "productId": "string",
        "productName": "string",
        "category": "string",
        "position": { "x": number, "y": number, "z": number },
        "dimensions": { "length": number, "width": number, "height": number },
        "rotation": number,
        "placedAgainstWall": "NORTH" | "SOUTH" | "EAST" | "WEST" | "NONE",
        "cameraVisibility": "FULL" | "PARTIAL" | "HIDDEN_BEHIND_CAMERA",
        "designRulesApplied": ["string"]
      }
    ]
  },
  "naturalLanguagePrompt": "string (a descriptive, natural language summary of where every item is placed in the room, wall alignments, rotations, and spatial relationships for image generation system prompt)",
  "spatialViolations": [
    {
      "type": "DIMENSION_OVERFLOW" | "WALKWAY_BLOCKAGE" | "DOOR_IMPACT" | "WINDOW_BLOCKAGE" | "DRAWER_CLEARANCE_BLOCKAGE",
      "description": "string",
      "conflictingProductIds": ["string"]
    }
  ],
  "suggestedRemovals": ["productId1", "productId2"]
}

### Rules:
- Assign "placedAgainstWall" explicitly as "NORTH", "SOUTH", "EAST", or "WEST" for items placed against walls, distributing furniture across different walls.
- If products fit within room boundaries without exceeding room category or spatial limits, set "isApplicable": true, provide full "layoutDiagram", generate "naturalLanguagePrompt", and set "spatialViolations" to [].
- If products do NOT fit or exceed realistic room capacity, set "isApplicable": false, provide partial "layoutDiagram", populate "spatialViolations" with detailed failure reasons, and populate "suggestedRemovals" with product IDs that should be removed to make the layout work.
- Each product entry in "allocations" must appear exactly once per quantity unit (if quantity=2, include two separate allocation entries for that product).
- Rotation values: 0, 90, 180, or 270 degrees only.
- "position" coordinates are the CENTER of the item.`;
};

/**
 * Build the user prompt containing room metrics, structural elements (doors/windows), and selected product details.
 *
 * @param {Object} roomMetrics - { length, width, height, doors, windows } in cm
 * @param {Array<Object>} products - Array of product objects with dimensions
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {string} User prompt text
 */
const buildSpatialUserPrompt = (roomMetrics, products, generationType = 'CREATE_FROM_SCRATCH', previousFeedbackHistory = []) => {
  const isEnhance = generationType === 'ENHANCE_ROOM' || generationType === 'ENHANCE_EXISTING';
  const productList = products.map((p, idx) => {
    const pData = p.productData || p;
    const dims = p.dimensions || pData.dimensions || pData.specifications?.dimensions || {};
    const w = dims.width || dims.w || 0;
    const d = dims.length || dims.depth || dims.d || dims.l || 0;
    const h = dims.height || dims.h || 0;
    const qty = p.quantity || 1;
    const title = p.title || pData.basic?.name || pData.name || pData.title || p.category || 'Unknown';
    const category = p.category || pData.classification?.canonicalCategory || pData.category || 'Furniture';
    const action = p.action || pData.action || (isEnhance ? 'ADD' : null);
    const isCoreItem = p.isCoreItem !== undefined
      ? p.isCoreItem
      : ['Sofa', 'Bed', 'Dining Table', 'Desk', 'TV Unit', 'Wardrobe'].includes(category);

    return `${idx + 1}. Product ID: "${p.productId || pData._id || idx}"
   Title: "${title}"
   Category: "${category}"
   Dimensions: ${w}cm (W) × ${d}cm (D) × ${h}cm (H)
   Quantity: ${qty}
   ${action ? `Action: ${action}\n   ` : ''}Is Core Item: ${isCoreItem ? 'Yes' : 'No'}`;
  }).join('\n');

  const doorsText = (roomMetrics.doors && roomMetrics.doors.length > 0)
    ? roomMetrics.doors.map((d, i) => `  - Door ${i + 1}: wall="${d.wall || 'SOUTH'}", position (X=${d.x || 0}cm, Y=${d.y || 0}cm), width=${d.width || 90}cm, height=${d.height || 210}cm`).join('\n')
    : '  - None specified (assume standard room entrance at SOUTH wall)';

  const windowsText = (roomMetrics.windows && roomMetrics.windows.length > 0)
    ? roomMetrics.windows.map((w, i) => `  - Window ${i + 1}: wall="${w.wall || 'NORTH'}", position (X=${w.x || 0}cm, Y=${w.y || 0}cm), width=${w.width || 120}cm, height=${w.height || 140}cm`).join('\n')
    : '  - None specified';

  let feedbackSection = '';
  if (previousFeedbackHistory && previousFeedbackHistory.length > 0) {
    feedbackSection = `\n\n## 🚨 PREVIOUS ATTEMPT SELF-CORRECTION FEEDBACK (REJECTED BY REALISM CRITIC)
Your previous layout attempt(s) were REJECTED by the Stage 2 Realism Audit or contained physical conflicts. You MUST self-correct and adjust coordinates in this attempt to resolve all reported issues:

${previousFeedbackHistory.map(fb => `
### Attempt ${fb.iteration} Rejection Reason:
- Critic Feedback: "${fb.criticFeedback}"
- Conflicting Allocations from Attempt ${fb.iteration}: ${JSON.stringify(fb.proposedLayout?.allocations || [])}
- Detected Violations: ${JSON.stringify(fb.violations || [])}
`).join('\n')}

CRITICAL SELF-CORRECTION DIRECTIVES FOR THIS RETRY:
1. Do NOT place two floor-standing items at identical or overlapping coordinates!
2. Ensure every floor-standing furniture item has distinct, non-overlapping (x_cm, y_cm) center coordinates.
3. Verify that all items physically fit within room dimensions (${roomMetrics.width}cm W x ${roomMetrics.length}cm L).
4. Maintain required clearance in front of wardrobes, beds, and doorways.
5. Re-calculate and return a corrected layout diagram fixing all overlaps mentioned above.`;
  }

  return `## Room Metrics
- Length: ${roomMetrics.length}cm
- Width: ${roomMetrics.width}cm
- Height: ${roomMetrics.height}cm
- Total Floor Area: ${((roomMetrics.length * roomMetrics.width) / 10000).toFixed(2)} m²
- Generation Mode: ${generationType}

## Room Structural Elements (DO NOT BLOCK)
Doors:
${doorsText}

Windows:
${windowsText}

## Selected Products (${products.length} unique items)
${productList}${feedbackSection}

Evaluate whether all products fit within this room while respecting structural elements (doors and windows) and ergonomic clearances. Return the JSON result.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bedrock API Integration (DeepSeek v3.2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fallback algorithmic spatial evaluation engine.
 * Computes deterministic physical layout & clearance checks when external AI APIs are unavailable.
 */
const evaluateAlgorithmicSpatialSafety = (roomMetrics, products, generationType = 'CREATE_FROM_SCRATCH') => {
  console.log(`[SpatialGuardrail] 🛠️ Executing local deterministic spatial algorithm fallback (mode=${generationType})...`);
  
  const roomAreaSqM = (roomMetrics.length * roomMetrics.width) / 10000;
  const violations = [];
  const allocations = [];
  
  let currentX = 20;
  let currentY = 20;
  let maxRowHeight = 0;
  let totalProductAreaSqM = 0;

  const isRugOrMat = (prod) => {
    const cat = (prod.category || '').toLowerCase();
    const title = (prod.title || '').toLowerCase();
    return (
      cat.includes('rug') || cat.includes('carpet') || cat.includes('mat') || cat.includes('flooring') || cat.includes('سجاد') || cat.includes('موكيت') ||
      title.includes('rug') || title.includes('carpet') || title.includes('mat') || title.includes('سجادة') || title.includes('سجاد') || title.includes('موكيت')
    );
  };

  const isSurfaceOrDecorItem = (prod) => {
    const cat = (prod.category || '').toLowerCase();
    const title = (prod.title || '').toLowerCase();
    return (
      cat.includes('decor') || cat.includes('lighting') || cat.includes('lamp') || cat.includes('pillow') || cat.includes('cushion') || cat.includes('vase') || cat.includes('art') || cat.includes('mirror') || cat.includes('accessory') || cat.includes('plant') || cat.includes('curtain') || cat.includes('blind') || cat.includes('drape') || cat.includes('ستائر') || cat.includes('ستارة') ||
      title.includes('lamp') || title.includes('pillow') || title.includes('cushion') || title.includes('vase') || title.includes('curtain') || title.includes('blind') || title.includes('drape') || title.includes('مصباح') || title.includes('وسادة') || title.includes('ديكور') || title.includes('فازة') || title.includes('مرآة') || title.includes('ساعة') || title.includes('ستارة') || title.includes('ستائر')
    );
  };

  products.forEach((prod) => {
    if (prod.action === 'REMOVE') return; // Skip items being removed in ENHANCE_ROOM

    const w = prod.dimensions?.width || 80;
    const l = prod.dimensions?.length || 60;
    const h = prod.dimensions?.height || 80;
    const qty = prod.quantity || 1;

    // Check individual item height against room ceiling
    if (h > roomMetrics.height) {
      violations.push({
        type: 'DIMENSION_OVERFLOW',
        description: `"${prod.title}" height (${h}cm) exceeds room ceiling height (${roomMetrics.height}cm).`,
        conflictingProductIds: [prod.productId]
      });
    }

    // 1. Rugs & Floor Coverings (Flat on floor under furniture)
    if (isRugOrMat(prod)) {
      if (w > roomMetrics.width || l > roomMetrics.length) {
        violations.push({
          type: 'DIMENSION_OVERFLOW',
          description: `Rug "${prod.title}" (${w}x${l}cm) exceeds room boundary (${roomMetrics.width}x${roomMetrics.length}cm).`,
          conflictingProductIds: [prod.productId]
        });
      }

      for (let q = 0; q < qty; q++) {
        allocations.push({
          productId: prod.productId,
          title: prod.title,
          category: prod.category,
          coordinates: {
            x_cm: Math.round(roomMetrics.width / 2),
            y_cm: Math.round(roomMetrics.length / 2),
            z_cm: 0,
            rotation_deg: 0
          },
          dimensions: { width_cm: w, length_cm: l, height_cm: h },
          designRulesApplied: ['FLAT_FLOOR_RUG_UNDER_FURNITURE']
        });
      }
      return;
    }

    // 2. Decor & Tabletop Items (Rest on furniture surfaces)
    if (isSurfaceOrDecorItem(prod)) {
      for (let q = 0; q < qty; q++) {
        allocations.push({
          productId: prod.productId,
          title: prod.title,
          category: prod.category,
          coordinates: {
            x_cm: 50,
            y_cm: 50,
            z_cm: 75,
            rotation_deg: 0
          },
          dimensions: { width_cm: w, length_cm: l, height_cm: h },
          designRulesApplied: ['SURFACE_OR_TABLETOP_ITEM']
        });
      }
      return;
    }

    // 3. Floor-Standing Furniture Items
    for (let q = 0; q < qty; q++) {
      const itemAreaSqM = (w * l) / 10000;
      totalProductAreaSqM += itemAreaSqM;

      const catLower = (prod.category || '').toLowerCase();
      let wallAssigned = 'NORTH';
      if (catLower.includes('bed') || catLower.includes('sofa')) {
        wallAssigned = 'NORTH';
      } else if (catLower.includes('nightstand') || catLower.includes('bedside')) {
        wallAssigned = 'NORTH';
      } else if (catLower.includes('wardrobe') || catLower.includes('armoire') || catLower.includes('closet')) {
        wallAssigned = 'EAST';
      } else if (catLower.includes('desk') || catLower.includes('dresser') || catLower.includes('chair') || catLower.includes('table')) {
        wallAssigned = 'WEST';
      } else {
        wallAssigned = 'SOUTH';
      }

      // Wrap around grid rows if item exceeds room width
      if (currentX + w > roomMetrics.width - 20) {
        currentX = 20;
        currentY += maxRowHeight + 30; // 30cm clearance between rows
        maxRowHeight = 0;
      }

      // Check if Y exceeds room length
      if (currentY + l > roomMetrics.length - 20) {
        violations.push({
          type: 'WALKWAY_BLOCKAGE',
          description: `Insufficient floor area for "${prod.title}". Item extends past room boundary (${roomMetrics.length}cm).`,
          conflictingProductIds: [prod.productId]
        });
      }

      allocations.push({
        productId: prod.productId,
        title: prod.title,
        category: prod.category,
        coordinates: {
          x_cm: currentX,
          y_cm: currentY,
          z_cm: 0,
          rotation_deg: 0
        },
        dimensions: { width_cm: w, length_cm: l, height_cm: h },
        placedAgainstWall: wallAssigned
      });

      currentX += w + 20;
      if (l > maxRowHeight) maxRowHeight = l;
    }
  });

  // Check total footprint ratio vs available floor area (70% max density rule)
  const maxAllowedAreaSqM = roomAreaSqM * 0.70;
  if (totalProductAreaSqM > maxAllowedAreaSqM) {
    violations.push({
      type: 'DIMENSION_OVERFLOW',
      description: `Total furniture footprint (${totalProductAreaSqM.toFixed(2)}m²) exceeds maximum recommended floor capacity (${maxAllowedAreaSqM.toFixed(2)}m²) for this ${roomMetrics.length}x${roomMetrics.width}cm room.`,
      conflictingProductIds: products.map(p => p.productId)
    });
  }

  const isApplicable = violations.length === 0;

  const layoutDiagram = {
    roomDimensions: {
      length_cm: roomMetrics.length,
      width_cm: roomMetrics.width,
      height_cm: roomMetrics.height
    },
    allocations
  };

  const naturalLanguagePrompt = translateLayoutToPromptDirectives(layoutDiagram);

  return {
    isApplicable,
    spatialViolations: violations,
    suggestedRemovals: Array.from(new Set(violations.flatMap(v => v.conflictingProductIds || []))),
    layoutDiagram,
    naturalLanguagePrompt
  };
};

/**
 * Call DeepSeek v3.2 via AWS Bedrock to validate spatial applicability.
 *
 * @param {Object} roomMetrics - { length, width, height } in cm
 * @param {Array<Object>} products - Normalized product array
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {Promise<Object>} Parsed spatial guardrail result
 */
/**
 * Stage 1: Invoke Spatial Generator Model
 * Performs 2D layout allocation based on room metrics, product dimensions, and previous feedback history.
 *
 * @param {Object} roomMetrics - Room dimensions { length, width, height, doors, windows }
 * @param {Array<Object>} products - Normalized product array
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @param {Array<Object>} previousFeedbackHistory - Array of past attempt failure feedback
 * @returns {Promise<Object>} Stage 1 layout result object
 */
const invokeSpatialStage1 = async (roomMetrics, products, generationType = 'CREATE_FROM_SCRATCH', previousFeedbackHistory = []) => {
  const apiKey = process.env.BEDROCK_API_KEY;
  const primaryModel = process.env.STEP3_MODEL_ID || 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';
  
  const baseUrl = process.env.SPATIAL_API_URL || 'http://apiaccess.iti.net.eg/api/v1';
  let endpointUrl = baseUrl;
  if (!endpointUrl.endsWith('/student/chat') && !endpointUrl.endsWith('/chat/completions')) {
    endpointUrl = `${baseUrl.replace(/\/$/, '')}/student/chat`;
  }

  if (!apiKey) {
    console.warn('[SpatialGuardrail Stage 1] BEDROCK_API_KEY not configured. Falling back to algorithmic engine.');
    return evaluateAlgorithmicSpatialSafety(roomMetrics, products, generationType);
  }

  const systemPrompt = buildSpatialSystemPrompt(generationType);
  const userPrompt = buildSpatialUserPrompt(roomMetrics, products, generationType, previousFeedbackHistory);

  const callModelApi = async (targetModel) => {
    return await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model_id: targetModel,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system_prompt: systemPrompt,
        max_tokens: 40960 
      })
    });
  };

  const candidateModels = Array.from(new Set([
    primaryModel,
    'deepseek.v3-v1:0'
  ]));

  let response = null;
  let lastErrorMsg = '';

  for (const modelId of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[SpatialGuardrail Stage 1] Invoking model "${modelId}" (attempt ${attempt}) via "${endpointUrl}"...`);
        response = await callModelApi(modelId);
        if (response.ok) break;

        lastErrorMsg = await response.text();
        console.warn(`[SpatialGuardrail Stage 1] Model call to "${modelId}" (attempt ${attempt}) returned HTTP ${response.status}: ${lastErrorMsg.slice(0, 150)}`);
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        lastErrorMsg = err.message;
        console.warn(`[SpatialGuardrail Stage 1] Fetch exception invoking "${modelId}": ${err.message}`);
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    if (response && response.ok) break;
  }

  if (!response || !response.ok) {
    console.error(`[SpatialGuardrail Stage 1] All external spatial model calls failed. ${lastErrorMsg}`);
    console.log('[SpatialGuardrail Stage 1] 🔄 Activating local algorithmic spatial safety engine fallback...');
    return evaluateAlgorithmicSpatialSafety(roomMetrics, products);
  }

  const data = await response.json();
  console.log('[SpatialGuardrail Stage 1] Raw API Response:', JSON.stringify(data).slice(0, 400));

  let parsed = null;

  if (data && typeof data === 'object' && typeof data.isApplicable === 'boolean') {
    parsed = data;
  } else {
    let rawContent = 
      data.output_text ||
      data.response || 
      data.content || 
      data.choices?.[0]?.message?.content || 
      data.choices?.[0]?.text || 
      data.text ||
      data.completion || 
      data.output || 
      data.message?.content || 
      data.data?.content || 
      data.result;

    if (Array.isArray(rawContent)) {
      rawContent = rawContent.map((block) => (typeof block === 'string' ? block : block.text || block.content || '')).join('');
    }

    if (typeof rawContent === 'object' && rawContent !== null && typeof rawContent.isApplicable === 'boolean') {
      parsed = rawContent;
    } else if (typeof rawContent === 'string' && rawContent.trim()) {
      let str = rawContent.trim();
      
      if (str.startsWith('```json')) str = str.slice(7);
      else if (str.startsWith('```')) str = str.slice(3);
      if (str.endsWith('```')) str = str.slice(0, -3);
      str = str.trim();

      const jsonMatch = str.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        str = jsonMatch[0];
      }

      try {
        parsed = JSON.parse(str);
      } catch (err) {
        console.error('[SpatialGuardrail Stage 1] Failed to parse extracted JSON string:', str.slice(0, 300));
      }
    }
  }

  if (!parsed || typeof parsed.isApplicable !== 'boolean') {
    console.error('[SpatialGuardrail Stage 1] Invalid or unparseable AI model response structure. Activating local fallback engine.');
    return evaluateAlgorithmicSpatialSafety(roomMetrics, products, generationType);
  }

  return parsed;
};

/**
 * Stage 2: Spatial Realism Validator (Critic Guardrail)
 * Passes the Stage 1 proposed layout to a second model to audit if it is realistic in real life.
 */
const validateRealismWithCriticModel = async (roomMetrics, products, stage1Result) => {
  const apiKey = process.env.BEDROCK_API_KEY;
  const baseUrl = process.env.SPATIAL_API_URL || 'http://apiaccess.iti.net.eg/api/v1';
  let endpointUrl = baseUrl;
  if (!endpointUrl.endsWith('/student/chat') && !endpointUrl.endsWith('/chat/completions')) {
    endpointUrl = `${baseUrl.replace(/\/$/, '')}/student/chat`;
  }

  const validatorModel = process.env.VALIDATOR_MODEL_ID || 'deepseek.v3-v1:0';

  const criticSystemPrompt = `You are a Practical Interior Layout Reviewer.
Your ONLY job is to check whether a proposed furniture layout is PHYSICALLY POSSIBLE in real life — meaning items actually fit inside the room without literally overlapping each other.

Room: ${roomMetrics.width}cm (W) x ${roomMetrics.length}cm (L) x ${roomMetrics.height}cm (H).

## CRITICAL RULES — READ CAREFULLY:
- You are NOT an ergonomics optimizer. Do NOT reject layouts for being "tight" or "cozy."
- A standard bedroom with 1 bed, 1 wardrobe, 1 rug, and 2 nightstands is ALWAYS realistic. This is the most common bedroom furniture set in the world.
- Rugs and carpets lie FLAT on the floor UNDER furniture. They NEVER cause walkway blockages, NEVER conflict with other items, and must NEVER appear in violations or suggestedRemovals.
- Lamps, pillows, cushions, and small decor items sit ON TOP of furniture surfaces. They NEVER cause spatial violations.
- Wardrobes only need clearance on the DOOR-FACING side (the side not against the wall). 30cm is sufficient clearance for sliding doors. 50cm for swing doors.
- Nightstands/bedside tables placed next to a bed is the standard expected configuration — this is NOT a violation.

## ONLY flag "isRealistic": false if ANY of these are true:
1. Two floor-standing furniture items (NOT rugs, NOT lamps) have bounding boxes that literally OVERLAP in 2D space (their x/y ranges intersect).
2. A single furniture item's width or length exceeds the room wall it is placed against.
3. The total combined floor-standing furniture area (EXCLUDING rugs, lamps, decor) exceeds 70% of total room floor area.

## If NONE of those 3 conditions are met, you MUST return "isRealistic": true.

Return STRICT JSON ONLY:
{
  "isRealistic": boolean,
  "realismScore": number (0-100, where 100 = perfect, 70+ = acceptable, below 40 = reject),
  "criticism": "string (brief summary)",
  "violations": [],
  "suggestedRemovals": []
}`;

  const criticUserPrompt = `Room Dimensions: ${roomMetrics.width}cm (W) x ${roomMetrics.length}cm (L) x ${roomMetrics.height}cm (H).

Products requested:
${JSON.stringify(products, null, 2)}

Proposed Stage 1 Layout:
${JSON.stringify(stage1Result.layoutDiagram, null, 2)}

Natural Language Directive proposed:
"${stage1Result.naturalLanguagePrompt}"

Audit this proposed layout carefully. Is it realistic in real life? Return JSON matching schema.`;

  try {
    console.log(`[SpatialGuardrail] 🔍 Stage 2: Auditing proposed layout with Critic Model "${validatorModel}"...`);
    const resp = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model_id: validatorModel,
        messages: [{ role: 'user', content: criticUserPrompt }],
        system_prompt: criticSystemPrompt,
        max_tokens: 4096
      })
    });

    if (!resp.ok) {
      console.warn(`[SpatialGuardrail] Stage 2 Realism Critic returned HTTP ${resp.status}. Accepting Stage 1 result.`);
      return { isRealistic: true, criticism: 'Critic model unavailable' };
    }

    const data = await resp.json();
    let rawContent = data.output_text || data.response || data.content || data.choices?.[0]?.message?.content || data.text;
    if (typeof rawContent === 'string') {
      let str = rawContent.trim();
      if (str.startsWith('```json')) str = str.slice(7);
      if (str.startsWith('```')) str = str.slice(3);
      if (str.endsWith('```')) str = str.slice(0, -3);
      const jsonMatch = str.trim().match(/\{[\s\S]*\}/);
      if (jsonMatch) str = jsonMatch[0];
      const criticParsed = JSON.parse(str);
      console.log(`[SpatialGuardrail] 🔍 Stage 2 Audit Result: isRealistic=${criticParsed.isRealistic}, score=${criticParsed.realismScore}`);
      return criticParsed;
    }
  } catch (err) {
    console.warn(`[SpatialGuardrail] Realism Critic check error: ${err.message}. Accepting Stage 1 result.`);
  }

  return { isRealistic: true };
};

/**
 * Main Spatial Model Orchestrator
 * Executes a 3-iteration self-correction loop between Stage 1 (Generator) and Stage 2 (Critic).
 *
 * @param {Object} roomMetrics - { length, width, height, doors, windows } in cm
 * @param {Array<Object>} products - Normalized product array
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {Promise<Object>} Final parsed spatial guardrail result
 */
const invokeSpatialModel = async (roomMetrics, products, generationType = 'CREATE_FROM_SCRATCH') => {
  const MAX_ITERATIONS = 3;
  const feedbackHistory = [];
  let finalResult = null;

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n=================================================================`);
    console.log(`[SpatialGuardrail] 🔄 --- SPATIAL GUARDRAIL ITERATION ${iteration}/${MAX_ITERATIONS} ---`);
    console.log(`=================================================================`);

    // Stage 1: Generator
    const stage1Result = await invokeSpatialStage1(roomMetrics, products, generationType, feedbackHistory);

    if (!stage1Result || typeof stage1Result.isApplicable !== 'boolean') {
      console.warn(`[SpatialGuardrail] Iteration ${iteration}: Stage 1 produced unparseable response. Activating fallback engine.`);
      return evaluateAlgorithmicSpatialSafety(roomMetrics, products, generationType);
    }

    if (stage1Result.isApplicable === false) {
      console.warn(`[SpatialGuardrail] ⚠️ Iteration ${iteration}: Stage 1 produced unapplicable layout.`);
      const stage1Feedback = (stage1Result.spatialViolations || []).map(v => v.description).join('; ') || 'Stage 1 layout unapplicable.';
      feedbackHistory.push({
        iteration,
        criticFeedback: stage1Feedback,
        proposedLayout: stage1Result.layoutDiagram,
        violations: stage1Result.spatialViolations || []
      });
      finalResult = stage1Result;

      if (iteration < MAX_ITERATIONS) {
        console.log(`[SpatialGuardrail] 🔁 Self-Correction Triggered (Attempt ${iteration + 1}): Retrying Stage 1 with previous error feedback...`);
        continue;
      } else {
        break;
      }
    }

    // Stage 2: Critic Realism Audit
    const criticResult = await validateRealismWithCriticModel(roomMetrics, products, stage1Result);
    const score = criticResult?.realismScore ?? 100;
    const rejected = criticResult?.isRealistic === false && score < 40;

    if (!rejected) {
      console.log(`[SpatialGuardrail] ✅ Iteration ${iteration}: Stage 2 Critic APPROVED layout (score=${score}): ${criticResult?.criticism || 'OK'}`);
      stage1Result.isApplicable = true;
      if (!stage1Result.naturalLanguagePrompt || !stage1Result.naturalLanguagePrompt.trim()) {
        stage1Result.naturalLanguagePrompt = translateLayoutToPromptDirectives(stage1Result.layoutDiagram);
      }
      return stage1Result;
    }

    // Stage 2 Critic REJECTED the layout
    const criticismText = criticResult.criticism || 'Layout is physically impossible (overlapping items or boundary clipping).';
    console.warn(`[SpatialGuardrail] ❌ Stage 2 Critic REJECTED layout on iteration ${iteration} (score=${score}): ${criticismText}`);

    const criticViolations = criticResult.violations?.length
      ? normalizeSpatialViolations(criticResult.violations)
      : [{ type: 'WALKWAY_BLOCKAGE', description: `Stage 2 Realism Audit Failed (score ${score}/100): ${criticismText}`, conflictingProductIds: [] }];

    stage1Result.isApplicable = false;
    stage1Result.spatialViolations = [
      ...normalizeSpatialViolations(stage1Result.spatialViolations || []),
      ...criticViolations
    ];
    stage1Result.suggestedRemovals = Array.from(new Set([
      ...(stage1Result.suggestedRemovals || []),
      ...(Array.isArray(criticResult.suggestedRemovals) ? criticResult.suggestedRemovals.map(String) : [])
    ]));

    feedbackHistory.push({
      iteration,
      criticFeedback: criticismText,
      proposedLayout: stage1Result.layoutDiagram,
      violations: stage1Result.spatialViolations
    });

    finalResult = stage1Result;

    if (iteration < MAX_ITERATIONS) {
      console.log(`[SpatialGuardrail] 🔁 Self-Correction Triggered: Stage 2 Critic rejected iteration ${iteration}. Retrying Stage 1 for Iteration ${iteration + 1} with feedback...`);
    } else {
      console.warn(`[SpatialGuardrail] ⛔ Reached 3-iteration self-correction limit without achieving valid layout.`);
    }
  }

  if (!finalResult.naturalLanguagePrompt || !finalResult.naturalLanguagePrompt.trim()) {
    finalResult.naturalLanguagePrompt = translateLayoutToPromptDirectives(finalResult.layoutDiagram);
  }

  return finalResult;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Main Validation Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic Physical Feasibility Pre-Check
 * Evaluates physical space fitting based on bounding box footprint area, required clearance buffers (50cm),
 * and cumulative wall perimeter limits for the specific room dimensions.
 */
const checkPhysicalFeasibility = (roomMetrics, products, generationType = 'CREATE_FROM_SCRATCH') => {
  const violations = [];
  const suggestedRemovals = [];

  const totalWallPerimeter = 2 * (roomMetrics.length + roomMetrics.width);
  const roomAreaSqM = (roomMetrics.length * roomMetrics.width) / 10000;

  let totalRawFootprintSqM = 0;
  let totalEffectiveFootprintSqM = 0; // includes 50cm clearance margin around items for walkways
  let totalFloorStandingWidth = 0;

  const floorStandingItems = [];

  products.forEach((prod) => {
    if (prod.action === 'REMOVE') return; // REMOVE items free space and are not added

    const catLower = (prod.category || '').toLowerCase();
    const titleLower = (prod.title || '').toLowerCase();
    const w = prod.dimensions?.width || 80;
    const l = prod.dimensions?.length || 60;
    const h = prod.dimensions?.height || 80;
    const qty = prod.quantity || 1;

    const isRug = catLower.includes('rug') || catLower.includes('carpet') || titleLower.includes('rug') || titleLower.includes('sajada') || titleLower.includes('سجاد');
    const isDecor = catLower.includes('lighting') || catLower.includes('lamp') || catLower.includes('pillow') || catLower.includes('decor') || catLower.includes('curtain') || catLower.includes('blind') || catLower.includes('drape') || catLower.includes('art') || titleLower.includes('lamp') || titleLower.includes('curtain') || titleLower.includes('blind') || titleLower.includes('drape') || titleLower.includes('ستائر') || titleLower.includes('ستارة') || titleLower.includes('مصباح');

    // 1. Single item exceeds room dimensions
    if (w > roomMetrics.width && w > roomMetrics.length) {
      violations.push({
        type: 'DIMENSION_OVERFLOW',
        description: `Item "${prod.title}" width (${w}cm) exceeds room dimensions (${roomMetrics.width}cm x ${roomMetrics.length}cm).`,
        conflictingProductIds: [prod.productId]
      });
      suggestedRemovals.push(prod.productId);
    }

    if (!isRug && !isDecor) {
      const rawSqM = (w * l * qty) / 10000;
      // Add 50cm clearance margin around items for open doors/drawers/walkways
      const effectiveSqM = ((w + 50) * (l + 50) * qty) / 10000;

      totalRawFootprintSqM += rawSqM;
      totalEffectiveFootprintSqM += effectiveSqM;
      totalFloorStandingWidth += (w * qty);

      floorStandingItems.push({
        productId: prod.productId,
        title: prod.title,
        category: prod.category,
        qty,
        w,
        l,
        rawSqM,
        effectiveSqM
      });
    }
  });

  // 2. Room Overcrowding Check:
  // Raw furniture footprint exceeds 55% of floor area OR Effective footprint (with 50cm walkways) exceeds total room area
  if (totalRawFootprintSqM > (roomAreaSqM * 0.55) || totalEffectiveFootprintSqM > roomAreaSqM) {
    // Sort items by size (largest first) to suggest removing extra large/duplicate items
    const sortedItems = [...floorStandingItems].sort((a, b) => b.rawSqM - a.rawSqM);
    const oversizeRemovals = sortedItems.slice(1).map(i => i.productId);

    violations.push({
      type: 'DIMENSION_OVERFLOW',
      description: `Physical space capacity exceeded: Selected furniture footprint (${totalRawFootprintSqM.toFixed(2)}m² raw / ${totalEffectiveFootprintSqM.toFixed(2)}m² required with walkways) cannot physically fit inside this ${roomMetrics.width}x${roomMetrics.length}cm room (${roomAreaSqM.toFixed(2)}m²) without overlapping items or blocking walkways.`,
      conflictingProductIds: sortedItems.map(i => i.productId)
    });

    if (oversizeRemovals.length > 0) {
      suggestedRemovals.push(...oversizeRemovals);
    }
  }

  // 3. Wall Perimeter Overcrowding Check:
  // Total cumulative width of floor-standing items exceeds 80% of total room wall perimeter
  if (totalFloorStandingWidth > (totalWallPerimeter * 0.80)) {
    violations.push({
      type: 'WALKWAY_BLOCKAGE',
      description: `Cumulative furniture width (${totalFloorStandingWidth}cm) exceeds available wall space in a ${roomMetrics.width}x${roomMetrics.length}cm room. Items physically cannot fit without overlapping each other or clipping walls.`,
      conflictingProductIds: floorStandingItems.map(i => i.productId)
    });
  }

  if (violations.length > 0) {
    return {
      isApplicable: false,
      spatialViolations: violations,
      suggestedRemovals: Array.from(new Set(suggestedRemovals))
    };
  }

  return { isApplicable: true };
};

/**
 * Helper to ensure kept products (action: 'KEEP') from room layout/extracted preferences
 * are included in the products list during ENHANCE_ROOM mode.
 */
const ensureKeptProductsInList = (generation, selectedProducts) => {
  const generationType = generation?.generationType;
  const isEnhance = generationType === 'ENHANCE_ROOM' || generationType === 'ENHANCE_EXISTING';
  if (!isEnhance) return selectedProducts || [];

  const result = [...(selectedProducts || [])];

  const existingCategories = new Set(
    result.map((p) => {
      const pData = p.productData || p;
      const cat = p.category || pData.classification?.canonicalCategory || pData.category || '';
      return cat.toLowerCase();
    }).filter(Boolean)
  );

  const getDefaultDimensionsForCategory = (catName) => {
    const c = (catName || '').toLowerCase();
    if (c.includes('bed')) return { width: 160, length: 200, height: 100 };
    if (c.includes('wardrobe') || c.includes('armoire')) return { width: 150, length: 60, height: 220 };
    if (c.includes('nightstand') || c.includes('side table')) return { width: 50, length: 40, height: 55 };
    if (c.includes('sofa') || c.includes('couch')) return { width: 200, length: 90, height: 85 };
    if (c.includes('tv') || c.includes('media')) return { width: 140, length: 40, height: 50 };
    if (c.includes('dining')) return { width: 140, length: 80, height: 75 };
    if (c.includes('desk')) return { width: 120, length: 60, height: 75 };
    if (c.includes('dresser')) return { width: 120, length: 45, height: 85 };
    if (c.includes('curtain') || c.includes('blind') || c.includes('drape')) return { width: 150, length: 15, height: 240 };
    if (c.includes('rug') || c.includes('carpet')) return { width: 160, length: 230, height: 1 };
    if (c.includes('lamp') || c.includes('lighting')) return { width: 30, length: 30, height: 50 };
    if (c.includes('chair') || c.includes('armchair')) return { width: 70, length: 70, height: 85 };
    if (c.includes('table')) return { width: 100, length: 60, height: 45 };
    if (c.includes('cabinet') || c.includes('bookshelf')) return { width: 90, length: 40, height: 180 };
    if (c.includes('ac') || c.includes('air conditioner')) return { width: 90, length: 25, height: 30 };
    return { width: 80, length: 60, height: 80 };
  };

  const catPrefs = generation?.extractedPreferences?.categoryPreferences || [];
  catPrefs.forEach((pref) => {
    const action = pref.action;
    if (action === 'KEEP' || (pref.included && action !== 'REMOVE' && action !== 'REPLACE')) {
      const catName = pref.category;
      if (catName && !existingCategories.has(catName.toLowerCase())) {
        const defaultDims = getDefaultDimensionsForCategory(catName);
        const qty = pref.quantity || 1;
        for (let q = 0; q < qty; q++) {
          const suffix = qty > 1 ? ` ${q + 1}` : '';
          result.push({
            productId: `keep_${catName.toLowerCase().replace(/\s+/g, '_')}${q > 0 ? `_${q + 1}` : ''}`,
            category: catName,
            title: `Existing ${catName}${suffix}`,
            quantity: 1,
            action: 'KEEP',
            isRecommended: false,
            price: 0,
            productData: {
              name: `Existing ${catName}${suffix}`,
              title: `Existing ${catName}${suffix}`,
              category: catName,
              action: 'KEEP',
              dimensions: defaultDims
            }
          });
        }
        existingCategories.add(catName.toLowerCase());
      }
    }
  });

  return result;
};

/**
 * Run full spatial validation for a generation record.
 * Handles cache checking, model invocation, and result persistence.
 *
 * @param {Object} generation - Mongoose Generation document
 * @param {Object} room - Mongoose Room document (with dimensions)
 * @param {Array<Object>} selectedProducts - Fully populated product list
 * @param {Object} options - Options including generationType and force
 * @returns {Promise<Object>} The spatial guardrail result object
 */
const validateSpatialApplicability = async (generation, room, selectedProducts, options = {}) => {
  const generationType = options.generationType || generation.generationType || 'CREATE_FROM_SCRATCH';
  console.log(`[SpatialGuardrail Service] Starting spatial validation for Generation ID: ${generation._id} (type=${generationType}, force=${!!options.force})`);
  
  // Build room metrics
  const roomMetrics = {
    length: options.roomMetrics?.length || generation.roomLayoutData?.length_cm || room?.dimensions?.length || 400,
    width: options.roomMetrics?.width || generation.roomLayoutData?.width_cm || room?.dimensions?.width || 350,
    height: options.roomMetrics?.height || generation.roomLayoutData?.height_cm || room?.dimensions?.height || 280,
    doors: options.roomMetrics?.doors || options.doors || generation.roomLayoutData?.doors || room?.doors || [],
    windows: options.roomMetrics?.windows || options.windows || generation.roomLayoutData?.windows || room?.windows || []
  };

  console.log(`[SpatialGuardrail Service] Room dimensions: ${roomMetrics.length}cm (L) x ${roomMetrics.width}cm (W) x ${roomMetrics.height}cm (H)`);

  // Ensure KEPT items in ENHANCE_ROOM mode are included in the product list
  const fullProductsList = ensureKeptProductsInList(generation, selectedProducts);

  // Normalize products for the model
  const normalizedProducts = normalizeProductsForSpatial(fullProductsList);

  console.log(`[SpatialGuardrail Service] Normalized ${normalizedProducts.length} products for spatial analysis`);

  // Compute current hash
  const currentHash = computeProductsHash(
    generation.roomId,
    fullProductsList
  );

  console.log(`[SpatialGuardrail Service] Products Hash: ${currentHash}`);

  // ── Smart Spatial Hash Cache Check ──────────────────────────────────────
  // If products have NOT changed since last spatial guard call and force is false, skip LLM re-invocation
  const isForce = options.force === true || options.ignoreHash === true;
  if (
    !isForce &&
    generation.spatialGuardrail &&
    generation.spatialGuardrail.productsHash === currentHash &&
    typeof generation.spatialGuardrail.isApplicable === 'boolean'
  ) {
    console.log(`[SpatialGuardrail Service] ⚡ Products HAVE NOT CHANGED since last spatial guardrail call (hash match: ${currentHash}). Reusing saved spatial guardrail.`);
    return generation.spatialGuardrail;
  }

  // Deterministic feasibility pre-check for impossible requests (3 beds, perimeter overflow, etc.)
  const feasibility = checkPhysicalFeasibility(roomMetrics, normalizedProducts, generationType);
  if (!feasibility.isApplicable) {
    console.warn(`[SpatialGuardrail Service] ❌ Feasibility check failed: ${feasibility.spatialViolations[0]?.description}`);
    const guardrailData = {
      isApplicable: false,
      productsHash: currentHash,
      layoutDiagram: null,
      naturalLanguagePrompt: '',
      spatialViolations: feasibility.spatialViolations,
      suggestedRemovals: feasibility.suggestedRemovals,
      validatedAt: new Date()
    };
    generation.spatialGuardrail = guardrailData;
    try {
      if (typeof generation.save === 'function') await generation.save();
    } catch (_) {}
    return guardrailData;
  }

  console.log('[SpatialGuardrail Service] ⚡ Layout or products modified — invoking spatial model...');

  // Invoke the spatial model
  const result = await invokeSpatialModel(roomMetrics, normalizedProducts, generationType);

  const naturalLanguagePrompt = result.naturalLanguagePrompt || translateLayoutToPromptDirectives(result.layoutDiagram);

  // Generate 2D Layout Mask PNG if layout diagram exists
  let maskDataBase64 = null;
  let maskImageUrl = null;
  if (result.layoutDiagram && result.layoutDiagram.allocations && result.layoutDiagram.allocations.length > 0) {
    try {
      const { generateLayoutMask } = require('./layoutMaskGenerator.service');
      const maskResult = await generateLayoutMask(result.layoutDiagram, roomMetrics);
      maskDataBase64 = maskResult.maskDataBase64;
      maskImageUrl = maskResult.maskImageUrl;
      console.log('[SpatialGuardrail Service] 🎨 Generated 2D Layout Mask PNG successfully.');
    } catch (maskErr) {
      console.warn('[SpatialGuardrail Service] Warning: Failed to generate layout mask:', maskErr.message);
    }
  }

  // Build the guardrail object to persist
  const guardrailData = {
    isApplicable: result.isApplicable,
    productsHash: currentHash,
    layoutDiagram: result.layoutDiagram || null,
    naturalLanguagePrompt: naturalLanguagePrompt || '',
    spatialViolations: normalizeSpatialViolations(result.spatialViolations || []),
    suggestedRemovals: result.suggestedRemovals || [],
    maskDataBase64: maskDataBase64 || null,
    maskImageUrl: maskImageUrl || null,
    validatedAt: new Date()
  };

  // Save to generation safely (do not block result on DB save errors)
  generation.spatialGuardrail = guardrailData;
  try {
    if (typeof generation.save === 'function') {
      await generation.save();
    } else if (generation._id) {
      const Generation = require('../models/generation.model');
      await Generation.findByIdAndUpdate(generation._id, { spatialGuardrail: guardrailData });
    }
  } catch (dbErr) {
    console.warn(`[SpatialGuardrail Service] Warning: Failed to save guardrail data to DB: ${dbErr.message}`);
  }

  console.log(`[SpatialGuardrail Service] Saved updated spatial guardrail state to generation ${generation._id}`);
  return guardrailData;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Spatial Prompt Translator (for Image Generation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Translate the 2D JSON layout diagram into explicit natural language
 * spatial placement directives for the image generation model.
 *
 * @param {Object} layoutDiagram - The layoutDiagram from spatialGuardrail
 * @returns {string} Natural language spatial directives
 */
const translateLayoutToPromptDirectives = (layoutDiagram) => {
  if (!layoutDiagram || !layoutDiagram.allocations || layoutDiagram.allocations.length === 0) {
    return '';
  }

  const dims = layoutDiagram.roomDimensions || {};
  const lines = [
    '\nSPATIAL LAYOUT DIRECTIVES (STRICT ADHERENCE REQUIRED):',
    `- Room Dimensions: ${dims.width || '?'}cm x ${dims.length || '?'}cm x ${dims.height || '?'}cm.`,
    `- Total Room Area: ${layoutDiagram.totalRoomArea || '?'} m².`,
    `- Usable Floor Percentage: ${layoutDiagram.usableFloorPercentage || '?'}%.`,
    ''
  ];

  // Group allocations by wall placement for readable directives
  const wallGroups = { NORTH: [], SOUTH: [], EAST: [], WEST: [], NONE: [] };
  for (const alloc of layoutDiagram.allocations) {
    const wall = alloc.placedAgainstWall || 'NONE';
    wallGroups[wall].push(alloc);
  }

  // Count instances to prevent quantity hallucination
  const itemCounts = {};
  const currentCounts = {};
  for (const alloc of layoutDiagram.allocations) {
    const id = alloc.productId || alloc.productName || alloc.name || alloc.category || 'Furniture';
    itemCounts[id] = (itemCounts[id] || 0) + 1;
  }

  // Generate per-item placement directives
  for (const alloc of layoutDiagram.allocations) {
    const pos = alloc.position || alloc.coordinates || {};
    const dim = alloc.dimensions || {};
    const baseName = alloc.title || alloc.productName || alloc.name || alloc.category || 'Furniture';
    const id = alloc.productId || alloc.productName || alloc.name || alloc.category || 'Furniture';
    currentCounts[id] = (currentCounts[id] || 0) + 1;
    
    const instanceStr = itemCounts[id] > 1 ? ` (Instance ${currentCounts[id]} of ${itemCounts[id]})` : '';
    const name = `${baseName}${instanceStr}`;
    const category = alloc.category || 'Furniture';
    const posX = pos.x ?? pos.x_cm ?? '?';
    const posY = pos.y ?? pos.y_cm ?? '?';
    const dimW = dim.width ?? dim.width_cm ?? '?';
    const dimL = dim.length ?? dim.length_cm ?? '?';
    const dimH = dim.height ?? dim.height_cm ?? '?';

    const wallNote = alloc.placedAgainstWall && alloc.placedAgainstWall !== 'NONE'
      ? `, aligned flat against the ${alloc.placedAgainstWall} wall`
      : '';
    const visNote = alloc.cameraVisibility === 'HIDDEN_BEHIND_CAMERA'
      ? ' [NOTE: Located near camera boundary, may be partially out of frame]'
      : alloc.cameraVisibility === 'PARTIAL'
        ? ' [NOTE: Partially visible from camera angle]'
        : '';
    const rules = (alloc.designRulesApplied || []).length > 0
      ? ` (Design rules: ${alloc.designRulesApplied.join(', ')})`
      : '';

    lines.push(
      `- Place "${name}" [${category}] centered at position (X=${posX}cm, Y=${posY}cm)${wallNote}, ` +
      `rotated ${alloc.rotation || 0}°, dimensions ${dimW}×${dimL}×${dimH}cm.${visNote}${rules}`
    );
  }

  lines.push('');
  lines.push('- BALANCED 4-WALL ROOM ARRANGEMENT (NORTH, WEST, SOUTH, EAST): Distribute furniture items naturally across all 4 walls (North back wall, West left wall, East right wall, South foreground wall). Do NOT stack or crowd all furniture onto only 1 or 2 walls.');
  lines.push('- WARDROBE & DRAWER CLEARANCE: Ensure at least 50cm-80cm of clear, unobstructed opening space in front of wardrobe doors and drawers so they can open fully. Do NOT place wardrobes directly touching or flush against the side/foot of a bed.');
  lines.push('- Camera Position: Wide-angle corner perspective shot from ceiling corner showing full 4-wall room architecture.');

  return lines.join('\n');
};

module.exports = {
  normalizeProductsForSpatial,
  computeProductsHash,
  buildSpatialSystemPrompt,
  buildSpatialUserPrompt,
  invokeSpatialModel,
  validateSpatialApplicability,
  translateLayoutToPromptDirectives
};
