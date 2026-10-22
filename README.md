# FarmDirect B2B – Map-first B2B Marketplace (Fresh Start)

Interactive map-first marketplace for agricultural products. Leaflet map + Cloudflare Worker + D1.

## Canonical data shape

`location{lat,long}`, `visibility` (worldwide|country|province), `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`.

See `schema/listings.schema.json` and `schema/d1-schema.sql`.

## Architecture

Browser (Leaflet) → Worker (`workers/api.js`, binding `DB`) → D1 `b2bistening`.

Seed fallback: `data/seed-listings.json` when API is offline.

**Live Worker:** https://farmdirect-b2b.fehrjohan65.workers.dev  
**Frontend:** https://farmdirect-b2b-yjzt.vercel.app

## P3 – Authentication & listing publication (user action required)

Frontend auth modal + dashboard publish controls are ready. The Worker script in this repo already includes register/login/session + draft/published/archived workflow.

You must apply the migration so live sessions work (Worker is already redeployed with auth routes).

### Exact commands

```bash
# 1. Login (once)
npx wrangler login

# 2. Apply auth + publication migration to live D1
#    (Ignore "duplicate column name" errors if columns already exist – that is expected on re-run.)
npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql

# 3. (Optional) Apply RFQ persistence migration
# npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql

# 4. Redeploy the Worker only if you have local changes (same name farmdirect-b2b; no new Worker needed)
# npx wrangler deploy

# 5. Smoke test
curl https://farmdirect-b2b.fehrjohan65.workers.dev/api/v1/health
# Then register / login from the frontend Profile menu
```

Alternatively, paste `schema/auth-migration.sql` into the Cloudflare D1 Console for `b2bistening`.

After this:

- `POST /api/v1/auth/register` and `/login` return a Bearer token
- Public `GET /api/v1/listings` returns only `published`
- `GET /api/v1/listings/mine` + publish/unpublish/archive require the token
- Frontend already sends `Authorization: Bearer …` when logged in
- (After RFQ migration) `POST /api/v1/rfqs` stores quote requests in D1; sellers can `GET /api/v1/rfqs/mine`

Interim `X-Seller-Id` remains as a fallback until you prefer pure sessions.

## P1 – Original deploy notes (already live)

The database already exists:

- name: `b2bistening`
- id: `ad22b284-cafd-4f74-a8bc-6205056d38f8`
- binding: `DB`

Base schema (`schema/d1-schema.sql`) was applied earlier. Use the P3 migration above for auth/publication columns.

## Local development

```bash
npx wrangler dev
# Frontend can point API_BASE at http://localhost:8787
```

## Optional: GitHub Actions auto-deploy (P5)

The repo includes `.github/workflows/deploy.yml` which deploys the Worker on push to `main` (or manual dispatch) using the Cloudflare Wrangler action.

To enable it, add these repository secrets (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` – Cloudflare API token with Workers edit / deploy permissions
- `CLOUDFLARE_ACCOUNT_ID` – your Cloudflare account ID

No other changes required. The workflow uses the existing `wrangler.toml` (D1 binding already set).

## Project layout

```
schema/          # JSON Schema + D1 SQL (incl. auth-migration.sql, rfq-migration.sql)
data/            # seed-listings.json
workers/         # api.js (auth + publication + RFQ ready)
css/             # main.css
js/              # map, cards, filters, form, dashboard, auth, api, rfq modules
index.html       # Leaflet shell
wrangler.toml
```

## Improvement log

See `IMPROVEMENTS.md`.
