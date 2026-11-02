## 2026-11-01 (America/Denver) – Seed/demo UX: local listing tags

- Added substantial `js/tags.js` module that stores private per-listing tags in localStorage (`fd-tags`).
- Users can add/edit/clear tags from the product card (“Tags” / “Edit tags” button) or manage them all in a dedicated modal (list with tag pills, View, Edit, Clear).
- Tags display on the product card when present. Fully client-side; no schema or Worker changes.
- Wired a “Listing tags” button into the options menu, added the `#tags-modal` shell to `index.html`, loaded the script, and bound the module in `main.js`.
- Added light CSS for tag pills and the tags list so they remain readable on both themes.
- Improves seed/demo fallback exploration (organize by interest, follow-up status, samples, etc.) while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

# Improvements log

## 2026-11-01 (America/Denver) – Seed/demo UX: private listing notes

- Added substantial `js/notes.js` module that stores private per-listing notes in localStorage (`fd-notes`).
- Users can add/edit/delete notes from the product card (“Add note” / “Edit note” button) or manage them all in a dedicated modal (list with previews, View, Edit, Delete).
- Notes display on the product card when present. Fully client-side; no schema or Worker changes.
- Wired a “Private notes” button into the options menu, added the `#notes-modal` shell to `index.html`, loaded the script, and bound the module in `main.js`.
- Added light CSS for note items and the inline listing note so they remain readable on both themes.
- Improves seed/demo fallback exploration (remember follow-ups, prices, impressions) while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: filter presets

- Added substantial `js/presets.js` module that lets users save the current filter combination (search, category, seller, visibility, units, price range, favorites, nearby, in-view, sort) under a name and later re-apply it.
- Stored in localStorage (`fd-presets`); modal lists presets with summary, Apply, and Delete actions plus a “Save current” form.
- Wired a “Filter presets” button into the options menu, added the `#presets-modal` shell to `index.html`, loaded the script, and bound the module in `main.js`.
- Added light CSS for the preset items so the manager is readable on both themes.
- Fully client-side; improves seed/demo fallback exploration while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: data quality inspector

- Added substantial `js/quality.js` module that scans current listings for schema issues (invalid/missing location, visibility enum, empty required fields, bad price, missing image).
- Opens a modal listing issues with severity, and a “View” button that selects the listing (opens product card + flies map).
- Wired a “Data quality” button into the options menu, added the `#quality-modal` shell to `index.html`, loaded the script, and bound the module in `main.js`.
- Added light CSS for the quality items so the inspector is readable on both themes.
- Fully client-side; improves seed/demo fallback clarity and data hygiene while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: local data manager

- Added substantial `js/localmanager.js` module that lists all `fd-*` localStorage keys (demo listings, favorites, map view, theme, RFQs, onboarding flag, etc.) with sizes and short previews.
- Users can clear individual keys or wipe all local data (with confirmation) and reload.
- Wired a “Local data” button into the options menu, added the `#localmanager-modal` shell to `index.html`, loaded the script, and bound the module in `main.js`.
- Added light CSS for the local items so the inspector is readable on both themes.
- Fully client-side; improves seed/demo fallback clarity and cleanup while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: demo status inspector

- Added substantial `js/demostatus.js` module that compares current listings against pure seed data and shows added, modified, and missing items.
- Users can revert individual listings to the original seed version (or remove demo-only items), export the current set, or force pure seed.
- Wired a “Demo status” button into the options menu, added the `#demostatus-modal` shell to `index.html`, and bound the module in `main.js`.
- Added light CSS for the diff items so the inspector is readable on both themes.
- Fully client-side; improves seed/demo fallback clarity while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

## 2026-11-01 (America/Denver) – Seed/demo UX: first-run onboarding welcome

- Added substantial `js/onboarding.js` module that shows a one-time welcome modal on first visit when the data source is seed, demo, or api-empty.
- Modal covers quick start (map, filters, local demo edits), exports, data-source indicators, and links to the existing Seed/demo tips.
- Wired a “Welcome tour” button into the options menu, added the `#onboarding-modal` shell to `index.html`, and bound the module in `main.js` (auto-show after load + outside-click close).
- Data-source modal now mentions the welcome tour.
- Fully client-side; improves seed/demo fallback onboarding while the Worker may be empty or offline.
- Highest unfinished code-only item after documented user actions (P1 optional RFQ/GH secrets, P3 live E2E, P5 secrets).

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
