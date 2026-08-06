require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');

async function seedTestSellerProducts() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartspace_db';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);

  // Define 4 Sellers
  const sellersData = [
    {
      email: 'seller@smartspace.com',
      businessName: 'SmartSpace Home',
      firstName: 'SmartSpace',
      lastName: 'Store'
    },
    {
      email: 'cairo.furniture@smartspace.com',
      businessName: 'Cairo Luxury Furniture Co.',
      firstName: 'Cairo',
      lastName: 'Furniture'
    },
    {
      email: 'nile.decor@smartspace.com',
      businessName: 'Nile Modern Home Décor',
      firstName: 'Nile',
      lastName: 'Décor'
    },
    {
      email: 'alex.furnishings@smartspace.com',
      businessName: 'Alexandria Craft Furnishings',
      firstName: 'Alexandria',
      lastName: 'Crafts'
    }
  ];

  const sellerDocs = [];

  for (const sData of sellersData) {
    let seller = await User.findOne({ 'authentication.email': sData.email });
    if (!seller) {
      seller = new User({
        role: 'SELLER',
        status: 'ACTIVE',
        profile: {
          firstName: sData.firstName,
          lastName: sData.lastName
        },
        authentication: {
          email: sData.email,
          passwordHash: 'Password123!',
          provider: 'local',
          emailVerified: true
        },
        sellerProfile: {
          businessName: sData.businessName,
          phone: '+201001234567',
          commissionRate: 0.10
        }
      });
      await seller.save();
      console.log(`Created seller: ${sData.businessName} (${seller._id})`);
    } else {
      seller.authentication.passwordHash = 'Password123!';
      seller.role = 'SELLER';
      seller.status = 'ACTIVE';
      await seller.save();
      console.log(`Updated seller password: ${sData.businessName} (${seller._id})`);
    }
    sellerDocs.push(seller);
  }

  // Clear previous test products for these sellers
  const sellerIds = sellerDocs.map((s) => s._id);
  await Product.deleteMany({ sellerId: { $in: sellerIds } });

  // Define Products for each seller
  const testProducts = [
    // === SELLER 0: SmartSpace Home ===
    {
      sellerId: sellerDocs[0]._id,
      basic: {
        name: 'SmartSpace Royal Velvet Modular Sofa',
        brand: 'SmartSpace Home',
        description: 'Modern luxury 3-seater modular sofa with high-density foam cushioning and premium stain-resistant velvet fabric.',
        sku: 'SS-SOFA-001'
      },
      classification: {
        canonicalCategory: 'sofa',
        roomTypes: ['living_room', 'reception', 'lounge'],
        styles: ['Modern', 'Luxury', 'Contemporary'],
        materials: ['Velvet', 'Hardwood', 'High-Density Foam'],
        colors: ['Grey', 'Charcoal', 'Navy'],
        tags: ['sofa', 'modular', 'living_room', 'luxury']
      },
      pricing: { currency: 'EGP', currentPrice: 18500, originalPrice: 22000, discountPercentage: 16 },
      dimensions: { width: 240, length: 95, height: 85, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 98 }
    },
    {
      sellerId: sellerDocs[0]._id,
      basic: {
        name: 'SmartSpace Nordic Geometric Wool Carpet',
        brand: 'SmartSpace Home',
        description: 'Hand-tufted minimalist wool area rug with geometric Scandinavian pattern and soft underfoot texture.',
        sku: 'SS-RUG-001'
      },
      classification: {
        canonicalCategory: 'Rug',
        roomTypes: ['living_room', 'bedroom', 'reception'],
        styles: ['Scandinavian', 'Minimalist', 'Modern'],
        materials: ['Wool', 'Cotton Backing'],
        colors: ['Beige', 'Cream', 'Grey'],
        tags: ['carpet', 'rug', 'wool', 'scandinavian']
      },
      pricing: { currency: 'EGP', currentPrice: 4200, originalPrice: 5000, discountPercentage: 16 },
      dimensions: { width: 200, length: 300, height: 2, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/6444256/pexels-photo-6444256.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 95 }
    },

    // === SELLER 1: Cairo Luxury Furniture Co. ===
    {
      sellerId: sellerDocs[1]._id,
      basic: {
        name: 'Cairo Marble Top Coffee Table',
        brand: 'Cairo Luxury',
        description: 'Elegant golden steel frame coffee table with genuine Italian white marble tabletop.',
        sku: 'SS-CT-001'
      },
      classification: {
        canonicalCategory: 'coffee_table',
        roomTypes: ['living_room', 'reception'],
        styles: ['Luxury', 'Modern'],
        materials: ['Marble', 'Steel'],
        colors: ['White', 'Gold'],
        tags: ['coffee_table', 'marble', 'gold']
      },
      pricing: { currency: 'EGP', currentPrice: 5800, originalPrice: 6500, discountPercentage: 10 },
      dimensions: { width: 110, length: 60, height: 45, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 96 }
    },
    {
      sellerId: sellerDocs[1]._id,
      basic: {
        name: 'Cairo Velvet Chesterfield 3-Seater Sofa',
        brand: 'Cairo Luxury',
        description: 'Classic tufted Chesterfield sofa in deep emerald velvet with brass stud details.',
        sku: 'SS-SOFA-002'
      },
      classification: {
        canonicalCategory: 'sofa',
        roomTypes: ['living_room', 'reception'],
        styles: ['Classic', 'Luxury'],
        materials: ['Velvet', 'Mahogany Wood'],
        colors: ['Emerald Green', 'Gold'],
        tags: ['sofa', 'chesterfield', 'luxury']
      },
      pricing: { currency: 'EGP', currentPrice: 21000, originalPrice: 25000, discountPercentage: 16 },
      dimensions: { width: 220, length: 90, height: 80, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/3757055/pexels-photo-3757055.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 97 }
    },
    {
      sellerId: sellerDocs[1]._id,
      basic: {
        name: 'Cairo Royal Gold Velvet Armchair',
        brand: 'Cairo Luxury',
        description: 'Statement wingback accent chair upholstered in plush gold velvet with curved oak legs.',
        sku: 'SS-CHAIR-001'
      },
      classification: {
        canonicalCategory: 'armchair',
        roomTypes: ['living_room', 'bedroom', 'reception'],
        styles: ['Luxury', 'Classic'],
        materials: ['Velvet', 'Oak Wood'],
        colors: ['Gold', 'Bronze'],
        tags: ['armchair', 'chair', 'gold']
      },
      pricing: { currency: 'EGP', currentPrice: 7400, originalPrice: 8500, discountPercentage: 12 },
      dimensions: { width: 85, length: 80, height: 105, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 95 }
    },

    // === SELLER 2: Nile Modern Home Décor ===
    {
      sellerId: sellerDocs[2]._id,
      basic: {
        name: 'Nile Floating Wooden TV Unit Console',
        brand: 'Nile Décor',
        description: 'Sleek wall-mounted oak TV unit with concealed cable management and push-to-open cabinets.',
        sku: 'SS-TV-002'
      },
      classification: {
        canonicalCategory: 'tv_unit',
        roomTypes: ['living_room'],
        styles: ['Modern', 'Minimalist'],
        materials: ['Oak Wood'],
        colors: ['Natural Oak', 'White'],
        tags: ['tv_unit', 'console', 'wood']
      },
      pricing: { currency: 'EGP', currentPrice: 7900, originalPrice: 8900, discountPercentage: 11 },
      dimensions: { width: 180, length: 40, height: 35, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/6970057/pexels-photo-6970057.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 94 }
    },
    {
      sellerId: sellerDocs[2]._id,
      basic: {
        name: 'Nile Modern Vintage Shag Area Rug',
        brand: 'Nile Décor',
        description: 'Ultra-soft high-pile shag carpet with subtle bohemian diamond motifs.',
        sku: 'SS-RUG-003'
      },
      classification: {
        canonicalCategory: 'Rug',
        roomTypes: ['living_room', 'bedroom'],
        styles: ['Boho', 'Modern'],
        materials: ['Microfiber', 'Jute'],
        colors: ['Ivory', 'Grey'],
        tags: ['carpet', 'rug', 'shag', 'boho']
      },
      pricing: { currency: 'EGP', currentPrice: 3800, originalPrice: 4500, discountPercentage: 15 },
      dimensions: { width: 160, length: 230, height: 3, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/5824901/pexels-photo-5824901.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 93 }
    },
    {
      sellerId: sellerDocs[2]._id,
      basic: {
        name: 'Nile Scandinavian Nesting Coffee Tables',
        brand: 'Nile Décor',
        description: 'Set of 2 nesting round coffee tables with natural wood tops and tapered tripod legs.',
        sku: 'SS-CT-002'
      },
      classification: {
        canonicalCategory: 'coffee_table',
        roomTypes: ['living_room'],
        styles: ['Scandinavian', 'Minimalist'],
        materials: ['Birch Wood', 'MDF'],
        colors: ['Light Wood', 'White'],
        tags: ['coffee_table', 'nesting', 'scandinavian']
      },
      pricing: { currency: 'EGP', currentPrice: 4900, originalPrice: 5600, discountPercentage: 12 },
      dimensions: { width: 80, length: 80, height: 48, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/892618/pexels-photo-892618.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 94 }
    },

    // === SELLER 3: Alexandria Craft Furnishings ===
    {
      sellerId: sellerDocs[3]._id,
      basic: {
        name: 'Alexandria Minimalist Bookshelf Unit',
        brand: 'Alexandria Crafts',
        description: '5-tier industrial bookshelf with solid pine wood shelves and matte black iron frame.',
        sku: 'SS-SHELF-003'
      },
      classification: {
        canonicalCategory: 'bookshelf',
        roomTypes: ['living_room', 'office', 'bedroom'],
        styles: ['Industrial', 'Modern'],
        materials: ['Pine Wood', 'Iron'],
        colors: ['Brown', 'Black'],
        tags: ['bookshelf', 'shelf', 'industrial']
      },
      pricing: { currency: 'EGP', currentPrice: 3600, originalPrice: 4200, discountPercentage: 14 },
      dimensions: { width: 90, length: 35, height: 180, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 92 }
    },
    {
      sellerId: sellerDocs[3]._id,
      basic: {
        name: 'Alexandria Modern Accent Armchair',
        brand: 'Alexandria Crafts',
        description: 'Ergonomic upholstered armchair with walnut wooden legs and textured linen cushion.',
        sku: 'SS-CHAIR-003'
      },
      classification: {
        canonicalCategory: 'armchair',
        roomTypes: ['living_room', 'bedroom', 'office'],
        styles: ['Contemporary', 'Nordic'],
        materials: ['Linen', 'Walnut Wood'],
        colors: ['Mustard Yellow', 'Walnut'],
        tags: ['armchair', 'chair', 'accent']
      },
      pricing: { currency: 'EGP', currentPrice: 6200, originalPrice: 7000, discountPercentage: 11 },
      dimensions: { width: 80, length: 85, height: 90, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/2082090/pexels-photo-2082090.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 95 }
    },
    {
      sellerId: sellerDocs[3]._id,
      basic: {
        name: 'Alexandria Solid Walnut Media Console TV Unit',
        brand: 'Alexandria Crafts',
        description: 'Handcrafted solid walnut TV console featuring slatted sliding doors and brass hardware.',
        sku: 'SS-TV-003'
      },
      classification: {
        canonicalCategory: 'tv_unit',
        roomTypes: ['living_room', 'reception'],
        styles: ['Mid-Century Modern', 'Craftsman'],
        materials: ['Walnut Wood', 'Brass'],
        colors: ['Dark Walnut', 'Brass'],
        tags: ['tv_unit', 'console', 'walnut']
      },
      pricing: { currency: 'EGP', currentPrice: 9500, originalPrice: 11000, discountPercentage: 13 },
      dimensions: { width: 200, length: 45, height: 50, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/6758771/pexels-photo-6758771.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 96 }
    },
    {
      sellerId: sellerDocs[3]._id,
      basic: {
        name: 'Alexandria Oak Corner Bookshelf',
        brand: 'Alexandria Crafts',
        description: 'Space-saving 6-tier corner bookcase crafted from solid white oak.',
        sku: 'SS-SHELF-004'
      },
      classification: {
        canonicalCategory: 'bookshelf',
        roomTypes: ['living_room', 'office', 'bedroom'],
        styles: ['Nordic', 'Minimalist'],
        materials: ['Oak Wood'],
        colors: ['Natural Oak'],
        tags: ['bookshelf', 'corner', 'oak']
      },
      pricing: { currency: 'EGP', currentPrice: 4100, originalPrice: 4800, discountPercentage: 14 },
      dimensions: { width: 45, length: 45, height: 190, dimensionUnit: 'cm' },
      images: [{ url: 'https://images.pexels.com/photos/279618/pexels-photo-279618.jpeg?auto=compress&cs=tinysrgb&w=800', isPrimary: true }],
      availability: { inStock: true, stockStatus: 'IN_STOCK' },
      processing: { status: 'ACCEPTED', qualityScore: 94 }
    }
  ];

  const inserted = await Product.insertMany(testProducts);
  console.log(`\nSuccessfully inserted ${inserted.length} products across ${sellersData.length} sellers:`);
  inserted.forEach((p, idx) => {
    console.log(`  [${idx + 1}] Seller: ${p.basic.brand} | Name: ${p.basic.name} | Category: ${p.classification.canonicalCategory} | Price: ${p.pricing.currentPrice} EGP`);
  });

  await mongoose.disconnect();
  console.log('\nSeeding completed cleanly.');
}

seedTestSellerProducts().catch((err) => {
  console.error('Error seeding test products:', err);
  process.exit(1);
});
