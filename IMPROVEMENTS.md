## 2026-10-29 – Seed/demo UX polish: badge → details + persistent banner dismiss

**What:** Made the top-bar data-source badge (SEED/DEMO/EMPTY) open the data-source details modal on click. Banner dismiss now persists per source in localStorage (cleared on live API or demo reset). Details modal content is source-aware with concrete next-step guidance for seed, demo, and api-empty cases. Toast messages also distinguish api-empty.

**Why:** Seed/demo fallback is the primary usable path while optional Worker migrations and secrets remain user-owned. Making status clearer and less repetitive improves the offline/empty experience without inventing new features.

**How:** `js/main.js` tracks current source, adds `openDatasourceModal` (dynamic HTML), wires badge click + updated banner-details button, and stores/checks dismiss state. Reset demo clears the dismiss flag so the banner can reappear.

**Files:** `js/main.js`, `IMPROVEMENTS.md`.

## 2026-10-29 – Complete main.js bootstrap + full list.js sidebar (seed/demo UX)

**What:** Replaced placeholder `js/main.js` with a full app bootstrap that loads listings (live or seed/demo), wires top-bar, filters, options, banner, badge, map, and module binds. Replaced incomplete `js/list.js` with a substantial sidebar module: filter application (search, category, visibility, units, seller, price, radius, favorites, in-view, sort), favorites (localStorage), selection + map fly, filter badge count, URL query param restore, category color swatches, HTML escaping, and filtered JSON export.

**Why:** After prior commits left `js/main.js` as a placeholder and `js/list.js` incomplete, the map-first UI could not initialize or filter listings in seed/demo mode. This restores a working client-side experience while the Worker remains optional.

**How:** `main.js` calls `FD_MAP.initMap`, `FD_API.fetchListings`, `FD_LIST.setListings`, updates markers/banner/badge, populates filter dropdowns from data, and binds all UI controls and module `bind`/`open` methods. `list.js` implements the full filter/sort/render pipeline with seller display names and map sync.

**Files:** `js/main.js`, `js/list.js`, `IMPROVEMENTS.md`.
