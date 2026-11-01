## 2026-11-01 – Quick Favorites toggle in sidebar (seed/demo UX)

**What:** Added a “Favorites” quick-toggle button in the sidebar tools (next to Nearby). It turns the existing favorites-only filter on/off with one click, highlights when active, and stays in sync with the filter card checkbox and removable chips. Complements Nearby, Random, and Group-by-seller for faster exploration of starred listings in seed/demo mode.

Fully client-side; works offline with seed data.

**How:** Button in `index.html`, toggle + visual state in `js/list.js` (also highlights Nearby for consistency). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Complete list navigation + filter setters (seed/demo UX)

**What:** Implemented the missing `navigate`, `setVisibilityFilter`, and `setUnitsFilter` functions in `js/list.js` (and exported `getFavorites`). Product cards already called these for Prev/Next cycling through the filtered set and for clicking category/visibility/units badges to apply filters. They now work fully client-side with seed/demo data, making sidebar + card exploration smoother offline.

**How:** Updated `js/list.js` only. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Copy filter summary (seed/demo UX)

**What:** Added “Copy filter summary” button in the options menu. It copies a human-readable one-line summary of the current filters and result count (e.g. “FarmDirect filtered view: 12 / 45 listings (category: produce, nearby ≤25 km, sort: price ↑)”). Complements the existing filtered-view link and JSON/CSV exports. Fully client-side; works with seed/demo data.

Useful for notes, chat, or documenting the exact active view without sharing a URL.

**How:** Added `copyFilterSummary` to `js/list.js`, button in `index.html`, and event wiring in `js/main.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Export filtered listings as JSON (seed/demo UX)

**What:** Added “Export filtered JSON” button in the options menu. It copies the currently filtered listings (the active seed/demo view) as pretty-printed JSON to the clipboard. Complements existing CSV/GeoJSON/export-demo actions and is useful for inspecting, saving, or sharing the exact set visible after filters, search, Nearby, etc.

Fully client-side; works with seed/demo data and live mode.

**How:** Added `exportFilteredJson` to `js/list.js`, button in `index.html`, and event wiring in `js/main.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Complete list.js module + filter chips (seed/demo UX)

**What:** Restored and completed the `js/list.js` module (previously truncated). It now fully supports filtering, favorites, Nearby, sort, Group-by-seller, removable filter chips, clickable filtered/total count, random picker, Clear & fit, shareable filtered links, and map sync. Added `#filter-chips` container to `index.html` and corresponding styles in `css/main.css`. Fully client-side; works with seed/demo data.

Improves offline/seed fallback exploration and makes the sidebar list + filters actually functional again.

**How:** Replaced `js/list.js` with a complete implementation matching current HTML IDs (`listings-list`, `list-count`, `group-by-seller`, filter controls). Minimal additions to `index.html` and `css/main.css`. Single commit via push_files / create_or_update_file. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Reset map view button (seed/demo UX)

**What:** Added “Reset map view” button in the options menu. It returns the Leaflet map to the configured default center and zoom (from FD_CONFIG). Complements Copy map view link, Fit map, and shareable views. Fully client-side; works with seed/demo data.

Improves offline/seed fallback exploration after zooming or following a shared map link.

**How:** Frontend changes to `index.html` (button), `js/map.js` (`resetToDefault`), and `js/main.js` (event wiring). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Shareable map view links (seed/demo UX)

**What:** Added “Copy map view link” button in the options menu. It copies a URL with `#map=lat,lng,zoom` for the current map center and zoom. Opening that link (or changing the hash) restores the view. Complements existing filtered-view links and works fully with seed/demo data.

Improves offline/seed fallback exploration and sharing without new features or schema changes.

**How:** Frontend changes to `index.html` (button), `js/map.js` (`getMapViewLink` + `applyMapViewFromHash`), and `js/main.js` (wiring + hash handling). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-10-31 – Load pure seed data button (seed/demo UX)

**What:** Added a “Load pure seed data” button in the options menu. It clears any local demo overrides (via existing `resetDemoListings`) and reloads the canonical seed listings so the map and sidebar return to a known baseline. Complements Reload listings, Import/Export/Download, and Reset demo.

Improves offline/seed fallback UX without new features or schema changes. Useful after experimenting with local edits or when demo data becomes cluttered.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (event wiring + confirm + toast + reload). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-10-31 – Reload listings button (seed/demo UX)

**What:** Added a “Reload listings” button in the options menu that re-fetches from the live Worker or seed/demo fallback and refreshes the map + sidebar. Complements the existing Import/Export/Download/Reset demo actions and the offline banner guidance.

Improves offline/seed fallback UX without new features or schema changes. Useful after switching API base, restoring demo data, or retrying a previously empty Worker.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (event wiring + toast). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-10-31 – Import demo backup button (seed/demo UX)

**What:** Added an “Import demo backup” button in the options menu that opens a file picker for a JSON array of listings and calls the existing `FD_API.importDemoData`. On success it reloads the list so the restored data appears immediately. Complements the existing Export demo / Download backup / Reset demo actions.

Improves offline/seed fallback UX without new features or schema changes.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (file-input wiring + toast + reload). Single commit via push_files. Replaced placeholder IMPROVEMENTS.md with this entry.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---
