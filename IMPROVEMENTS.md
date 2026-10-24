# FarmDirect B2B – Improvements Log

## 2026-10-24 – Expand seed listings for richer demo fallback UX
- P4 / seed-demo polish: Added four more diverse listings to `data/seed-listings.json` (carrots, clover honey, pasture eggs, whole milk).
- Increases map density and filter/demo variety in the Denver metro cluster when the Worker is offline or undeployed.
- Fully client-side; no runtime or API changes. Improves first-load seed experience.

## 2026-10-24 – Clarify P1 user deploy steps + richer deploy modal
- P1 docs polish: Enhanced the deploy modal in `index.html` with the full exact sequence from README (login, auth-migration, optional RFQ, redeploy, smoke test).
- Added a clear note in `GOAL.md` that remaining P1/P5 items require user action (wrangler login / secrets) and that seed/demo fallback is ready.
- Improves discoverability of deploy guidance from the SEED/DEMO badge and offline banner without changing runtime behavior.

## 2026-10-24 – Seed data expansion + map center alignment (seed UX)
- P4 / seed-demo polish: Expanded `data/seed-listings.json` with two additional listings (potatoes, dried lavender) for a richer fallback demo.
- Aligned default `MAP_CENTER` / zoom in `js/config.js` to the Denver metro seed cluster so the first map view is relevant when no saved view or URL hash exists.
- Fully client-side; improves seed fallback experience when the Worker is unreachable. Live API path unchanged.

## 2026-10-24 – Complete restoration of js/list.js (full module with thumbnails + chips)
- P4 / seed-demo polish: Replaced the persistent truncated stub in `js/list.js` with a complete substantial module.
  - Correct HTML escaping, filter persistence (localStorage), favorites, distance calculation/sort, only-in-view (via FD_MAP.getBounds), keyboard navigation helpers, empty-state with Clear filters, copy listing links.
  - Real listing thumbnails (image or placeholder) using existing `.list-thumb` CSS.
  - Removable filter chips for all active filters (search, category, visibility, units, seller, price range, radius, favorites, only-in-view, sort).
  - Filter count badge, populate dynamic options, hover highlight sync with map.
  - Fully client-side; works in seed/demo mode and with live Worker.
  - Restores the core map-first sidebar list that repeated overwrites had left broken.

## 2026-10-24 – Restore complete sidebar list.js (thumbnails + chips)
- P4 / seed-demo polish: Replaced the truncated stub in `js/list.js` (which broke the sidebar) with a full substantial module.
  - Correct HTML escaping, filter persistence, favorites, distance, only-in-view, keyboard nav, empty-state clear, copy links.
  - Real listing thumbnails (image or placeholder) using existing `.list-thumb` CSS.
  - Removable filter chips in the sidebar for all active filters (search, category, visibility, units, seller, price, radius, favorites, only-in-view).
  - Fully client-side; works in seed/demo mode without the Worker.
  - Restores core map-first listing list that prior overwrites had broken.

## 2026-10-24 – Restore full sidebar list module + listing thumbnails
- P4 / seed-demo polish: Replaced the truncated stub in `js/list.js` with the complete module (filters, chips, keyboard nav, favorites, distance, only-in-view, persistence, empty-state, copy links).
  - Added real listing thumbnails (image or placeholder) in sidebar rows for better scannability.
  - Matches existing `.list-thumb` CSS. Fully client-side; works in seed/demo mode.
  - Restores core map-first sidebar that had been broken by a prior overwrite.

## 2026-10-24 – Clickable data-source badge
- P4 polish: Made the persistent SEED/DEMO data-source badge a button.
  - Click opens the existing deploy modal with exact wrangler commands.
  - Hover/focus scale + updated title tooltip.
  - Improves seed/demo UX by surfacing deploy guidance without relying on the dismissible banner.
  - Changes in index.html, css/main.css, js/main.js.

## 2026-10-24
- P4 polish: Added persistent data-source badge (SEED / DEMO) in the top bar.
  - Visible even after dismissing the offline banner.
  - Clear visual cue for seed fallback / demo mode when Worker is unreachable.
  - Styled in css/main.css; logic in js/main.js; markup in index.html.

## Prior
- Frontend shell complete (index.html, css/main.css, js/* modules).
- Auth + publication workflow UI ready (awaiting D1 auth-migration.sql).
- Seed/demo fallback automatic in js/api.js with localStorage persistence.
- Deploy notes documented in README.md and deploy modal.
