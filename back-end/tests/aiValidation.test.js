/**
 * Unit & Integration Tests — Gemini Vision Product Audit Pipeline
 */

const Product = require('../src/models/product.model');
const { validateSellerProductSubmission } = require('../src/services/aiService');
const { GoogleGenAI } = require('@google/genai');

// Mock dependencies
jest.mock('../src/models/product.model');
jest.mock('@google/genai');

describe('Gemini Vision Product Audit Pipeline', () => {
  const mockProductId = '64f8c9b29c9c9c9c9c9c9c9d';
  let mockProduct;
  let mockGenerateContent;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProduct = {
      _id: mockProductId,
      basic: {
        name: 'Modern Velvet Sofa',
        brand: 'Urban Living',
        description: 'A luxurious 3-seater velvet sofa'
      },
      classification: {
        canonicalCategory: 'Sofa',
        materials: ['Velvet', 'Wood'],
        colors: ['Blue']
      },
      dimensions: { length: 200, width: 90, height: 85 },
      images: [
        { url: 'data:image/jpeg;base64,mockBase64StringData', isPrimary: true }
      ],
      processing: {
        status: 'PENDING_AI_VALIDATION',
        confidence: null,
        detectedObject: null,
        issues: []
      },
      save: jest.fn().mockResolvedValue(true)
    };

    Product.findById.mockResolvedValue(mockProduct);

    mockGenerateContent = jest.fn();
    GoogleGenAI.prototype.models = {
      generateContent: mockGenerateContent
    };
  });

  test('Scenario 1: Valid Furniture — Item matches metadata with high confidence -> ACCEPTED', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        is_furniture: true,
        detected_object: 'Sofa',
        is_match: true,
        confidence: 0.95,
        mismatches: [],
        human_reasons: []
      })
    });

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('ACCEPTED');
    expect(result.processing.confidence).toBe(0.95);
    expect(result.processing.detectedObject).toBe('Sofa');
    expect(result.processing.issues).toEqual([]);
    expect(mockProduct.save).toHaveBeenCalled();
  });

  test('Scenario 2: Non-Furniture Image — Uploaded image is a laptop -> REJECTED', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        is_furniture: false,
        detected_object: 'Laptop',
        is_match: false,
        confidence: 0.98,
        mismatches: ['Image contains an electronic device, not furniture.'],
        human_reasons: [
          'The uploaded image does not show a furniture product.',
          'The selected category is Sofa, but the image shows a laptop.'
        ]
      })
    });

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('REJECTED');
    expect(result.processing.detectedObject).toBe('Laptop');
    expect(result.processing.issues).toContain('The uploaded image does not show a furniture product.');
    expect(result.processing.issues).toContain('The selected category is Sofa, but the image shows a laptop.');
  });

  test('Scenario 3: Category Mismatch — Metadata says Sofa, image shows Dining Table -> REJECTED', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        is_furniture: true,
        detected_object: 'Dining Table',
        is_match: false,
        confidence: 0.92,
        mismatches: ['Category discrepancy: image contains a table.'],
        human_reasons: [
          'The uploaded product appears to be a Dining Table, not a Sofa.',
          'The image does not match the selected product category.'
        ]
      })
    });

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('REJECTED');
    expect(result.processing.detectedObject).toBe('Dining Table');
    expect(result.processing.issues).toContain('The uploaded product appears to be a Dining Table, not a Sofa.');
  });

  test('Scenario 4: Attribute Conflict — Material mismatch -> REJECTED', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        is_furniture: true,
        detected_object: 'Sofa',
        is_match: false,
        confidence: 0.90,
        mismatches: ['Material mismatch'],
        human_reasons: [
          'The material appears to be leather rather than velvet as stated in metadata.'
        ]
      })
    });

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('REJECTED');
    expect(result.processing.issues).toContain('The material appears to be leather rather than velvet as stated in metadata.');
  });

  test('Scenario 5: Low Confidence (< 0.85) -> MANUAL_REVIEW_REQUIRED', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        is_furniture: true,
        detected_object: 'Sofa',
        is_match: true,
        confidence: 0.72,
        mismatches: [],
        human_reasons: [
          'Lighting and image angle prevent high-confidence automated verification.'
        ]
      })
    });

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('MANUAL_REVIEW_REQUIRED');
    expect(result.processing.confidence).toBe(0.72);
    expect(result.processing.issues).toContain('Lighting and image angle prevent high-confidence automated verification.');
  });

  test('Scenario 6: API/Network Exception -> MANUAL_REVIEW_REQUIRED with clear reason', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API Rate Limit Exceeded / Network Timeout'));

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('MANUAL_REVIEW_REQUIRED');
    expect(result.processing.confidence).toBe(0);
    expect(result.processing.detectedObject).toBe('Error');
    expect(result.processing.issues).toContain('Automatic AI validation could not be completed. Manual review is required.');
  });

  test('Scenario 7: Missing Image -> REJECTED', async () => {
    mockProduct.images = [];

    const result = await validateSellerProductSubmission(mockProductId);

    expect(result.processing.status).toBe('REJECTED');
    expect(result.processing.issues).toContain('No product image was provided for validation.');
  });
});
