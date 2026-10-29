## 2026-10-29 – Complete main.js bootstrap + full list.js sidebar (seed/demo UX)

**What:** Replaced placeholder `js/main.js` with a full app bootstrap that loads listings (live or seed/demo), wires top-bar, filters, options, banner, badge, map, and module binds. Replaced incomplete `js/list.js` with a substantial sidebar module: filter application (search, category, visibility, units, seller, price, radius, favorites, in-view, sort), favorites (localStorage), selection + map fly, filter badge count, URL query param restore, category color swatches, HTML escaping, and filtered JSON export.

**Why:** After prior commits left `js/main.js` as a placeholder and `js/list.js` incomplete, the map-first UI could not initialize or filter listings in seed/demo mode. This restores a working client-side experience while the Worker remains optional.

**How:** `main.js` calls `FD_MAP.initMap`, `FD_API.fetchListings`, `FD_LIST.setListings`, updates markers/banner/badge, populates filter dropdowns from data, and binds all UI controls and module `bind`/`open` methods. `list.js` implements the full filter/sort/render pipeline with seller display names and map sync.

**Files:** `js/main.js`, `js/list.js`, `IMPROVEMENTS.md`.
