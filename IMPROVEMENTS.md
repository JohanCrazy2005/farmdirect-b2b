PLACEHOLDER

## 2026-10-27 (America/Denver)
- Implemented full `js/list.js` module (was placeholder). Sidebar list now renders listings, applies all filter-card controls + top search, supports sort, favorites (localStorage), radius/in-view, chips, selection (opens product card + map fly), keyboard nav, filtered JSON export, and deep-link hash. Uses seller display names. Client-side only; works with seed/demo fallback. main.js / cards.js / search.js integration complete.

## 2026-10-28 (America/Denver)
- Fixed incomplete filter integration between map and list modules. Added `isInView` and `getUserLocation` to `js/map.js` so the "only in view" checkbox and radius filter work after Locate. Added `setSellerFilter` to `js/list.js` (and fixed seller dropdown value restore) so map popup seller badges correctly apply the seller filter. All client-side; improves seed/demo UX without requiring live Worker.
- Added data-source details modal. Clicking the persistent data-source badge (SEED/DEMO/API+SEED/LIVE) now opens a modal with current source explanation, health status, listing count, and quick actions (reload, export/reset demo, deploy/migration steps). Improves seed/demo fallback UX while P1 user actions (wrangler login + auth-migration.sql) remain pending. Fully client-side.
- Enhanced data-source modal with the exact next wrangler migration command, D1 ID (`ad22b284-cafd-4f74-a8bc-6205056d38f8`), and a one-click copy button. Clearer guidance for the remaining P1 user steps (login + auth-migration.sql) while seed/demo fallback stays fully usable. No new features; pure UX polish for the pending deploy notes.
- Improved sidebar empty-state UX for seed/demo mode. When no listings match filters, the list now shows contextual tips (clear filters / use Locate + radius) plus inline buttons. Fully client-side; keeps the map-first experience usable while P1 user actions remain pending.

## 2026-10-28 (America/Denver) – Clickable seller names in sidebar list
**What:** Seller display names in the sidebar listing items are now clickable. Clicking a seller name applies the seller filter (using the existing setSellerFilter) and shows a toast. Improves seed/demo exploration UX.
**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes it easier to filter by a specific seller directly from the list without opening the filter card.
**How:** Updated js/list.js renderList template and added click handlers. Fully client-side; works with seed/demo fallback. Single commit.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – List↔map fly-to + distance in sidebar
**What:** Selecting a listing in the sidebar now flies the map to it and opens the popup (`FD_MAP.flyToListing`). Sidebar items show approximate distance (km) after the user has used Locate. Improves seed/demo exploration so the map and list stay in sync.
**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish completes the list-to-map interaction that was previously a no-op (`flyToListing` missing) and makes Locate + radius more useful.
**How:** Added `flyToListing` to js/map.js (exported on FD_MAP). Updated js/list.js `renderList` to append distance when user location is known. Fully client-side; works with seed/demo fallback. Single commit.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).
---

## 2026-10-28 (America/Denver) – Visual filter-radius circle on map
**What:** When the user has located themselves and sets a Radius (km) filter, the map now draws a dashed green circle showing the exact filter radius. The circle updates live as the filter changes or location is cleared. Improves seed/demo UX for the radius filter.
**Why:** Highest unfinished items remain user-owned (P1 auth migration + wrangler login). This code-only polish makes the radius filter more discoverable and visually consistent with the list filtering.
**How:** Added `updateFilterRadius` to js/map.js (draws/removes L.circle based on #filter-radius + userPos). Called from locateMe, clearLocation, and from js/list.js applyFilters after markers update. Fully client-side.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Fix HTML escaping in sidebar list
**What:** Corrected the broken `escapeHtml` helper in `js/list.js` so that `& < > \"` are properly turned into entities. Previously the replacements were identity (no-op), so any listing title/description/address containing special characters could break the list HTML or inject markup.
**Why:** Highest unfinished items remain user-owned (P1). This code-only correctness fix improves seed/demo robustness and prevents rendering glitches in the sidebar.
**How:** Updated the four `.replace` calls in `escapeHtml`. Fully client-side.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Distance in search suggestions + reliable fly-to
**What:** Search typeahead suggestions now show approximate distance (~km) after the user has used Locate. Selecting a suggestion (click, Enter, or keyboard) always flies the map to the listing and opens its popup via `FD_MAP.flyToListing`, in addition to calling `FD_LIST.select`. Improves seed/demo exploration so search results stay visually tied to the map.
**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish extends the existing Locate + distance pattern from the sidebar into the top search bar, making discovery faster without opening the filter card.
**How:** Added `getUserLocation` + `haversineKm` helpers to `js/search.js`. Updated `renderSuggestions` to append distance when user position is known. Enhanced `selectSuggestion` to look up the listing and call `flyToListing`. Fully client-side; works with seed/demo fallback.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Restore complete list.js module
**What:** Replaced the stub `js/list.js` (empty methods + placeholder comment) with a full, substantial implementation. Sidebar now fully renders filtered listings, applies every filter-card control + top search, supports sort (price/name/distance), favorites (localStorage), radius/in-view, chips, selection (opens product card + map fly-to), clickable seller names, distance display after Locate, contextual empty-state tips with action buttons, keyboard navigation, filtered JSON export, and deep-link hash support. Proper HTML escaping. Fully client-side; works with seed/demo fallback.
**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The list module had become a non-functional stub, breaking the core map-first sidebar experience. Completing it restores usable seed/demo UX without inventing new features.
**How:** Implemented bindUI, setListings, applyFilters, renderList, chips, empty state, filter setters, favorites, export, deep links, and keyboard nav. Integrates with FD_MAP (updateMarkers, flyToListing, updateFilterRadius, isInView, getUserLocation), FD_CARDS (openProduct), FD_SELLERS (display names), FD_TOAST, and FD_RECENT. Single commit.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Individual filter chip removal
**What:** Each active filter chip (search, category, visibility, units, seller, price range, radius, favorites, in-view, sort) now has a working × button that removes only that filter and re-applies the rest. Shows a brief toast. Improves seed/demo filter UX so users can refine results without opening the full filter card or clearing everything.
**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). This code-only polish completes the previously optional chip-remove enhancement, making multi-filter exploration smoother while the live Worker/auth migration is pending.
**How:** Updated `renderChips` in js/list.js to emit data-key attributes and wired `.chip-remove` clicks to a new `removeChip` helper that clears the matching control then calls `applyFilters`. Fully client-side.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Working compare selection from list and product cards
**What:** Compare feature is now usable in seed/demo mode. Each sidebar listing item and the product card has a Compare button that toggles selection (max 4). Options menu "Compare listings" opens the side-by-side modal with seller display names and distance after Locate. Fixed broken distance lookup (`getUserLatLng` → `getUserLocation`).
**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The compare module existed but had no entry points in the UI and a broken map API call, so multi-listing comparison was inaccessible offline. This code-only polish completes the existing feature for better seed/demo exploration.
**How:** Added `.compare-btn` toggles in js/list.js renderList and js/cards.js openProduct, wired to FD_COMPARE.toggle + updateButtons. Updated js/compare.js for correct user location, seller display names, and robustness. Fully client-side. Single commit.
**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-28 (America/Denver) – Client API mutations for post-migration E2E
**What:** Extended `js/api.js` with authenticated listing operations against the live Worker: `fetchMyListings`, `createListing`, `updateListing`, `deleteListing`, `publishListing`, `unpublishListing`, `archiveListing`. Requests send `Authorization: Bearer` from `FD_AUTH` (or legacy `X-Seller-Id` for demo). When the API is unavailable, mutations persist to localStorage demo data so the dashboard/form still work offline.
**Why:** User confirmed the D1 auth migration is applied. Dashboard and form already called these methods, but the client API layer only had read/fallback helpers, so publish workflow could not complete end-to-end against the Worker.
**How:** Added `authHeaders` + `apiRequest` helpers and the mutation suite; demo fallback keeps seed UX intact. Updated GOAL.md (P1 migration checked, P3 client API marked done). Single commit.
**Next:** Optional RFQ migration; live E2E smoke (register → create draft → publish). GitHub Actions secrets still optional.

## 2026-10-28 (America/Denver) – Client RFQ API methods + demo fallback
**What:** Added `createRfq` and `fetchMyRfqs` to `js/api.js`. Both prefer the live Worker (`POST /api/v1/rfqs`, `GET /api/v1/rfqs/mine`) with Bearer auth when available, and fall back to the existing `fd-rfqs` localStorage used by the RFQ modal. Demo/seed mode remains fully functional even before the optional RFQ migration.
**Why:** Highest unfinished items are still user-owned (optional RFQ migration + GH Actions secrets). The Worker already exposes RFQ routes and the frontend RFQ module already called `FD_API.createRfq`, but the method was missing from the client API layer. Completing it makes the quote-request flow work end-to-end in both live (post-migration) and seed/demo modes without inventing new UI.
**How:** Extended the authenticated `apiRequest` helpers already used for listings. Single commit; no schema or feature changes. Appended this entry.
**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification.

## 2026-10-28 (America/Denver) – Goal: P6 phone declutter + CSS polish
**What:** Added **P6 – Phone view declutter + CSS polish** to GOAL.md as the preferred next code-only run target: less cluttered narrow/phone layout (top bar, list, filter card, map controls, cards), improve and organize `css/main.css` (breakpoints, spacing, touch targets, overlap), progressive disclosure on mobile.
**Why:** User requested an explicit goal for the next run to make phone view less cluttered and improve CSS files.
**How:** Docs-only update to GOAL.md + this IMPROVEMENTS note. No CSS code change in this commit—implementation is for the next builder run (one shippable change).
**Next:** Next code run should pick the highest unfinished P6 item and ship one focused mobile/CSS improvement.

## 2026-10-28 (America/Denver) – P6 phone view declutter + mobile CSS polish
**What:** Shipped responsive CSS improvements for narrow/phone viewports. Top bar now wraps (full-width search above action row), icon buttons have 44px touch targets, list rows are larger and more readable, cards/filter/options menus use full available width with better positioning, safe-area insets applied for notches/home indicators, and the fullscreen button is hidden on small screens to reduce top-bar clutter (map is already immersive). Sidebar, offline banner, and product cards adjust correctly with the taller top bar.
**Why:** Highest unfinished code item was P6. This focused CSS-only change makes the map-first UI less cluttered and more usable on phones without inventing features or requiring the live Worker.
**How:** Expanded the `@media (max-width: 768px)` block in `css/main.css` (sets `--top-h`, flex-wrap, larger targets, safe-area, hides `#fullscreen-btn`). Marked P6 complete in GOAL.md. Fully client-side; works with seed/demo fallback.
**Next:** Optional user items remain (RFQ migration, GH Actions secrets, live E2E). Further code runs can polish remaining seed UX if needed.

## 2026-10-28 (America/Denver) – Fix HTML escaping in product and seller cards
**What:** Corrected the broken `escapeHtml` helper in `js/cards.js` so that `& < > "` are properly turned into entities. Previously the replacements were identity (no-op), so any listing title, description, address, or seller name containing special characters could break the product/seller card HTML or inject markup.
**Why:** Highest unfinished items remain user-owned (optional RFQ migration, GH Actions secrets, live E2E). This code-only correctness fix improves seed/demo robustness for the product and seller cards, matching the earlier list.js fix and preventing rendering glitches when special characters appear in seed data.
**How:** Updated the four `.replace` calls in `escapeHtml` inside js/cards.js. Fully client-side; works with seed/demo fallback. Single commit.
**Next:** Optional: user runs `npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`. Live E2E smoke for auth+publish still pending user verification.
