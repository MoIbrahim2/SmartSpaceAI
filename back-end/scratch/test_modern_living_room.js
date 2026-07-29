require('dotenv').config();
const promptBuilder = require('../src/services/promptBuilder.service');
const aiService = require('../src/services/aiService');
const { resolveAllCategories } = require('../src/services/recommendation/categoryResolver');
const { allocateBudgets } = require('../src/services/recommendation/budgetAllocator');
const { formatTierProduct } = require('../src/services/recommendation/tierClassifier');

async function testModernLivingRoom() {
  console.log('Testing Modern Living Room Prompt Requirements...');

  const prompt = "Design this room in a Modern style featuring sleek furniture, clean architectural lines, neutral tones, and ambient LED lighting. I want a large beige fabric sofa as the main piece, two comfortable armchairs, and a natural wood coffee table. Add a large neutral rug, a wooden TV unit, and two side tables. I prefer natural wood, beige, cream, and warm neutral colors. Include a modern floor lamp and some minimal wall art. Avoid leather, black furniture, bright colors, and anything that looks industrial or overly luxurious. Keep the design clean and spacious rather than filling the room with too much furniture. The sofa and coffee table are the most important pieces, so prioritize more of the budget for them.";

  const roomType = 'living_room';
  const categoryRules = promptBuilder.loadCategoryRules(roomType);
  const availableCategories = promptBuilder.extractAvailableCategories(categoryRules);
  const categoryNames = availableCategories.map(c => c.category);
  const systemPrompt = promptBuilder.buildSystemPrompt(availableCategories);
  const userPrompt = promptBuilder.buildUserPrompt(
    { roomType, length: 500, width: 400, height: 280, budget: 100000 },
    prompt,
    availableCategories
  );

  console.log('\nExtracting preferences via Gemini...');
  const preferences = await aiService.extractPreferences(systemPrompt, userPrompt, categoryNames);

  console.log('\n--- Extracted Room Preferences ---');
  console.log(preferences.roomPreferences);

  console.log('\n--- Extracted Negative Preferences ---');
  console.log(preferences.negativePreferences);

  console.log('\n--- Extracted Category Preferences ---');
  console.table(preferences.categoryPreferences.filter(c => c.included || c.quantity));

  // Category resolution
  const kbCategories = categoryRules.categories;
  const resolutionResult = resolveAllCategories(
    preferences.categoryPreferences,
    kbCategories,
    availableCategories,
    preferences.negativePreferences
  );

  console.log('\n--- Resolved Categories ---');
  console.table(resolutionResult.resolvedCategories.map(c => ({
    category: c.resolvedCategory,
    isUserRequested: c.isUserRequested,
    importance: c.geminiPreference?.importance || 'N/A',
    budgetAdjustment: c.geminiPreference?.budgetAdjustment || 'N/A',
    quantity: c.geminiPreference?.quantity || 1,
    role: c.kbRule?.role
  })));

  // Budget allocation
  const allocations = allocateBudgets(100000, resolutionResult.resolvedCategories);
  console.log('\n--- Budget Allocations ---');
  console.table(allocations.map(a => ({
    category: a.resolvedCategory,
    isUserRequested: a.isUserRequested,
    allocatedBudget: a.allocatedBudget,
    effectivePercentage: Math.round(a.effectivePercentage * 10) / 10,
    unitTargetBudget: a.unitTargetBudget,
    resolvedQuantity: a.resolvedQuantity
  })));

  // Verify DB/Scraped product image formatting
  const mockDbProduct = {
    _id: 'db_sofa_123',
    basic: { name: 'Modern Fabric Beige Sofa', brand: 'Homzmart' },
    pricing: { currentPrice: 25000, currency: 'EGP' },
    images: [{ url: 'https://cdn.homzmart.com/products/sofa1.jpg', isPrimary: true }],
    source: { productUrl: 'https://homzmart.com/sofa1' }
  };
  const formatted = formatTierProduct(mockDbProduct, 1);
  console.log('\n--- Formatted Product Image Verification ---');
  console.log('Primary Image:', formatted.primaryImage);
  console.log('Matches original DB/scraped URL:', formatted.primaryImage === 'https://cdn.homzmart.com/products/sofa1.jpg');

  console.log('\nAll checks completed successfully!');
}

testModernLivingRoom().catch(console.error);
