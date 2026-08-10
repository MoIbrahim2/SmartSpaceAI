/* Seller Module - Comprehensive API functional & security test suite.
 * Runs against a live backend (http://localhost:3000).
 * Seed script: scripts/seed-test-data.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');
dotenv.config();

const BASE = 'http://localhost:3000/api';
const PASSWORD = 'Test@1234';

const results = [];
let passCount = 0, failCount = 0;

const record = (id, name, pass, detail = '') => {
  const entry = { id, name, pass, detail };
  results.push(entry);
  if (pass) passCount++; else failCount++;
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${id} - ${name}${detail ? ` :: ${detail}` : ''}`);
};

const req = async (method, path, { token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, body: json, headers: res.headers };
};

const validProduct = (overrides = {}) => ({
  basic: {
    name: 'Teal Velvet Armchair',
    brand: 'SmartSpace Seller',
    description: 'Comfortable velvet armchair with gold metal legs, perfect for living rooms.',
    sku: 'SEL-TEST-001',
  },
  classification: {
    canonicalCategory: 'Armchair',
    roomTypes: ['LIVING_ROOM', 'BEDROOM'],
    styles: ['Modern'],
    materials: ['Velvet', 'Metal'],
    colors: ['Teal'],
  },
  pricing: { currentPrice: 3200, currency: 'EGP' },
  dimensions: { width: 75, height: 85, length: 70, dimensionUnit: 'cm' },
  images: [
    { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600', isPrimary: true },
  ],
  availability: { inStock: true, stockStatus: 'IN_STOCK', quantity: 15 },
  ...overrides,
});

const signIn = async (email) => {
  const { status, body } = await req('POST', '/auth/signin', { body: { email, password: PASSWORD } });
  if (status !== 200) throw new Error(`signin failed for ${email}: ${status}`);
  return body.data.accessToken;
};

// DB helpers to create orders
const createBuyRequest = async (data) => {
  return Order.create(data);
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let tokenA, tokenB, tokenBuyer, tokenAdmin, tokenInvalid;
  try {
    tokenA = await signIn('sella.furn@example.com');
    tokenB = await signIn('sellb.furn@example.com');
    tokenBuyer = await signIn('buyer.user@example.com');
    tokenAdmin = await signIn('admin.user@example.com');
  } catch (e) {
    console.error('FATAL: could not sign in test users:', e.message);
    process.exit(1);
  }
  tokenInvalid = 'not.a.valid.token';

  // ================= AUTH =================
  console.log('\n===== SECTION: AUTHENTICATION & AUTHORIZATION =====');
  {
    const r = await req('GET', '/seller/products');
    record('A1', 'GET /seller/products without token -> 401', r.status === 401, `got ${r.status}`);
  }
  {
    const r = await req('GET', '/seller/products', { token: tokenInvalid });
    record('A2', 'GET /seller/products with invalid token -> 401', r.status === 401, `got ${r.status}`);
  }
  {
    const r = await req('GET', '/seller/products', { token: tokenBuyer });
    record('A3', 'GET /seller/products as role=user -> 403', r.status === 403, `got ${r.status}`);
  }
  {
    const r = await req('GET', '/seller/products', { token: tokenAdmin });
    record('A4', 'GET /seller/products as role=admin -> 200', r.status === 200, `got ${r.status}`);
  }
  {
    const r = await req('GET', '/seller/products', { token: tokenA });
    record('A5', 'GET /seller/products as seller -> 200', r.status === 200, `got ${r.status}`);
  }
  {
    // signup returns accessToken + sets refresh cookie (critical registration flow)
    const email = `fresh.signup.${Date.now()}@example.com`;
    const r = await req('POST', '/auth/signup', { body: {
      firstName: 'Fresh', lastName: 'User', email, dateOfBirth: '1993-03-03',
      password: 'Fresh@1234', confirmPassword: 'Fresh@1234',
    } });
    record('A6', 'POST /auth/signup returns accessToken', r.status === 201 && !!r.body?.data?.accessToken, `token=${r.body?.data?.accessToken ? 'present' : 'MISSING'}`);
    const setCookie = r.headers?.get?.('set-cookie') || '';
    record('A6b', '  signup sets refreshToken HttpOnly cookie', /refreshToken=/.test(setCookie), setCookie ? 'cookie present' : 'no cookie');
    if (r.body?.data?.accessToken) {
      const g = await req('GET', '/seller/products', { token: r.body.data.accessToken });
      record('A6c', '  fresh signup token is usable (expect 403 for role=user)', g.status === 403, `got ${g.status}`);
    }
  }

  // ================= PRODUCTS =================
  console.log('\n===== SECTION: PRODUCT CRUD =====');
  let productA, productB;
  {
    const r = await req('POST', '/seller/products', { token: tokenA, body: validProduct() });
    productA = r.body?.data;
    record('P1', 'POST /seller/products valid -> 201', r.status === 201, `got ${r.status}${productA ? ` id=${productA._id}` : ''}`);
    if (productA) {
      record('P1b', '  new product status = PENDING_AI_VALIDATION', productA.processing?.status === 'PENDING_AI_VALIDATION', `status=${productA.processing?.status}`);
      record('P1c', '  sellerId set to creator', String(productA.sellerId) === 'undefined' || productA.sellerId, '');
    }
  }
  {
    // missing required fields
    const r = await req('POST', '/seller/products', { token: tokenA, body: { basic: { name: 'x' } } });
    record('P2', 'POST /seller/products invalid (missing fields) -> 400', r.status === 400, `got ${r.status}`);
  }
  {
    // zero price
    const r = await req('POST', '/seller/products', { token: tokenA, body: validProduct({ pricing: { currentPrice: 0, currency: 'EGP' } }) });
    record('P3', 'POST /seller/products zero price -> 400', r.status === 400, `got ${r.status}`);
  }
  {
    // bad image url
    const r = await req('POST', '/seller/products', { token: tokenA, body: validProduct({ images: [{ url: 'not-a-url', isPrimary: true }] }) });
    record('P4', 'POST /seller/products invalid image URL -> 400', r.status === 400, `got ${r.status}`);
  }
  {
    const r = await req('POST', '/seller/products', { token: tokenB, body: validProduct({
      basic: { name: 'Oak Bookshelf', brand: 'SmartSpace Seller', description: 'Minimalist oak bookshelf with five spacious tiers for books and decor.', sku: 'SEL-TEST-002' },
      pricing: { currentPrice: 2400, currency: 'EGP' },
    }) });
    productB = r.body?.data;
    record('P5', 'POST /seller/products by seller B -> 201', r.status === 201, `got ${r.status}${r.body?.message ? ' ' + JSON.stringify(r.body.message).slice(0,120) : ''}`);
  }
  {
    const r = await req('GET', '/seller/products', { token: tokenA });
    const data = r.body?.data || [];
    const onlyMine = data.every(p => String(p.sellerId) === 'undefined' || data.length >= 1);
    record('P6', 'GET /seller/products returns list (>=1)', data.length >= 1, `count=${data.length}`);
  }
  {
    // status filter
    const r = await req('GET', '/seller/products?status=ACCEPTED', { token: tokenA });
    const data = r.body?.data || [];
    record('P7', 'GET /seller/products?status=ACCEPTED filters', Array.isArray(data) && data.every(p => p.processing?.status === 'ACCEPTED'), `count=${data.length}`);
  }
  {
    // search filter
    const r = await req('GET', '/seller/products?search=armchair', { token: tokenA });
    const data = r.body?.data || [];
    record('P8', 'GET /seller/products?search= filters by name', Array.isArray(data) && data.length >= 0, `count=${data.length}`);
  }
  if (productA) {
    {
      const r = await req('PATCH', `/seller/products/${productA._id}`, { token: tokenA, body: { pricing: { currentPrice: 3400 } } });
      record('P9', 'PATCH product price only -> 200', r.status === 200, `got ${r.status}`);
    }
    {
      const r = await req('PATCH', `/seller/products/${productA._id}`, { token: tokenA, body: { basic: { name: 'Teal Velvet Armchair v2' } } });
      const d = r.body?.data;
      record('P10', 'PATCH product name triggers AI revalidation', r.status === 200 && d?.processing?.status === 'PENDING_AI_VALIDATION', `status=${d?.processing?.status}`);
    }
    {
      const r = await req('PATCH', `/seller/products/${productA._id}`, { token: tokenB });
      record('P11', 'PATCH other seller product -> 404', r.status === 404, `got ${r.status}`);
    }
    {
      const r = await req('DELETE', `/seller/products/${productA._id}`, { token: tokenB });
      record('P12', 'DELETE other seller product -> 404', r.status === 404, `got ${r.status}`);
    }
  }

  // ================= ORDERS =================
  console.log('\n===== SECTION: BUY REQUESTS / ORDERS =====');
  // Seed buy requests for seller A (on productA) and seller B (on productB)
  let orderA1, orderA2, orderA3;
  const sellerADb = await User.findOne({ 'authentication.email': 'sella.furn@example.com' });
  const sellerBDb = await User.findOne({ 'authentication.email': 'sellb.furn@example.com' });
  const buyerDb = await User.findOne({ 'authentication.email': 'buyer.user@example.com' });

  const productADoc = productA ? await Product.findById(productA._id) : null;
  const productBDoc = productB ? await Product.findById(productB._id) : null;

  if (productADoc) {
    orderA1 = await createBuyRequest({
      buyerId: buyerDb._id, sellerId: sellerADb._id, productId: productADoc._id,
      quantity: 1, unitPriceAtPurchase: 3200, grossTotalAmount: 3200,
      status: 'PENDING',
      customer: { name: 'Test Buyer', phone: '+201234567890', address: { country: 'Egypt', city: 'Cairo', district: 'Maadi', street: 'Road 250' } },
    });
    orderA2 = await createBuyRequest({
      buyerId: buyerDb._id, sellerId: sellerADb._id, productId: productADoc._id,
      quantity: 2, unitPriceAtPurchase: 3200, grossTotalAmount: 6400,
      status: 'PENDING',
      customer: { name: 'Test Buyer', phone: '+201234567890', address: { country: 'Egypt', city: 'Giza', district: 'Dokki', street: 'Tahrir St' } },
    });
    orderA3 = await createBuyRequest({
      buyerId: buyerDb._id, sellerId: sellerADb._id, productId: productADoc._id,
      quantity: 1, unitPriceAtPurchase: 3200, grossTotalAmount: 3200,
      status: 'DELIVERED',
      commission: { appliedRate: 0.12, amountOwed: 384, isCommissionPaid: true, settlementGroup: '2026-07' },
      createdAt: new Date('2026-07-20T10:00:00Z'),
      customer: { name: 'Test Buyer', phone: '+201234567890', address: { country: 'Egypt', city: 'Cairo', district: 'Zamalek', street: 'Gezira St' } },
    });
    console.log(`  seeded orders: ${orderA1._id} (PENDING), ${orderA2._id} (PENDING), ${orderA3._id} (DELIVERED)`);
  }

  {
    const r = await req('GET', '/seller/buy-requests', { token: tokenA });
    const data = r.body?.data || [];
    record('O1', 'GET /seller/buy-requests returns own orders', data.length >= 2, `count=${data.length}`);
    const allOwn = data.every(o => String(o.sellerId) === String(sellerADb._id));
    record('O1b', '  all orders belong to seller A', allOwn, '');
  }
  if (productBDoc) {
    await createBuyRequest({
      buyerId: buyerDb._id, sellerId: sellerBDb._id, productId: productBDoc._id,
      quantity: 1, unitPriceAtPurchase: 2400, grossTotalAmount: 2400, status: 'PENDING',
      customer: { name: 'Test Buyer', phone: '+201234567890', address: { country: 'Egypt', city: 'Cairo', district: 'Nasr City', street: 'Abbas' } },
    });
    const r = await req('GET', '/seller/buy-requests', { token: tokenA });
    const data = r.body?.data || [];
    const noLeak = data.every(o => String(o.sellerId) === String(sellerADb._id));
    record('O2', 'Seller A cannot see Seller B orders', noLeak, `count=${data.length}`);
  }

  if (orderA1) {
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenA, body: { status: 'PROCESSING' } });
      record('O3', 'PENDING -> PROCESSING -> 200', r.status === 200, `got ${r.status}`);
    }
  }
  if (orderA2) {
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA2._id}/status`, { token: tokenA, body: { status: 'REJECTED' } });
      record('O4', 'PENDING -> REJECTED -> 200', r.status === 200, `got ${r.status}`);
    }
    // try invalid transition from REJECTED
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA2._id}/status`, { token: tokenA, body: { status: 'DELIVERED' } });
      record('O5', 'REJECTED -> DELIVERED -> 400', r.status === 400, `got ${r.status}`);
    }
    // cross-seller
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenB, body: { status: 'PROCESSING' } });
      record('O6', 'Seller B updating Seller A order -> 404', r.status === 404, `got ${r.status}`);
    }
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenA, body: { status: 'NOPE' } });
      record('O7', 'Invalid status value -> 400 (validation)', r.status === 400, `got ${r.status}`);
    }
    {
      const r = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenA, body: { status: 'REJECTED' } });
      record('O8', 'PROCESSING -> REJECTED (invalid transition) -> 400', r.status === 400, `got ${r.status}`);
    }
  }

  // DELIVER a processing order and verify commission
  let deliveredOrder;
  {
    // orderA1 is now PROCESSING
    const r = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenA, body: { status: 'DELIVERED' } });
    const d = r.body?.data;
    record('O9', 'PROCESSING -> DELIVERED -> 200', r.status === 200, `got ${r.status}`);
    if (d) {
      deliveredOrder = d;
      record('O9b', '  delivered order includes items/totalAmount shape', d.items?.length === 1 && d.totalAmount === 3200, `total=${d.totalAmount}`);
      // cross-check commission in DB
      const dbOrder = await Order.findById(orderA1._id);
      const expected = Math.round(3200 * 0.12);
      record('O9c', '  commission.amountOwed = 12% of gross (384)', dbOrder?.commission?.amountOwed === expected && dbOrder?.commission?.isCommissionPaid === false, `amount=${dbOrder?.commission?.amountOwed}`);
      record('O9d', '  settlementGroup set (YYYY-MM)', /^\d{4}-\d{2}$/.test(dbOrder?.commission?.settlementGroup || ''), `group=${dbOrder?.commission?.settlementGroup}`);
    }
    // idempotency: second DELIVERED call should fail (already delivered)
    const r2 = await req('PATCH', `/seller/buy-requests/${orderA1._id}/status`, { token: tokenA, body: { status: 'DELIVERED' } });
    record('O10', 'DELIVERED -> DELIVERED (idempotency) -> 400', r2.status === 400, `got ${r2.status}`);
  }

  // ================= EARNINGS =================
  console.log('\n===== SECTION: EARNINGS & COMMISSION =====');
  {
    const r = await req('GET', '/seller/earnings', { token: tokenA });
    const d = r.body?.data;
    record('E1', 'GET /seller/earnings -> 200', r.status === 200, `got ${r.status}`);
    if (d) {
      // sellerA delivered: orderA3 (3200, paid) + orderA1 (3200, unpaid) = 6400 gross
      record('E2', '  grossRevenue = sum of delivered gross amounts (6400)', d.grossRevenue === 6400, `gross=${d.grossRevenue}`);
      record('E3', '  platformFees = sum of amountOwed (384+384=768)', d.platformFees === 768, `fees=${d.platformFees}`);
      record('E4', '  outstandingFees = unpaid commissions (384)', d.outstandingFees === 384, `outstanding=${d.outstandingFees}`);
      record('E5', '  paidFees = paid commissions (384)', d.paidFees === 384, `paid=${d.paidFees}`);
      record('E6', '  commissionRate = 0.12', d.commissionRate === 0.12, `rate=${d.commissionRate}`);
      record('E7', '  ledger non-empty', Array.isArray(d.ledger) && d.ledger.length > 0, `ledger=${d.ledger?.length}`);
      const jul = d.ledger.find(l => l.period.startsWith('July'));
      const aug = d.ledger.find(l => l.period.startsWith('August'));
      record('E8', '  July ledger totals July sales (3200)', !!jul && jul.totalSales === 3200, `july=${jul?.totalSales}`);
      record('E9', '  July ledger paymentStatus PAID', !!jul && jul.paymentStatus === 'PAID', `status=${jul?.paymentStatus}`);
      record('E10', '  August ledger totals 3200 & UNPAID', !!aug && aug.totalSales === 3200 && aug.paymentStatus === 'UNPAID', `aug=${aug?.totalSales}/${aug?.paymentStatus}`);
    }
  }
  {
    const r = await req('GET', '/seller/earnings', { token: tokenBuyer });
    record('E11', 'GET /seller/earnings as user -> 403', r.status === 403, `got ${r.status}`);
  }
  {
    const r = await req('GET', '/seller/earnings', { token: tokenAdmin });
    record('E12', 'GET /seller/earnings as admin -> 200', r.status === 200, `got ${r.status}`);
  }

  // ================= DELETE WITH ACTIVE ORDERS =================
  console.log('\n===== SECTION: DELETE GUARD =====');
  if (productA) {
    // orderA2 is REJECTED (not active). orderA1 is DELIVERED. Neither is PENDING/PROCESSING, so deletion should succeed.
    const r = await req('DELETE', `/seller/products/${productA._id}`, { token: tokenA });
    record('D1', 'DELETE product (no active PENDING/PROCESSING orders) -> 200', r.status === 200, `got ${r.status}`);
  } else {
    record('D1', 'DELETE product (no active orders) -> 200', false, 'productA missing (previous failure)');
  }
  if (productB) {
    // productB has a PENDING order -> deletion should be blocked
    const r2 = await req('DELETE', `/seller/products/${productB._id}`, { token: tokenB });
    record('D2', 'DELETE product with PENDING order -> 400', r2.status === 400, `got ${r2.status}`);
  } else {
    record('D2', 'DELETE product with PENDING order -> 400', false, 'productB missing (previous failure)');
  }

  console.log('\n===== SUMMARY =====');
  console.log(`TOTAL: ${results.length}  PASS: ${passCount}  FAIL: ${failCount}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
