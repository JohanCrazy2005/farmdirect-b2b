# FarmDirect B2B – Fresh Start Goal Document

**Status:** Active rebuild (started 2026-10-17)  
**Repo:** JohanCrazy2005/farmdirect-b2b  
**Database:** Cloudflare D1  
- binding: `DB`  
- database_name: `b2bistening`  
- database_id: `ad22b284-cafd-4f74-a8bc-6205056d38f8`

---

## Vision

A map-first B2B marketplace for agricultural products and services. Buyers discover listings on a Leaflet map; sellers publish products that conform to a strict JSON Schema. Data lives in Cloudflare D1 and is exposed through a Worker API.

## Canonical Data Shape

location (lat,long), visibility (worldwide|country|province), address, sellerid, category, headerdescription, price, units, description, image.

Full schema: schema/listings.schema.json
SQL: schema/d1-schema.sql
Seed: data/seed-listings.json

## UI Requirements

1. Leaflet map primary view
2. Transparent top search + profile icon + options menu + filter icon
3. Filter card for schema fields
4. Product detail card + seller profile card
5. Side list panel synced with map

## Architecture

Browser → Worker (workers/api.js, binding DB) → D1 b2bistening

Seed fallback when API offline.

## Priority Queue (one shippable change per hourly run)

### P0 Foundation (done)
- [x] JSON Schema, D1 schema+seed, wrangler.toml, Worker API, Leaflet shell, top bar, filter panel, cards, seed fallback

### P1 Deploy & connect D1 (user action required – commands documented)
- [ ] wrangler deploy
- [ ] Run d1-schema.sql on live DB
- [ ] Set FD_CONFIG.API_BASE
- [ ] Verify /api/v1/health

**Exact commands are in README.md.** Run them after `npx wrangler login`.

### P2 Polish UI
- [x] Marker clustering (library already loaded; fuller custom icons, spiderfy, disable-at-zoom, category markers)
- [x] Empty/loading states (skeletons, map overlay, clearer empty UX)
- [x] Mobile, a11y, theme (bottom-sheet sidebar, ARIA, system preference, options menu)
- [x] Seed-fallback UX banner (dismissible demo-mode notice pointing to README deploy steps) (2026-10-18)
- [x] Runtime API_BASE override via localStorage (options menu set/clear for post-deploy testing without source edit) (2026-10-18)

### P3 Seller experience
- [x] Add listing form, edit/delete, image upload
  - [x] Add listing form modal + client validation + POST support (2026-10-17)
  - [x] Edit / delete existing listings (2026-10-17)
  - [x] Image upload (client-side file → resized data URL + preview; URL fallback) (2026-10-17)

### P4 Auth
- [x] Cloudflare Access / JWT, RLS, seller dashboard (docs + interim implementation complete; user dashboard action remains after deploy)
  - [x] Seller dashboard skeleton (client-side localStorage seller session + my-listings view with edit/delete) (2026-10-17)
  - [x] Interim RLS simulation: Worker enforces X-Seller-Id ownership on mutations; client attaches current session seller (2026-10-17)
  - [x] Cloudflare Access / JWT setup steps documented in README.md (user action after deploy) (2026-10-17)

### P5 Production
- [x] Rate limit, observability, custom domain, CI (code + docs complete; user secrets/action remain after deploy)
  - [x] Basic in-memory rate limiting on Worker API (per-IP, 60 req / 60s, 429 + Retry-After) (2026-10-18)
  - [x] Basic structured request logging for observability (JSON console logs: method, path, status, duration, ip, seller) (2026-10-18)
  - [x] Custom domain setup steps documented in README.md (user action after deploy) (2026-10-18)
  - [x] CI skeleton notes documented in README.md (GitHub Actions deploy workflow + required secrets) (2026-10-18)
- [x] R2 (or similar) for durable image storage (data URLs are interim only)
  - [x] Setup steps documented in README.md (create bucket, bind IMAGES, Worker upload endpoint, client switch from data URLs) (2026-10-18)

## Hard Constraints

1. Substantial files when practical
2. Schema is law
3. One deliverable per automation run
4. Leaflet + vanilla JS + Cloudflare D1/Workers
5. Old runners A/B paused

## Success Criteria (MVP)

Map markers, search, filters, product card, seller profile, live D1 after deploy, organised folders.

*Last updated: 2026-10-18 – removed remaining legacy script tags from index.html (cleanup.js + listings-api.js no longer loaded). All P2–P5 items remain complete; P1 deploy still requires user.*
