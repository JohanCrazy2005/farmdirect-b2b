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
