# Improvements log

## 2026-11-01 (America/Denver) – Seed/demo UX: in-app tips module

- Added substantial `js/seedtips.js` module that opens a guided tips modal covering map exploration, filters/sort, local demo edits, exports, and data-source indicators.
- Wired a “Seed/demo tips” button into the options menu, added the `#seedtips-modal` shell to `index.html`, and bound the module in `main.js` (including outside-click close).
- Data-source modal now mentions the new tips entry.
- Fully client-side; improves seed/demo fallback clarity and onboarding while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: richer data-source status

- Added `getDemoInfo()` to `js/api.js` so the client can report how many local demo overrides exist in localStorage.
- Enhanced the offline banner and top-bar data-source badge: tooltip now shows source, check time, and demo-override count.
- Data-source modal now displays last-checked timestamp, local demo override count, and clearer guidance to “Load pure seed data”.
- Banner message mentions overrides when present so users know why they are seeing mixed data.
- Fully client-side; improves seed/demo fallback clarity while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Complete js/list.js sidebar module

- Replaced the incomplete stub in `js/list.js` with a full working sidebar + filter module.
- Renders listings (with thumbs, price, seller names, favorites), applies every filter-card control + top search + nearby/in-view/favorites, removable chips, group-by-seller, sort, selection (opens product card + map fly), keyboard-friendly navigation, shareable filtered-view links, and empty-state clear.
- Exposes the complete `FD_LIST` API expected by `main.js`, `map.js`, `cards.js`, and `search.js`.
- Fully client-side; works in seed/demo mode so the map-first shell is usable while the Worker is undeployed or empty.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## Prior

- Frontend shell, auth client, seed fallback, phone CSS, Retry live button, and deploy notes completed in earlier runs.
