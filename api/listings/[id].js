/**
 * FarmDirect B2B — single listing API (Vercel Serverless)
 * DELETE /api/listings/:id → remove listing from tmp extras and/or Turso
 * PUT    /api/listings/:id → update price / availableQty / stockStatus (coords unchanged unless sent)
 *
 * Seed data/listings.json is immutable in this open-source demo.
 * User listings created via POST live in /tmp or Turso and can be updated/deleted.
 */

const fs = require('fs');
const path = require('path');

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

function readExtras() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      const list = JSON.parse(fs.readFileSync(TMP_PATH, 'utf8'));
      return Array.isArray(list) ? list : [];
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

async function tryTursoDelete(id) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return false;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    await client.execute({
      sql: 'DELETE FROM listings WHERE id = ?',
      args: [Number(id)],
    });
    return true;
  } catch (e) {
    console.warn('Turso delete failed', e.message);
    return false;
  }
}

async function tryTursoUpdate(id, updates) {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });

    const sets = [];
    const args = [];
    if (updates.price != null) {
      sets.push('price = ?');
      args.push(Number(updates.price));
    }
    if (updates.availableQty != null) {
      sets.push('available_qty = ?');
      args.push(Number(updates.availableQty));
    }
    if (updates.stockStatus != null) {
      sets.push('stock_status = ?');
      args.push(String(updates.stockStatus));
    }
    if (updates.lat != null && updates.lng != null) {
      sets.push('lat = ?');
      sets.push('lng = ?');
      args.push(Number(updates.lat), Number(updates.lng));
    }
    if (sets.length === 0) return null;

    sets.push("updated_at = datetime('now')");
    args.push(Number(id));

    await client.execute({
      sql: `UPDATE listings SET ${sets.join(', ')} WHERE id = ?`,
      args,
    });

    const rs = await client.execute({
      sql: 'SELECT * FROM listings WHERE id = ?',
      args: [Number(id)],
    });
    const r = (rs.rows || [])[0];
    if (!r) return null;
    return ensureCoords({
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
    });
  } catch (e) {
    console.warn('Turso update failed', e.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const id = parseInt(req.query.id, 10);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  if (req.method === 'DELETE') {
    const extras = readExtras();
    const before = extras.length;
    const filtered = extras.filter((l) => Number(l.id) !== id);
    const removedFromTmp = filtered.length !== before;
    if (removedFromTmp) {
      writeExtras(filtered);
    }

    const tursoOk = await tryTursoDelete(id);

    res.status(200).json({
      ok: true,
      id,
      source: tursoOk ? 'turso' : 'tmp',
      removedFromTmp,
    });
    return;
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const updates = {};
    if (body.price != null) {
      const p = Number(body.price);
      if (!(p >= 0)) {
        res.status(400).json({ error: 'price must be a number >= 0' });
        return;
      }
      updates.price = p;
    }
    if (body.availableQty != null) {
      const q = Number(body.availableQty);
      if (Number.isNaN(q) || q < 0) {
        res.status(400).json({ error: 'availableQty must be a number >= 0' });
        return;
      }
      updates.availableQty = q;
    }
    if (body.stockStatus != null) {
      const allowed = ['in_stock', 'low', 'out'];
      const s = String(body.stockStatus);
      if (!allowed.includes(s)) {
        res.status(400).json({ error: 'stockStatus must be in_stock, low, or out' });
        return;
      }
      updates.stockStatus = s;
    }
    // Coordinates only if both explicitly sent; never clear them
    if (body.lat != null && body.lng != null) {
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        updates.lat = lat;
        updates.lng = lng;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update (price, availableQty, stockStatus)' });
      return;
    }

    // Prefer Turso when configured
    const tursoUpdated = await tryTursoUpdate(id, updates);
    if (tursoUpdated) {
      res.status(200).json({ listing: tursoUpdated, source: 'turso' });
      return;
    }

    // Fallback to tmp extras (user-created listings)
    const extras = readExtras();
    const idx = extras.findIndex((l) => Number(l.id) === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Listing not found (seed is immutable; only user listings in tmp/Turso can be updated)' });
      return;
    }

    const current = extras[idx];
    const next = ensureCoords({
      ...current,
      ...updates,
      // preserve existing coords unless both were sent
      lat: updates.lat != null ? updates.lat : current.lat,
      lng: updates.lng != null ? updates.lng : current.lng,
    });
    extras[idx] = next;
    writeExtras(extras);

    res.status(200).json({ listing: next, source: 'tmp' });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
