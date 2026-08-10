/* Seed test data: sellers, buyer, products, buy-requests */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
dotenv.config();

const BASE = 'http://localhost:3000/api';
const PASSWORD = 'Test@1234';

const users = {
  sellerA: { firstName: 'Ahmed', lastName: 'Hassan', email: 'sella.furn@example.com', role: 'seller', phone: '+20 100 111 1111', businessName: 'Ahmed Furnishings' },
  sellerB: { firstName: 'Mona', lastName: 'Adel', email: 'sellb.furn@example.com', role: 'seller', phone: '+20 100 222 2222', businessName: 'Mona Home Decor' },
  buyer: { firstName: 'Test', lastName: 'Buyer', email: 'buyer.user@example.com', role: 'user' },
  admin: { firstName: 'Super', lastName: 'Admin', email: 'admin.user@example.com', role: 'admin' },
};

const signup = async (u) => {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      dateOfBirth: '1990-01-15',
      password: PASSWORD,
      confirmPassword: PASSWORD,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Remove previous test data
  const testEmails = Object.values(users).map(u => u.email);
  const existing = await User.find({ 'authentication.email': { $in: testEmails } });
  const existingIds = existing.map(u => u._id);
  if (existingIds.length) {
    await Product.deleteMany({ sellerId: { $in: existingIds } });
    await Order.deleteMany({ $or: [{ sellerId: { $in: existingIds } }, { buyerId: { $in: existingIds } }, { userId: { $in: existingIds } }] });
    await User.deleteMany({ _id: { $in: existingIds } });
    console.log(`Removed existing test users: ${existingIds.length}`);
  }

  for (const [key, u] of Object.entries(users)) {
    const r = await signup(u);
    console.log(`signup ${key}: HTTP ${r.status}`, r.body?.message || '');
  }

  // Promote roles via DB (no endpoint exists for this)
  const updated = [];
  for (const [key, u] of Object.entries(users)) {
    const dbUser = await User.findOne({ 'authentication.email': u.email });
    if (!dbUser) { console.log(`  ! user not found for ${key}`); continue; }
    dbUser.role = u.role;
    if (u.phone) dbUser.sellerProfile.phone = u.phone;
    if (u.businessName) dbUser.sellerProfile.businessName = u.businessName;
    await dbUser.save();
    updated.push(`${key}->${u.role}`);
  }
  console.log('Roles set:', updated.join(', '));

  await mongoose.disconnect();
  console.log('SEED COMPLETE');
})().catch(e => { console.error(e); process.exit(1); });
