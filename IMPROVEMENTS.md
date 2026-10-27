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
