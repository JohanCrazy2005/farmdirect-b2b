/**
 * FarmDirect B2B — single listing API (Vercel Serverless)
 * DELETE /api/listings/:id → remove listing from tmp extras and/or Turso
 *
 * Seed data/listings.json is immutable in this open-source demo.
 * User listings created via POST live in /tmp or Turso and can be deleted.
 */

const fs = require('fs');
const path = require('path');

const TMP_PATH = path.join('/tmp', 'farmdirect-listings-extra.json');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

  res.status(405).json({ error: 'Method not allowed' });
};
