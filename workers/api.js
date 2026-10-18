/**
 * FarmDirect B2B Worker API
 * Binding: env.DB (D1)
 * Endpoints:
 *   GET /api/v1/health
 *   GET /api/v1/listings
 *   GET /api/v1/listings/:id
 *   POST /api/v1/listings   (create)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS for frontend
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    try {
      if (path === '/api/v1/health' && request.method === 'GET') {
        return Response.json({
          status: 'ok',
          service: 'farmdirect-b2b',
          database: 'b2bistening',
          binding: 'DB',
          timestamp: new Date().toISOString(),
        }, { headers: corsHeaders });
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

        return Response.json({ listings, count: listings.length, source: 'd1' }, { headers: corsHeaders });
      }

      if (path === '/api/v1/listings' && request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
        }

        const required = ['location','visibility','address','sellerid','category','headerdescription','price','units','image'];
        for (const k of required) {
          if (body[k] == null || (typeof body[k] === 'string' && !body[k].trim())) {
            return Response.json({ error: `Missing required field: ${k}` }, { status: 400, headers: corsHeaders });
          }
        }
        if (!body.location?.lat || !body.location?.long) {
          return Response.json({ error: 'location.lat and location.long required' }, { status: 400, headers: corsHeaders });
        }
        if (!['worldwide','country','province'].includes(body.visibility)) {
          return Response.json({ error: 'Invalid visibility' }, { status: 400, headers: corsHeaders });
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

        return Response.json({ listing, message: 'created' }, { status: 201, headers: corsHeaders });
      }

      const listingMatch = path.match(/^\/api\/v1\/listings\/([^/]+)$/);
      if (listingMatch && request.method === 'GET') {
        const id = listingMatch[1];
        const row = await env.DB.prepare(
          'SELECT id, lat, long, visibility, address, sellerid, category, headerdescription, price, units, description, image FROM listings WHERE id = ?'
        ).bind(id).first();

        if (!row) {
          return Response.json({ error: 'Listing not found' }, { status: 404, headers: corsHeaders });
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

        return Response.json(listing, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found', path }, { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error(err);
      return Response.json({ error: 'Internal error', message: err.message }, { status: 500, headers: corsHeaders });
    }
  },
};
