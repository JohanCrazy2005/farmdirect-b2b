## 2026-10-26 – Seller filter uses display names (seed UX)

**What:** The seller dropdown in the filter card and the corresponding filter chips now show human-readable names from `data/seed-sellers.json` (via `FD_SELLERS.getDisplayName`) instead of raw sellerids. Values remain the ids so filtering is unchanged.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). This code-only polish improves seed/demo UX: users see “Greenfield Organics” rather than “seller-greenfield” while exploring the map and filters.

**How:** Updated `js/list.js` (`populateSelects` + `renderChips`). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-26 – Seed fallback when Worker is live but empty

**What:** When the live Worker health check succeeds but `/api/v1/listings` returns no published rows, `fetchListings` now loads and returns the seed listings while setting source to `'api-empty'`. The map and sidebar stay populated. The top-bar badge reads `API+SEED` and the offline banner explains that seed is shown and points to the auth migration. Added CSS classes `.source-api` and `.source-api-empty` (including dark mode) so the badge is visually distinct.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Previously an empty live response left the map blank, which hurt seed/demo UX while waiting for the migration. This keeps the map-first experience fully usable and still clearly signals the data source.

**How:** Updated `js/api.js` (api-empty path loads seed), `js/main.js` (badge/banner/toast wording), and `css/main.css` (badge styles). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-26 – Health-aware seed/demo data-source status

**What:** Added `checkHealth()` in `js/api.js` that probes `/api/v1/health`. `fetchListings` now returns a `health` object and a new source `'api-empty'` when the Worker is reachable but returns no published listings. The top-bar badge and offline banner in `js/main.js` distinguish “API live + empty”, “API up but falling back to seed”, and “fully offline seed” so users see exactly why they are seeing demo data.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The live Worker already responds to health, but listings may be empty until the migration is applied. Precise status makes the seed fallback UX clearer without inventing new features.

**How:** Extended `js/api.js` (checkHealth + richer fetchListings return) and `js/main.js` (updateDataSourceBadge + showOfflineBanner accept health). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-26 – Restore full map.js + main.css (seed/demo UX)

**What:** Replaced placeholder `js/map.js` and `css/main.css` with a complete Leaflet module and stylesheet.
Map now has clusters, category-colored pins with favorite star overlays, user location + radius circle, scale, legend, shareable view links, hover sync with the list, and flyTo.
CSS provides the transparent top bar, floating sidebar, filter/options cards, product/seller cards, modals, dark mode, and mobile sidebar toggle so the seed/demo frontend is fully usable without a live Worker.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). Frontend shell files were stubs, so seed fallback could not render the map or layout.
This code-only change completes the map-first experience for the interim seed/demo mode.

**How:** Substantial `js/map.js` (initMap, updateMarkers, locateMe, radius, getMapViewLink, category colors, favorite stars) + complete `css/main.css` (layout, cards, clusters, responsive, dark theme). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end.

---
