/**
 * FarmDirect B2B — listings collection API (Vercel Serverless)
 * GET  /api/listings  → seed (data/listings.json) + user extras (/tmp or Turso)
 * POST /api/listings  → create listing (requires name, product, price; lat/lng required or defaulted)
 *
 * Open-source stack: JSON seed + optional Turso (libSQL). Every listing always has lat, lng, coordinates.
 */

const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(process.cwd(), 'data', 'listings.json');
const TMP_PATH = path.join('/tmp', 'farmdirect-listings-extra.json');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function ensureCoords(item) {
  const lat = item.lat != null ? Number(item.lat) : 51.51;
  const lng = item.lng != null ? Number(item.lng) : -0.08;
  return {
    ...item,
    lat,
    lng,
    coordinates: item.coordinates && item.coordinates.lat != null
      ? item.coordinates
      : { lat, lng },
  };
}

function readSeed() {
  try {
    const raw = fs.readFileSync(SEED_PATH, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.map(ensureCoords) : [];
  } catch (e) {
    console.warn('seed read failed', e.message);
    return [];
  }
}

function readExtras() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      const list = JSON.parse(fs.readFileSync(TMP_PATH, 'utf8'));
      return Array.isArray(list) ? list.map(ensureCoords) : [];
    }
  } catch {}
  return [];
}

function writeExtras(list) {
  try {
    fs.writeFileSync(TMP_PATH, JSON.stringify(list.map(ensureCoords), null, 2));
  } catch (e) {
    console.warn('tmp write failed', e.message);
  }
}

async function tryTursoGet() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    const rs = await client.execute('SELECT * FROM listings ORDER BY id');
    return (rs.rows || []).map((r) => ensureCoords({
      id: r.id,
      name: r.name,
      farm: r.farm,
      product: r.product,
      category: r.category,
      price: r.price,
      unit: r.unit,
      qty: r.qty,
      organic: !!r.organic,
      verified: !!r.verified,
      rating: r.rating,
      reviews: r.reviews,
      distance: r.distance,
      lat: r.lat,
      lng: r.lng,
      color: r.color,
      emoji: r.emoji,
      img: r.img,
      moq: r.moq,
      leadTimeDays: r.lead_time_days,
      stockStatus: r.stock_status,
      availableQty: r.available_qty,
      paymentTerms: r.payment_terms,
      fulfillment: r.fulfillment,
      harvestDaysAgo: r.harvest_days_ago,
      bio: r.bio,
      isUserListing: !!r.is_user_listing,
    }));
  } catch (e) {
    console.warn('Turso GET failed', e.message);
    return null;
  }
}

async function tryTursoPost(listing) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return false;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    const c = ensureCoords(listing);
    await client.execute({
      sql: `INSERT INTO listings
        (name, farm, product, category, price, unit, qty, organic, verified,
         rating, reviews, lat, lng, color, emoji, img, moq, lead_time_days,
         stock_status, available_qty, payment_terms, fulfillment, harvest_days_ago,
         bio, is_user_listing)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        c.name, c.farm || c.name, c.product, c.category || 'tomatoes', c.price,
        c.unit || 'kg', c.qty || null, c.organic ? 1 : 0, c.verified ? 1 : 0,
        c.rating || 0, c.reviews || 0, c.lat, c.lng, c.color || '#84cc16',
        c.emoji || '🌱', c.img || null, c.moq || 10, c.leadTimeDays || 3,
        c.stockStatus || 'in_stock', c.availableQty || 0, c.paymentTerms || 'due_on_receipt',
        c.fulfillment || 'both', c.harvestDaysAgo || 0, c.bio || null, 1,
      ],
    });
    return true;
  } catch (e) {
    console.warn('Turso POST failed', e.message);
    return false;
  }
}

function nextId(seed, extras) {
  const all = [...seed, ...extras];
  const max = all.reduce((m, l) => Math.max(m, Number(l.id) || 0), 0);
  return max + 1;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const tursoList = await tryTursoGet();
    if (tursoList) {
      res.status(200).json({ listings: tursoList, source: 'turso', count: tursoList.length });
      return;
    }
    const seed = readSeed();
    const extras = readExtras();
    const listings = [...seed, ...extras];
    res.status(200).json({
      listings,
      source: 'json+tmp',
      count: listings.length,
    });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const name = (body.name || '').trim();
    const product = (body.product || '').trim();
    const price = Number(body.price);
    if (!name || !product || !(price >= 0)) {
      res.status(400).json({ error: 'name, product and price (>=0) are required' });
      return;
    }

    let lat = body.lat != null ? Number(body.lat) : null;
    let lng = body.lng != null ? Number(body.lng) : null;
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      // Default near London with small jitter so markers don't stack
      lat = 51.51 + (Math.random() - 0.5) * 0.04;
      lng = -0.08 + (Math.random() - 0.5) * 0.04;
    }

    const seed = readSeed();
    const extras = readExtras();
    const id = nextId(seed, extras);

    const listing = ensureCoords({
      id,
      name,
      farm: name,
      product,
      category: body.category || 'tomatoes',
      price,
      unit: body.unit || 'kg',
      qty: body.qty || null,
      organic: !!body.organic,
      verified: false,
      rating: 0,
      reviews: 0,
      lat,
      lng,
      color: body.color || '#84cc16',
      emoji: body.emoji || '🌱',
      img: body.img || null,
      moq: Number(body.moq) || 10,
      leadTimeDays: Number(body.leadTimeDays) || 3,
      stockStatus: body.stockStatus || 'in_stock',
      availableQty: Number(body.availableQty) || Number(body.qty) || 0,
      paymentTerms: body.paymentTerms || 'due_on_receipt',
      fulfillment: body.fulfillment || 'both',
      harvestDaysAgo: Number(body.harvestDaysAgo) || 0,
      bio: body.bio || null,
      isUserListing: true,
    });

    const tursoOk = await tryTursoPost(listing);
    if (!tursoOk) {
      extras.push(listing);
      writeExtras(extras);
    }

    res.status(201).json({
      listing,
      source: tursoOk ? 'turso' : 'tmp',
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
