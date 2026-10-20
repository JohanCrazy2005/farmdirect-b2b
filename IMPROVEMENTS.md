## 2026-10-20 – P2+: Fix HTML escaping in map popups & legend + richer marker popups (seed/demo safety & UX)

**What:** Corrected the broken `escapeHtml` in `js/map.js` (previously replaced `&`/`</`/`>`/`"` with the characters themselves instead of entities). Marker popups and the category legend now safely escape user/seed content. Popups were also enriched to show formatted price, seller, address, visibility, and a short hint, with matching CSS. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). The broken escaping was a latent XSS/rendering risk in map popups (and legend) even with seed data; richer popups improve map-first scanning without opening the full product card.

**How:** One commit. Updated `js/map.js` (proper `escapeHtml` + richer `bindPopup` HTML), `css/main.css` (`.map-popup` / `.popup-price` / `.popup-meta` / `.popup-hint` styles), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Empty-state clear filters button (better demo UX when no matches)

**What:** Enhanced the sidebar empty state (shown when filters/search produce zero listings). Added a prominent “Clear filters” button that resets all filters/search in one click and re-renders the list + map. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). With many filters available, buyers can easily reach a zero-result state; a one-click recovery improves the undeployed demo experience without opening the filter card.

**How:** One commit. Updated `js/list.js` (empty HTML + click listener calling `clearAllFilters`), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Restore complete list.js (critical fix for all sidebar/filter features)

**What:** Replaced the broken `js/list.js` (which contained only the literal string `$(cat /tmp/list.js)`) with a full, substantial module. Restores every previously implemented P2 feature: filtering (category/visibility/price/units/seller/sort/radius/favorites/in-view), active removable filter chips, keyboard navigation (arrows + Enter), list-map hover highlight sync, distance sort + labels after Locate me, localStorage + shareable URL query-param persistence, dynamic seller select, map-view bounds filter with live pan/zoom updates, export filtered view, favorites (heart toggle + localStorage), clear favorites, and proper interfaces for `map.js` / `cards.js` / `main.js`.

**Why:** Highest remaining pure-code item. The file had been corrupted to a 19-byte stub, breaking the entire side list, filters, chips, keyboard a11y, hover sync, and map integration even in pure seed/demo mode. P1 remains blocked on user (`npx wrangler login` + README deploy commands). This restores a working map-first demo.

**How:** One commit. Full rewrite of `js/list.js` (~18 KB) implementing `FD_LIST` API (`bindUI`, `setListings`, `getListings`, `select`, `highlight`, `sortByDistance`, `isFavorite`, `toggleFavorite`, `clearFavorites`, `exportFiltered`, `applyFilters`). Updated `IMPROVEMENTS.md` and `GOAL.md` last-updated line.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: List-map hover highlight sync (map-first polish for seed/demo)

**What:** Added bidirectional hover highlighting between the sidebar listing cards and Leaflet markers. Hovering a list card scales and highlights the corresponding map marker (and raises its z-index). Hovering a marker highlights the matching list card (scrolls it into view). Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Strengthens the map-first discovery experience by making the connection between the side list and map markers immediate and visual, without requiring a click.

**How:** One commit. Updated `js/map.js` (highlightMarker / clearMarkerHighlight + mouseover/mouseout on markers + export), `js/list.js` (mouseenter/mouseleave listeners after renderList + header comment), `css/main.css` (`.category-marker.marker-highlighted` scale + glow), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Keyboard navigation for listing list (a11y polish for seed/demo)

**What:** Added keyboard support to the sidebar listing list. ArrowDown / ArrowUp move focus between listing cards (tabindex=0, role=listitem). Enter on a focused card selects it (flies map + opens product card), same as click. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves accessibility and keyboard-only exploration of the map-synced list without requiring mouse, which is useful for the undeployed demo.

**How:** One commit. Updated `js/list.js` (handleListKeydown + listener on #listing-list in bindEvents; header comment), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Active filter chips for clearer multi-filter demo UX

**What:** Added a filter chips bar in the sidebar (below the listings header). When any filter is active (search, category, price, sort, radius, units, seller, favorites-only, in-view, etc.), a compact chip appears for each one. Clicking the × on a chip removes that single filter and immediately updates the list + map. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). With many filters now available, chips give buyers an at-a-glance view of the current query and a one-click way to drop individual constraints without opening the filter card or using Clear all.

**How:** One commit. Updated `index.html` (chips container), `js/list.js` (renderFilterChips + removeFilter + call from applyFilters), `css/main.css` (chip styles), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Only in current map view filter for better map-first demo exploration

**What:** Added an “Only in current map view” checkbox to the filter card. When enabled, the sidebar list and map markers show only listings whose coordinates fall inside the current Leaflet viewport. The filter updates live on pan/zoom (`moveend`). Auto-fitBounds is skipped while the filter is active so the view does not jump or loop. The choice is persisted in localStorage, reflected in the shareable URL (`?inView=1`), and cleared with Clear filters. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Strengthens the map-first experience by letting buyers explore a geographic area and immediately see only the relevant seed listings in the side list, without manual category/price filtering.

**How:** One commit. Updated `index.html` (new checkbox), `js/list.js` (FILTER_PARAMS + default + URL sync/load + applyFilters bounds check + hasActiveFilters + clear/restore UI + change listener + map moveend hook), `js/map.js` (renderMarkers accepts `{fit: false}` option), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Seller filter in filter card for better demo browsing by supplier

**What:** Added a Seller select to the filter card. It is dynamically populated with the unique `sellerid` values from the current listings (seed, demo, or live). Selecting a seller filters the list and map to that supplier only. The choice is persisted in localStorage, reflected in the shareable URL query param (`?seller=…`), and cleared with Clear filters. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements category/units/price filters by letting buyers quickly focus on a specific supplier’s offerings in the undeployed demo, which is especially useful for B2B exploration of the seed data.

**How:** One commit. Updated `index.html` (new filter group), `js/list.js` (FILTER_PARAMS + default + URL sync/load + applyFilters check + hasActiveFilters + clear/restore UI + updateSellerOptions helper that rebuilds the select from unique sellerids + change listener + call on setListings), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

(Previous entries continue as before.)
