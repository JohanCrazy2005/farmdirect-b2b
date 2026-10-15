
## 2026-10-15 – Restored GET/POST /api/listings (seed + tmp + optional Turso)

**What:** Implemented the previously empty `api/listings.js` serverless handler. GET returns seed data from `data/listings.json` merged with user extras from `/tmp` (or Turso when `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` are set). POST creates a listing with required name/product/price and always persists `lat`, `lng`, and `coordinates`.

**Why:** The collection endpoint was empty after an earlier push, so `listings-api.js` could not load live data and new seller listings could not be published to the API. This restores the open backend required by GOAL.md success criterion #5 and unblocks #8.

**How (implemented):**
- Every listing is passed through `ensureCoords` so `lat`, `lng`, and `coordinates` are always present.
- Seed is immutable; user-created rows go to `/tmp/farmdirect-listings-extra.json` or Turso.
- Dynamic `import('@libsql/client')` only when Turso env vars exist (no hard dependency).
- Compatible with existing `listings-api.js` load/publish helpers and the DELETE handler in `api/listings/[id].js`.
- Addresses the highest unfinished API priority (P6/P7 foundation) and keeps coordinates required.

Open-source stack only (JSON + SQLite schema + optional Turso). Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Simplified List-Product Form to 7 Fields / 3 Required (Issue #6)

**What:** Tightened the Seller Portal “List a Product” form to exactly 7 fields with only name, product, and price required. Added optional latitude/longitude inputs so sellers can pin exact coordinates; unit defaults to kg.

**Why:** The previous form lacked coordinate controls and did not clearly mark required fields. Matching the product success criterion (≤7 fields, exactly 3 required) keeps onboarding fast while guaranteeing every listing has lat/lng.

**How (implemented):**
- Form now: Farm/Seller name*, Product*, Price*, Category, Available qty, Latitude (optional), Longitude (optional).
- `submitListProduct` validates the three required fields, uses provided lat/lng when valid, otherwise falls back to a random point near London, and sets `coordinates: [lat, lng]`.
- Addresses GitHub issue #6 and GOAL.md success criterion #2.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Null-safe filterSellers / clearFilters / preset & URL state (Issue #12)

**What:** Made all filter state capture, apply, and clear paths null-safe so missing DOM nodes (after filter simplification) never throw.

**Why:** After removing advanced filters, leftover direct `getElementById(...).value` / `.classList` calls in `captureFilterState` and `applyFilterState` caused console errors when presets or shareable URLs ran. Issue #12 required no throws on minimal filter DOM.

**How (implemented):**
- `captureFilterState` now uses safe `val` / `on` / `chk` helpers that return defaults when elements are absent.
- `applyFilterState` guards every setter (`setVal`, `setToggle`, `setChk`, `setText`).
- `filterSellers` and `clearFilters` already used existence checks; left them intact.
- Addresses GitHub issue #12. Acceptance: no console errors on missing `traceableToggle`, `regionKent`, etc.; clear still works.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).
