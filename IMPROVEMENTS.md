## 2026-10-29 (America/Denver) – Seed/demo UX: color-coded badge with count + last-loaded time

**What:** Data-source badge now applies the existing `.source-seed` / `.source-demo` / `.source-api` / `.source-api-empty` CSS classes for color coding, shows listing count (e.g. "SEED · 12"), and sets a richer title with relative load time. Data-source modal adds "Last loaded: Xs ago (time)" so users can see freshness without inventing new features.

**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). This code-only polish makes the seed/demo fallback status clearer and more actionable in the map-first UI.

**How:** Updated `js/main.js` (`updateDataSourceBadge`, `openDataSourceModal`, `relativeTime` helper, `lastLoadedAt`). CSS classes already existed. Fully client-side. Appended this entry.

**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification. Further seed/demo UX polish available.

---

## 2026-10-29 (America/Denver) – Seed/demo UX: loading state + Retry on offline banner

**What:** Added a visible LOADING… state on the data-source badge during `fetchListings` and a Retry button on the offline/seed banner that triggers a reload. CSS styles the loading badge (neutral, cursor wait).

**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). This code-only polish improves feedback when the Worker is unreachable or empty so the map-first UI stays usable with seed/demo fallback.

**How:** Updated `index.html` (Retry button), `js/main.js` (setBadgeLoading + banner-retry handler), and `css/main.css` (loading class). Fully client-side. Appended this entry.

**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification. Further seed/demo UX polish available.

---

## 2026-10-28 (America/Denver) – Fix HTML escaping in map popups

**What:** Fixed the `escapeHtml` helper in `js/map.js` so that `& < > \"` are properly converted to HTML entities. Previously the replacements were identity (no-op), so any listing title, address, seller name, or category containing special characters could break map popup HTML or inject markup.

**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). This completes the HTML-escaping correctness pass started for list.js/cards.js, improving seed/demo robustness for map popups.

**How:** Updated the four `.replace` calls in `js/map.js` and added a brief comment. Fully client-side; works with seed/demo fallback. Single commit via push_files. Appended this entry.

**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification. Further seed/demo UX polish available.

---

## 2026-10-28 (America/Denver) – Complete main.js bootstrap + expose map.getMap

**What:** Replaced the stub `js/main.js` with a full bootstrap that initializes the Leaflet map, loads listings via `FD_API.fetchListings` (seed/demo fallback), binds every module (`FD_LIST`, auth, dashboard, form, RFQ, search, sellers, compare, recent, shortcuts, stats, layers, CSV, GeoJSON, fullscreen), wires top-bar / options / filter / profile / data-source modal / offline banner / theme / URL map-view deep links, and updates the data-source badge. Also added `getMap()` to `js/map.js` so layer switcher and fullscreen can access the map instance.

**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). P2 frontend shell was marked done but `main.js` was a non-functional placeholder. This code-only change makes the map-first UI fully operational in seed/demo mode.

**How:** New substantial `js/main.js` + one-line export addition in `js/map.js`. Single commit via push_files. Appended this entry.

**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification.

---

## 2026-10-28 (America/Denver) – Correct HTML escaping in list and cards

**What:** Fixed the `escapeHtml` helpers in `js/list.js` and `js/cards.js` so that `& < > \"` are properly converted to HTML entities. Previously the replacements were identity (no-op), so any listing title, description, address, or seller name containing special characters could break sidebar list HTML, product/seller cards, or inject markup.

**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). This code-only correctness fix improves seed/demo robustness for the core list and card UI.

**How:** Updated the four `.replace` calls in both modules. Fully client-side; works with seed/demo fallback. Single commit.

**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification.

---

## 2026-10-27 (America/Denver)
- Implemented full `js/list.js` module (was placeholder). Sidebar list now renders listings, applies all filter-card controls + top search, supports sort, favorites (localStorage), radius/in-view, chips, selection (opens product card + map fly), keyboard nav, filtered JSON export, and deep-link hash. Uses seller display names. Client-side only; works with seed/demo fallback. main.js / cards.js / search.js integration complete.

## 2026-10-28 (America/Denver)
- Fixed incomplete filter integration between map and list modules. Added `isInView` and `getUserLocation` to `js/map.js` so the "only in view" checkbox and radius filter work after Locate. Added `setSellerFilter` to `js/list.js` (and fixed seller dropdown value restore) so map popup seller badges correctly apply the seller filter. All client-side; improves seed/demo UX without requiring live Worker.
- Added data-source details modal. Clicking the persistent data-source badge (SEED/DEMO/API+SEED/LIVE) now opens a modal with current source explanation, health status, listing count, and quick actions (reload, export/reset demo, deploy/migration steps). Improves seed/demo fallback UX while P1 user actions (wrangler login + auth-migration.sql) remain pending. Fully client-side.
- Client API mutations for post-migration E2E; RFQ API methods; P6 phone declutter + CSS polish; accurate data-source modal guidance (auth migration applied).
- See full history in prior commits for filter chips, compare, distance, fly-to, and seed UX polish.
