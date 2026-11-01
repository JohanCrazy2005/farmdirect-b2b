## 2026-10-31 – Fix list escaping + wire Only-in-map-view filter (seed/demo UX)

**What:** Corrected the broken `escapeHtml` in `js/list.js` (same no-op replacements previously fixed in cards.js) and completed the wiring for the “Only in map view” filter checkbox so it is read from and synced to the UI.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. List items used a non-functional escapeHtml, so seed data containing `&`, `<`, `>` or quotes could break the sidebar rendering. The filter-card checkbox for in-view existed and was counted in the badge, but `readFiltersFromUI` never captured it and `syncFilterUI` never restored it, so the filter could not be set or restored from the card (or from shareable links after reload of the form).

**How:**
- `js/list.js`: proper `escapeHtml` (`&`, `<`, `>`, `"`); `readFiltersFromUI` now sets `filters.inView` from `#filter-in-view`; `syncFilterUI` restores the checkbox state.

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Make Nearby filter a proper toggle (seed/demo UX)

**What:** Nearby sidebar button now toggles the 25 km filter on/off and shows an active visual state.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. Previously the Nearby button only turned the filter on; turning it off required clearing all filters. Users exploring seed data on the map could not easily compare “nearby” vs full set.

**How:**
- `js/list.js`: replaced enableNearby with toggleNearby; button text/title/class update on every render.
- `css/main.css`: added `.small-btn.active` so the active Nearby control is clearly highlighted.

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Fix product/seller card escaping and seller filter

**What:** Corrected HTML escaping in `js/cards.js` and wired the seller card “Show their listings” button so it applies the filter.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. Product cards used a broken `escapeHtml` (replacements were no-ops), so any seed description containing `&`, `<`, or `>` would break rendering or inject markup. The seller-card button only set a select value and never applied the filter.

**How:**
- `js/cards.js`: proper `escapeHtml` (`&`, `<`, `>`, `"`); seller button now calls `FD_LIST.setSellerFilter`.
- `js/list.js`: exported `setSellerFilter` (mirrors existing setCategory/Visibility/Units helpers) so cards can filter reliably.

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Polish seed/demo list layout + wire CSV/GeoJSON exports

**What:** Completed visual layout for sidebar list items (thumbs, meta, group headers, empty state) and wired the existing CSV and GeoJSON export modules into the options menu.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. list.js already rendered structured items and group-by-seller, but CSS lacked the matching rules so thumbs and sections did not display correctly. Export modules (csv.js, geojson.js) existed but their buttons were missing from the UI, so filtered seed data could not be exported client-side.

**How:**
- `css/main.css`: flex layout for `.listing-item`, styles for `.list-thumb` / placeholder, `.list-body`, `.list-meta`, `.fav-btn`, `.seller-group` / `.group-header`, and `.empty-state`.
- `index.html`: added `#export-csv-btn` and `#export-geojson-btn` in the options menu (bind already present in the modules).

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Complete and wire list.js for seed/demo UX

**What:** Replaced the truncated/placeholder `js/list.js` with a complete module that matches the index.html shell.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. The previous list.js was incomplete (wrong DOM IDs, missing group-by-seller, count, filter badge), so the sidebar list, tools, and filters did not function with the completed frontend shell.

**How:**
- Correct IDs: `#listings-list`, `#list-count` (now shows filtered/total and clears filters on click), `#random-btn`, `#fit-btn`, `#group-by-seller`, `#reset-filters`.
- Active filter count badge on the filter icon.
- Group-by-seller sections (click header to filter to that seller).
- Empty state with Clear filters button.
- Full filtering, sorting, Nearby, favorites, shareable links, selection → product card + map fly.

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Polish seed fallback UX with Deploy steps banner button

**What:** Added a “Deploy steps” button to the offline/seed banner that opens the existing deploy modal, and expanded the data-source modal + deploy modal with the exact optional next commands (RFQ migration + GH Actions secrets).

**Why:** P1 optional items and P5 secrets are user-owned; highest unfinished code-only work is seed/demo UX polish so offline users immediately see how to go live.

**How:**
- `index.html`: banner now has Details + Deploy steps + dismiss; deploy modal lists the three optional commands.
- `js/main.js`: wired `#banner-deploy` to open `#deploy-modal`; richer source-modal next-steps list.

Seed/demo fallback continues to work fully offline. Live E2E verification remains user action after optional migrations.

---

## 2026-10-31 – Complete frontend shell (index.html + css/main.css)

**What:** Replaced placeholder `index.html` and `css/main.css` with a complete map-first shell.

**Why:** P2 was marked done but the files were still placeholders (`PLACEHOLDER_INDEX` / `PLACEHOLDER_CSS`). Existing JS modules (`map.js`, `list.js`, `main.js`, `search.js`, `cards.js`, etc.) could not render without matching DOM structure and styles.

**How:**
- `index.html`: transparent top bar (search + clear, filter icon with badge slot, options, profile, data-source badge), offline banner, Leaflet map container + legend, sidebar with tools (Locate, Fit, Clear & fit, Nearby, Random, sort, group-by-seller) and `#listings-list`, filter card, options menu, floating product/seller cards, lightbox, toast container, and modal shells for auth/dashboard/form/sellers/deploy/shortcuts/source/compare/recent/stats. Scripts load in dependency order ending with `main.js`.
- `css/main.css`: layout, transparent/blur top bar, sidebar slide, filter/options cards, floating cards, dark-theme variables, responsive phone layout (full-width sidebar, bottom cards, progressive disclosure), marker pins, toasts, and map legend.

Seed/demo fallback continues to work offline. Next polish can wire any remaining list.js render targets or further UX once live E2E is available.
