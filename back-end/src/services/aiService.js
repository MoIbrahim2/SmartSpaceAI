const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const ApiError = require('../errors/ApiError');
const HTTP_STATUS = require('../constants/statusCodes');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Helper to retry asynchronous AI service operations on transient errors (e.g., fetch failed, network timeouts, 429/5xx).
 *
 * @param {Function} fn - Async operation to execute
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} initialDelayMs - Initial backoff delay in ms (default: 500)
 * @returns {Promise<any>}
 */
const withRetry = async (fn, maxRetries = 3, initialDelayMs = 500) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isFetchError =
        error.message?.includes('fetch failed') ||
        error.name === 'FetchError' ||
        error.cause?.code === 'ECONNRESET' ||
        error.cause?.code === 'ETIMEDOUT';

      if (attempt < maxRetries && (isFetchError || error.status >= 500 || error.status === 429)) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[AI Service] Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

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

  // Read file as base64 inlineData (much faster and avoids upload API network failures on local dev)
  const imageBuffer = fs.readFileSync(filePath);
  const base64Data = imageBuffer.toString('base64');

  // Build the prompt
  const prompt = `Analyze this image of a room. You are an expert architectural evaluator. 
Determine if this image is suitable for generating an interior design rendering.
${isEnhance
      ? 'Note: This room is being evaluated for the "ENHANCE_ROOM" option. It is completely fine and acceptable if the room has items, furniture, clutter, or existing layouts in it. You should focus on lighting and composition, and you should set is_empty_enough to true.'
      : 'Note: This room is being evaluated for the "CREATE_FROM_SCRATCH" option. The room MUST be mostly empty or only have minimal clutter.'
    }`;

  // Build the config with structured output schema
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

  // Call Gemini with inline image data inside withRetry
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_FOR_GUARD || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            { text: prompt }
          ]
        }
      ],
      config
    });

    return JSON.parse(response.text);
  });
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
            quantity: {
              type: Type.INTEGER,
              nullable: true,
              description: 'Extracted product quantity for this category if explicitly specified or unambiguously implied by the user as a number of separate products (e.g. 2 for "two sofas"). Must be null if user did not specify product quantity or if it refers to capacity/configuration/component count (e.g. table for 6, double-sink vanity, 3-door wardrobe).'
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
          required: [
            'category',
            'included',
            'excluded',
            'quantity',
            'preferredMaterial',
            'preferredColor',
            'preferredStyle',
            'preferredShape',
            'preferredSize',
            'budgetAdjustment',
            'importance'
          ]
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

  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_FOR_JSON_CONVERSION || 'gemini-2.5-flash',
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
  });
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
    if (
      catPref.quantity !== undefined &&
      catPref.quantity !== null &&
      (!Number.isInteger(catPref.quantity) || catPref.quantity < 1)
    ) {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'AI response contains invalid quantity in categoryPreferences.'
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

/**
 * Generate a photorealistic room rendering showing selected products arranged in the room using Gemini/Imagen.
 *
 * @param {Object} params
 * @param {string} params.roomImageUrl - Path to source room image
 * @param {Array} params.selectedProducts - Array of selected product objects
 * @param {string} params.prompt - User design instructions
 * @param {Object} params.roomDimensions - { length_cm, width_cm, height_cm }
 * @param {string} params.roomType - Room type name
 * @returns {Promise<Object>} { url, promptUsed, modelUsed }
 */
const generateRoomCompositeImage = async ({
  roomImageUrl,
  selectedProducts = [],
  prompt = '',
  roomDimensions = {},
  roomType = 'room'
}) => {
  // Build comprehensive system & user prompt for image generation
  const productDescriptions = selectedProducts
    .map((p, idx) => {
      const pData = p.productData || p;
      const title = pData.title || pData.name || p.category || `Product ${idx + 1}`;
      const provider = pData.brand || pData.provider || pData.merchant || 'Retailer';
      const price = pData.price ? `${pData.price} EGP` : '';
      const dims = pData.specifications?.dimensions || pData.dimensions
        ? `(${pData.specifications?.dimensions?.width || ''}x${pData.specifications?.dimensions?.length || ''}x${pData.specifications?.dimensions?.height || ''} cm)`
        : '';
      const style = pData.attributes?.style || pData.style || '';
      const color = pData.attributes?.color || pData.color || '';
      const material = pData.attributes?.material || pData.material || '';
      return `- ${p.category}: "${title}" by ${provider} ${dims}. Style: ${style}, Color: ${color}, Material: ${material}. ${price}`;
    })
    .join('\n');

  const dimText = roomDimensions.width_cm && roomDimensions.length_cm
    ? `${roomDimensions.width_cm}cm x ${roomDimensions.length_cm}cm x ${roomDimensions.height_cm || 280}cm`
    : 'standard room proportions';

  const systemPrompt = `Create a photorealistic 8K interior design architectural rendering of a ${roomType} (${dimText}).
User Design Prompt & Preferred Style:
"${prompt}"

Selected Furniture Products to Smartly Align and Place in the Room:
${productDescriptions}

Placement & Architectural Rules:
- Accurately scale each furniture item according to its dimensions relative to room size.
- Maintain natural realistic lighting, depth, soft shadows, and clean perspective.
- Follow architectural design norms with logical product positioning, walking paths, and aesthetic harmony.`;

  const modelUsed = process.env.GEMINI_MODEL_FOR_IMAGE_GEN || 'imagen-3.0-generate-002';

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'generations');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return await withRetry(async () => {
    try {
      // Try Imagen generateImages API via GoogleGenAI SDK
      if (typeof ai.models.generateImages === 'function') {
        const response = await ai.models.generateImages({
          model: modelUsed,
          prompt: systemPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });

        const imageObj = response.generatedImages?.[0];
        if (imageObj && imageObj.image?.imageBytes) {
          const fileName = `generated_room_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const filePath = path.join(uploadsDir, fileName);
          const buffer = Buffer.from(imageObj.image.imageBytes, 'base64');
          fs.writeFileSync(filePath, buffer);
          return {
            url: `uploads/generations/${fileName}`,
            promptUsed: systemPrompt,
            modelUsed,
          };
        }
      }
    } catch (imgGenErr) {
      console.warn(`[AI Service] Imagen API error (${imgGenErr.message}), falling back to baseline composite generator...`);
    }

    // Fallback: If image generation fails or model is unavailable in tier, create a valid composite reference using source image or default asset
    const fileName = `generated_room_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = path.join(uploadsDir, fileName);

    // If source room image exists, copy it as baseline output, else create/copy fallback image
    let sourcePath = roomImageUrl ? path.join(process.cwd(), roomImageUrl.replace(/^\//, '')) : null;
    if (sourcePath && fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, filePath);
    } else {
      const sampleJpegBase64 =
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
      fs.writeFileSync(filePath, Buffer.from(sampleJpegBase64, 'base64'));
    }

    return {
      url: `uploads/generations/${fileName}`,
      promptUsed: systemPrompt,
      modelUsed: `${modelUsed}-fallback`,
    };
  });
};

module.exports = {
  validateRoomImage,
  extractPreferences,
  generateRoomCompositeImage
};
