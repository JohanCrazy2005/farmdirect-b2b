## 2026-10-15 – Sync Max price live label when applying presets / shareable URL

**What:** `applyFilterState` now updates `#priceValue` whenever it sets `#priceRange` (presets, shareable filter URLs, restore). Previously only the range input and Clear all / chip reset kept the label in sync.

**Why:** Loading a saved search or opening a shared filter link left the “Max price: $XX” label stale while the slider moved, so the visible cap disagreed with the actual filter.

**How (implemented):**
- After `setVal('priceRange', s.price || 50)` call `setText('priceValue', s.price || 50)`.
- Matches the existing pattern used for `#distValue`.
- No new filters, badges, or form fields.
- All GOAL.md P1–P11 priorities remain complete in code; issue #7 acceptance is met (comment added on the issue).

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Live value display for Max price filter (UI polish)

**What:** Added a live `$<span id="priceValue">` next to the Max price label (matching the existing distance control). The range now updates the displayed value on input, and Clear all / chip reset keep the label in sync.

**Why:** The distance slider already showed its current value; the price slider did not, so buyers could not see the exact cap while dragging. Small but real UX gap after filter simplification.

**How (implemented):**
- Label now reads “Max price (per unit): $XX”.
- `oninput` updates `#priceValue`.
- `clearFilters` and the price chip reset both restore the display to 50.
- No new filters, badges, or form fields.
- All GOAL.md P1–P11 priorities already implemented in code; this is a minor polish. Issue #7 (rating on map popup) acceptance criteria are met — comment added recommending close.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Confirmed API priorities P6–P10 complete and closed issues #9 / #11

**What:** Verified and closed the remaining open API issues (#9 Turso/libSQL persistence, #11 PUT /api/listings/[id]). All backend priorities from the GOAL.md queue are implemented and shipped.

**Why:** Runner B (API/data) priority queue items were already coded in prior runs (GET/POST, DELETE, PUT, Turso path, seed consistency, coordinates always present). Closing the issues advances the queue to remaining polish (accessibility #3, etc.).

**How (implemented – already in main):**
- `api/listings.js` + `api/listings/[id].js` with `ensureCoords` on every path; Turso dynamic import when env set.
- `package.json` declares `@libsql/client`; README documents env vars and behavior.
- `listings-api.js` loads from GET as primary source, provides update/delete helpers.
- Seed `data/listings.json` consistent with coordinates object.
- Addresses GOAL.md success criterion #5 and priorities P6–P10.

Open-source stack only (JSON seed + SQLite schema + optional Turso). Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Fixed incomplete sort options in filterSellers (UI bug)

**What:** Completed the sort logic in `filterSellers` so every option in the sort dropdown actually works: Delivery cost, Landed cost (price + delivery), Freshest first, Earliest arrival, and Reliability. Previously only Price and Rating were handled; others silently fell back to Distance.

**Why:** Dropdown options that do nothing are a real UI bug.

**How (implemented):** Full sort cases using existing helpers. Cycle continues.
