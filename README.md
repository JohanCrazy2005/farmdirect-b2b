# FarmDirect B2B – Map-first B2B Marketplace (Fresh Start)

Interactive map-first marketplace for agricultural products. Leaflet map + Cloudflare Worker + D1.

## Canonical data shape

`location{lat,long}`, `visibility` (worldwide|country|province), `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`.

See `schema/listings.schema.json` and `schema/d1-schema.sql`.

## Architecture

Browser (Leaflet) → Worker (`workers/api.js`, binding `DB`) → D1 `b2bistening`.

Seed fallback: `data/seed-listings.json` when API is offline.

## P1 – Deploy & connect D1 (user action required)

The database already exists:

- name: `b2bistening`
- id: `ad22b284-cafd-4f74-a8bc-6205056d38f8`
- binding: `DB`

### Exact commands

```bash
# 1. Login (once)
npx wrangler login

# 2. Apply schema to the live D1 database
npx wrangler d1 execute b2bistening --remote --file=./schema/d1-schema.sql

# 3. (Optional) Seed the database from JSON
#    You can convert seed-listings.json to INSERT statements or use a small script.
#    For now, the Worker falls back gracefully if the table is empty.

# 4. Deploy the Worker
npx wrangler deploy

# 5. Set the frontend API base (after you know the Worker URL)
#    Edit index.html or js/config.js and set:
#    window.FD_CONFIG = { API_BASE: 'https://farmdirect-b2b.<your-subdomain>.workers.dev' };

# 6. Verify health
curl https://farmdirect-b2b.<your-subdomain>.workers.dev/api/v1/health
```

After deploy, the Worker serves:

- `GET /api/v1/health`
- `GET /api/v1/listings`
- `GET /api/v1/listings/:id`
- `POST /api/v1/listings` (requires `X-Seller-Id` header matching body.sellerid)
- `PUT /api/v1/listings/:id` (requires ownership)
- `DELETE /api/v1/listings/:id` (requires ownership)

### Interim auth (P4)

Mutations currently expect an `X-Seller-Id` header. The frontend attaches it automatically from the seller dashboard session (localStorage). This is a temporary ownership check that will be replaced by Cloudflare Access / JWT validation after Access is configured. Open the profile menu, enter a seller ID, then create/edit/delete.

## Local development

```bash
npx wrangler dev
# Frontend can point API_BASE at http://localhost:8787
```

## Project layout

```
schema/          # JSON Schema + D1 SQL
data/            # seed-listings.json
workers/         # api.js
css/             # main.css
js/              # map, cards, filters, form, dashboard, api modules
index.html       # Leaflet shell
wrangler.toml
```

## Improvement log

See `IMPROVEMENTS.md`.
