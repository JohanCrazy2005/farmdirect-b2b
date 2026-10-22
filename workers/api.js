/**
 * FarmDirect B2B Worker API (P3 – auth + publication)
 * Binding: env.DB (D1)
 *
 * Public:
 *   GET  /api/v1/health
 *   GET  /api/v1/listings              (published only)
 *   GET  /api/v1/listings/:id          (published, or owner with token)
 *
 * Auth:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   POST /api/v1/auth/logout
 *   GET  /api/v1/auth/me
 *
 * Seller (Bearer token required):
 *   GET  /api/v1/listings/mine
 *   POST /api/v1/listings              (default status: draft)
 *   PUT  /api/v1/listings/:id
 *   DELETE /api/v1/listings/:id
 *   POST /api/v1/listings/:id/publish
 *   POST /api/v1/listings/:id/unpublish
 *   POST /api/v1/listings/:id/archive
 *
 * Interim: X-Seller-Id still accepted for mutations if no Bearer token
 * (legacy); prefer Authorization: Bearer <token> from login.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;
const rateStore = new Map();

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateStore.get(ip);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateStore.set(ip, entry);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function logRequest(entry) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'farmdirect-b2b', ...entry }));
}

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Seller-Id',
    'Content-Type': 'application/json',
    ...extra,
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, { status, headers: corsHeaders(extraHeaders) });
}

function rowToListing(row) {
  if (!row) return null;
  return {
    id: row.id,
    location: { lat: row.lat, long: row.long },
    visibility: row.visibility,
    address: row.address,
    sellerid: row.sellerid,
    category: row.category,
    headerdescription: row.headerdescription,
    price: row.price,
    units: row.units,
    description: row.description,
    image: row.image,
    status: row.status || 'published',
    published_at: row.published_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

const LISTING_SELECT =
  'SELECT id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image, status, published_at, created_at, updated_at FROM listings';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomBytesB64(n = 32) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf));
}

async function hashPassword(password, saltB64) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function verifyPassword(password, saltB64, hashB64) {
  const computed = await hashPassword(password, saltB64);
  return computed === hashB64;
}

function getBearerToken(request) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function resolveSession(env, request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.sellerid, s.expires_at, sel.name, sel.email, sel.contact, sel.bio
     FROM sessions s
     LEFT JOIN sellers sel ON sel.sellerid = s.sellerid
     WHERE s.token_hash = ?`
  ).bind(tokenHash).first();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return {
    sellerid: row.sellerid,
    name: row.name,
    email: row.email,
    contact: row.contact,
    bio: row.bio,
    tokenHash,
  };
}

/** Session seller, or legacy X-Seller-Id header */
async function resolveActor(env, request) {
  const session = await resolveSession(env, request);
  if (session) return { sellerid: session.sellerid, via: 'session', session };
  const legacy = (request.headers.get('X-Seller-Id') || '').trim();
  if (legacy) return { sellerid: legacy, via: 'legacy', session: null };
  return null;
}

async function createSession(env, sellerid) {
  const token = randomBytesB64(32);
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessions (token_hash, sellerid, expires_at) VALUES (?, ?, ?)'
  ).bind(tokenHash, sellerid, expires).run();
  return { token, expiresAt: expires };
}

function validateListingBody(body, { requireImage = true } = {}) {
  const required = ['location', 'visibility', 'address', 'sellerid', 'category', 'headerdescription', 'price', 'units'];
  if (requireImage) required.push('image');
  for (const k of required) {
    if (body[k] == null || (typeof body[k] === 'string' && !String(body[k]).trim())) {
      return `Missing required field: ${k}`;
    }
  }
  if (body.location?.lat == null || body.location?.long == null) {
    return 'location.lat and location.long required';
  }
  if (!['worldwide', 'country', 'province'].includes(body.visibility)) {
    return 'Invalid visibility';
  }
  if (body.status && !['draft', 'published', 'archived'].includes(body.status)) {
    return 'Invalid status (draft|published|archived)';
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;
    const ip = getClientIp(request);

    if (method === 'OPTIONS') {
      const res = new Response(null, { status: 204, headers: corsHeaders() });
      logRequest({ method, path, status: 204, durationMs: Date.now() - start, ip, type: 'cors' });
      return res;
    }

    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      const res = json(
        { error: 'Rate limit exceeded', retryAfter: rl.retryAfter },
        429,
        { 'Retry-After': String(rl.retryAfter) }
      );
      logRequest({ method, path, status: 429, durationMs: Date.now() - start, ip, rateLimited: true });
      return res;
    }

    try {
      // ---- Health ----
      if (path === '/api/v1/health' && method === 'GET') {
        const res = json({
          status: 'ok',
          service: 'farmdirect-b2b',
          database: 'b2bistening',
          binding: 'DB',
          features: ['auth', 'publication'],
          rateLimit: { windowSec: 60, max: RATE_LIMIT_MAX, remaining: rl.remaining },
          timestamp: new Date().toISOString(),
        });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip });
        return res;
      }

      // ---- Auth: register ----
      if (path === '/api/v1/auth/register' && method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        const sellerid = (body.sellerid || '').trim();
        const password = body.password || '';
        if (!sellerid || sellerid.length < 2) {
          return json({ error: 'sellerid required (min 2 chars)' }, 400);
        }
        if (!password || password.length < 6) {
          return json({ error: 'password required (min 6 chars)' }, 400);
        }
        const existing = await env.DB.prepare('SELECT sellerid FROM sellers WHERE sellerid = ?').bind(sellerid).first();
        if (existing) {
          return json({ error: 'sellerid already registered' }, 409);
        }
        const salt = randomBytesB64(16);
        const password_hash = await hashPassword(password, salt);
        await env.DB.prepare(
          `INSERT INTO sellers (sellerid, name, email, contact, bio, password_hash, password_salt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sellerid,
          body.name || sellerid,
          body.email || null,
          body.contact || null,
          body.bio || null,
          password_hash,
          salt
        ).run();
        const { token, expiresAt } = await createSession(env, sellerid);
        const res = json({
          message: 'registered',
          token,
          expiresAt,
          seller: { sellerid, name: body.name || sellerid, email: body.email || null },
        }, 201);
        logRequest({ method, path, status: 201, durationMs: Date.now() - start, ip, sellerid });
        return res;
      }

      // ---- Auth: login ----
      if (path === '/api/v1/auth/login' && method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        const sellerid = (body.sellerid || '').trim();
        const password = body.password || '';
        const row = await env.DB.prepare(
          'SELECT sellerid, name, email, contact, bio, password_hash, password_salt FROM sellers WHERE sellerid = ?'
        ).bind(sellerid).first();
        if (!row || !row.password_hash || !row.password_salt) {
          return json({ error: 'Invalid sellerid or password' }, 401);
        }
        const ok = await verifyPassword(password, row.password_salt, row.password_hash);
        if (!ok) {
          return json({ error: 'Invalid sellerid or password' }, 401);
        }
        const { token, expiresAt } = await createSession(env, sellerid);
        const res = json({
          message: 'ok',
          token,
          expiresAt,
          seller: {
            sellerid: row.sellerid,
            name: row.name,
            email: row.email,
            contact: row.contact,
            bio: row.bio,
          },
        });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid });
        return res;
      }

      // ---- Auth: logout ----
      if (path === '/api/v1/auth/logout' && method === 'POST') {
        const session = await resolveSession(env, request);
        if (session) {
          await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
        }
        const res = json({ message: 'logged out' });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip });
        return res;
      }

      // ---- Auth: me ----
      if (path === '/api/v1/auth/me' && method === 'GET') {
        const session = await resolveSession(env, request);
        if (!session) {
          return json({ error: 'Not authenticated' }, 401);
        }
        const res = json({
          seller: {
            sellerid: session.sellerid,
            name: session.name,
            email: session.email,
            contact: session.contact,
            bio: session.bio,
          },
        });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid: session.sellerid });
        return res;
      }

      // ---- Listings: mine (owner, all statuses) ----
      if (path === '/api/v1/listings/mine' && method === 'GET') {
        const actor = await resolveActor(env, request);
        if (!actor) {
          return json({ error: 'Authentication required (Bearer token or X-Seller-Id)' }, 401);
        }
        const { results } = await env.DB.prepare(
          `${LISTING_SELECT} WHERE sellerid = ? ORDER BY updated_at DESC`
        ).bind(actor.sellerid).all();
        const listings = (results || []).map(rowToListing);
        const res = json({ listings, count: listings.length, source: 'd1', scope: 'mine' });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid: actor.sellerid, count: listings.length });
        return res;
      }

      // ---- Listings: public list (published only) ----
      if (path === '/api/v1/listings' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `${LISTING_SELECT} WHERE COALESCE(status, 'published') = 'published' ORDER BY COALESCE(published_at, created_at) DESC`
        ).all();
        const listings = (results || []).map(rowToListing);
        const res = json({ listings, count: listings.length, source: 'd1' });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, count: listings.length });
        return res;
      }

      // ---- Listings: create ----
      if (path === '/api/v1/listings' && method === 'POST') {
        const actor = await resolveActor(env, request);
        if (!actor) {
          return json({ error: 'Authentication required' }, 401);
        }
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        body.sellerid = actor.sellerid;
        const verr = validateListingBody(body);
        if (verr) return json({ error: verr }, 400);

        const status = body.status && ['draft', 'published', 'archived'].includes(body.status)
          ? body.status
          : 'draft';
        const id = crypto.randomUUID();
        const publishedAt = status === 'published' ? new Date().toISOString() : null;

        await env.DB.prepare(
          `INSERT INTO listings (id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image, status, published_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          Number(body.location.lat),
          Number(body.location.long),
          body.visibility,
          body.address,
          actor.sellerid,
          body.category,
          body.headerdescription,
          Number(body.price),
          body.units,
          body.description || '',
          body.image,
          status,
          publishedAt
        ).run();

        const listing = rowToListing({
          id,
          lat: Number(body.location.lat),
          long: Number(body.location.long),
          visibility: body.visibility,
          address: body.address,
          sellerid: actor.sellerid,
          category: body.category,
          headerdescription: body.headerdescription,
          price: Number(body.price),
          units: body.units,
          description: body.description || '',
          image: body.image,
          status,
          published_at: publishedAt,
        });

        const res = json({ listing, message: 'created' }, 201);
        logRequest({ method, path, status: 201, durationMs: Date.now() - start, ip, sellerid: actor.sellerid, listingId: id, listingStatus: status });
        return res;
      }

      // ---- Listings: by id + publish actions ----
      const listingMatch = path.match(/^\/api\/v1\/listings\/([^/]+)(?:\/(publish|unpublish|archive))?$/);
      if (listingMatch) {
        const id = decodeURIComponent(listingMatch[1]);
        const action = listingMatch[2] || null;

        // Publish / unpublish / archive
        if (action && method === 'POST') {
          const actor = await resolveActor(env, request);
          if (!actor) return json({ error: 'Authentication required' }, 401);

          const existing = await env.DB.prepare(
            `${LISTING_SELECT} WHERE id = ?`
          ).bind(id).first();
          if (!existing) return json({ error: 'Listing not found' }, 404);
          if (existing.sellerid !== actor.sellerid) {
            return json({ error: 'Not authorized' }, 403);
          }

          let newStatus;
          let publishedAt = existing.published_at;
          if (action === 'publish') {
            newStatus = 'published';
            publishedAt = existing.published_at || new Date().toISOString();
          } else if (action === 'unpublish') {
            newStatus = 'draft';
          } else if (action === 'archive') {
            newStatus = 'archived';
          }

          await env.DB.prepare(
            `UPDATE listings SET status = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?`
          ).bind(newStatus, publishedAt, id).run();

          const updated = { ...existing, status: newStatus, published_at: publishedAt };
          const res = json({ listing: rowToListing(updated), message: action });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid: actor.sellerid, listingId: id, action });
          return res;
        }

        if (method === 'GET') {
          const row = await env.DB.prepare(`${LISTING_SELECT} WHERE id = ?`).bind(id).first();
          if (!row) return json({ error: 'Listing not found' }, 404);
          const status = row.status || 'published';
          if (status !== 'published') {
            const actor = await resolveActor(env, request);
            if (!actor || actor.sellerid !== row.sellerid) {
              return json({ error: 'Listing not found' }, 404);
            }
          }
          const res = json(rowToListing(row));
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, listingId: id });
          return res;
        }

        if (method === 'PUT') {
          const actor = await resolveActor(env, request);
          if (!actor) return json({ error: 'Authentication required' }, 401);
          let body;
          try {
            body = await request.json();
          } catch {
            return json({ error: 'Invalid JSON' }, 400);
          }
          body.sellerid = actor.sellerid;
          const verr = validateListingBody(body);
          if (verr) return json({ error: verr }, 400);

          const existing = await env.DB.prepare('SELECT id, sellerid, status, published_at FROM listings WHERE id = ?').bind(id).first();
          if (!existing) return json({ error: 'Listing not found' }, 404);
          if (existing.sellerid !== actor.sellerid) {
            return json({ error: 'Not authorized to update this listing' }, 403);
          }

          let status = existing.status || 'published';
          let publishedAt = existing.published_at;
          if (body.status && ['draft', 'published', 'archived'].includes(body.status)) {
            status = body.status;
            if (status === 'published' && !publishedAt) publishedAt = new Date().toISOString();
          }

          await env.DB.prepare(
            `UPDATE listings SET
              lat = ?, long = ?, visibility = ?, address = ?, sellerid = ?, category = ?,
              headerdescription = ?, price = ?, units = ?, description = ?, image = ?,
              status = ?, published_at = ?, updated_at = datetime('now')
             WHERE id = ?`
          ).bind(
            Number(body.location.lat),
            Number(body.location.long),
            body.visibility,
            body.address,
            actor.sellerid,
            body.category,
            body.headerdescription,
            Number(body.price),
            body.units,
            body.description || '',
            body.image,
            status,
            publishedAt,
            id
          ).run();

          const listing = rowToListing({
            id,
            lat: Number(body.location.lat),
            long: Number(body.location.long),
            visibility: body.visibility,
            address: body.address,
            sellerid: actor.sellerid,
            category: body.category,
            headerdescription: body.headerdescription,
            price: Number(body.price),
            units: body.units,
            description: body.description || '',
            image: body.image,
            status,
            published_at: publishedAt,
          });
          const res = json({ listing, message: 'updated' });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid: actor.sellerid, listingId: id });
          return res;
        }

        if (method === 'DELETE') {
          const actor = await resolveActor(env, request);
          if (!actor) return json({ error: 'Authentication required' }, 401);
          const existing = await env.DB.prepare('SELECT id, sellerid FROM listings WHERE id = ?').bind(id).first();
          if (!existing) return json({ error: 'Listing not found' }, 404);
          if (existing.sellerid !== actor.sellerid) {
            return json({ error: 'Not authorized to delete this listing' }, 403);
          }
          await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();
          const res = json({ message: 'deleted', id });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerid: actor.sellerid, listingId: id });
          return res;
        }
      }

      const res = json({ error: 'Not found', path }, 404);
      logRequest({ method, path, status: 404, durationMs: Date.now() - start, ip });
      return res;
    } catch (err) {
      console.error(err);
      const res = json({ error: 'Internal error', message: err.message }, 500);
      logRequest({ method, path, status: 500, durationMs: Date.now() - start, ip, error: err.message });
      return res;
    }
  },
};
