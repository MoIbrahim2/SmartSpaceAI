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
    defaultIncluded: rule.defaultIncluded
  }));
};

/**
 * Build the system prompt that defines Gemini's role.
 * Gemini is strictly scoped to preference extraction — NO recommendations,
 * budget allocation, placement, or product filtering.
 * @param {Array<Object>} availableCategories
 * @returns {string}
 */
const buildSystemPrompt = (availableCategories) => {
  const categoryList = availableCategories
    .map((c) => `- ${c.category} (${c.role}, ${c.defaultIncluded ? 'included by default' : 'optional'})`)
    .join('\n');

  return `You are a design preference extraction assistant for an AI-powered interior design platform called SmartSpaceAI.

Your ONLY responsibility is to understand the user's natural language description and extract their design preferences.

You must NEVER:
- Recommend specific products
- Allocate budgets
- Calculate sizes or dimensions
- Make placement decisions
- Filter or rank products
- Invent preferences the user did not express

If the user did not mention a preference, return null for that field.
If the user did not mention a specific category, still include it in categoryPreferences with included set to null.

Available furniture categories for this room type:
${categoryList}

You must return a structured JSON response with the following schema:
1. roomPreferences: The overall room design preferences (style, theme, mood, lighting, colorPalette)
2. categoryPreferences: Per-category preferences for each available category
3. negativePreferences: Things the user explicitly wants to avoid`;
};

/**
 * Build the user prompt with room context and the user's design description.
 * Only sends information needed for Gemini to understand intent.
 * Does NOT include: placement rules, constraints, budget rules, size rules.
 * @param {Object} roomDetails - { roomType, length, width, height, budget }
 * @param {string} userPrompt - The user's free-text design description
 * @param {Array<Object>} availableCategories
 * @returns {string}
 */
const buildUserPrompt = (roomDetails, userPrompt, availableCategories) => {
  const categoryNames = availableCategories.map((c) => c.category).join(', ');

  return `Room Information:
- Room Type: ${roomDetails.roomType}
- Dimensions: ${roomDetails.length}cm (L) × ${roomDetails.width}cm (W) × ${roomDetails.height}cm (H)
- Budget: ${roomDetails.budget} EGP

Available Categories: ${categoryNames}

User's Design Description:
"${userPrompt}"

Based on the user's description above, extract their design preferences. For each available category, determine if the user expressed any preference about it. If unknown, use null.`;
};

module.exports = {
  normalizeRoomType,
  loadCategoryRules,
  extractAvailableCategories,
  buildSystemPrompt,
  buildUserPrompt
};
