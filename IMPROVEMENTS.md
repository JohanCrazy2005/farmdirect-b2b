
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

## 2026-10-15 – PUT /api/listings/[id] for price/qty/stock (Issue #11)

**What:** Added `PUT /api/listings/:id` that updates `price`, `availableQty`, and `stockStatus` on user listings. Coordinates remain required and are left unchanged unless both `lat` and `lng` are explicitly sent. Client helper `updateListingToApi` applies the result to `window.sellers`, rebinds the map popup, and refreshes the list.

**Why:** Sellers need a way to adjust price, quantity, and stock status after publishing. Issue #11 required validation, reflection on map/card, and coordinate integrity. Seed data stays immutable; only tmp extras or Turso rows are mutable.

**How (implemented):**
- `api/listings/[id].js` now accepts PUT with field validation (`price >= 0`, `availableQty >= 0`, `stockStatus` in `in_stock|low|out`).
- Updates write to `/tmp/farmdirect-listings-extra.json` or Turso (`UPDATE ... WHERE id`).
- Every response listing is passed through `ensureCoords`.
- `listings-api.js` exposes `window.updateListingToApi(id, updates)` which refreshes local state, marker popup, and calls `filterSellers`.
- Addresses GitHub issue #11 and keeps the open-source JSON + optional Turso stack.

Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Migrate sellers to GET /api/listings as primary source (Issue #8)

**What:** On page load, `GET /api/listings` is now the source of truth for `window.sellers`. Embedded sample data is used only when the API is unreachable (offline / file://). Markers are fully synced so the map matches the API response exactly. Coordinates are normalized (array or object → always `{lat, lng}`) and required on every listing.

**Why:** Success criterion #5 and issue #8 require live listings from the open backend as the primary data source, with a working offline fallback. Previous merge logic left markers potentially stale relative to API data.

**How (implemented):**
- `loadFromApi` replaces `window.sellers` with the API list on success.
- New `syncMarkers` removes markers for IDs no longer returned, updates position/popup for existing ones, and adds missing markers.
- `ensureCoords` normalizes both object and array coordinate forms and guarantees `lat`/`lng`/`coordinates`.
- Network tab shows the GET; markers and list match API data; offline still falls back to embedded sellers.
- Addresses GitHub issue #8 and GOAL.md success criterion #5. Seed data already consistent.

Open-source stack only (JSON seed + optional Turso). Cycle continues (still within 60 days of 2026-10-11).
