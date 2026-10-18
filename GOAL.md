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

### P3 Seller experience
- [x] Add listing form, edit/delete, image upload
  - [x] Add listing form modal + client validation + POST support (2026-10-17)
  - [x] Edit / delete existing listings (2026-10-17)
  - [x] Image upload (client-side file → resized data URL + preview; URL fallback) (2026-10-17)

### P4 Auth
- [ ] Cloudflare Access / JWT, RLS, seller dashboard

### P5 Production
- [ ] Rate limit, observability, custom domain, CI
- [ ] R2 (or similar) for durable image storage (data URLs are interim only)

## Hard Constraints

1. Substantial files when practical
2. Schema is law
3. One deliverable per automation run
4. Leaflet + vanilla JS + Cloudflare D1/Workers
5. Old runners A/B paused

## Success Criteria (MVP)

Map markers, search, filters, product card, seller profile, live D1 after deploy, organised folders.

*Last updated: 2026-10-17 – P3 image upload (client-side) shipped.*
