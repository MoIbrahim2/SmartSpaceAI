const fs = require('fs');
const path = require('path');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

/**
 * Normalize room type string to match knowledge base filenames.
 * e.g. "Living Room" -> "living_room", "kids_room" -> "kids_room"
 * @param {string} roomType
 * @returns {string}
 */
const normalizeRoomType = (roomType) => {
  return roomType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
};

/**
 * Load category rules from the knowledge base for a given room type.
 * The template is system knowledge and is NEVER modified.
 * @param {string} roomType - e.g. "living_room", "bedroom", "Living Room"
 * @returns {Object} Parsed JSON category rules
 */
const loadCategoryRules = (roomType) => {
  const normalized = normalizeRoomType(roomType);
  const filePath = path.join(
    process.cwd(),
    'knowledge_base',
    'category_rules',
    `${normalized}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Unsupported room type: ${roomType}. No category rules found.`
    );
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
};

/**
 * Extract available furniture category names from category rules.
 * Only returns the category name — no placement, size, or budget data.
 * @param {Object} categoryRules - Parsed category rules JSON
 * @returns {Array<Object>} Array of { category, role, priority, defaultIncluded }
 */
const extractAvailableCategories = (categoryRules) => {
  if (!categoryRules || !Array.isArray(categoryRules.rules)) {
    return [];
  }

  return categoryRules.rules.map((rule) => ({
    category: rule.category,
    role: rule.role,
    priority: rule.priority,
    defaultIncluded: rule.defaultIncluded,
    quantity: rule.quantity
      ? {
          min: rule.quantity.min,
          max: rule.quantity.max,
          allowMultiple: rule.quantity.allowMultiple
        }
      : null
  }));
};

/**
 * Build the system prompt that defines Gemini's role.
 * Gemini is strictly scoped to preference extraction — NO recommendations,
 * budget allocation, placement, or product filtering.
 * @param {Array<Object>} availableCategories
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {string}
 */
const buildSystemPrompt = (availableCategories, generationType = 'CREATE_FROM_SCRATCH') => {
  const isEnhance = generationType === 'ENHANCE_ROOM' || generationType === 'ENHANCE_EXISTING';
  const categoryList = availableCategories
    .map((c) => {
      let qInfo = '';
      if (c.quantity) {
        qInfo = `; Quantity Constraints: min=${c.quantity.min}, max=${c.quantity.max}, allowMultiple=${c.quantity.allowMultiple}`;
      }
      return `- ${c.category} (${c.role}, ${c.defaultIncluded ? 'included by default' : 'optional'}${qInfo})`;
    })
    .join('\n');

  const enhanceInstructions = isEnhance
    ? `\nSPECIAL MODE: ENHANCE_ROOM (Room Enhancement & Restyling)
- The room is ALREADY FURNISHED. The user is asking to modify, upgrade, replace, or add specific furniture, or change overall colors/materials/lighting.
- Unmentioned categories do NOT imply rejection; existing items may remain in the room layout.
- For each category, extract the user's intended 'action':
  * 'REPLACE': User wants to swap out an existing piece for a new one (e.g. "replace the bed", "change the sofa").
  * 'ADD': User wants to introduce a new piece into an empty spot (e.g. "add a rug", "put a floor lamp in corner").
  * 'KEEP': User explicitly asks to retain an existing piece (e.g. "keep the current wardrobe", "leave the desk as is").
  * 'REMOVE': User explicitly wants to discard an item.
  * null: Not mentioned by user.`
    : '';

  return `You are an intent and design-preference extraction system for an AI-powered interior design platform called SmartSpaceAI.

Your ONLY responsibility is to understand the user's natural language description and extract their design preferences.
${enhanceInstructions}

Core Inclusion & Priority Rules:
- If the user explicitly mentions or requests specific furniture items in their description (e.g., "I want a sofa", "two armchairs", "a coffee table", "add a rug", "TV unit", "two side tables", "include a floor lamp", "wall art"):
  * Set 'included: true' for ALL categories explicitly requested by the user. These requested items are REQUIRED by the user.
  * For any category NOT requested or mentioned by the user, set 'included: false' or 'included: null'. Treat unrequested items as OPTIONAL.
- Priority & Importance Rules:
  * If the user highlights specific items as main pieces, most important, or requests to prioritize budget for them (e.g., "The sofa and coffee table are the most important pieces, so prioritize more of the budget for them"):
    - Set 'importance': 'HIGH' and 'budgetAdjustment': 'premium' for those specific categories.
    - Set 'importance': 'MEDIUM' or 'LOW' for other categories unless specified otherwise.

You must NEVER:
- Recommend specific products
- Allocate budgets or calculate category budgets from quantity
- Multiply category budget percentages by quantity
- Calculate sizes, dimensions, or physical product dimensions from quantity
- Make placement decisions
- Filter or rank products
- Invent preferences the user did not express
- Use the category's default quantity as extracted user intent
- Modify knowledge-base quantity rules

Extract only preferences explicitly stated or clearly implied by the user's request.

For quantity extraction:
- Quantity means the number of separate products/items requested from a category.
- Extract quantity only when the number of products is explicit or unambiguous (e.g. "two armchairs" -> Armchair quantity: 2, "two side tables" -> Side Table quantity: 2).
- If quantity is not specified by the user, return null. NEVER use the category's default quantity as extracted user intent.
- Do NOT confuse product quantity with capacity, component count, or product configuration:
  * "table for six people" -> Dining Table quantity: null
  * "double-sink vanity" -> Vanity Unit quantity: null
  * "three-door wardrobe" -> Wardrobe quantity: null
  * "four-drawer dresser" -> Dresser quantity: null
  * "seating for two people" -> Seating quantity: null
  * "two sofas" -> Sofa quantity: 2
  * "six dining chairs" -> Dining Chairs quantity: 6
  * "two nightstands" -> Nightstand quantity: 2
- Respect the supplied category quantity constraints (min, max, allowMultiple).

Available furniture categories for this room type:
${categoryList}

You must return a structured JSON response with the following schema:
1. roomPreferences: The overall room design preferences (style, theme, mood, lighting, colorPalette)
2. categoryPreferences: Per-category preferences for each available category (including category, included, excluded, quantity, preferredMaterial, preferredColor, preferredStyle, preferredShape, preferredSize, budgetAdjustment, importance, action)
3. negativePreferences: Things the user explicitly wants to avoid`;
};

/**
 * Build the user prompt with room context and the user's design description.
 * Only sends information needed for Gemini to understand intent.
 * Does NOT include: placement rules, constraints, budget rules, size rules.
 * @param {Object} roomDetails - { roomType, length, width, height, budget }
 * @param {string} userPrompt - The user's free-text design description
 * @param {Array<Object>} availableCategories
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {string}
 */
const buildUserPrompt = (roomDetails, userPrompt, availableCategories, generationType = 'CREATE_FROM_SCRATCH') => {
  const categoryNames = availableCategories.map((c) => c.category).join(', ');

  return `Room Information:
- Room Type: ${roomDetails.roomType}
- Generation Mode: ${generationType}
- Dimensions: ${roomDetails.length}cm (L) × ${roomDetails.width}cm (W) × ${roomDetails.height}cm (H)
- Budget: ${roomDetails.budget} EGP

Available Categories: ${categoryNames}

User's Design Description:
"${userPrompt}"

Based on the user's description above, extract their design preferences. For each available category, determine if the user expressed any preference about it (including explicit product quantity and action if requested). If unknown or not specified, use null.`;
};

module.exports = {
  normalizeRoomType,
  loadCategoryRules,
  extractAvailableCategories,
  buildSystemPrompt,
  buildUserPrompt
};
