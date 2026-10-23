# FarmDirect B2B – Fresh Start Goal

Map-first B2B marketplace. Leaflet + Cloudflare Worker + D1 `b2bistening`.

## Priority queue (highest unfinished first)

### P1 – Deploy notes (user action)
- [x] Document exact wrangler commands in README.md
- [ ] User runs: `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors)
- [ ] Optional: RFQ migration + GitHub Actions secrets for auto-deploy

### P2 – Frontend shell (DONE this run)
- [x] Complete `index.html` (transparent top bar, map, sidebar list, filter card, options menu, product/seller cards, modals)
- [x] Complete `css/main.css` (layout, cards, clusters, responsive)
- [x] Complete `js/main.js` (bootstrap map, list, search, dashboard, auth, seed/API load, options)

### P3 – Auth & publication polish
- [ ] End-to-end after user applies auth-migration.sql
- [ ] Any remaining UI feedback for publish workflow

### P4 – Seed fallback UX
- [x] Automatic seed/demo fallback already in `js/api.js`
- [ ] Optional: clearer offline banner if desired

### P5 – Optional GitHub Actions
- [x] `.github/workflows/deploy.yml` present
- [ ] User adds `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets

## Schema (canonical)
`location{lat,long}`, `visibility(worldwide|country|province)`, `address`, `sellerid`, `category`, `headerdescription`, `price`, `units`, `description`, `image`

Live Worker: https://farmdirect-b2b.fehrjohan65.workers.dev
