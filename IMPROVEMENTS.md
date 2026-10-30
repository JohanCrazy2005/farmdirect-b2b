## 2026-10-30 – Complete sidebar list module (seed/demo UX)

**What:** Restored and completed `js/list.js` as a substantial client-side module. It now fully renders the sidebar list with thumbnails (error fallback), clickable category/visibility/units badges and seller links for instant filtering, distance display from user location, filtered/total count (clickable to clear all filters), removable filter chips, source-aware empty state, favorites, sort, radius (with Locate prompt), in-view, keyboard selection, and JSON export. Integrates with map markers, product cards, and sellers.

**Why:** Highest unfinished code-only items are seed/demo UX polish (P1/P5 remain user-owned). The list module had become a short skeleton, breaking the core map-first sidebar interactions. This returns a working, feature-complete list that works offline with seed data.

**How:** Full rewrite of `js/list.js` exporting `FD_LIST` with the expected API (`setListings`, `toggleFavorite`, filter setters, etc.). Fully client-side; no Worker changes.

Cycle continues.
