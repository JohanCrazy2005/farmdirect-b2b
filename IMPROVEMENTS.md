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
