/**
 * Create MongoDB indexes for the products collection
 * to optimize recommendation engine queries.
 *
 * Usage: node scratch/create_product_indexes.js
 *
 * Only creates indexes that don't already exist.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db';
  console.log(`Connecting to: ${mongoUri.replace(/\/\/[^@]+@/, '//***@')}`);

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const products = db.collection('products');

  // Check existing indexes
  const existingIndexes = await products.indexes();
  const existingNames = existingIndexes.map(idx => idx.name);
  console.log('Existing indexes:', existingNames.join(', '));

  // Compound index for candidate generation queries
  const indexName = 'recommendation_candidate_idx';
  if (!existingNames.includes(indexName)) {
    console.log(`\nCreating index: ${indexName}...`);
    await products.createIndex(
      {
        'processing.status': 1,
        'classification.canonicalCategory': 1,
        'pricing.currentPrice': 1,
      },
      { name: indexName }
    );
    console.log('Created successfully.');
  } else {
    console.log(`\nIndex ${indexName} already exists.`);
  }

  // Verify final index state
  console.log('\n=== FINAL INDEXES ===');
  const finalIndexes = await products.indexes();
  finalIndexes.forEach(idx => {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  await mongoose.disconnect();
  console.log('\nDone.');
};

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
