# FarmDirect B2B – Fresh Start Goal

Map-first B2B marketplace. Leaflet + Cloudflare Worker + D1 `b2bistening`.

## Priority queue (highest unfinished first)

### P1 – Deploy notes (user action)
- [x] Document exact wrangler commands in README.md
- [x] User applied auth-migration.sql on D1 b2bistening (reported 2026-10-28)
- [ ] Optional: RFQ migration + GitHub Actions secrets for auto-deploy

**Note:** Auth migration applied. Optional RFQ migration + GH Actions secrets still user-owned. Client API now supports authenticated create/publish/mine after migration.

### P2 – Frontend shell (DONE)
- [x] Complete `index.html` (transparent top bar, map, sidebar list, filter card, options menu, product/seller cards, modals)
- [x] Complete `css/main.css` (layout, cards, clusters, responsive)
- [x] Complete `js/main.js` (bootstrap map, list, search, dashboard, auth, seed/API load, options)

### P3 – Auth & publication polish
- [x] Client API: create/update/delete/publish/unpublish/archive + fetchMyListings with Bearer token
- [ ] Live E2E verification (register → create draft → publish → appears on map)
- [x] UI feedback for publish workflow (draft note + toast + next-step guidance)

### P4 – Seed fallback UX
- [x] Automatic seed/demo fallback already in `js/api.js`
- [x] Clearer offline banner (dismissible, shows for seed/demo)
- [x] Persistent data-source badge in top bar (SEED/DEMO)
- [x] Seller filter dropdown + chips use human-readable names from seed-sellers.json

### P5 – Optional GitHub Actions
- [x] `.github/workflows/deploy.yml` present
- [ ] User adds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets

### P6 – Phone view declutter + CSS polish (DONE)
- [x] Make phone / narrow viewport less cluttered (top bar, sidebar list, filter card, map controls, product/seller cards)
- [x] Improve and organize `css/main.css` (responsive breakpoints, spacing, touch targets, reduce overlapping UI on small screens)
- [x] Prefer progressive disclosure on mobile: collapse secondary controls, larger list rows, readable type, safe-area padding

**Note for builders:** P6 mobile CSS polish shipped. Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). Next code runs can continue seed/demo UX polish or other code-only items without inventing unrelated features.

## Schema (canonical)
`location{lat,long}`, `visibility(worldwide|country|province)`, `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`

Live Worker: https://farmdirect-b2b.fehrjohan65.workers.dev
