## 2026-10-23 – Live “Only in view” filter on map move

**What:** The existing “Only in view” filter now re-applies automatically whenever the map is panned or zoomed. Exposed `applyFilters` on `FD_LIST` and added a `moveend` listener in the map module that calls it only when the checkbox is active. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes the viewport filter useful during exploration instead of a one-shot snapshot. Improves map-first UX without new features or schema changes.

**How:** Frontend changes to js/list.js and js/map.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Activate Only-in-view filter + shareable map view link

**What:** Exposed `getBounds()` on `FD_MAP` so the existing “Only in view” checkbox in the filter card now correctly restricts listings to the current map viewport. Also added a “Copy map view link” button in the options menu that uses the already-implemented `getMapViewLink()` (hash `#map=lat,lng,zoom`). Fixed incomplete HTML escaping in map popups/legend. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish activates an existing filter control that was non-functional and surfaces the shareable deep-link already coded in the map module. Improves map-first exploration UX without new features or schema changes.

**How:** Frontend changes to js/map.js, index.html, and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Improve seed fallback UX with deploy guidance + reload

**What:** Added a “Deploy steps” button to the offline/seed banner that opens the existing deploy modal, and a “Reload listings” button in the options menu that re-fetches from the API or seed/demo fallback. Banner button group is flex for side-by-side actions. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish further improves seed-fallback UX by surfacing next steps directly from the persistent banner and giving a quick reload without inventing features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire clear favorites into options menu

**What:** Added a “Clear favorites” button to the options menu in `index.html` and wired it in `js/main.js` to call the existing `FD_LIST.clearFavorites()`. Users can now reset their starred listings from the options menu. Completes exposure of the favorites feature already present in the list and product cards. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates an already-implemented helper that was not exposed in the UI. Improves UX for managing favorites without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire filtered JSON export into options menu

**What:** Added an “Export filtered JSON” button to the options menu in `index.html` and wired it in `js/main.js` to call the existing `FD_LIST.exportFiltered()`. Users can now download the currently filtered listings (sidebar view) as a pretty-printed JSON array. Completes the export suite alongside CSV and GeoJSON. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates an already-implemented export helper that was not exposed in the UI. Improves data portability without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire GeoJSON export module for filtered listings

**What:** Completed the existing `js/geojson.js` module by adding an “Export filtered GeoJSON” button in the options menu, loading the script in `index.html`, and calling `FD_GEOJSON.bind()` from `js/main.js`. Users can now download the currently filtered listings (as shown in the sidebar) as a GeoJSON FeatureCollection of Point features with schema properties. Complements the existing CSV/JSON exports. Fully client-side.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves geospatial data portability without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire fullscreen map toggle module

**What:** Completed the existing `js/fullscreen.js` module by adding a ⛶ button in the top actions bar, loading the script in `index.html`, calling `FD_FULLSCREEN.bind()` from `js/main.js`, and adding CSS for the Fullscreen API fallback (`.map-fullscreen`). Also calls `map.invalidateSize()` after toggle so Leaflet redraws correctly. Users can expand the map to the full browser window for better exploration.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves map-first UX without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, js/fullscreen.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire CSV export module for filtered listings

**What:** Completed the existing `js/csv.js` module by adding an “Export filtered CSV” button in the options menu, loading the script in `index.html`, and calling `FD_CSV.bind()` from `js/main.js`. Users can now download the currently filtered listings (as shown in the sidebar) as a properly escaped CSV file. Complements the existing JSON export. Fully client-side.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves data portability without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire map base-layer switcher module

**What:** Completed the existing `js/layers.js` module by loading the script in `index.html` and calling `FD_LAYERS.bind()` from `js/main.js` after map initialization. The Leaflet layers control now appears on the map (top-right), letting users switch between OpenStreetMap, Carto Light, Carto Dark, and Esri Satellite tiles. Choice persists in localStorage.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves map-first exploration UX without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire listings statistics module

**What:** Completed the existing `js/stats.js` module by adding the `#stats-modal` UI, a “Listings statistics” button in the options menu, script load + bind in `main.js`, and styles for the summary and lists. Users can now open a modal showing total listings, unique sellers, price range/average, and breakdowns by category, visibility, and units.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for understanding the current dataset without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire RFQ buyer modals and options entry

**What:** Completed the existing `js/rfq.js` module by adding the `#rfq-modal` request form and `#my-rfqs-modal` buyer view to `index.html`, fixing the product-card “Request quote” button to call `FD_RFQ.open(listing.id)`, binding the module in `main.js`, and adding a “My quote requests” button in the options menu. Buyers can now request quotes from product cards and review their requests; sellers continue to see incoming RFQs in the dashboard. Fully works in seed/demo mode (localStorage) and prefers the live Worker when available.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented (and script-loaded) but missing its UI shell. Improves B2B quote-request UX without new features or schema changes.

**How:** Frontend changes to index.html, js/cards.js, and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire seller directory module

**What:** Completed the existing `js/sellers.js` module by adding the `#sellers-modal` UI, a “Seller directory” button in the options menu, script load + bind in `main.js`, and basic styles for the directory items. Users can now open a list of unique sellers (with listing counts, categories, and average price) and click to filter the map/list to that seller.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for browsing sellers without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire keyboard shortcuts module

**What:** Completed the existing `js/shortcuts.js` module by adding the `#shortcuts-modal` UI, a “Keyboard shortcuts” button in the options menu, script load + bind in `main.js`, and styles for the help list. Escape now correctly closes overlays that use either the `hidden` attribute or the `.open` class. Users can press `/` or `s` to focus search, `l` to locate, `f` to fit all, etc., or open the help modal.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for faster map exploration without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, js/shortcuts.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire compare listings module

**What:** Completed the existing `js/compare.js` module by adding the `#compare-modal` UI, a “Compare listings” button in the options menu, script load + bind in `main.js`. Users can now open the side-by-side comparison (2–4 listings) from Options. Selection persists in localStorage.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for comparing products without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire recently-viewed module

**What:** Completed the existing `js/recent.js` module by adding the `#recent-modal` UI, a “Recently viewed” button in the options menu, script load + bind in `main.js`, and an `add` alias for `track` so `FD_LIST.select` correctly records views. Image rendering is now null-safe.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already referenced from the list but not wired into the shell. Works fully in seed/demo mode and improves UX for exploring listings without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, and js/recent.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Polish: dynamically populate units filter select

**What:** Extended `populateFilterSelects` in `js/list.js` so the Units `<select id=\"filter-units\">` is filled with unique, sorted values from the current listings (same pattern as Category and Seller). Also corrected the broken `escapeHtml` helper (was emitting literal `&` instead of `&` etc.).

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. The filter card already had a Units control and the filter logic already respected it, but the dropdown stayed empty (only \"Any\"). Completing the dynamic population makes the filter fully usable in both seed/demo and live modes without new features or schema changes.

**How:** Frontend-only change to `js/list.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Publish workflow UI feedback (P3)

**What:** Added a visible draft-guidance note (`#form-draft-note`) in the listing form that appears only in create mode. On successful create/update the form status now includes next-step text and a success toast is shown via FD_TOAST. Close delay slightly increased so the message is readable. Edit mode hides the note.

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. Completes the remaining UI feedback for the publish workflow promised in GOAL.md. Works in both demo (localStorage) and live modes; no schema or second Worker required.

**How:** Frontend changes to index.html and js/form.js. Updated GOAL.md to mark the UI-feedback item complete. Single commit via push_files.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Clearer offline/seed banner (P4 seed fallback UX)

**What:** Added a dismissible fixed banner (`#offline-banner`) that appears below the top bar when listings load from seed or demo fallback. Text distinguishes seed (read-only until Worker live) vs demo (local changes persist). Dismiss is remembered for the session via sessionStorage. Styles in `css/main.css` (amber warning, responsive). Wired in `js/main.js` after `fetchListings`.

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. The toast was easy to miss; a persistent but dismissible banner improves seed-fallback UX as noted in GOAL.md without inventing features or requiring a second Worker. Works in both demo and live modes.

**How:** Frontend-only changes to index.html, css/main.css, and js/main.js. Updated GOAL.md to mark the optional banner complete. Single commit via push_files.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Complete frontend shell (index.html + css/main.css + js/main.js)

**What:** Replaced the three PLACEHOLDER files with a full map-first UI shell. `index.html` provides the transparent top search bar, profile icon, options menu, filter button → filter card, sidebar listing list, product + seller cards, lightbox, dashboard/form/auth/deploy modals. `css/main.css` supplies layout, cards, clusters, legend, responsive behavior. `js/main.js` bootstraps Leaflet via FD_MAP, binds FD_LIST / search / dashboard / form / auth, loads listings (live API or seed/demo fallback), and wires options (API base override, deploy commands, demo export/reset).

**Why:** Highest unfinished item after the user-owned D1 auth migration. The modules (map.js, list.js, cards.js, api.js, …) were already substantial but the shell that wires them was missing, so the app could not run. Pure code-only change; no second Worker; works in both demo and live modes.

**How:** Single commit via push_files. Updated GOAL.md priority queue to mark P2 complete and keep P1 as the user action.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Polish: Options menu close button

**What:** Added a × close button (`#close-options-btn.close-card`) to the options menu in `index.html`. Bound it in `js/main.js` so the menu closes and aria-expanded is reset. Prevents the menu from staying open after use.

**Why:** Small UX polish after the shell was completed. The options menu previously had no explicit close control.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.
