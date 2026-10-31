PLACEHOLDER

## 2026-10-30 – Frontend shell completed (map / list / bootstrap)

- Replaced placeholder `index.html`, `js/map.js`, `js/list.js`, and `js/main.js` with a working map-first shell.
- `index.html` wires the transparent top bar, Leaflet map, sidebar list, filter card, options menu, product/seller cards, and all modals expected by existing modules (auth, dashboard, form, sellers, deploy, shortcuts, data-source, lightbox).
- `js/map.js` initializes Leaflet, renders category-colored markers, supports fly-to and user location, and updates with filtered listings.
- `js/list.js` holds listings, applies search + filter chips (category, seller, visibility, units, price, favorites), renders the sidebar, handles selection (opens product card + flies map), and persists favorites.
- `js/main.js` bootstraps everything: loads via `FD_API.fetchListings` (seed/demo fallback), shows data-source badge + offline banner with Details modal, wires theme / options / sidebar / filters / profile, and calls bind() on the other modules.
- Seed/demo UX remains fully usable when the Worker is offline or empty. No unrelated features added.

## 2026-10-30 – Random listing picker (seed/demo UX)

**What:** Added a “Random” button in the sidebar header that picks a listing at random from the current filtered set, opens its product card, and flies the map to it.

**Why:** Seed/demo mode is the primary experience while the live Worker is empty or offline. A one-click random explorer makes the map-first UI easier to scan without inventing new features.

**How:**
- `index.html`: new `#random-listing-btn` next to Add / Sample.
- `js/list.js`: `pickRandom()` selects from `filtered`, calls `select()`, and shows a toast with the header description. Wired in `bind()`.
- Exposed on `FD_LIST.pickRandom`. Works fully client-side with seed or demo data.

## 2026-10-30 – Nearby quick filter (seed/demo UX)

**What:** Added a “Nearby” button in the sidebar that filters the current set to listings within 25 km of the user’s location and sorts them by distance. Distance is shown on list rows. A removable chip appears.

**Why:** Seed/demo mode is the main experience while the live Worker is offline or empty. Proximity exploration helps users scan the map-first UI without inventing unrelated features.

**How:**
- `index.html`: new `#nearby-btn` next to Random.
- `js/map.js`: `locateUser` now accepts an optional success callback so the filter can activate after geolocation.
- `js/list.js`: `enableNearby()` requests location if needed, sets `filters.nearby`, applies a ≤25 km Haversine filter, sorts by distance, and renders a chip. Distance shown in list meta. Chip removal and Clear filters turn it off. Fully client-side.
- Exposed on `FD_LIST.enableNearby`.

## 2026-10-30 – Sidebar sort control (seed/demo UX)

**What:** Added a Sort select in the sidebar (Default / Price ↑ / Price ↓ / Distance). Price sorts are numeric; Distance requests geolocation if needed and sorts by Haversine km. A removable chip shows the active sort. Distance is also shown on list rows whenever location is known.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Sorting helps scan price or proximity without inventing unrelated features.

**How:**
- `index.html`: new `.sidebar-sort` with `#sort-select` under the header tools.
- `css/main.css`: styles for the sort row (flex, compact select).
- `js/list.js`: `filters.sort`, applied after filtering in `applyFilters()`. Nearby still forces distance sort. Chip removal and Clear reset to default. `setSort()` exposed. Fully client-side.

## 2026-10-30 – Fit map control (seed/demo UX)

**What:** Added a “Fit map” button in the sidebar tools that re-frames the Leaflet map to the bounds of the current filtered listings (with padding and maxZoom).

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. After using Random, Nearby, selection, or manual panning/zooming, a one-click fit helps users reorient on the map-first UI without inventing unrelated features.

**How:**
- `index.html`: new `#fit-map-btn` next to Nearby.
- `js/map.js`: `fitAll()` collects lat/long from `currentListings` (the filtered set already pushed by the list), calls `map.fitBounds`, and toasts the count. Exposed on `FD_MAP.fitAll`.
- `js/list.js`: button click in `bind()` calls `FD_MAP.fitAll()`. Fully client-side.

## 2026-10-30 – Clickable category legend (seed/demo UX)

**What:** Added a bottom-right map legend that lists unique categories from the current filtered set, with color swatches matching the markers and live counts. Clicking an item filters the list and map to that category (via existing `FD_LIST.setCategoryFilter`).

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. The colored markers need a legend so users can quickly identify and isolate categories without opening the filter card.

**How:**
- `index.html`: new `#map-legend` div (hidden until populated).
- `css/main.css`: absolute positioning (bottom-right, safe-area aware) plus heading styles; existing swatch/item rules reused.
- `js/map.js`: `updateLegend()` aggregates categories from `currentListings`, renders clickable items, and is called at the end of `setListings()`. Fully client-side.

## 2026-10-31 – GeoJSON export button (seed/demo UX)

**What:** Wired the existing `js/geojson.js` exporter into the Options menu with an “Export GeoJSON” button. It downloads the currently filtered listings as a GeoJSON FeatureCollection of Points.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Exposing the already-implemented client-side GeoJSON export lets users save or share the filtered map view without inventing new features.

**How:**
- `index.html`: new `#export-geojson-btn` in the options menu (next to other export actions).
- `js/main.js`: calls `FD_GEOJSON.bind()` during bootstrap so the button listener is attached.
- Existing `exportGeoJSON()` uses `FD_LIST.getFiltered()`, builds a FeatureCollection with schema properties, and triggers a download. Fully client-side.

## 2026-10-30 – Wire compare module into UI (seed/demo UX)

**What:** Completed the existing `js/compare.js` module by adding the `#compare-modal` markup, an Options-menu “Compare listings” button (`#compare-btn`), and basic table styles. Product-card Compare buttons already called `FD_COMPARE.toggle`; the modal now opens side-by-side for 2–4 selected listings.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. The comparison feature was already implemented client-side (and partially wired in cards) but missing its UI surface, so users could not open it.

**How:**
- `index.html`: new `#compare-btn` in the options menu and `#compare-modal` / `#compare-content`.
- `css/main.css`: `.compare-table` styles and `.compare-btn.active` highlight.
- Existing `FD_COMPARE.bind()` (already called from `main.js`) attaches the listeners. Fully client-side; no schema or Worker changes.

## 2026-10-30 – CSV export button (seed/demo UX)

**What:** Wired the existing `js/csv.js` exporter into the Options menu with an “Export CSV” button. It downloads the currently filtered listings as a properly escaped CSV (schema fields + lat/long).

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Exposing the already-implemented client-side CSV export complements GeoJSON and improves data portability without inventing new features.

**How:**
- `index.html`: new `#export-csv-btn` in the options menu (next to Export GeoJSON).
- `js/main.js`: calls `FD_CSV.bind()` during bootstrap so the button listener is attached.
- Existing `exportFilteredCsv()` uses `FD_LIST.getFiltered()`, builds a CSV with header + rows, and triggers a download. Fully client-side.

## 2026-10-30 – Wire recently viewed module (seed/demo UX)

**What:** Completed the existing `js/recent.js` module by adding the `#recent-modal` markup, an Options-menu “Recently viewed” button (`#open-recent`), calling `FD_RECENT.bind()` from bootstrap, and tracking every product-card selection from `FD_LIST.select()`. Clicking a recent item reopens the product card and flies the map.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. The recent-history feature was already implemented client-side (localStorage, last 8) but missing its UI surface and tracking hook, so users could not use it.

**How:**
- `index.html`: new `#open-recent` in the options menu and `#recent-modal` / `#recent-list` / `#clear-recent-btn`.
- `js/main.js`: `FD_RECENT.bind()` in `init()` plus the options-menu click handler that opens the modal.
- `js/list.js`: `select()` now calls `FD_RECENT.track(listing.id)` so every card open is recorded. Fully client-side; no schema or Worker changes.

## 2026-10-31 – Wire listings stats module (seed/demo UX)

**What:** Completed the existing `js/stats.js` module by adding the `#stats-modal` markup, an Options-menu “Listings stats” button (`#open-stats`), calling `FD_STATS.bind()` from bootstrap, and basic styles for the summary rows and lists. Opening it computes counts, unique sellers, price range/average, and breakdowns by category / visibility / units from the current in-memory listings.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. The stats feature was already implemented client-side but missing its UI surface, so users could not view a quick summary of the loaded set.

**How:**
- `index.html`: new `#open-stats` in the options menu and `#stats-modal` / `#stats-content`.
- `js/main.js`: `FD_STATS.bind()` in `init()` plus the options-menu click handler that opens the modal (and adds it to the outside-click closer).
- `css/main.css`: `.stats-summary`, `.stat-row`, and `.stats-list` styles.
- Existing `computeStats` / `renderStats` / `open` use `FD_LIST.getListings()`. Fully client-side; no schema or Worker changes.

## 2026-10-31 – Deep-link support for #listing=ID (seed/demo UX)

**What:** Shared listing links (`#listing=ID`) now open the matching product card and fly the map after listings load. The product-card Share button already copied these URLs; they now work on page load and on hashchange.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Making the existing Share links functional improves exploration and sharing without inventing new features.

**How:**
- `js/main.js`: `maybeOpenHashListing()` parses `location.hash` for `listing=`, then calls `FD_LIST.select(id)` after a short delay. Invoked at the end of `loadAndRender()` and on `hashchange`. Fully client-side.

## 2026-10-31 – Keyboard shortcuts polish (seed/demo UX)

**What:** Fixed the keyboard shortcuts module so it correctly calls the existing client-side APIs (`FD_MAP.locateUser`, `FD_MAP.fitAll`, `FD_LIST.pickRandom`) and expanded the help modal to document the full set of map-first controls.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. The shortcuts previously referenced non-existent methods, so keyboard exploration of the map and list did not work. Making them functional improves scanning without inventing new features.

**How:**
- `js/shortcuts.js`: rewired locate / fit / random / favorites / theme to the real methods already exposed by map.js and list.js; cleaned panel-closing logic to use the actual card classes.
- `index.html`: updated `#shortcuts-modal` list to show the working shortcuts (`/`, `I`, `O`, `L`, `F`, `R`, `D`, `V`, arrows, Enter, Esc, etc.).
- Fully client-side; no schema, Worker, or unrelated feature changes.

## 2026-10-31 – Only in current map view filter (seed/demo UX)

**What:** Added an “In view” toggle in the sidebar tools that filters the list and markers to listings whose coordinates fall inside the current Leaflet map bounds. The filter re-applies automatically on pan or zoom. A removable chip shows when active, and the button highlights.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. After panning or zooming, users can quickly limit the sidebar to what is currently visible on the map without inventing unrelated features.

**How:**
- `index.html`: new `#in-view-btn` next to Nearby / Fit map.
- `js/list.js`: `filters.inView`, `isInCurrentView()` using `FD_MAP.getMap().getBounds()`, applied in `applyFilters()`. `toggleInView()` flips the flag. Chip removal and Clear filters turn it off. `moveend` listener re-renders while active. Button gets `.active` class.
- `css/main.css`: `.small-btn.active` highlight (reused from compare).
- Fully client-side; no schema or Worker changes.

## 2026-10-31 – Favorites quick filter button (seed/demo UX)

**What:** Added a “Favorites” button in the sidebar tools that instantly toggles the favorites-only filter (same as the checkbox in the filter card). The button highlights when active, a chip appears, and the keyboard shortcut `V` now drives it directly.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Favorites were only reachable via the filter card; a one-click toggle in the same toolbar as Nearby / In view / Random makes starring and reviewing favorites faster without inventing unrelated features.

**How:**
- `index.html`: new `#favorites-btn` next to In view.
- `js/list.js`: `toggleFavoritesOnly()` flips `filters.favoritesOnly`, updates the button `.active` state, re-renders, and toasts. Chip removal and Clear still work. Exposed on `FD_LIST`.
- `js/shortcuts.js`: `V` now calls `FD_LIST.toggleFavoritesOnly()` so the shortcut applies immediately.
- Fully client-side; no schema or Worker changes.

## 2026-10-31 – Shareable filtered view links (seed/demo UX)

**What:** Added “Copy filtered view link” in the Options menu. It serializes the current filters (category, seller, visibility, units, price range, favorites, nearby, in-view, sort, search) plus any selected listing into the URL hash, copies the full URL, and updates the address bar. On load or hashchange the filters are reapplied before opening a #listing= deep link.

**Why:** Seed/demo mode is the primary experience while the live Worker is offline or empty. Shareable filtered views let users send a colleague a specific category + price + map-view slice without inventing unrelated features.

**How:**
- `js/list.js`: `serializeFilters()`, `applyFiltersFromParams()`, `copyFilteredLink()` (clipboard + history.replaceState). Exposed on `FD_LIST`.
- `js/main.js`: `maybeOpenHashListing()` now calls `applyFiltersFromParams` first; button listener wired in `setupOptions`.
- `index.html`: new `#copy-filtered-link` button in the options menu.
- Fully client-side; no schema or Worker changes. Works with existing #listing= support.
