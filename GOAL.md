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

Seed fallback when API offline. Interactive demo mode (localStorage) when Worker undeployed.

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
- [x] Interactive demo mode: localStorage persistence for create/edit/delete while Worker undeployed (2026-10-18)
- [x] Richer seed data for better demo map experience (more markers, geographic spread, category variety) (2026-10-18)
- [x] Locate me geolocation control (top-bar button, centers map + temporary user marker; works fully in seed/demo mode) (2026-10-18)
- [x] Fit all listings control (top-bar button resets map view to current markers; useful after locate-me or filtering) (2026-10-18)
- [x] Distance sort after Locate me (sidebar reorders by proximity + km labels on cards; fully works in seed/demo mode) (2026-10-18)
- [x] Sort control in filter card (Default / Distance / Price low-high / Price high-low / Name A–Z; distance requires Locate me; fully client-side for demo) (2026-10-18)
- [x] In-app deploy commands modal (seed-banner + options menu; exact P1 steps + copy button; improves undeployed UX) (2026-10-18)
- [x] Distance radius filter after Locate me (max-km input in filter card + translucent circle on map; fully client-side for demo) (2026-10-18)
- [x] Category legend on map (bottom-left control explaining colored markers by category; fully client-side for demo) (2026-10-18)
- [x] Deep-linkable listings via URL hash (#listing=<id> opens card + flies to marker; copy-link button; works in seed/demo) (2026-10-19)
- [x] Richer seller profile card (lists other listings by the same sellerid from current data; clickable to open product; fully client-side for demo) (2026-10-19)
- [x] Units filter in filter card (select for kg/liter/dozen/ton matching seed data; fully client-side for demo) (2026-10-19)
- [x] Min price filter in filter card (complements max price; fully client-side for demo) (2026-10-19)
- [x] Image lightbox in product card (click photo to enlarge; Escape/click-outside close; fully client-side for demo) (2026-10-19)
- [x] Clear-search button in top bar (appears when query present; one-click reset of search; fully client-side for demo) (2026-10-19)
- [x] Directions button in product card (opens Google Maps directions to listing lat/long; fully client-side for demo) (2026-10-19)
- [x] Copy address button in product card (copies listing address to clipboard; fully client-side for demo) (2026-10-19)
- [x] Fix HTML escaping in list panel (correct & < > \" escaping so special characters in seed descriptions render safely; fully client-side for demo) (2026-10-19)
- [x] Distance in product card after Locate me (shows km/m away in detail card; fully client-side for demo) (2026-10-19)
- [x] Coordinates display + copy button in product card (shows lat/long; copies to clipboard; fully client-side for demo) (2026-10-19)
- [x] Share button in product card (Web Share API when available, falls back to copy link; fully client-side for demo) (2026-10-19)
- [x] Favorites (heart toggle in product card + list items; localStorage persistence; Favorites only filter; fully client-side for demo) (2026-10-19)
- [x] Toast notifications (non-blocking feedback for copy/share/warnings instead of alert(); fully client-side for demo) (2026-10-19)
- [x] Distance filter precondition toasts (replace remaining alert() for Locate me required on sort/radius; fully client-side for demo) (2026-10-19)
- [x] Demo data export/import (options menu; download/upload JSON of localStorage demo listings; fully client-side for better seed/demo UX) (2026-10-19)
- [x] Copy listing JSON button in product card (pretty-printed JSON to clipboard for individual demo sharing/export; fully client-side for seed/demo) (2026-10-19)
- [x] Category and units selects in listing form (dropdowns matching filter/seed values instead of free text; prevents mismatches; fully client-side for demo) (2026-10-19)
- [x] Copy product summary button in product card (human-readable text to clipboard for easy sharing; fully client-side for demo) (2026-10-19)
- [x] Clear favorites option in options menu (one-click clear of localStorage favorites with confirmation + toast; fully client-side for demo) (2026-10-19)
- [x] Persist filter/search state in localStorage (category, visibility, price, sort, radius, units, favorites-only, search query survive reloads; fully client-side for demo) (2026-10-20)
- [x] Export filtered view as JSON (options menu downloads current filtered listings; complements full demo export; fully client-side for demo) (2026-10-20)
- [x] Shareable filter links via URL query params (options menu copies current view link; restores filters/search on load; fully client-side for demo) (2026-10-20)
- [x] Seller filter in filter card (select of unique sellerids from current data; fully client-side for demo) (2026-10-20)
- [x] Only-in-current-map-view filter (checkbox in filter card; list + markers update on pan/zoom; skips auto-fit to avoid loop; fully client-side for demo) (2026-10-20)
- [x] Active filter chips (sidebar shows current filters as removable chips; click × clears one filter; fully client-side for demo) (2026-10-20)
- [x] Keyboard navigation for listing list (arrow keys move focus between cards, Enter opens product card; improves a11y in seed/demo mode) (2026-10-20)
- [x] List-map hover highlight sync (hovering a sidebar card scales/highlights its map marker and vice versa; improves map-first exploration in seed/demo mode) (2026-10-20)
- [x] Restore complete list.js after stub corruption (full filters/chips/keyboard/hover/favorites/export/map-view/distance; seed/demo ready) (2026-10-20)
- [x] Empty-state clear filters button (sidebar empty view has one-click Clear filters when no matches; fully client-side for demo) (2026-10-20)
- [x] Fix HTML escaping in map popups & legend + richer marker popups (correct & < > \" entities; show price/seller/address/visibility/hint; fully client-side for demo) (2026-10-20)
- [x] Locate me polish: toasts instead of alerts, accuracy circle, clear-location top-bar button (hides when no location; fully client-side for demo) (2026-10-20)
- [x] RFQ / Request for Quote modal in product card (simple form: name, email, quantity, message; demo stores in localStorage + toast; fully client-side for seed/demo) (2026-10-20)
- [x] Restore frontend shell (index.html + js/main.js + js/rfq.js) so the map-first seed/demo experience loads end-to-end (2026-10-20)
- [x] RFQ inbox in seller dashboard (shows incoming quote requests for the seller's listings from localStorage; clear button; fully client-side for seed/demo) (2026-10-20)
- [x] Fix HTML escaping in seller dashboard (correct & < > \" entities in listings + RFQ inbox; fully client-side for demo) (2026-10-20)
- [x] RFQ count badge on profile icon (red badge shows pending quote count for current seller session; updates on submit/clear/login/logout/data load; fully client-side for seed/demo) (2026-10-20)
- [x] My quote requests buyer view (options menu modal lists locally stored RFQs with listing titles; clear button; fully client-side for seed/demo) (2026-10-20)
- [x] Clickable RFQs in buyer My quote requests (View listing button opens product card + flies to marker; fully client-side for seed/demo) (2026-10-20)
- [x] Clickable RFQs in seller dashboard inbox (View listing button opens product card + flies to marker; fully client-side for seed/demo) (2026-10-20)

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

*Last updated: 2026-10-20 – P2+: Clickable RFQs in seller dashboard inbox (open product card). P1 deploy still requires user (`npx wrangler login` + README commands).*
