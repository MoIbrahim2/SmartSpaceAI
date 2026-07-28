/**
 * Scratch script to test recommendation engine end-to-end with user's payload
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { generateRecommendations } = require('../src/services/recommendation/recommendationEngine');

const payload = {
  "roomType": "dining_room",
  "budget": 50000,
  "length": 400,
  "width": 300,
  "height": 280,
  "extractedPreferences": {
    "roomPreferences": {
      "style": "modern",
      "theme": null,
      "mood": null,
      "lighting": null,
      "colorPalette": null
    },
    "categoryPreferences": [
      {
        "category": "Dining Table",
        "included": true,
        "excluded": false,
        "quantity": null,
        "preferredMaterial": "wood",
        "preferredColor": null,
        "preferredStyle": "modern",
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": "HIGH"
      },
      {
        "category": "Dining Chairs",
        "included": true,
        "excluded": false,
        "quantity": 6,
        "preferredMaterial": "upholstered",
        "preferredColor": "beige",
        "preferredStyle": "modern",
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": "MEDIUM"
      },
      {
        "category": "Buffet Sideboard",
        "included": null,
        "excluded": null,
        "quantity": null,
        "preferredMaterial": null,
        "preferredColor": null,
        "preferredStyle": null,
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": null
      },
      {
        "category": "Chandelier",
        "included": null,
        "excluded": null,
        "quantity": null,
        "preferredMaterial": null,
        "preferredColor": null,
        "preferredStyle": null,
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": null
      },
      {
        "category": "Rug",
        "included": null,
        "excluded": null,
        "quantity": null,
        "preferredMaterial": null,
        "preferredColor": null,
        "preferredStyle": null,
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": null
      },
      {
        "category": "Curtains",
        "included": null,
        "excluded": null,
        "quantity": null,
        "preferredMaterial": null,
        "preferredColor": null,
        "preferredStyle": null,
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": null
      },
      {
        "category": "Wall Art",
        "included": null,
        "excluded": null,
        "quantity": null,
        "preferredMaterial": null,
        "preferredColor": null,
        "preferredStyle": null,
        "preferredShape": null,
        "preferredSize": null,
        "budgetAdjustment": null,
        "importance": null
      }
    ],
    "negativePreferences": {
      "materialsToAvoid": null,
      "colorsToAvoid": null,
      "categoriesToAvoid": null
    }
  }
};

const run = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db';
  await mongoose.connect(mongoUri);

  try {
    const result = await generateRecommendations({
      roomType: payload.roomType,
      totalBudget: payload.budget,
      length: payload.length,
      width: payload.width,
      height: payload.height,
      extractedPreferences: payload.extractedPreferences
    });

    console.log('=== RECOMMENDATION SUCCESS ===');
    console.log('Total Cost:', result.totalCost);
    console.log('Categories processed:', result.categories.length);
    result.categories.forEach(cat => {
      console.log(`- ${cat.category} (x${cat.quantity}): allocated=${cat.allocatedBudget}, unitTarget=${cat.unitTargetBudget}, rec=${cat.recommendation ? `${cat.recommendation.name} (${cat.recommendation.price} EGP)` : 'NONE'}`);
    });
    console.log('Diagnostics:', result.diagnostics);
  } catch (err) {
    console.error('=== RECOMMENDATION FAILED ===', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
