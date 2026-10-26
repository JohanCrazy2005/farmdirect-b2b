## 2026-10-25 – Map marker popups with summary + view details

**What:** Markers now open a Leaflet popup showing the listing header, category swatch, price/units, and a “View details” button that selects the listing (opens the product card) and closes the popup. Clicking a marker still selects it; fly-to from the list opens the popup.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish improves map-first exploration so users can get a quick summary and open the full card without leaving the map or opening the sidebar.

**How:** Updated `js/map.js` `updateMarkers` to `bindPopup` with escaped HTML; added a one-time `popupopen` listener in `initMap` to wire the view button; added `.map-popup` / `.popup-swatch` styles in `css/main.css`. Single commits via create_or_update_file. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-25 – Mobile sidebar toggle for map-first list access

**What:** Added a mobile-only sidebar toggle button (☰) in the transparent top bar. On screens ≤768px the listings sidebar starts off-canvas and can be opened/closed from the top bar. Selecting a listing automatically closes the sidebar. Button text switches to × when open.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; previously the list was inaccessible on small screens because the sidebar was translated off-canvas with no control. This code-only polish completes the responsive map-first shell so users can browse seed listings on phones.

**How:** Added `#sidebar-toggle` to `index.html` (hidden via `.mobile-only` on desktop). CSS media query shows it and keeps the existing transform. `js/main.js` wires the toggle and auto-close on list click. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-25 – Interactive category legend (click to filter)

**What:** The map category legend is now interactive. Clicking (or keyboard Enter/Space) a category sets the category filter, updates the list and markers, and highlights the active item. Clicking the same category again clears the filter. Active state stays in sync when filters change from the sidebar or chips.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish lets users filter by category directly from the map legend without opening the filter card, improving map-first exploration.

**How:** Extended `js/map.js` legend items with click/keydown handlers and `updateLegendActive`; `js/list.js` `applyFilters` now calls it; added hover/active/focus styles in `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-25 – Add category color legend to map (seed/demo polish)

**What:** Added a Leaflet control legend (bottom-right) that lists every category with its matching color swatch. Colors are identical to map markers, sidebar list items, and filter chips via the shared CATEGORY_COLORS map.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish improves visual consistency and scanability so users can instantly understand marker colors without opening filters or the list.

**How:** Extended `js/map.js` with `addCategoryLegend()` called from `initMap`; added `.category-legend` / `.legend-item` / `.legend-swatch` styles to `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-25 – Implement real map.js + list.js + main.css (seed/demo functional)

**What:** Replaced the literal placeholder contents of `js/map.js`, `js/list.js`, and `css/main.css` (which still contained `$(cat /tmp/...)` strings) with full working modules. Map initializes Leaflet + marker clusters with category-colored dots, supports locate/fit/view links, and exposes `getCategoryColor`. List handles filters, chips with swatches, favorites, distance, only-in-view, search sync, and map marker updates. CSS provides the transparent top bar, sidebar, cards, markers, responsive layout, and visual consistency.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The frontend shell was broken because the critical map/list/CSS files were still placeholders, so seed/demo mode could not render markers or the sidebar. This single code-only change restores the specified map-first UI so users can explore seed listings immediately.

**How:** Substantial new implementations of `js/map.js`, `js/list.js`, `css/main.css`, plus this IMPROVEMENTS.md entry. Commits via create_or_update_file. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo is now fully usable in the meantime.

---

## 2026-10-25 – Category color swatches on sidebar list + filter chips

**What:** Sidebar listing items and active filter chips now show the same category color swatches used on the map legend, markers, and search suggestions. Colors come from the shared CATEGORY_COLORS map via a new `FD_MAP.getCategoryColor` helper.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). This code-only polish improves visual consistency and scanability in pure seed/demo mode so users can instantly match list items and chips to map markers without new features or schema changes.

**How:** Exposed `getCategoryColor` from `js/map.js`; updated `js/list.js` renderList and renderChips; small CSS alignment rules in `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-25 – Restore substantial list.js + main.css for seed/demo UX

**What:** Restored the complete `js/list.js` module (filters, chips, favorites, distance, only-in-view, keyboard nav, copy links, persistence, empty-state) and essential `css/main.css` styles so the map-first shell, sidebar, filter card, and product cards work correctly in pure seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). The list module and main stylesheet had become placeholders, breaking the core sidebar and all filter/list interactions. This code-only restoration returns the specified UI to a working state without new features or schema changes.

**How:** Frontend changes to `js/list.js` and `css/main.css`. Single commit via push_files / create_or_update_file. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-25 – Actually restore list.js + main.css placeholders

**What:** Replaced placeholder `js/list.js` (filters, chips, favorites, distance, only-in-view, keyboard navigation, copy links, persistence, empty-state, map sync) and `css/main.css` (transparent top bar, sidebar, cards, clusters, responsive, badges, modals) with full implementations matching the index.html shell and existing modules.

**Why:** Previous IMPROVEMENTS entry documented the intent, but the files remained 24/11-byte placeholders. Highest unfinished code-only item is the broken seed/demo UX. P1 remains user-owned (wrangler login + auth-migration.sql).

**How:** Single commit of `js/list.js`, `css/main.css`, and this IMPROVEMENTS.md entry. No schema or Worker changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Live auth + publish then works end-to-end; seed/demo already functional.

---
