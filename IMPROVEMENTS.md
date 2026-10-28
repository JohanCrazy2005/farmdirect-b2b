PLACEHOLDER

## 2026-10-27 (America/Denver)
- Implemented full `js/list.js` module (was placeholder). Sidebar list now renders listings, applies all filter-card controls + top search, supports sort, favorites (localStorage), radius/in-view, chips, selection (opens product card + map fly), keyboard nav, filtered JSON export, and deep-link hash. Uses seller display names. Client-side only; works with seed/demo fallback. main.js / cards.js / search.js integration complete.

## 2026-10-28 (America/Denver)
- Fixed incomplete filter integration between map and list modules. Added `isInView` and `getUserLocation` to `js/map.js` so the "only in view" checkbox and radius filter work after Locate. Added `setSellerFilter` to `js/list.js` (and fixed seller dropdown value restore) so map popup seller badges correctly apply the seller filter. All client-side; improves seed/demo UX without requiring live Worker.
- Added data-source details modal. Clicking the persistent data-source badge (SEED/DEMO/API+SEED/LIVE) now opens a modal with current source explanation, health status, listing count, and quick actions (reload, export/reset demo, deploy/migration steps). Improves seed/demo fallback UX while P1 user actions (wrangler login + auth-migration.sql) remain pending. Fully client-side.
- Enhanced data-source modal with the exact next wrangler migration command, D1 ID (`ad22b284-cafd-4f74-a8bc-6205056d38f8`), and a one-click copy button. Clearer guidance for the remaining P1 user steps (login + auth-migration.sql) while seed/demo fallback stays fully usable. No new features; pure UX polish for the pending deploy notes.
- Improved sidebar empty-state UX for seed/demo mode. When no listings match filters, the list now shows contextual tips (clear filters / use Locate + radius) plus inline buttons. Fully client-side; keeps the map-first experience usable while P1 user actions remain pending.
