/* Verify new fixes: GET /api/seller/products/:id + signup token flow + buyer email populate */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user.model');
dotenv.config();

const BASE = 'http://localhost:3000/api';
const PASSWORD = 'Test@1234';

const req = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (e) {}
  return { status: res.status, body: json };
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // cleanup probe users created during checks
  await User.deleteMany({ 'authentication.email': /^probe.*@example\.com$/ });
  console.log('cleaned probe users');

  // 1. signin as sellerA
  const s = await req('POST', '/auth/signin', { body: { email: 'sella.furn@example.com', password: PASSWORD } });
  const tokenA = s.body?.data?.accessToken;
  console.log('signin sellerA:', s.status, tokenA ? 'token ok' : 'NO TOKEN');

  // 2. create a product then GET it by id
  const prod = await req('POST', '/seller/products', { token: tokenA, body: {
    basic: { name: 'Single Detail Check Sofa', brand: 'X', description: 'A sofa used to verify the single-product fetch endpoint behavior.', sku: 'TMP-1' },
    classification: { canonicalCategory: 'Sofa', roomTypes: ['LIVING_ROOM'], styles: ['Modern'], materials: ['Fabric'], colors: ['Grey'] },
    pricing: { currentPrice: 1000, currency: 'EGP' },
    dimensions: { width: 100, height: 80, length: 200, dimensionUnit: 'cm' },
    images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', isPrimary: true }],
  }});
  const pid = prod.body?.data?._id;
  console.log('create product:', prod.status, pid);

  if (pid) {
    const g = await req('GET', `/seller/products/${pid}`, { token: tokenA });
    console.log('GET /seller/products/:id by owner:', g.status, g.body?.data?._id === pid ? 'MATCH' : 'MISMATCH');

    // cross-seller (sellerB token)
    const sb = await req('POST', '/auth/signin', { body: { email: 'sellb.furn@example.com', password: PASSWORD } });
    const tokenB = sb.body?.data?.accessToken;
    const g2 = await req('GET', `/seller/products/${pid}`, { token: tokenB });
    console.log('GET /seller/products/:id by other seller:', g2.status, '(expect 404)');

    // buyer token (expect 403)
    const buy = await req('POST', '/auth/signin', { body: { email: 'buyer.user@example.com', password: PASSWORD } });
    const g3 = await req('GET', `/seller/products/${pid}`, { token: buy.body?.data?.accessToken });
    console.log('GET /seller/products/:id by buyer:', g3.status, '(expect 403)');

    // cleanup this test product
    await mongoose.connection.collection('products').deleteOne({ _id: pid });
    console.log('cleaned test product');
  }

  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
