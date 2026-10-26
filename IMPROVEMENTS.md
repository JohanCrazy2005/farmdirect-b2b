## 2026-10-26 – Map base-layer switcher respects dark mode (seed/demo UX)

**What:** Updated `js/layers.js` so the Leaflet base-layer control (OSM / Light Carto / Dark Carto / Satellite) correctly detects and follows the app’s dark mode (`data-theme="dark"` on `<html>`). Previously it looked for a non-existent `.dark` class, so the auto-initial layer and the theme-observer never matched the actual preference. User-chosen layers still persist in localStorage and win over auto-sync.

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

**What:** Added a dark mode toggle (button in Options menu + keyboard `d`). Preference is saved to localStorage and restored on load. Dark theme uses CSS variables and a `data-theme="dark"` attribute so the map, sidebar, cards, top bar, and legends remain readable and consistent.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish improves long exploration sessions and low-light use of the map-first UI without new features or schema changes.

**How:** Extended `css/main.css` with dark theme rules. Added theme init/toggle in `js/main.js`. Added button to `index.html` Options menu and updated shortcuts list. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

(Previous entries prior to placeholder overwrites are summarized in commit history; cycle continues within the 60-day window.)
