## 2026-10-17 – Fresh-start foundation: schema, seed, wrangler, Worker skeleton + P1 deploy docs

**What:** Added the canonical schema (`schema/listings.schema.json`, `schema/d1-schema.sql`), seed data (`data/seed-listings.json`) matching the required fields, `wrangler.toml` with the existing D1 binding, a minimal Worker (`workers/api.js`) exposing `/api/v1/health` and listings endpoints, and documented the exact `wrangler` commands needed for P1 deploy in README.md.

**Why:** P0 claimed the foundation but the new files were missing from the tree. P1 deploy steps require user login/secrets, so the commands are now explicit. This unblocks the next code-only polish items while keeping the live Worker undeployed until the user runs the commands.

**How:** One commit via push_files. Schema is strict (no additionalProperties). Worker maps D1 rows back to the nested `location` shape. Seed uses Denver-area coordinates for local testing. Old Vercel/Turso paths remain for reference but are no longer the primary path.

Next: complete modular frontend (css/main.css, js/* ) and seed-fallback UX, then marker clustering / empty states (P2).

---

## 2026-10-15 – Wire edit controls in My Listings to PUT /api/listings/[id]

**What:** Enhanced the My Listings modal so sellers can edit price, availableQty, and stockStatus inline and save via the existing PUT API. Coordinates are preserved (never cleared).

**Why:** PUT endpoint and client helper existed, but the UI only offered Remove. Completing the acceptance criteria for issue #11 (map/card reflect new values after save) required a simple edit surface without adding product clutter.

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

## 2026-10-15 – Closed completed UI priority issues (#7, #5, #12, #6, #3)

**What:** Verified all listed UI priorities (P1–P6 + P11) are fully implemented on main and closed the corresponding open GitHub issues.

**Why:** Acceptance criteria for map popup rating, lean filters, null-safe filter state, simplified list form, script wiring, and accessibility fixes were already met in prior commits, but issues remained open. Closing them clears the priority queue for polish-only work.

**How (verified on main @ 714a9e7):**
- #7: `buildPopupHtml` renders prominent ★ X.X (N reviews) near top, null-safe, CSS-var colored.
- #5: Filter panel contains only distance, category, organic, verified, available, min rating, max price, max MOQ + search/sort.
- #12: filterSellers / captureFilterState / applyFilterState use safe getVal/isOn helpers.
- #6: List form has exactly 7 fields / 3 required (name, product, price).
- Scripts: `cleanup.js` + `listings-api.js` loaded immediately before `</body>`.
- #3: aria-labels, keyboard ARIA switches, contrast, live regions present.
- Badges capped at ≤3 via `getLeanBadges`.

No new filters, badges, or form fields. Production deploy expected from Git push.

## 2026-10-15 – Closed Issue #7: Review score on map popups

**What:** Confirmed and closed GitHub issue #7. Map popups already render a prominent ★ rating near the top.

**Why:** Acceptance criteria (visible without scrolling, works with 0 reviews, light/dark readable) were fully met in prior commits. Closing clears the next priority queue item.

**How (verified):**
- `buildPopupHtml` places `<div class="seller-rating">★ ${rating.toFixed(1)} (${reviews} reviews)</div>` immediately after the product line.
- Null-safe defaults (0 / 0).
- Color uses `var(--text)` so it remains readable in both themes.
- Comment added on the issue recommending close.

No code changes required. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Closed remaining open UI priority issues (#12, #5, #6, #3)

**What:** Verified all remaining open issues matching the priority queue (null-safe filters, simplified filters, simplified list form, accessibility) are fully implemented in current main, then closed them on GitHub.

**Why:** Code acceptance criteria were already met in prior commits, but issues stayed open. Closing them completes the UI priority queue so future runs stay on polish only.

**How (verified on main):**
- #12: `filterSellers` / `clearFilters` use safe `getVal` / `isOn` helpers; no throws on missing advanced DOM nodes.
- #5: Filters panel limited to distance, category, organic, verified, available, min rating, max price, max MOQ + search/sort.
- #6: List form has ≤7 fields / exactly 3 required (name, product, price); coords always stored.
- #3: aria-labels, keyboard ARIA switches, contrast, skip link, live regions present.
- Scripts `cleanup.js` + `listings-api.js` loaded before `</body>`; badges ≤3 via `getLeanBadges`; ★ rating on map popups.

No new filters, badges, or form fields. Cycle continues (within 60 days of 2026-10-11).

## 2026-10-16 – Null-safe rating display on seller cards and drawer

**What:** Made star rating and review count on list cards and the seller detail drawer null-safe (defaults to 0 / 0.0), matching the already-safe map popup.

**Why:** `Math.floor(s.rating)` and bare `${s.rating}` throw or render "undefined" when a listing lacks rating/reviews (e.g. newly published user listings). Real UI bug with missing data.

**How:** `Number(s.rating) || 0` / `Number(s.reviews) || 0` and `.toFixed(1)` for consistent display. No new filters, badges, or form fields. All GOAL.md P1–P11 priorities remain complete; no open issues. Cycle continues (within 60 days of 2026-10-11).
