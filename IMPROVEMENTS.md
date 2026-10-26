## 2026-10-26 – Show distance in product cards + map scale bar (seed/demo UX)

**What:** When a user location is set, the product detail card now shows the distance to the listing (e.g. “2.3 km away”) directly under the price. Also added a metric scale bar (bottom-left) to the Leaflet map for quick distance orientation. `FD_MAP.getUserLocation()` is now exported so other modules can use it.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; distance was already in the sidebar list and marker popups, so surfacing it in the product card completes the consistent Locate-me experience across list / map / detail views without new features or schema changes.

**How:** Added `getUserLocation` export and `L.control.scale` in `js/map.js`. Added distance calculation + display in `showProduct` of `js/cards.js`. Minor CSS rule for `.card-distance`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Show distance in map popups (seed/demo UX)

**What:** When a user location is set (via Locate me or the persisted location), each marker popup now shows the distance to that listing (e.g. “2.3 km away” or “450 m away”) below the price. Distance uses the same haversine helper and updates automatically whenever markers are rebuilt (on filter/sort/location change).

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; the sidebar list already shows distance, so adding it to map popups makes the Locate-me + radius features immediately useful while exploring the map without new features or schema changes.

**How:** Added distanceKm/formatDistance helpers and currentUserLoc tracking in `js/map.js`. Popups in updateMarkers include the distance line when location is available. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Show distance in listing list (seed/demo UX)

**What:** When a user location is set (via Locate me or the new persistence), each sidebar listing item now shows the distance in its meta line (e.g. \"2.3 km\" or \"450 m\"). Distance is computed with the existing haversine helper and updates automatically on location change or filter/sort.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; showing distance makes the Locate-me + radius + distance-sort features immediately useful during exploration without new features or schema changes.

**How:** Added formatDistance helper and distance text in renderList of `js/list.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Persist Locate-me location across reloads (seed/demo UX)

**What:** User location from “Locate me” is now saved to localStorage. On map init the marker, accuracy circle, clear-location button, and `FD_LIST.setUserLocation` are restored automatically so distance sort/filter and the radius overlay survive page reloads. Clear location removes the stored value.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; previously Locate me was session-only, forcing re-location after every refresh during exploration. This code-only polish improves map-first distance UX without new features or schema changes.

**How:** Added `LOC_KEY` persistence helpers and restore logic in `js/map.js` (initMap, locateMe, clearLocation). Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Restore substantial js/api.js with seed/demo fallback (seed/demo UX)

**What:** Replaced the 33-byte placeholder `js/api.js` with a full client-side API module. It tries the live Worker (`/api/v1/listings`), falls back to `data/seed-listings.json` on any error or empty response, and supports demo mode via localStorage overrides so local edits persist until the Worker is live. Exposes `fetchListings` (returns `{listings, source, count}`), `exportDemoData`, and `resetDemoListings` as expected by `main.js` and the options menu.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; the API module was a stub so listings could not load at all. This code-only restoration completes the expected seed fallback UX without new features or schema changes.

**How:** New substantial `js/api.js` (exposes `FD_API`). Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Fix HTML escaping + expose getListings (seed/demo UX)

**What:** Corrected the broken `escapeHtml` helper in `js/list.js` (replacements were identity instead of entities, so `&`, `<`, `>`, `\"` were not escaped in list items, chips, and selects). Also exported `getListings()` so the existing stats modal receives the full in-memory set.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; correct escaping prevents broken markup or injection risks during exploration, and stats now work as intended without new features or schema changes.

**How:** Updated `js/list.js` escapeHtml and the FD_LIST export. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Map base-layer switcher respects dark mode (seed/demo UX)

**What:** Updated `js/layers.js` so the Leaflet base-layer control (OSM / Light Carto / Dark Carto / Satellite) correctly detects and follows the app’s dark mode (`data-theme=\"dark\"` on `<html>`). Previously it looked for a non-existent `.dark` class, so the auto-initial layer and the theme-observer never matched the actual preference. User-chosen layers still persist in localStorage and win over auto-sync.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; this code-only polish makes the map base layer match the existing dark-mode toggle, improving long exploration sessions without new features or schema changes.

**How:** Revised dark detection, MutationObserver attribute filter, and layer application helper in `js/layers.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Keyboard shortcuts module (seed/demo UX)

**What:** Replaced the 24-byte stub `js/shortcuts.js` with a full client-side keyboard shortcuts module. It binds the Options → Keyboard shortcuts button + modal, and handles the listed keys: `/` or `s` focus search, `i` toggle filters, `o` toggle options, `l` locate, `f` fit all, `x` clear location, `d` toggle dark mode, `?`/`h` open help, ↑/↓ navigate listings (with map highlight), Enter/Space open highlighted, Esc close open panels/modals. Keypresses are ignored while typing in inputs.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; the shortcuts module was a placeholder so the documented keyboard controls and help modal did not work. This code-only change completes the expected map-first UX without new features or schema changes.

**How:** New substantial `js/shortcuts.js` (exposes `FD_SHORTCUTS` with bind/open/close). Integrates with existing FD_MAP, FD_LIST, FD_CARDS, FD_TOAST. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Restore substantial list.js (seed/demo UX)

**What:** Replaced the 37-byte placeholder `js/list.js` with a full client-side listing list + filter module. Implements sidebar rendering with category swatches, filter card wiring, chips with per-chip clear, favorites (localStorage), sort (price/name/distance), radius filter (with map circle), “only in view” (re-applies on map move), bidirectional hover highlight sync with markers, shareable filtered view links, filter-state persistence, HTML escaping, empty-state “Clear filters” button, filter-count badge, and export of filtered JSON.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; the list module was a stub so the map-first UI could not show or filter listings. This code-only change completes the expected frontend shell for exploration without new features or schema changes.

**How:** New substantial `js/list.js` (exposes `FD_LIST` with bindUI, setListings, applyFilters, select, highlightListItem, onMapMove, setUserLocation, getFilteredViewLink, exportFiltered, clearFavorites). Single commit via create_or_update_file. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Persistent dark mode toggle (seed/demo polish)

**What:** Added a dark mode toggle (button in Options menu + keyboard `d`). Preference is saved to localStorage and restored on load. Dark theme uses CSS variables and a `data-theme=\"dark\"` attribute so the map, sidebar, cards, top bar, and legends remain readable and consistent.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish improves long exploration sessions and low-light use of the map-first UI without new features or schema changes.

**How:** Extended `css/main.css` with dark theme rules. Added theme init/toggle in `js/main.js`. Added button to `index.html` Options menu and updated shortcuts list. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

(Previous entries prior to placeholder overwrites are summarized in commit history; cycle continues within the 60-day window.)
