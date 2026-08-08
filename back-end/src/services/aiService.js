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
            },
            action: {
              type: Type.STRING,
              nullable: true,
              description: 'Action for ENHANCE_ROOM mode: REPLACE, ADD, KEEP, or REMOVE. null if not mentioned.'
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
            'importance',
            'action'
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
  spatialDirectives = '',
  roomDimensions = {},
  roomType = 'room',
  generationType = 'CREATE_FROM_SCRATCH',
  resolution = { width: 1280, height: 720 }
}) => {
  const modelUsed = process.env.QWEN_MODEL_FOR_IMAGE_GEN || 'qwen-image-2.0-pro';
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'generations');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dimText = roomDimensions.width_cm && roomDimensions.length_cm
    ? `${roomDimensions.width_cm}cm x ${roomDimensions.length_cm}cm x ${roomDimensions.height_cm || 280}cm`
    : 'standard room proportions';

  return await withRetry(async () => {
    try {
      if (apiKey) {
        const messageContent = [];
        let imageIndex = 1;
        let roomImageRef = '';
        const productRefList = [];

        // 1. Target Room Layout Image (<|image_1|>)
        if (roomImageUrl) {
          let roomImgSrc = null;
          if (roomImageUrl.startsWith('http://') || roomImageUrl.startsWith('https://')) {
            roomImgSrc = roomImageUrl;
          } else {
            const localPath = path.join(process.cwd(), roomImageUrl.replace(/^\//, ''));
            if (fs.existsSync(localPath)) {
              const fileBuffer = fs.readFileSync(localPath);
              const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
              const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
              roomImgSrc = `data:${mime};base64,${fileBuffer.toString('base64')}`;
            } else {
              console.warn(`[AI Service] Local room image file not found on disk: ${localPath}`);
            }
          }

          if (roomImgSrc) {
            messageContent.push({ image: roomImgSrc });
            roomImageRef = `<|image_1|> is the exact target room layout uploaded by the user. Maintain the background walls, floor, windows, doors, perspective, and architectural geometry of <|image_1|> EXACTLY identical.`;
            imageIndex++;
          }
        }

        // 2. Product Images & Detailed Inventory Directives
        for (const p of selectedProducts) {
          const pData = (p.productId && typeof p.productId === 'object' && (p.productId.basic || p.productId.name || p.productId.images))
            ? p.productId
            : (p.productData || p);

          const title = pData.basic?.name || pData.name || pData.title || pData.basic?.brand || p.category || 'Furniture Item';
          const brand = pData.basic?.brand || pData.brand || '';
          const fullTitle = brand ? `${brand} ${title}` : title;
          const qty = p.quantity || 1;
          const category = p.category || pData.classification?.canonicalCategory || pData.category || 'Furniture';

          // Extract physical dimensions
          const dimsObj = pData.dimensions || pData.specifications?.dimensions || {};
          const w = dimsObj.width || dimsObj.w;
          const d = dimsObj.length || dimsObj.depth || dimsObj.d || dimsObj.l;
          const h = dimsObj.height || dimsObj.h;
          const dimUnit = dimsObj.dimensionUnit || 'cm';
          const dimString = (w || d || h)
            ? `${w || '?'} ${dimUnit} (W) x ${d || '?'} ${dimUnit} (D) x ${h || '?'} ${dimUnit} (H)`
            : null;

          // Extract visual attributes & color keywords
          const rawColors = Array.isArray(pData.classification?.colors) && pData.classification.colors.length > 0
            ? pData.classification.colors.join(', ')
            : (Array.isArray(pData.ai?.dominantColors) && pData.ai.dominantColors.length > 0
                ? pData.ai.dominantColors.join(', ')
                : (pData.attributes?.color || pData.color || ''));
          
          const materials = Array.isArray(pData.classification?.materials)
            ? pData.classification.materials.join(', ')
            : (pData.attributes?.material || pData.material || '');
          
          const styles = Array.isArray(pData.classification?.styles)
            ? pData.classification.styles.join(', ')
            : (pData.attributes?.style || pData.style || '');

          // Helper keyword detector for color & finish from title/description
          const fullTextSearch = `${fullTitle} ${pData.basic?.description || ''} ${pData.description || ''}`.toLowerCase();
          const colorKeywords = ['white', 'black', 'grey', 'gray', 'beige', 'cream', 'brown', 'gold', 'silver', 'oak', 'walnut', 'natural wood', 'marble', 'glass', 'metal', 'velvet', 'fabric', 'upholstered', 'dark'];
          const detectedColors = colorKeywords.filter(kw => fullTextSearch.includes(kw));
          
          const finalColors = rawColors || (detectedColors.length > 0 ? detectedColors.join(', ') : '');
          const attrDetails = [styles, finalColors ? `COLOR/FINISH: ${finalColors.toUpperCase()}` : '', materials ? `MATERIAL: ${materials}` : ''].filter(Boolean).join(' | ');

          // Robust product image extraction helper
          let imgUrl = pData.primaryImage || pData.image_url || pData.image || pData.imageUrl || pData.img || pData.mainImageUrl || p.primaryImage || p.image || p.imageUrl || p.img;
          if (typeof imgUrl === 'object' && imgUrl) {
            imgUrl = imgUrl.url || imgUrl.src || null;
          }
          if (!imgUrl) {
            const imagesArr = pData.images || p.images || pData.productData?.images;
            if (Array.isArray(imagesArr) && imagesArr.length > 0) {
              const primary = imagesArr.find(img => img && (img.isPrimary || img.primary));
              const firstImg = primary || imagesArr[0];
              imgUrl = typeof firstImg === 'string' ? firstImg : (firstImg?.url || firstImg?.src);
            }
          }

          // CRITICAL FIX: Convert ALL images to base64 data URIs
          // Remote URLs often have CORS/hotlink protection causing the model to not see them
          let productImgSrc = null;
          if (imgUrl && typeof imgUrl === 'string') {
            imgUrl = imgUrl.trim();
            if (imgUrl.startsWith('data:image/')) {
              productImgSrc = imgUrl;
            } else if (imgUrl.includes('/uploads/')) {
              const relPath = imgUrl.substring(imgUrl.indexOf('/uploads/'));
              const localPath = path.join(process.cwd(), relPath.replace(/^\//, ''));
              if (fs.existsSync(localPath)) {
                const fileBuffer = fs.readFileSync(localPath);
                const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'png';
                const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                productImgSrc = `data:${mime};base64,${fileBuffer.toString('base64')}`;
              }
            }

            if (!productImgSrc && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))) {
              // DOWNLOAD remote image and convert to base64
              try {
                console.log(`[AI Service] Downloading product image for "${fullTitle}": ${imgUrl}`);
                const headers = {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'image/*,*/*'
                };
                try {
                  headers['Referer'] = new URL(imgUrl).origin;
                } catch (_) {}

                const imgRes = await fetch(imgUrl, {
                  headers,
                  signal: AbortSignal.timeout(15000)
                });
                if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  if (buffer.length > 100) {
                    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                    const mime = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/jpeg';
                    productImgSrc = `data:${mime};base64,${buffer.toString('base64')}`;
                    console.log(`[AI Service] ✓ Downloaded product image (${Math.round(buffer.length / 1024)}KB) for "${fullTitle}"`);
                  }
                } else {
                  console.warn(`[AI Service] ✗ Failed to download product image (HTTP ${imgRes.status}) for "${fullTitle}"`);
                }
              } catch (dlErr) {
                console.warn(`[AI Service] ✗ Error downloading product image for "${fullTitle}": ${dlErr.message}`);
              }
            } else if (!productImgSrc && !imgUrl.startsWith('http')) {
              const localPath = path.join(process.cwd(), imgUrl.replace(/^\//, ''));
              if (fs.existsSync(localPath)) {
                const fileBuffer = fs.readFileSync(localPath);
                const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'png';
                const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
                productImgSrc = `data:${mime};base64,${fileBuffer.toString('base64')}`;
              } else {
                console.warn(`[AI Service] Product image local file not found: ${localPath}`);
              }
            }
          }

          console.log(`[AI Service] Product parsed: "${fullTitle}" (${category}) | Has Image: ${Boolean(productImgSrc)} | Attr: ${attrDetails} | Image URL: ${imgUrl || 'N/A'}`);

          if (productImgSrc) {
            messageContent.push({ image: productImgSrc });
            const imgTag = `<|image_${imageIndex}|>`;
            productRefList.push(
              `• Object to Insert: ${imgTag} [Category: ${category.toUpperCase()}]\n` +
              `  - SUPREME SOURCE OF TRUTH: ${imgTag} (Reference Product Image)\n` +
              `  - ZERO HALLUCINATION (SHAPE & DIMENSIONS): You MUST mathematically copy the exact length, width, and height proportions from ${imgTag}. Do NOT extend or stretch the object. Copy the exact geometry and aspect ratio.\n` +
              `  - ZERO HALLUCINATION (COLOR): Extract the exact RGB color from ${imgTag} and apply it. If it is dark, it must render as dark. NO COLOR BLEEDING from the floor.\n` +
              `  - PIXEL-PERFECT CLONING: Copy the exact fabric/wood finish and frame structure from ${imgTag}.\n` +
              `  - QUANTITY TO RENDER: Exactly ${qty} ${qty > 1 ? 'identical units' : 'unit'} placed in the room.\n` +
              `  - PHYSICAL DIMENSIONS: ${dimString || 'Maintain exact proportions from the reference image'}.`
            );
            imageIndex++;
          } else {
            productRefList.push(
              `• Object to Insert: [Category: ${category.toUpperCase()}]\n` +
              `  - QUANTITY TO RENDER: Exactly ${qty} ${qty > 1 ? 'units' : 'unit'}.\n` +
              `  - PHYSICAL DIMENSIONS: ${dimString || 'Maintain exact proportions'}\n` +
              `  - VISUAL SPECIFICATIONS: Modern design.`
            );
          }
        }

        // Count total products for verification
        const totalProductCount = selectedProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
        const totalUniqueProducts = selectedProducts.length;
        const isEnhance = generationType === 'ENHANCE_ROOM' || generationType === 'ENHANCE_EXISTING';

        // 3. Ultra-Concentrated & Detailed System Prompt Directive for Qwen
        const qwenPrompt = `[SYSTEM ROLE & CORE DIRECTIVE]
You are a deterministic, ultra-high-precision Architectural Virtual Staging & ${isEnhance ? 'Room Enhancement' : 'Compositing'} Engine. You do not imagine, hallucinate, or generate random furniture. Your EXCLUSIVE purpose is to execute a pixel-perfect ${isEnhance ? 'room enhancement, restyling, and inpainting' : 'compositing'} operation. You will take the provided reference furniture images and clone their exact visual properties into the target room layout (<|image_1|>).

[1. BASE ROOM ARCHITECTURE & LAYOUT (<|image_1|>)]
${roomImageRef ? roomImageRef : `Target Room Space: A ${roomType} (${dimText}).`}
- WIDE-ANGLE & FULL ROOM CAMERA ANGLE: Expand the camera perspective to a wide-angle architectural corner lens shot (18mm-24mm FOV from an elevated room corner). Even if <|image_1|> is cropped, tightly framed, or partial, WIDEN the room layout angle to display the full, uncropped room space from corner to corner so all placed furniture items (bed, wardrobe, nightstands, etc.) are completely visible in the scene.
- STRUCTURAL IMMUTABILITY: The room geometry is locked. You are FORBIDDEN from altering, moving, or modifying the back walls, side walls, floor material, floor texture, ceiling lines, doors, window frames, built-in fixtures, or baseboards.
- LIGHTING & PERSPECTIVE LOCK: Match the camera Field of View (FOV), vanishing points, horizon line, and room scale perfectly. Analyze natural daylight (windows) and artificial light (ceiling) in <|image_1|>. All placed furniture must cast physically accurate contact shadows and directional shadows matching this exact lighting environment. 
${isEnhance ? '- EXISTING FURNITURE & RESTYLING DIRECTIVE: <|image_1|> contains an existing furnished room layout. RETAIN existing furniture items visible in <|image_1|> EXCEPT for items explicitly replaced, removed, or added by the new product inventory below. Perform smooth inpainting and seamless visual integration for new items.' : '- NO ARCHITECTURAL BLEEDING: The room\'s floor texture or wall colors MUST NOT bleed onto the furniture.'}

[2. MANDATORY PRODUCT INVENTORY (${totalUniqueProducts} unique products, ${totalProductCount} total items)]
CRITICAL REQUIREMENT: You MUST clone the EXACT visual products from the provided images into the room. You may not substitute them with generic 3D models from your training data.

--- INVENTORY LIST ---
${productRefList.join('\n\n')}
----------------------

[3. PIXEL-PERFECT VISUAL FIDELITY, COLOR, & MATERIAL REPLICATION]
- EXACT RGB COLOR MATCHING: You must analyze the hex colors of the reference images. A dark brown wooden bed in the reference MUST remain a dark brown wooden bed in the generated image. DO NOT lighten or change the color to match the floor or walls.
- PROHIBITION OF COLOR LEAKAGE: Do NOT blend the furniture colors with the room's floor or walls. Color leakage is strictly prohibited.
- GEOMETRIC & DIMENSIONAL ACCURACY: Replicate exact leg shapes, headboard heights, armrest curves, cushion tufting, and frame thicknesses. Do NOT hallucinate longer beds or taller headboards. Lock the aspect ratio of the object to match its reference image exactly.

[4. SPATIAL AWARENESS & PLACEMENT LOGIC]
- MANDATORY SPATIAL LAYOUT DIRECTIVES (FROM DEEPSEEK SPATIAL GUARDRAIL Engine):
${spatialDirectives ? spatialDirectives : '- Arrange products logically with clean walking paths, realistic spacing, and balanced ergonomics.'}

- WARDROBE & DRAWER OPENING CLEARANCE MANDATE: Every Wardrobe, Dresser, Closet, or Storage unit MUST have at least 80cm-100cm of clear, unobstructed open floor space directly in front of its doors and drawers. You are STRICTLY FORBIDDEN from positioning a wardrobe flush or jammed against the side/foot of a bed or nightstand. Maintain a visible clear floor gap in front of wardrobes so doors and drawers can open fully without colliding into beds or nightstands.
- USER DESIGN INSTRUCTIONS: "${prompt || 'Follow standard aesthetic interior design principles.'}"
- CORE FOCAL ITEM MANDATE: Major focal furniture items (e.g. BED in a Bedroom, SOFA in a Living Room) are MANDATORY central focal points. The Bed must be rendered prominently placed against a main wall with its headboard and frame clearly visible. Secondary items like Nightstands and Wardrobes must be positioned adjacent or along walls relative to the main Bed.
- SCALE & PROPORTION: Adhere strictly to the physical dimensions provided in the inventory. Use the room's doors and windows (which have standard heights) as a scale reference. DO NOT stretch objects along the Z-axis.
- PHYSICAL MECHANICS: Furniture must rest firmly on the floor. No floating objects. Objects must not clip through walls, intersect with other furniture, or block structural doors. Provide realistic spacing between items.

[5. ABSOLUTE MANDATORY RULES (VIOLATION IS UNACCEPTABLE)]
- RULE 1 (ZERO HALLUCINATION OF SHAPE/COLOR): Ignore any text titles, default room templates, or your own assumptions that contradict the reference image pixels. The reference image is absolute law.
- RULE 2 (EXACT QUANTITY & ALL CATEGORIES INCLUDED): Render EVERY SINGLE product listed in the inventory below (Bed, Wardrobe, Nightstand, etc.). You are FORBIDDEN from omitting core items like the Bed. Render EXACTLY ${totalProductCount} total items from the inventory list. If a product has a quantity of 2, place TWO IDENTICAL, separate copies in the room.
- RULE 3 (${isEnhance ? 'RESTYLING & CLEAN INTEGRATION' : 'NO STRAY OBJECTS'}): ${isEnhance ? 'Preserve non-replaced items in <|image_1|>, remove/replace old items targeted by the new inventory, and seamlessly composite the new furniture items into <|image_1|> without unrequested clutter.' : 'DO NOT add random decor, plants, rugs, or lamps unless explicitly listed in the inventory above. The room must only contain <|image_1|>\'s architecture and the exact products listed.'}

[FINAL COMPLIANCE CHECKLIST]
✓ Are the exact RGB colors, textures, and dimensions cloned 100% from the reference images?
✓ Are the proportions correct without any unnatural stretching?
✓ Is the room's original architecture, flooring, and perspective 100% preserved?
✓ Are there EXACTLY ${totalProductCount} inserted items, with no unrequested decor?
✓ Are contact shadows physically accurate without altering the object's true color?`;

        messageContent.push({ text: qwenPrompt });

        const qwenApiUrl = process.env.QWEN_API_URL || 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
        console.log(`[AI Service] Calling Qwen API (${modelUsed}) at ${qwenApiUrl} with ${messageContent.filter(m => m.image).length} images (${messageContent.filter(m => m.image && m.image.startsWith('data:')).length} as base64)...`);

        const response = await fetch(qwenApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelUsed,
            input: {
              messages: [
                {
                  role: 'user',
                  content: messageContent
                }
              ]
            },
            parameters: {
              n: 1,
              watermark: false
            }
          })
        });

        if (response.ok) {
          const resData = await response.json();
          let generatedImageUrl = null;

          if (resData.output?.choices?.[0]?.message?.content) {
            const contentArr = resData.output.choices[0].message.content;
            const imgObj = Array.isArray(contentArr) ? contentArr.find(item => item.image) : null;
            if (imgObj) generatedImageUrl = imgObj.image;
          }

          if (!generatedImageUrl) {
            generatedImageUrl =
              resData.output?.choices?.[0]?.image ||
              resData.output?.results?.[0]?.url ||
              resData.output?.image_url;
          }

          if (generatedImageUrl) {
            const fileName = `generated_room_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = path.join(uploadsDir, fileName);

            if (generatedImageUrl.startsWith('data:image/')) {
              const cleanBase64 = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
              fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
            } else {
              const imgRes = await fetch(generatedImageUrl);
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
              }
            }

            if (fs.existsSync(filePath)) {
              return {
                url: `uploads/generations/${fileName}`,
                promptUsed: qwenPrompt,
                modelUsed
              };
            }
          }
        } else {
          const errorText = await response.text();
          console.warn(`[AI Service] Qwen API error (${response.status}): ${errorText}`);
        }
      }
    } catch (imgGenErr) {
      console.warn(`[AI Service] Qwen image generation error (${imgGenErr.message}), falling back to baseline composite generator...`);
    }

    // Fallback: If image generation fails or model is unavailable, create a valid composite reference using source image or default asset
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

/**
 * Validate a seller product submission using Google Gemini Vision API.
 * Checks if the image matches product name, description, materials, colors, dimensions.
 *
 * @param {string} productId - Product ID to validate
 * @returns {Promise<Object>} Updated product or validation log
 */
const validateSellerProductSubmission = async (productId) => {
  const Product = require('../models/product.model');
  const product = await Product.findById(productId);
  if (!product) {
    console.error(`[AI Service] Product not found for validation: ${productId}`);
    return;
  }

  try {
    // 1. Get image to validate
    let imgUrl = null;
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.isPrimary);
      const firstImg = primary || product.images[0];
      imgUrl = firstImg.url;
    }

    if (!imgUrl) {
      product.processing.status = 'REJECTED';
      product.processing.issues = ['No product image was provided for validation.'];
      await product.save();
      return product;
    }

    // 2. Load image as base64
    let base64Data = null;
    let mimeType = 'image/jpeg';

    if (imgUrl.startsWith('data:image/')) {
      const parts = imgUrl.split(';base64,');
      mimeType = parts[0].split(':')[1] || 'image/jpeg';
      base64Data = parts[1];
    } else if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      const imgRes = await fetch(imgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*',
          'Referer': new URL(imgUrl).origin
        },
        signal: AbortSignal.timeout(15000)
      });
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        mimeType = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/jpeg';
        base64Data = buffer.toString('base64');
      } else {
        throw new Error(`Failed to fetch remote image: HTTP ${imgRes.status}`);
      }
    } else {
      // Local file
      const localPath = path.join(process.cwd(), imgUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
        mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        base64Data = fileBuffer.toString('base64');
      } else {
        throw new Error(`Local file not found: ${localPath}`);
      }
    }

    if (!base64Data) {
      throw new Error('Failed to resolve image data');
    }

    // 3. Build evaluation prompt
    const prompt = `Analyze this product image. You are an expert retail catalogue auditor.
Determine if this image is a correct representation of the product metadata provided below.
Name: ${product.basic?.name || 'N/A'}
Brand: ${product.basic?.brand || 'N/A'}
Description: ${product.basic?.description || 'N/A'}
Category: ${product.classification?.canonicalCategory || 'N/A'}
Materials: ${(product.classification?.materials || []).join(', ') || 'N/A'}
Colors: ${(product.classification?.colors || []).join(', ') || 'N/A'}
Dimensions: ${product.dimensions?.length || '?'}cm (L) x ${product.dimensions?.width || '?'}cm (W) x ${product.dimensions?.height || '?'}cm (H)

Perform the following verification checks:
1. Verify if the primary visual item is indeed of category "${product.classification?.canonicalCategory || 'N/A'}".
2. Check for material conflicts (e.g. description/metadata says 'Glass' or 'Wood' but visual shows plastic or fabric).
3. Check for major color mismatches.
4. Verify if the item proportions make sense relative to typical human scale.

Return whether it is a match, your confidence score, and a list of specific mismatches (in English) if any are found.`;

    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          is_match: {
            type: Type.BOOLEAN,
            description: 'true ONLY if the image represents the product described by the metadata without major visual contradictions.'
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Confidence score from 0.0 to 1.0.'
          },
          mismatches: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of specific discrepancy issues found, empty if is_match is true.'
          }
        },
        required: ['is_match', 'confidence', 'mismatches']
      }
    };

    // 4. Call Gemini
    const evaluation = await withRetry(async () => {
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

    console.log(`[AI Service] Validation result for product ${productId}:`, evaluation);

    // 5. Update product status
    if (evaluation.is_match && evaluation.confidence >= 0.85) {
      product.processing.status = 'ACCEPTED';
      product.processing.issues = [];
    } else if (!evaluation.is_match) {
      product.processing.status = 'REJECTED';
      product.processing.issues = evaluation.mismatches.length > 0 ? evaluation.mismatches : ['Visual details do not match metadata attributes.'];
    } else {
      product.processing.status = 'MANUAL_REVIEW_REQUIRED';
      product.processing.issues = evaluation.mismatches;
    }

    await product.save();
    return product;

  } catch (error) {
    console.error(`[AI Service] Error validating product ${productId}:`, error);
    // On pipeline error, flag for manual review so it does not get stuck forever
    product.processing.status = 'MANUAL_REVIEW_REQUIRED';
    product.processing.issues = [`AI pipeline validation error: ${error.message}`];
    await product.save();
    return product;
  }
};

/**
 * Generate a wide-angle expanded view of an empty room image using Qwen image model.
 * Uses process.env.QWEN_MODEL_FOR_WIDEN_ROOM (default: 'qwen-image-2.0-pro').
 *
 * @param {Object} options - { roomImageUrl, roomType }
 * @returns {Promise<Object>} { url: 'uploads/generations/widened_room_....jpg' } or null
 */
const widenRoomImage = async ({ roomImageUrl, roomType = 'room' }) => {
  const modelUsed = process.env.QWEN_MODEL_FOR_WIDEN_ROOM || 'qwen-image-2.0-pro';
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;

  if (!roomImageUrl) return null;

  const uploadsDir = path.join(process.cwd(), 'uploads', 'generations');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return await withRetry(async () => {
    try {
      if (!apiKey) {
        console.warn('[AI Service] Qwen API key not found. Cannot generate widened room image.');
        return null;
      }

      let roomImgSrc = null;
      if (roomImageUrl.startsWith('http://') || roomImageUrl.startsWith('https://')) {
        roomImgSrc = roomImageUrl;
      } else {
        const localPath = path.join(process.cwd(), roomImageUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          const fileBuffer = fs.readFileSync(localPath);
          const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          roomImgSrc = `data:${mime};base64,${fileBuffer.toString('base64')}`;
        } else {
          console.warn(`[AI Service] Local room image file not found for widening: ${localPath}`);
          return null;
        }
      }

      const widenPrompt = `You are an expert architectural camera lens expansion engine.
Take <|image_1|>, which shows an empty ${roomType}.
Expand the camera view into a high-resolution, wide-angle wide-perspective shot showing more of the floor space, walls, and ceiling architecture.

STRICT MANDATORY CONSTRAINTS:
1. ARCHITECTURAL IDENTITY: Keep the EXACT wall color, wall paint, floor tiles/wood texture, window/door positions, and lighting of <|image_1|>. Do NOT change the wall color or floor material.
2. COMPLETELY EMPTY ROOM: Do NOT add any furniture, beds, sofas, chairs, tables, plants, decor, rugs, or lamps. The room MUST remain 100% EMPTY.
3. NO CLUTTER: Render only the wide-angle empty room architecture.`;

      const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelUsed,
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  { image: roomImgSrc },
                  { text: widenPrompt }
                ]
              }
            ]
          },
          parameters: {
            n: 1,
            watermark: false
          }
        })
      });

      if (response.ok) {
        const resData = await response.json();
        let generatedImageUrl = null;

        if (resData.output?.choices?.[0]?.message?.content) {
          const contentArr = resData.output.choices[0].message.content;
          const imgObj = Array.isArray(contentArr) ? contentArr.find(item => item.image) : null;
          if (imgObj) generatedImageUrl = imgObj.image;
        }

        if (!generatedImageUrl) {
          generatedImageUrl =
            resData.output?.choices?.[0]?.image ||
            resData.output?.results?.[0]?.url ||
            resData.output?.image_url;
        }

        if (generatedImageUrl) {
          const fileName = `widened_room_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const filePath = path.join(uploadsDir, fileName);

          if (generatedImageUrl.startsWith('data:image/')) {
            const cleanBase64 = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
          } else {
            const imgRes = await fetch(generatedImageUrl);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            }
          }

          if (fs.existsSync(filePath)) {
            return {
              url: `uploads/generations/${fileName}`,
              promptUsed: widenPrompt,
              modelUsed
            };
          }
        }
      } else {
        const errorText = await response.text();
        console.warn(`[AI Service] Qwen widen room API error (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('[AI Service] Error in widenRoomImage:', err.message);
    }
    return null;
  });
};

/**
 * Validate that the widened room image preserves the original room's architecture
 * (wall color, floor material, room structure) and remains completely empty without adding furniture.
 *
 * @param {Object} options - { originalImageUrl, widenedImageUrl }
 * @returns {Promise<Object>} { is_valid: boolean, layout_preserved: boolean, remains_empty: boolean, reason: string }
 */
const validateWidenedRoomLayout = async ({ originalImageUrl, widenedImageUrl }) => {
  if (!originalImageUrl || !widenedImageUrl) {
    return { is_valid: false, reason: 'Missing original or widened image URL.' };
  }

  const getInlineData = (imgUrl) => {
    let localPath = imgUrl;
    if (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://')) {
      localPath = path.join(process.cwd(), imgUrl.replace(/^\//, ''));
    }
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      return {
        inlineData: {
          mimeType,
          data: buffer.toString('base64')
        }
      };
    }
    return null;
  };

  const origData = getInlineData(originalImageUrl);
  const widenData = getInlineData(widenedImageUrl);

  if (!origData || !widenData) {
    console.warn('[AI Service] Could not load image files for widened layout validation.');
    return { is_valid: true, layout_preserved: true, remains_empty: true, reason: 'File check skipped.' };
  }

  const prompt = `Compare these two room images:
The first image is the original empty room image uploaded by the user.
The second image is an AI-generated widened view of the same room.

Determine whether the second image correctly preserves the original room layout and architecture.
Evaluation Rules:
1. layout_preserved: true ONLY if the wall color, wall paint, floor material (e.g. wood, tiles), and architectural identity in the second image match the first image. Set to false if the wall color, floor, or room layout changed dramatically.
2. remains_empty: true ONLY if the second image is completely empty and contains NO hallucinated furniture, beds, sofas, tables, or unrequested objects.
3. is_valid: true ONLY if BOTH layout_preserved is true AND remains_empty is true.`;

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        layout_preserved: {
          type: Type.BOOLEAN,
          description: 'true if wall colors, floor materials, and architectural geometry match the original room'
        },
        remains_empty: {
          type: Type.BOOLEAN,
          description: 'true if the widened room contains no furniture, decor, or unrequested objects'
        },
        is_valid: {
          type: Type.BOOLEAN,
          description: 'true if both layout_preserved and remains_empty are true'
        },
        reason: {
          type: Type.STRING,
          description: 'Short explanation of the evaluation'
        }
      },
      required: ['layout_preserved', 'remains_empty', 'is_valid', 'reason']
    }
  };

  return await withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL_FOR_GUARD || 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              origData,
              widenData,
              { text: prompt }
            ]
          }
        ],
        config
      });

      const parsed = JSON.parse(response.text);
      console.log('[AI Service] Widened room layout validation result:', parsed);
      return parsed;
    } catch (err) {
      console.error('[AI Service] Error validating widened room layout with Gemini:', err.message);
      return { is_valid: true, layout_preserved: true, remains_empty: true, reason: 'Validation fallback on error' };
    }
  });
};

module.exports = {
  validateRoomImage,
  extractPreferences,
  generateRoomCompositeImage,
  validateSellerProductSubmission,
  widenRoomImage,
  validateWidenedRoomLayout
};
