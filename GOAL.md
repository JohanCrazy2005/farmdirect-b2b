# FarmDirect B2B – Fresh Start Goal

Map-first B2B marketplace. Leaflet + Cloudflare Worker + D1 `b2bistening`.

## Priority queue (highest unfinished first)

### P1 – Deploy notes (user action)
- [x] Document exact wrangler commands in README.md
- [ ] User runs: `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors)
- [ ] Optional: RFQ migration + GitHub Actions secrets for auto-deploy

**Note:** Docs and deploy modal are complete. These remaining items require user action (wrangler login / Cloudflare secrets). Seed/demo fallback is fully functional in the meantime. Seller filter now uses display names from seed-sellers.json for better UX.

### P2 – Frontend shell (DONE)
- [x] Complete `index.html` (transparent top bar, map, sidebar list, filter card, options menu, product/seller cards, modals)
- [x] Complete `css/main.css` (layout, cards, clusters, responsive)
- [x] Complete `js/main.js` (bootstrap map, list, search, dashboard, auth, seed/API load, options)

### P3 – Auth & publication polish
- [ ] End-to-end after user applies auth-migration.sql
- [x] UI feedback for publish workflow (draft note + toast + next-step guidance)

### P4 – Seed fallback UX
- [x] Automatic seed/demo fallback already in `js/api.js`
- [x] Clearer offline banner (dismissible, shows for seed/demo)
- [x] Persistent data-source badge in top bar (SEED/DEMO)
- [x] Seller filter dropdown + chips use human-readable names from seed-sellers.json

### P5 – Optional GitHub Actions
- [x] `.github/workflows/deploy.yml` present
- [ ] User adds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets

## Schema (canonical)
`location{lat,long}`, `visibility(worldwide|country|province)`, `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`

Live Worker: https://farmdirect-b2b.fehrjohan65.workers.dev
