/**
 * FarmDirect B2B — Listings API (Vercel Serverless)
 * GET  /api/listings  → all listings (each has lat/lng)
 * POST /api/listings  → create listing (requires name, product, price; lat/lng optional → default near London)
 *
 * Storage (open source first):
 * 1) data/listings.json (repo seed, always available)
 * 2) Optional Turso/libSQL if TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set
 * 3) Ephemeral /tmp append for demo POSTs on this instance
 */

const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(process.cwd(), 'data', 'listings.json');
const TMP_PATH = path.join('/tmp', 'farmdirect-listings-extra.json');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readSeed() {
  try {
    const raw = fs.readFileSync(SEED_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function readExtras() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      return JSON.parse(fs.readFileSync(TMP_PATH, 'utf8'));
    }
  } catch {}
  return [];
}

function writeExtras(list) {
  try {
    fs.writeFileSync(TMP_PATH, JSON.stringify(list, null, 2));
  } catch (e) {
    console.warn('tmp write failed', e.message);
  }
}

function normalize(row) {
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  return {
    ...row,
    lat,
    lng,
    coordinates: row.coordinates || { lat, lng },
    price: Number(row.price),
    rating: Number(row.rating) || 0,
    reviews: Number(row.reviews) || 0,
  };
}

async function tryTursoAll() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    const rs = await client.execute('SELECT * FROM listings ORDER BY id');
    return rs.rows.map((r) =>
      normalize({
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
      })
    );
  } catch (e) {
    console.warn('Turso read failed, using JSON seed', e.message);
    return null;
  }
}

async function tryTursoInsert(row) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    const rs = await client.execute({
      sql: `INSERT INTO listings (name, farm, product, category, price, unit, qty, lat, lng, stock_status, available_qty, is_user_listing)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) RETURNING id`,
      args: [
        row.name,
        row.farm || row.name,
        row.product,
        row.category || 'tomatoes',
        row.price,
        row.unit || 'kg',
        row.qty || '',
        row.lat,
        row.lng,
        row.stockStatus || 'in_stock',
        row.availableQty || 0,
      ],
    });
    return rs.rows[0]?.id ?? null;
  } catch (e) {
    console.warn('Turso insert failed', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    const fromTurso = await tryTursoAll();
    if (fromTurso && fromTurso.length) {
      res.status(200).json({ source: 'turso', listings: fromTurso });
      return;
    }
    const seed = readSeed().map(normalize);
    const extras = readExtras().map(normalize);
    const byId = new Map();
    [...seed, ...extras].forEach((l) => byId.set(l.id, l));
    res.status(200).json({ source: 'json', listings: Array.from(byId.values()) });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
      }
    }
    body = body || {};
    const name = String(body.name || '').trim();
    const product = String(body.product || '').trim();
    const price = Number(body.price);
    if (!name || !product || !(price >= 0)) {
      res.status(400).json({ error: 'Required: name, product, price (>=0)' });
      return;
    }
    let lat = Number(body.lat);
    let lng = Number(body.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      lat = 51.51 + (Math.random() - 0.5) * 0.08;
      lng = -0.08 + (Math.random() - 0.5) * 0.08;
    }
    const unit = String(body.unit || 'kg').trim();
    const qtyNum = parseInt(body.qty || body.availableQty || 100, 10) || 100;
    const seed = readSeed();
    const extras = readExtras();
    const maxId = Math.max(0, ...seed.map((s) => s.id), ...extras.map((s) => s.id));

    const row = normalize({
      id: maxId + 1,
      name,
      farm: body.farm || name,
      product,
      category: body.category || 'tomatoes',
      price,
      unit,
      qty: qtyNum + ' ' + unit,
      organic: !!body.organic,
      verified: false,
      rating: 0,
      reviews: 0,
      distance: 5,
      lat,
      lng,
      color: '#84cc16',
      emoji: '🌱',
      img: body.img || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=128&h=128&fit=crop',
      moq: body.moq || 10,
      leadTimeDays: body.leadTimeDays || 3,
      stockStatus: 'in_stock',
      availableQty: qtyNum,
      paymentTerms: 'due_on_receipt',
      fulfillment: 'both',
      harvestDaysAgo: 1,
      bio: body.bio || 'Live listing from API',
      isUserListing: true,
    });

    const tursoId = await tryTursoInsert(row);
    if (tursoId != null) row.id = tursoId;

    extras.push(row);
    writeExtras(extras);

    res.status(201).json({ source: tursoId != null ? 'turso' : 'tmp', listing: row });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
