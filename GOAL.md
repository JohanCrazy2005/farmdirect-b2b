# FarmDirect B2B – Fresh Start Goal

Map-first B2B marketplace. Leaflet + Cloudflare Worker + D1 `b2bistening`.

## Priority queue (highest unfinished first)

### P1 – Deploy notes (user action)
- [x] Document exact wrangler commands in README.md
- [x] User applied auth-migration.sql on D1 b2bistening (reported 2026-10-28)
- [ ] Optional: RFQ migration + GitHub Actions secrets for auto-deploy (commands already documented in README.md and the in-app Deploy modal; user action)

**Note:** Auth migration applied. Optional RFQ migration + GH Actions secrets are fully documented; still user-owned. Client API supports authenticated create/publish/mine after migration. Seed/demo fallback UX continues to be polished for offline/empty Worker cases.

### P2 – Frontend shell (DONE)
- [x] Complete `index.html` (transparent top bar, map, sidebar list, filter card, options menu, product/seller cards, modals)
- [x] Complete `css/main.css` (layout, cards, clusters, responsive)
- [x] Complete `js/main.js` (bootstrap map, list, search, dashboard, auth, seed/API load, options)
- [x] Complete `js/map.js` and `js/list.js` (markers, filtering, selection, favorites) so the shell actually runs with seed data

### P3 – Auth & publication polish
- [x] Client API: create/update/delete/publish/unpublish/archive + fetchMyListings with Bearer token
- [ ] Live E2E verification (register → create draft → publish → appears on map)
- [x] UI feedback for publish workflow (draft note + toast + next-step guidance)

### P4 – Seed fallback UX
- [x] Automatic seed/demo fallback already in `js/api.js`
- [x] Clearer offline banner (dismissible, shows for seed/demo)
- [x] Persistent data-source badge in top bar (SEED/DEMO)
- [x] Seller filter dropdown + chips use human-readable names from seed-sellers.json
- [x] Banner Details button opens data-source modal with next-step guidance

### P5 – Optional GitHub Actions
- [x] `.github/workflows/deploy.yml` present
- [ ] User adds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets (instructions in README)

### P6 – Phone view declutter + CSS polish (DONE)
- [x] Make phone / narrow viewport less cluttered (top bar, sidebar list, filter card, map controls, product/seller cards)
- [x] Improve and organize `css/main.css` (responsive breakpoints, spacing, touch targets, reduce overlapping UI on small screens)
- [x] Prefer progressive disclosure on mobile: collapse secondary controls, larger list rows, readable type, safe-area padding

**Note for builders:** P1 optional items and P5 secrets are user-owned (commands documented). Highest unfinished code-only items are further seed/demo UX polish or live E2E support once user applies remaining migrations. Do not invent unrelated features.

## Schema (canonical)
`location{lat,long}`, `visibility(worldwide|country|province)`, `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`

Live Worker: https://farmdirect-b2b.fehrjohan65.workers.dev
