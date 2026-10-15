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
