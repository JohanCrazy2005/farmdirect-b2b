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

## P4 – Cloudflare Access / JWT setup (user action required after deploy)

After the Worker is deployed, enable Cloudflare Access to replace the interim `X-Seller-Id` check with real identity.

### Exact steps

1. In the Cloudflare dashboard, go to **Workers & Pages** → your Worker → **Settings** → **Domains & Routes**.
2. For the `workers.dev` URL (or custom domain), click **Enable Cloudflare Access**.
3. Optionally click **Manage Cloudflare Access** to set policies (e.g. allow specific emails or groups).
4. Note the **AUD** (audience) tag and your team domain (`https://<team>.cloudflareaccess.com`).
5. Set Worker environment variables / secrets:
   ```bash
   npx wrangler secret put TEAM_DOMAIN   # e.g. https://yourteam.cloudflareaccess.com
   npx wrangler secret put POLICY_AUD    # the AUD tag from the Access application
   ```
6. In `workers/api.js`, add JWT validation (using `jose` or `ctx.access` where available) on mutation routes, extracting the authenticated seller identity (e.g. email or custom claim) and enforcing ownership instead of the `X-Seller-Id` header.
7. Redeploy: `npx wrangler deploy`.

Until Access is live, the interim header-based ownership continues to work for testing.

## P5 – R2 durable image storage (user action required after deploy)

Current image handling stores data URLs (or external https URIs) directly in the D1 `image` column. This is fine for the seed/fallback stage but not durable or efficient for production. Move images to Cloudflare R2.

### Exact steps

1. Create an R2 bucket (dashboard or CLI):
   ```bash
   npx wrangler r2 bucket create farmdirect-images
   ```
2. Add the binding to `wrangler.toml` (then redeploy):
   ```toml
   [[r2_buckets]]
   binding = "IMAGES"
   bucket_name = "farmdirect-images"
   ```
3. Optional: enable public access or custom domain for the bucket so listings can use stable `https://...` URLs.
4. Update the Worker (`workers/api.js`):
   - Add a dedicated `POST /api/v1/images` endpoint that accepts multipart form data (or base64), writes to `env.IMAGES.put(...)`, and returns a public URL or signed key.
   - On listing create/update, store only the R2 URL/key in the `image` field (schema remains `uri`).
5. Update the client form (`js/form.js`) to upload the resized file to the new endpoint instead of embedding a data URL, then set the returned URL on the listing.
6. Redeploy: `npx wrangler deploy`.

Until R2 is wired, data URLs continue to work and validate against the schema. Seed data remains unchanged.

## P5 – Custom domain (user action required after deploy)

After the Worker is deployed to a `workers.dev` URL, attach a custom domain for a production-ready API endpoint.

### Exact steps

1. Ensure the domain is on Cloudflare (add it via the dashboard if needed; DNS must be managed by Cloudflare).
2. In the Cloudflare dashboard, go to **Workers & Pages** → your Worker (`farmdirect-b2b`) → **Settings** → **Domains & Routes**.
3. Click **Add Custom Domain** and enter the desired hostname (e.g. `api.farmdirect.example.com` or `farmdirect.example.com`).
4. Cloudflare automatically creates the necessary DNS records. Wait for the certificate to provision (usually a few minutes).
5. (Optional) Enable Cloudflare Access on the custom domain if using the P4 auth flow.
6. Update the frontend API base in `js/config.js` (or the inline config in `index.html`):
   ```js
   window.FD_CONFIG = { API_BASE: 'https://api.farmdirect.example.com' };
   ```
7. Verify: `curl https://api.farmdirect.example.com/api/v1/health`

Alternatively, after the domain is on Cloudflare you can use the CLI (confirm current syntax with `npx wrangler deploy --help`):

```bash
npx wrangler deploy --domain api.farmdirect.example.com
```

Until a custom domain is configured, the `workers.dev` URL remains fully functional for testing and staging.

## P5 – CI (GitHub Actions deploy skeleton)

A continuous-deployment workflow can automatically run `wrangler deploy` on every push to `main` once the required secrets are set. The live Worker is still undeployed; this documents the exact steps and provides a ready-to-use workflow file.

### Exact steps

1. Create a Cloudflare API token with **Workers Scripts:Edit** and **D1:Edit** permissions (Account → My Profile → API Tokens → Create Token → custom template).
2. Find your Account ID (Cloudflare dashboard → Workers & Pages → right sidebar, or `npx wrangler whoami`).
3. In the GitHub repository: **Settings → Secrets and variables → Actions** add:
   - `CLOUDFLARE_API_TOKEN` = the token from step 1
   - `CLOUDFLARE_ACCOUNT_ID` = the account id from step 2
4. Create `.github/workflows/deploy.yml` with the content below (or copy the skeleton that will be committed in the same change).
5. Push the workflow. Subsequent pushes to `main` will deploy the Worker.

```yaml
name: Deploy Worker

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Workers
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

After the first successful deploy you can also add a step to apply the D1 schema if desired (`npx wrangler d1 execute … --remote`), but do so carefully so migrations remain idempotent. The existing `wire-scripts.yml` is unrelated to this fresh-start path and should be left alone.

Until the secrets and workflow are active, manual `npx wrangler deploy` (see P1) remains the way to go live.

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
