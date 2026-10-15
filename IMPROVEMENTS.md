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

**Why:** Dropdown options that do nothing are a real UI bug that confuses buyers. The helpers (`estimateDeliveryCost`, `daysUntilArrival`, `getReliabilityScore`, `harvestDaysAgo`) already existed; the sort cases were simply missing after filter simplification.

**How (implemented):**
- Added the missing `else if` branches inside `filterSellers` using the existing helpers.
- No new filters, badges, or form fields added.
- All priority items (P1–P6, P11) were already implemented; this is a polish bugfix.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Closed Issue #7 (prominent ★ rating on map popups)

**What:** Confirmed `buildPopupHtml` renders ★ X.X (N reviews) near the top of every map popup. Added closing comment and marked acceptance complete.

**Why:** Highest unfinished priority item (P2 #7) was already implemented and deployed; this run closes the loop so the priority queue can advance.

**How (implemented):**
- Rating line is immediately after the product name in the popup.
- Null-safe for missing/0 ratings and reviews.
- Uses CSS variables so it is readable in light and dark mode.
- No new features, filters, badges, or form fields.
- Addresses GitHub issue #7 and GOAL.md success criterion #3.

Production deploy already includes the change (earlier commit c8c5099). Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Accessibility fixes for remaining Vercel report issues (Issue #3)

**What:** Addressed remaining axe/Vercel accessibility findings: icon-only buttons now have `aria-label`, dynamic quantity inputs have accessible names, custom ARIA switch toggles are keyboard operable (`tabindex="0"` + Enter/Space), and muted text contrast was improved (light-mode `--muted` darkened to `#374151`).

**Why:** GitHub issue #3 tracks the Vercel accessibility scan (missing accessible names on selects/forms/buttons, ARIA toggle names, color contrast, appropriate roles). Prior passes added many labels; this closes the remaining gaps so screen-reader and keyboard users can operate filters, cards, cart, and favorites.

**How (implemented):**
- Card and popup favorite buttons, copy-summary buttons, and cart remove buttons received `aria-label`.
- Card estimator and cart quantity inputs received `aria-label="Quantity for …"`.
- Organic / Verified / Available toggles gained `tabindex="0"` and `onkeydown` so they are focusable and activatable by keyboard.
- Light-mode muted color adjusted for better small-text contrast while staying on-brand.
- No new product features, filters, badges, or form fields added.
- Addresses open GitHub issue #3 and GOAL.md P11 / success criterion usability.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Enforced ≤3 lean badges on cards, popups, and drawer (P1 / success criterion #1)

**What:** Introduced shared `getLeanBadges(s)` that returns at most 3 badges in priority order (Verified → Organic → Stock (non-in-stock) → Your listing → Premium → Lot-tracked). Used it in seller cards, map popups, and the seller detail drawer.

**Why:** Product goal and hard constraint require ≤3 badges on each listing card and map popup to keep the UI uncluttered. Cards and drawer previously rendered many extra badges (grade, pack, region, reliability, etc.).

**How (implemented):**
- New helper `getLeanBadges` centralizes the priority list and `.slice(0, 3)`.
- `renderSellers`, `buildPopupHtml`, and `openSellerDrawer` now call it.
- No new badge types or filter fields added.
- Addresses GOAL.md success criterion #1 and the original #4 intent.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Added package.json so Turso/libSQL client is available on Vercel (Issue #9)

**What:** Added a minimal `package.json` declaring `@libsql/client` as a dependency. This lets the existing dynamic `import('@libsql/client')` in the serverless handlers succeed when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set on Vercel.

**Why:** Without the package, the optional Turso path always fell back to JSON + `/tmp`. Installing the open-source client completes durable persistence for POST/PUT/DELETE so writes survive cold starts, matching issue #9 acceptance.

**How (implemented):**
- `package.json` with `@libsql/client` ^0.14.0 (no other deps).
- Handlers already use dynamic import only when env vars exist; fallback remains intact.
- Seed data in `data/listings.json` and schema already require coordinates; no change needed.
- Addresses the remaining gap in GitHub issue #9 and GOAL.md P10.

Open-source stack only (JSON seed + SQLite schema + optional Turso). Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Documented Turso/libSQL production persistence (Issue #9)

**What:** Documented the optional Turso/libSQL durable backend in README.md. The existing serverless handlers already support `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (dynamic `@libsql/client` import, GET returns `source: "turso"`, POST/PUT/DELETE persist there). Added setup steps, env var names, schema note, and fallback behavior.

**Why:** Issue #9 acceptance required documenting the env vars so operators can enable durable writes that survive Vercel cold starts (instead of only `/tmp`). The code path was already present; documentation completes the open-source persistence story.

**How (implemented):**
- README now has an "Open Backend (Listings API)" section with the full method table.
- Explicit Turso setup: create DB from `schema.sql`, set the two env vars on Vercel, optionally `npm install @libsql/client`, note that seed stays in JSON and user rows go to Turso when configured.
- Confirms every listing still receives `lat`/`lng`/`coordinates` via `ensureCoords`.
- Addresses GitHub issue #9 and GOAL.md success criterion #5.

Open-source stack only (JSON seed + SQLite schema + optional Turso). Cycle continues (still within 60 days of 2026-10-11).

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
## 2026-10-15 – Confirmed prominent ★ rating on map popups (Issue #7)

**What:** Verified and confirmed that `buildPopupHtml` already renders a prominent rating near the top of every map popup: `★ X.X (N reviews)`, null-safe, and readable in both light and dark modes via CSS variables.

**Why:** Issue #7 required the review score to be visible without scrolling, work for user listings (0 reviews OK), and stay readable in light/dark. The implementation already satisfies all acceptance criteria; this entry closes the loop and marks the issue complete.

**How (implemented):**
- Rating line placed immediately after product name, before price row.
- Uses `s.rating` / `s.reviews` with Number() guards (0 is fine).
- Color inherits `var(--text)` so it contrasts correctly under `html.dark`.
- Addresses GitHub issue #7. Acceptance checkboxes now met.

No further code change required. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Confirmed DELETE /api/listings/[id] and My Listings remove wiring (Issue #10)

**What:** Verified and confirmed that `DELETE /api/listings/:id` removes user listings from `/tmp` extras or Turso, and the My Listings “Remove” button calls the API after updating the local map/list and localStorage.

**Why:** Issue #10 required the delete endpoint and client wiring so sellers can unpublish listings, with markers removed and storage cleaned. The handlers and client override were already present; this closes the loop.

**How (implemented):**
- `api/listings/[id].js` handles DELETE: filters from tmp JSON and calls Turso DELETE if configured. Seed remains immutable.
- `listings-api.js` wraps `window.removeMyListing` so original local removal (sellers splice, markerCluster.removeLayer, localStorage filter) runs first, then `deleteListingFromApi(id)`.
- Every remaining listing keeps `lat`/`lng`/`coordinates` via `ensureCoords`.
- Addresses GitHub issue #10 and GOAL.md P8. Acceptance met: storage removed, marker gone, localStorage synced.

Open-source stack only (JSON seed + SQLite schema + optional Turso). Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Confirmed all API priorities complete (P6–P10)

**What:** Verified the full open backend stack is in place and functional: scripts wired, sellers load from GET /api/listings as primary source, DELETE and PUT on /api/listings/[id], optional Turso/libSQL persistence via @libsql/client, and every listing always has lat/lng/coordinates. Seed data in data/listings.json is consistent.

**Why:** Runner B (API/data) priority queue items P6–P10 were the highest unfinished API work. Code, client helpers, schema, package.json, and README already implement them; this confirms and documents completion so the queue can advance to remaining polish (a11y, etc.).

**How (implemented):**
- api/listings.js (GET/POST) + api/listings/[id].js (DELETE/PUT) with ensureCoords on every path.
- listings-api.js loadFromApi / syncMarkers / publish / delete / update helpers.
- package.json declares @libsql/client; dynamic import when TURSO_* env vars set.
- data/listings.json and schema.sql require coordinates.
- index.html loads cleanup.js + listings-api.js before </body>.
- Issues #8/#10/#11/#9 acceptance met (comments added; close pending form confirmation).

Open-source stack only. Cycle continues (still within 60 days of 2026-10-11).
