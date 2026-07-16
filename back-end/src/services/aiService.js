const { GoogleGenAI, Type } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Validate a room image using Google Gemini Vision API.
 * Checks if the image is a valid corner shot, has good lighting, and is empty enough.
 *
 * @param {string} filePath - Absolute path to the uploaded image file
 * @param {string} mimeType - MIME type of the image (e.g. 'image/jpeg')
 * @returns {Promise<Object>} Validation result with is_valid, rejection_reason, etc.
 */
const validateRoomImage = async (filePath, mimeType) => {
  // 1. Upload the file to Gemini
  const uploadedFile = await ai.files.upload({
    file: filePath,
    config: { mimeType }
  });

  // 2. Build the prompt
  const prompt = `Analyze this image of a room. You are an expert architectural evaluator. 
Determine if this image is suitable for generating an interior design rendering.`;

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
          description: 'true if the room is mostly empty or only has minimal clutter'
        },
        is_valid: {
          type: Type.BOOLEAN,
          description: 'true ONLY if is_corner_shot is true, lighting_quality is good or excellent, and is_empty_enough is true'
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
      required: ['is_corner_shot', 'lighting_quality', 'is_empty_enough', 'is_valid']
    }
  };

  // 4. Call Gemini with the uploaded file reference
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
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

module.exports = {
  validateRoomImage
};
