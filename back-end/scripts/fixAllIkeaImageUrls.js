const mongoose = require('mongoose');

const CATEGORY_POOLS = {
  sofa: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?w=800",
    "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800",
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800",
    "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800",
    "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800",
    "https://images.unsplash.com/photo-1506898667547-42e2b376e159?w=800"
  ],
  armchair: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800",
    "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
    "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800"
  ],
  coffee_table: [
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800",
    "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800",
    "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?w=800",
    "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800"
  ],
  tv_unit: [
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800"
  ],
  bed: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800"
  ],
  dining_table: [
    "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800",
    "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800",
    "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800"
  ],
  rug: [
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800",
    "https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?w=800"
  ],
  lamp: [
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800"
  ],
  bookshelf: [
    "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"
  ],
  default: [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"
  ]
};

function getPoolForCategory(cat = '') {
  const norm = String(cat).toLowerCase().replace(/[\s-]+/g, '_');
  if (norm.includes('sofa')) return CATEGORY_POOLS.sofa;
  if (norm.includes('chair') || norm.includes('armchair')) return CATEGORY_POOLS.armchair;
  if (norm.includes('table') && norm.includes('coffee')) return CATEGORY_POOLS.coffee_table;
  if (norm.includes('tv')) return CATEGORY_POOLS.tv_unit;
  if (norm.includes('bed')) return CATEGORY_POOLS.bed;
  if (norm.includes('table') && norm.includes('dining')) return CATEGORY_POOLS.dining_table;
  if (norm.includes('rug')) return CATEGORY_POOLS.rug;
  if (norm.includes('lamp')) return CATEGORY_POOLS.lamp;
  if (norm.includes('shelf') || norm.includes('book')) return CATEGORY_POOLS.bookshelf;
  return CATEGORY_POOLS.default;
}

async function fixAllIkeaImageUrls() {
  await mongoose.connect('mongodb://localhost:27017/smartspace_db');
  console.log('Connected to MongoDB smartspace_db');
  
  const collection = mongoose.connection.db.collection('products');
  const cursor = collection.find({ 'images.url': { $regex: 'ikea.com', $options: 'i' } });
  
  let updatedCount = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const cat = doc.classification?.canonicalCategory || doc.basic?.name || '';
    const pool = getPoolForCategory(cat);
    
    // Pick deterministic image from pool based on doc _id
    const hash = String(doc._id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const newUrl = pool[hash % pool.length];

    await collection.updateOne(
      { _id: doc._id },
      { $set: { 'images.0.url': newUrl } }
    );
    updatedCount++;
    if (updatedCount % 1000 === 0) {
      console.log(`Updated ${updatedCount} product image URLs...`);
    }
  }

  console.log(`\nSUCCESS: Updated ${updatedCount} product image URLs from blocked IKEA CDN to accessible Unsplash furniture images.`);
  process.exit(0);
}

fixAllIkeaImageUrls().catch((err) => {
  console.error(err);
  process.exit(1);
});
