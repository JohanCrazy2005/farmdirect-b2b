# Improvements log

## 2026-11-01 (America/Denver) – Complete js/list.js sidebar module

- Replaced the incomplete stub in `js/list.js` with a full working sidebar + filter module.
- Renders listings (with thumbs, price, seller names, favorites), applies every filter-card control + top search + nearby/in-view/favorites, removable chips, group-by-seller, sort, selection (opens product card + map fly), keyboard-friendly navigation, shareable filtered-view links, and empty-state clear.
- Exposes the complete `FD_LIST` API expected by `main.js`, `map.js`, `cards.js`, and `search.js`.
- Fully client-side; works in seed/demo mode so the map-first shell is usable while the Worker is undeployed or empty.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## Prior

- Frontend shell, auth client, seed fallback, phone CSS, Retry live button, and deploy notes completed in earlier runs.
