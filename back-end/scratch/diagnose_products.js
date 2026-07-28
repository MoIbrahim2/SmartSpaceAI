/**
 * MongoDB Diagnostic Script for Recommendation Engine
 * 
 * Queries the products collection to extract:
 * 1. All distinct canonicalCategory values with counts
 * 2. Existing indexes
 * 3. Processing issues distribution
 * 4. Price range per category
 * 5. Sample product document structure
 * 
 * Usage: node scratch/diagnose_products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db';
  console.log(`Connecting to: ${mongoUri.replace(/\/\/[^@]+@/, '//***@')}`);
  
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  
  // Check what collections exist
  const collections = await db.listCollections().toArray();
  console.log('=== ALL COLLECTIONS ===');
  collections.forEach(c => console.log(`  - ${c.name}`));
  console.log();

  // Find the products collection (might be named differently)
  const productCollectionNames = collections
    .map(c => c.name)
    .filter(n => n.toLowerCase().includes('product'));
  
  if (productCollectionNames.length === 0) {
    console.log('WARNING: No collection with "product" in the name found.');
    console.log('Looking for collections with significant document counts...');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  ${col.name}: ${count} documents`);
    }
    await mongoose.disconnect();
    return;
  }

  const collName = productCollectionNames[0];
  console.log(`Using collection: ${collName}\n`);
  const products = db.collection(collName);

  // 1. Total count
  const totalCount = await products.countDocuments();
  console.log(`=== TOTAL PRODUCTS: ${totalCount} ===\n`);

  // 2. Distinct canonicalCategory values with counts
  console.log('=== CANONICAL CATEGORIES ===');
  const categories = await products.aggregate([
    { $group: { _id: '$classification.canonicalCategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  categories.forEach(cat => {
    console.log(`  ${cat._id}: ${cat.count} products`);
  });
  console.log(`\nTotal distinct categories: ${categories.length}\n`);

  // 3. Processing status distribution
  console.log('=== PROCESSING STATUS ===');
  const statuses = await products.aggregate([
    { $group: { _id: '$processing.status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  statuses.forEach(s => console.log(`  ${s._id}: ${s.count}`));
  console.log();

  // 4. Processing issues distribution
  console.log('=== PROCESSING ISSUES DISTRIBUTION ===');
  const issues = await products.aggregate([
    { $unwind: { path: '$processing.issues', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$processing.issues', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  issues.forEach(i => console.log(`  ${i._id}: ${i.count}`));
  if (issues.length === 0) console.log('  (none found)');
  console.log();

  // 5. Existing indexes
  console.log('=== EXISTING INDEXES ===');
  const indexes = await products.indexes();
  indexes.forEach(idx => {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  });
  console.log();

  // 6. Price range per category (for ACCEPTED products)
  console.log('=== PRICE RANGES PER CATEGORY (ACCEPTED only) ===');
  const priceRanges = await products.aggregate([
    { $match: { 'processing.status': 'ACCEPTED', 'pricing.currentPrice': { $gt: 0 } } },
    { $group: {
      _id: '$classification.canonicalCategory',
      minPrice: { $min: '$pricing.currentPrice' },
      maxPrice: { $max: '$pricing.currentPrice' },
      avgPrice: { $avg: '$pricing.currentPrice' },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]).toArray();
  
  priceRanges.forEach(p => {
    console.log(`  ${p._id}: min=${p.minPrice}, max=${p.maxPrice}, avg=${Math.round(p.avgPrice)}, count=${p.count}`);
  });
  console.log();

  // 7. Availability distribution
  console.log('=== AVAILABILITY DISTRIBUTION ===');
  const availability = await products.aggregate([
    { $group: { _id: '$availability.inStock', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  availability.forEach(a => console.log(`  inStock=${a._id}: ${a.count}`));
  console.log();

  // 8. Sample product document (first ACCEPTED one)
  console.log('=== SAMPLE PRODUCT DOCUMENT ===');
  const sample = await products.findOne({ 'processing.status': 'ACCEPTED' });
  if (sample) {
    // Show structure with field types, not full content
    console.log(JSON.stringify(sample, null, 2));
  } else {
    console.log('No ACCEPTED product found');
  }

  // 9. Room types distribution
  console.log('\n=== ROOM TYPES DISTRIBUTION ===');
  const roomTypes = await products.aggregate([
    { $unwind: { path: '$classification.roomTypes', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$classification.roomTypes', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  roomTypes.forEach(r => console.log(`  ${r._id}: ${r.count}`));
  console.log();

  // 10. Dimensions field analysis — how many have dimensions?
  console.log('=== DIMENSION DATA QUALITY ===');
  const withDims = await products.countDocuments({
    'processing.status': 'ACCEPTED',
    $or: [
      { 'dimensions.width': { $exists: true, $ne: null, $gt: 0 } },
      { 'dimensions.length': { $exists: true, $ne: null, $gt: 0 } },
      { 'dimensions.height': { $exists: true, $ne: null, $gt: 0 } }
    ]
  });
  const acceptedCount = await products.countDocuments({ 'processing.status': 'ACCEPTED' });
  console.log(`  ACCEPTED products with at least one dimension: ${withDims} / ${acceptedCount}`);
  
  const withAllDims = await products.countDocuments({
    'processing.status': 'ACCEPTED',
    'dimensions.width': { $exists: true, $ne: null, $gt: 0 },
    'dimensions.length': { $exists: true, $ne: null, $gt: 0 },
    'dimensions.height': { $exists: true, $ne: null, $gt: 0 }
  });
  console.log(`  ACCEPTED products with ALL three dimensions: ${withAllDims} / ${acceptedCount}`);
  console.log();

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
