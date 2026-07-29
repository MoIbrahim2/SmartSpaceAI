require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../src/models/product.model');

// USD to EGP exchange rate
const USD_TO_EGP_RATE = 50;

function getJsonFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function seedProducts() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db';
  console.log(`Connecting to MongoDB at: ${mongoUri.replace(/\/\/[^@]+@/, '//***@')}`);
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.\n');

  const furnitureDir = path.join(__dirname, '..', 'knowledge_base', 'furniture');
  const jsonFiles = getJsonFiles(furnitureDir);
  console.log(`Found ${jsonFiles.length} JSON files in ${furnitureDir}`);

  let totalProductsProcessed = 0;
  let filesUpdated = 0;
  const allProducts = [];

  for (const file of jsonFiles) {
    const fileContent = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(fileContent);
    const items = Array.isArray(data) ? data : (data.products || data.items || []);
    let modifiedInFile = false;

    const updatedItems = items.map((item) => {
      const updatedItem = JSON.parse(JSON.stringify(item));

      // 1. Check and convert price to EGP
      if (!updatedItem.pricing) {
        updatedItem.pricing = {};
      }
      if (updatedItem.pricing.currency === 'USD') {
        updatedItem.pricing.currency = 'EGP';
        if (typeof updatedItem.pricing.currentPrice === 'number') {
          updatedItem.pricing.currentPrice = Math.round(updatedItem.pricing.currentPrice * USD_TO_EGP_RATE * 100) / 100;
        }
        if (typeof updatedItem.pricing.originalPrice === 'number') {
          updatedItem.pricing.originalPrice = Math.round(updatedItem.pricing.originalPrice * USD_TO_EGP_RATE * 100) / 100;
        }
        modifiedInFile = true;
      } else if (!updatedItem.pricing.currency) {
        updatedItem.pricing.currency = 'EGP';
        modifiedInFile = true;
      }

      // 2. Align with product.model.js Schema
      if (!updatedItem.availability) {
        updatedItem.availability = { inStock: true, stockStatus: 'IN_STOCK' };
        modifiedInFile = true;
      } else {
        if (updatedItem.availability.inStock === undefined) {
          updatedItem.availability.inStock = true;
          modifiedInFile = true;
        }
      }

      if (!updatedItem.processing) {
        updatedItem.processing = { status: 'ACCEPTED' };
        modifiedInFile = true;
      } else {
        if (!updatedItem.processing.status) {
          updatedItem.processing.status = 'ACCEPTED';
          modifiedInFile = true;
        }
      }

      // 3. Image validation - must have at least one valid, non-Unsplash image URL
      const imgs = updatedItem.images || [];
      const hasValidRealImage = Array.isArray(imgs) && imgs.some((img) => {
        const url = typeof img === 'string' ? img : (img && img.url ? img.url : '');
        return url && typeof url === 'string' && url.trim().length > 0 && !url.includes('unsplash.com');
      });

      totalProductsProcessed++;
      if (hasValidRealImage) {
        allProducts.push(updatedItem);
      }
      return updatedItem;
    });

    if (modifiedInFile) {
      fs.writeFileSync(file, JSON.stringify(updatedItems, null, 2) + '\n', 'utf8');
      filesUpdated++;
    }
  }

  console.log(`Finished checking and updating JSON files.`);
  console.log(`- Files updated: ${filesUpdated} / ${jsonFiles.length}`);
  console.log(`- Total products aligned: ${totalProductsProcessed}`);

  // 3. Clean old collection & Insert into MongoDB
  console.log('\nClearing existing products from MongoDB collection...');
  await Product.deleteMany({});
  console.log('Collection cleared.');

  console.log('\nCreating indexes on products collection...');
  await Product.createIndexes();
  console.log('Indexes created.');

  console.log(`\nInserting ${allProducts.length} products into local MongoDB...`);
  await Product.insertMany(allProducts, { ordered: false });
  console.log('MongoDB InsertMany completed successfully!');

  const dbCount = await Product.countDocuments();
  console.log(`\nTotal products in MongoDB collection: ${dbCount}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Done!');
}

seedProducts().catch((err) => {
  console.error('Error seeding products:', err);
  process.exit(1);
});
