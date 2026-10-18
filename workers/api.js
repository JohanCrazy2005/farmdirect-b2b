/**
 * FarmDirect B2B Worker API
 * Binding: env.DB (D1)
 * Endpoints:
 *   GET /api/v1/health
 *   GET /api/v1/listings
 *   GET /api/v1/listings/:id
 *   POST /api/v1/listings   (create – requires X-Seller-Id matching body.sellerid)
 *   PUT /api/v1/listings/:id (update – requires ownership)
 *   DELETE /api/v1/listings/:id (requires ownership)
 *
 * Interim auth: X-Seller-Id header (from client dashboard session).
 * Full Cloudflare Access / JWT verification will replace this after deploy + Access setup.
 *
 * Rate limiting: simple per-IP in-memory window (60 requests / 60s). Per-isolate only;
 * for production-scale use Durable Objects or KV. Returns 429 with Retry-After when exceeded.
 *
 * Observability: structured JSON logs to console for every request (method, path, status,
 * duration, ip, seller when present). Visible in Cloudflare Workers logs / wrangler tail.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const rateStore = new Map(); // ip -> { count, resetAt }

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
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

function getSellerId(request) {
  return (request.headers.get('X-Seller-Id') || '').trim();
}

function logRequest(entry) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    service: 'farmdirect-b2b',
    ...entry,
  }));
}

export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const ip = getClientIp(request);
    const sellerId = getSellerId(request);

    // CORS for frontend
    if (request.method === 'OPTIONS') {
      const res = new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Seller-Id',
        },
      });
      logRequest({ method, path, status: 204, durationMs: Date.now() - start, ip, type: 'cors' });
      return res;
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // Basic rate limit (skip OPTIONS)
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      const res = Response.json(
        { error: 'Rate limit exceeded', retryAfter: rl.retryAfter },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
      logRequest({ method, path, status: 429, durationMs: Date.now() - start, ip, sellerId: sellerId || null, rateLimited: true });
      return res;
    }
    // Attach remaining for successful responses (optional observability)
    corsHeaders['X-RateLimit-Limit'] = String(RATE_LIMIT_MAX);
    corsHeaders['X-RateLimit-Remaining'] = String(rl.remaining);

    try {
      if (path === '/api/v1/health' && request.method === 'GET') {
        const res = Response.json({
          status: 'ok',
          service: 'farmdirect-b2b',
          database: 'b2bistening',
          binding: 'DB',
          rateLimit: { windowSec: 60, max: RATE_LIMIT_MAX, remaining: rl.remaining },
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerId: sellerId || null });
        return res;
      }

      if (path === '/api/v1/listings' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image FROM listings ORDER BY created_at DESC'
        ).all();

        const listings = (results || []).map(row => ({
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
        }));

        const res = Response.json({ listings, count: listings.length, source: 'd1' }, { headers: corsHeaders });
        logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerId: sellerId || null, count: listings.length });
        return res;
      }

      if (path === '/api/v1/listings' && request.method === 'POST') {
        const sellerIdHdr = getSellerId(request);
        if (!sellerIdHdr) {
          const res = Response.json({ error: 'X-Seller-Id header required' }, { status: 401, headers: corsHeaders });
          logRequest({ method, path, status: 401, durationMs: Date.now() - start, ip, error: 'missing_seller' });
          return res;
        }

        let body;
        try {
          body = await request.json();
        } catch {
          const res = Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
          logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, error: 'invalid_json' });
          return res;
        }

        if (body.sellerid !== sellerIdHdr) {
          const res = Response.json({ error: 'sellerid must match X-Seller-Id' }, { status: 403, headers: corsHeaders });
          logRequest({ method, path, status: 403, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, error: 'seller_mismatch' });
          return res;
        }

        const required = ['location','visibility','address','sellerid','category','headerdescription','price','units','image'];
        for (const k of required) {
          if (body[k] == null || (typeof body[k] === 'string' && !body[k].trim())) {
            const res = Response.json({ error: `Missing required field: ${k}` }, { status: 400, headers: corsHeaders });
            logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, error: `missing_${k}` });
            return res;
          }
        }
        if (!body.location?.lat || !body.location?.long) {
          const res = Response.json({ error: 'location.lat and location.long required' }, { status: 400, headers: corsHeaders });
          logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, error: 'missing_location' });
          return res;
        }
        if (!['worldwide','country','province'].includes(body.visibility)) {
          const res = Response.json({ error: 'Invalid visibility' }, { status: 400, headers: corsHeaders });
          logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, error: 'invalid_visibility' });
          return res;
        }

        const id = crypto.randomUUID();
        const stmt = env.DB.prepare(
          `INSERT INTO listings (id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          Number(body.location.lat),
          Number(body.location.long),
          body.visibility,
          body.address,
          body.sellerid,
          body.category,
          body.headerdescription,
          Number(body.price),
          body.units,
          body.description || '',
          body.image
        );

        await stmt.run();

        const listing = {
          id,
          location: { lat: Number(body.location.lat), long: Number(body.location.long) },
          visibility: body.visibility,
          address: body.address,
          sellerid: body.sellerid,
          category: body.category,
          headerdescription: body.headerdescription,
          price: Number(body.price),
          units: body.units,
          description: body.description || '',
          image: body.image,
        };

        const res = Response.json({ listing, message: 'created' }, { status: 201, headers: corsHeaders });
        logRequest({ method, path, status: 201, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id });
        return res;
      }

      const listingMatch = path.match(/^\/api\/v1\/listings\/([^/]+)$/);
      if (listingMatch) {
        const id = listingMatch[1];

        if (request.method === 'GET') {
          const row = await env.DB.prepare(
            'SELECT id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image FROM listings WHERE id = ?'
          ).bind(id).first();

          if (!row) {
            const res = Response.json({ error: 'Listing not found' }, { status: 404, headers: corsHeaders });
            logRequest({ method, path, status: 404, durationMs: Date.now() - start, ip, sellerId: sellerId || null, listingId: id });
            return res;
          }

          const listing = {
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
          };

          const res = Response.json(listing, { headers: corsHeaders });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerId: sellerId || null, listingId: id });
          return res;
        }

        if (request.method === 'PUT') {
          const sellerIdHdr = getSellerId(request);
          if (!sellerIdHdr) {
            const res = Response.json({ error: 'X-Seller-Id header required' }, { status: 401, headers: corsHeaders });
            logRequest({ method, path, status: 401, durationMs: Date.now() - start, ip, listingId: id, error: 'missing_seller' });
            return res;
          }

          let body;
          try {
            body = await request.json();
          } catch {
            const res = Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
            logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'invalid_json' });
            return res;
          }

          const required = ['location','visibility','address','sellerid','category','headerdescription','price','units','image'];
          for (const k of required) {
            if (body[k] == null || (typeof body[k] === 'string' && !body[k].trim())) {
              const res = Response.json({ error: `Missing required field: ${k}` }, { status: 400, headers: corsHeaders });
              logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: `missing_${k}` });
              return res;
            }
          }
          if (!body.location?.lat || !body.location?.long) {
            const res = Response.json({ error: 'location.lat and location.long required' }, { status: 400, headers: corsHeaders });
            logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'missing_location' });
            return res;
          }
          if (!['worldwide','country','province'].includes(body.visibility)) {
            const res = Response.json({ error: 'Invalid visibility' }, { status: 400, headers: corsHeaders });
            logRequest({ method, path, status: 400, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'invalid_visibility' });
            return res;
          }

          const existing = await env.DB.prepare('SELECT id, sellerid FROM listings WHERE id = ?').bind(id).first();
          if (!existing) {
            const res = Response.json({ error: 'Listing not found' }, { status: 404, headers: corsHeaders });
            logRequest({ method, path, status: 404, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id });
            return res;
          }
          if (existing.sellerid !== sellerIdHdr) {
            const res = Response.json({ error: 'Not authorized to update this listing' }, { status: 403, headers: corsHeaders });
            logRequest({ method, path, status: 403, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'not_owner' });
            return res;
          }
          if (body.sellerid !== sellerIdHdr) {
            const res = Response.json({ error: 'Cannot change sellerid' }, { status: 403, headers: corsHeaders });
            logRequest({ method, path, status: 403, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'seller_change' });
            return res;
          }

          const stmt = env.DB.prepare(
            `UPDATE listings SET
              lat = ?, long = ?, visibility = ?, address = ?, sellerid = ?, category = ?,
              headerdescription = ?, price = ?, units = ?, description = ?, image = ?,
              updated_at = datetime('now')
             WHERE id = ?`
          ).bind(
            Number(body.location.lat),
            Number(body.location.long),
            body.visibility,
            body.address,
            body.sellerid,
            body.category,
            body.headerdescription,
            Number(body.price),
            body.units,
            body.description || '',
            body.image,
            id
          );

          await stmt.run();

          const listing = {
            id,
            location: { lat: Number(body.location.lat), long: Number(body.location.long) },
            visibility: body.visibility,
            address: body.address,
            sellerid: body.sellerid,
            category: body.category,
            headerdescription: body.headerdescription,
            price: Number(body.price),
            units: body.units,
            description: body.description || '',
            image: body.image,
          };

          const res = Response.json({ listing, message: 'updated' }, { headers: corsHeaders });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id });
          return res;
        }

        if (request.method === 'DELETE') {
          const sellerIdHdr = getSellerId(request);
          if (!sellerIdHdr) {
            const res = Response.json({ error: 'X-Seller-Id header required' }, { status: 401, headers: corsHeaders });
            logRequest({ method, path, status: 401, durationMs: Date.now() - start, ip, listingId: id, error: 'missing_seller' });
            return res;
          }

          const existing = await env.DB.prepare('SELECT id, sellerid FROM listings WHERE id = ?').bind(id).first();
          if (!existing) {
            const res = Response.json({ error: 'Listing not found' }, { status: 404, headers: corsHeaders });
            logRequest({ method, path, status: 404, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id });
            return res;
          }
          if (existing.sellerid !== sellerIdHdr) {
            const res = Response.json({ error: 'Not authorized to delete this listing' }, { status: 403, headers: corsHeaders });
            logRequest({ method, path, status: 403, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id, error: 'not_owner' });
            return res;
          }

          await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(id).run();

          const res = Response.json({ message: 'deleted', id }, { headers: corsHeaders });
          logRequest({ method, path, status: 200, durationMs: Date.now() - start, ip, sellerId: sellerIdHdr, listingId: id });
          return res;
        }
      }

      const res = Response.json({ error: 'Not found', path }, { status: 404, headers: corsHeaders });
      logRequest({ method, path, status: 404, durationMs: Date.now() - start, ip, sellerId: sellerId || null });
      return res;
    } catch (err) {
      console.error(err);
      const res = Response.json({ error: 'Internal error', message: err.message }, { status: 500, headers: corsHeaders });
      logRequest({ method, path, status: 500, durationMs: Date.now() - start, ip, sellerId: sellerId || null, error: err.message });
      return res;
    }
  },
};
