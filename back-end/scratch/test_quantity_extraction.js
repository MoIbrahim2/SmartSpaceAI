require('dotenv').config();
const promptBuilder = require('../src/services/promptBuilder.service');
const aiService = require('../src/services/aiService');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
  const tests = [
    {
      name: 'TEST 1 — Living Room',
      roomType: 'living_room',
      budget: 50000,
      length: 400,
      width: 300,
      height: 280,
      prompt: 'I want two small beige fabric sofas with warm lighting. Avoid leather.',
      assert: (res) => {
        const sofa = res.categoryPreferences.find(c => c.category === 'Sofa');
        const isLeatherAvoided = res.negativePreferences?.materialsToAvoid?.includes('leather');
        console.log('  Sofa extracted:', sofa);
        return sofa?.quantity === 2 &&
               sofa?.preferredColor?.toLowerCase() === 'beige' &&
               sofa?.preferredMaterial?.toLowerCase() === 'fabric' &&
               sofa?.preferredSize?.toLowerCase() === 'small' &&
               isLeatherAvoided;
      }
    },
    {
      name: 'TEST 2 — Bedroom',
      roomType: 'bedroom',
      budget: 40000,
      length: 400,
      width: 350,
      height: 280,
      prompt: 'I want two wooden nightstands beside the bed.',
      assert: (res) => {
        const nightstand = res.categoryPreferences.find(c => c.category === 'Nightstand');
        console.log('  Nightstand extracted:', nightstand);
        return nightstand?.quantity === 2 && nightstand?.preferredMaterial?.toLowerCase() === 'wood';
      }
    },
    {
      name: 'TEST 3 — Dining Room',
      roomType: 'dining_room',
      budget: 60000,
      length: 500,
      width: 400,
      height: 280,
      prompt: 'I want a dining table for six people with six beige upholstered chairs.',
      assert: (res) => {
        const table = res.categoryPreferences.find(c => c.category === 'Dining Table');
        const chairs = res.categoryPreferences.find(c => c.category === 'Dining Chairs');
        console.log('  Dining Table extracted:', table);
        console.log('  Dining Chairs extracted:', chairs);
        return (table?.quantity === null || table?.quantity === undefined) &&
               chairs?.quantity === 6 &&
               chairs?.preferredColor?.toLowerCase() === 'beige' &&
               chairs?.preferredMaterial?.toLowerCase() === 'upholstered';
      }
    },
    {
      name: 'TEST 4 — Bathroom',
      roomType: 'bathroom',
      budget: 30000,
      length: 300,
      width: 250,
      height: 280,
      prompt: 'I want a modern double-sink vanity.',
      assert: (res) => {
        const vanity = res.categoryPreferences.find(c => c.category === 'Vanity Unit');
        console.log('  Vanity Unit extracted:', vanity);
        return vanity?.quantity === null || vanity?.quantity === undefined;
      }
    },
    {
      name: 'TEST 5 — Bedroom Wardrobe',
      roomType: 'bedroom',
      budget: 45000,
      length: 450,
      width: 400,
      height: 280,
      prompt: 'I want a large three-door wooden wardrobe.',
      assert: (res) => {
        const wardrobe = res.categoryPreferences.find(c => c.category === 'Wardrobe');
        console.log('  Wardrobe extracted:', wardrobe);
        return (wardrobe?.quantity === null || wardrobe?.quantity === undefined) &&
               wardrobe?.preferredMaterial?.toLowerCase() === 'wood' &&
               wardrobe?.preferredSize?.toLowerCase() === 'large';
      }
    },
    {
      name: 'TEST 6 — Balcony',
      roomType: 'balcony',
      budget: 20000,
      length: 300,
      width: 200,
      height: 280,
      prompt: 'I want two outdoor chairs and four ceramic planters.',
      assert: (res) => {
        const seating = res.categoryPreferences.find(c => c.category === 'Outdoor Seating');
        const planter = res.categoryPreferences.find(c => c.category === 'Planter');
        console.log('  Outdoor Seating extracted:', seating);
        console.log('  Planter extracted:', planter);
        return seating?.quantity === 2 &&
               planter?.quantity === 4 &&
               planter?.preferredMaterial?.toLowerCase() === 'ceramic';
      }
    },
    {
      name: 'TEST 7 — No quantity',
      roomType: 'living_room',
      budget: 50000,
      length: 400,
      width: 300,
      height: 280,
      prompt: 'I want a modern minimalist living room with a beige fabric sofa and warm lighting.',
      assert: (res) => {
        const sofa = res.categoryPreferences.find(c => c.category === 'Sofa');
        console.log('  Sofa extracted:', sofa);
        return sofa?.quantity === null || sofa?.quantity === undefined;
      }
    }
  ];

  let passed = 0;
  for (const t of tests) {
    console.log(`\nRunning ${t.name}...`);
    const categoryRules = promptBuilder.loadCategoryRules(t.roomType);
    const availableCategories = promptBuilder.extractAvailableCategories(categoryRules);
    const categoryNames = availableCategories.map(c => c.category);
    const systemPrompt = promptBuilder.buildSystemPrompt(availableCategories);
    const userPrompt = promptBuilder.buildUserPrompt(
      { roomType: t.roomType, length: t.length, width: t.width, height: t.height, budget: t.budget },
      t.prompt,
      availableCategories
    );

    const result = await aiService.extractPreferences(systemPrompt, userPrompt, categoryNames);
    const ok = t.assert(result);
    if (ok) {
      console.log(`✅ ${t.name} PASSED!`);
      passed++;
    } else {
      console.log(`❌ ${t.name} FAILED! Result:`, JSON.stringify(result, null, 2));
    }
    // Rate limit pause: wait 3 seconds between calls
    await sleep(3000);
  }

  console.log(`\n========================================\nFinal Test Results: ${passed} / ${tests.length} passed.\n========================================`);
};

runTests();
