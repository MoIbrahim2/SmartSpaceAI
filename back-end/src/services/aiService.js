const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Validate a room image using Google Gemini Vision API.
 * Checks if the image is a valid corner shot, has good lighting, and is empty enough.
 *
 * @param {string} filePath - Absolute path to the uploaded image file
 * @param {string} mimeType - MIME type of the image (e.g. 'image/jpeg')
 * @param {string} generationType - 'CREATE_FROM_SCRATCH' or 'ENHANCE_ROOM'
 * @returns {Promise<Object>} Validation result with is_valid, rejection_reason, etc.
 */
const validateRoomImage = async (filePath, mimeType, generationType = 'CREATE_FROM_SCRATCH') => {
  const isEnhance = generationType === 'ENHANCE_ROOM';

  // 1. Upload the file to Gemini
  const uploadedFile = await ai.files.upload({
    file: filePath,
    config: { mimeType }
  });

  // 2. Build the prompt
  const prompt = `Analyze this image of a room. You are an expert architectural evaluator. 
Determine if this image is suitable for generating an interior design rendering.
${
  isEnhance
    ? 'Note: This room is being evaluated for the "ENHANCE_ROOM" option. It is completely fine and acceptable if the room has items, furniture, clutter, or existing layouts in it. You should focus on lighting and composition, and you should set is_empty_enough to true.'
    : 'Note: This room is being evaluated for the "CREATE_FROM_SCRATCH" option. The room MUST be mostly empty or only have minimal clutter.'
}`;

  // 3. Build the config with structured output schema
  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        is_corner_shot: {
          type: Type.BOOLEAN,
          description: 'true if at least 2 walls and the floor are visible forming a corner'
        },
        lighting_quality: {
          type: Type.STRING,
          enum: ['poor', 'good', 'excellent']
        },
        is_empty_enough: {
          type: Type.BOOLEAN,
          description: isEnhance
            ? 'Always true (because ENHANCE_ROOM allows furniture and items in the room)'
            : 'true if the room is mostly empty or only have minimal clutter'
        },
        is_valid: {
          type: Type.BOOLEAN,
          description: isEnhance
            ? 'true ONLY if is_corner_shot is true and lighting_quality is good or excellent'
            : 'true ONLY if is_corner_shot is true, lighting_quality is good or excellent, and is_empty_enough is true'
        },
        rejection_reason: {
          type: Type.STRING,
          nullable: true,
          description: '1-sentence explanation in English of why it was rejected, or null if is_valid is true'
        },
        rejection_reason_ar: {
          type: Type.STRING,
          nullable: true,
          description: 'The exact same 1-sentence rejection explanation translated to Arabic, or null if is_valid is true'
        }
      },
      required: ['is_corner_shot', 'lighting_quality', 'is_empty_enough', 'is_valid', 'rejection_reason', 'rejection_reason_ar']
    }
  };

  // 4. Call Gemini with the uploaded file reference
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL_FOR_GUARD || 'gemini-3.1-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
          { text: prompt }
        ]
      }
    ],
    config
  });

  // 5. Parse and return the structured JSON response
  const result = JSON.parse(response.text);
  return result;
};

/**
 * Build the structured response schema for Gemini preference extraction.
 * Enforces strict typing on the AI output.
 * @param {Array<string>} categoryNames - Array of valid category names
 * @returns {Object} Gemini response schema config
 */
const buildResponseSchema = (categoryNames) => {
  return {
    type: Type.OBJECT,
    properties: {
      roomPreferences: {
        type: Type.OBJECT,
        properties: {
          style: {
            type: Type.STRING,
            nullable: true,
            description: 'Design style the user wants (e.g. Modern, Scandinavian, Industrial, Bohemian). null if not mentioned.'
          },
          theme: {
            type: Type.STRING,
            nullable: true,
            description: 'Design theme or concept (e.g. coastal, rustic, minimalist, tropical). null if not mentioned.'
          },
          mood: {
            type: Type.STRING,
            nullable: true,
            description: 'Desired atmosphere or mood (e.g. cozy, elegant, vibrant, calm). null if not mentioned.'
          },
          lighting: {
            type: Type.STRING,
            nullable: true,
            description: 'Lighting preference (e.g. warm, natural, bright, dim, ambient). null if not mentioned.'
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: 'Array of colors the user mentioned wanting. null if not mentioned.'
          }
        },
        required: ['style', 'theme', 'mood', 'lighting', 'colorPalette']
      },
      categoryPreferences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Furniture category name. Must match one of the available categories.'
            },
            included: {
              type: Type.BOOLEAN,
              nullable: true,
              description: 'true if user wants this category, false if explicitly excluded, null if not mentioned.'
            },
            excluded: {
              type: Type.BOOLEAN,
              nullable: true,
              description: 'true if user explicitly does NOT want this category. null if not mentioned.'
            },
            preferredMaterial: {
              type: Type.STRING,
              nullable: true,
              description: 'Material preference for this category (e.g. wood, leather, fabric, marble). null if not mentioned.'
            },
            preferredColor: {
              type: Type.STRING,
              nullable: true,
              description: 'Color preference for this category. null if not mentioned.'
            },
            preferredStyle: {
              type: Type.STRING,
              nullable: true,
              description: 'Style preference for this category (e.g. modern, classic). null if not mentioned.'
            },
            preferredShape: {
              type: Type.STRING,
              nullable: true,
              description: 'Shape preference (e.g. round, rectangular, L-shaped). null if not mentioned.'
            },
            preferredSize: {
              type: Type.STRING,
              nullable: true,
              description: 'Size preference (e.g. large, compact, small). null if not mentioned.'
            },
            budgetAdjustment: {
              type: Type.STRING,
              nullable: true,
              description: 'Budget preference hint (e.g. premium, budget-friendly, mid-range). null if not mentioned.'
            },
            importance: {
              type: Type.STRING,
              nullable: true,
              description: 'How important this category seems to the user (HIGH, MEDIUM, LOW). null if not mentioned.'
            }
          },
          required: ['category']
        },
        description: 'Per-category preferences for each available furniture category.'
      },
      negativePreferences: {
        type: Type.OBJECT,
        properties: {
          materialsToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: 'Materials the user explicitly wants to avoid. null if not mentioned.'
          },
          colorsToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: 'Colors the user explicitly wants to avoid. null if not mentioned.'
          },
          categoriesToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            nullable: true,
            description: 'Furniture categories the user explicitly does not want. null if not mentioned.'
          }
        },
        required: ['materialsToAvoid', 'colorsToAvoid', 'categoriesToAvoid']
      }
    },
    required: ['roomPreferences', 'categoryPreferences', 'negativePreferences']
  };
};

/**
 * Call Gemini to extract user preferences from a design prompt.
 * @param {string} systemPrompt - System instructions for Gemini
 * @param {string} userPrompt - User context and design description
 * @param {Array<string>} categoryNames - Valid category names for schema
 * @returns {Promise<Object>} Parsed and validated extracted preferences
 */
const extractPreferences = async (systemPrompt, userPrompt, categoryNames) => {
  const responseSchema = buildResponseSchema(categoryNames);

  const config = {
    responseMimeType: 'application/json',
    responseSchema,
    systemInstruction: systemPrompt
  };

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL_FOR_JSON_CONVERSION || 'gemini-3.1-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    config
  });

  // Parse the structured JSON response
  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch (err) {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'AI response could not be parsed. Please try again.'
    );
  }

  // Validate required top-level fields
  validateExtractedPreferences(parsed);

  return parsed;
};

/**
 * Validate the structure of the extracted preferences from Gemini.
 * Rejects malformed JSON, invalid schema, or unexpected format.
 * @param {Object} preferences - Parsed Gemini response
 * @throws {ApiError} If validation fails
 */
const validateExtractedPreferences = (preferences) => {
  if (!preferences || typeof preferences !== 'object') {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'AI returned an invalid response structure.'
    );
  }

  // Validate roomPreferences exists and is an object
  if (!preferences.roomPreferences || typeof preferences.roomPreferences !== 'object') {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'AI response missing roomPreferences.'
    );
  }

  // Validate categoryPreferences exists and is an array
  if (!Array.isArray(preferences.categoryPreferences)) {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'AI response missing categoryPreferences array.'
    );
  }

  // Validate each category preference has a category name
  for (const catPref of preferences.categoryPreferences) {
    if (!catPref.category || typeof catPref.category !== 'string') {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'AI response contains categoryPreference without a valid category name.'
      );
    }
  }

  // Validate negativePreferences exists and is an object
  if (!preferences.negativePreferences || typeof preferences.negativePreferences !== 'object') {
    throw new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'AI response missing negativePreferences.'
    );
  }
};

module.exports = {
  validateRoomImage,
  extractPreferences
};
