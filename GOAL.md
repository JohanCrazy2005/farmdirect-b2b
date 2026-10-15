# FarmDirect B2B — Product Goal

## North star
A clean B2B farm marketplace where buyers find sellers on a map, request quotes, and sellers publish listings with **coordinates** — without UI clutter.

## Success criteria (must all be true)
1. **≤ 3 badges** on each listing card and map popup (priority: Verified → Organic → Stock → Your listing → Premium → Lot-tracked).
2. **Listing form ≤ 7 fields**, **exactly 3 required**: name, product, price. Optional: category, unit, qty, lat, lng.
3. **Review score on map popup** near the top: `★ X.X (N reviews)`.
4. **Lean filters only**: distance, category, organic, verified, available, min rating, max price, max MOQ + search/sort.
5. **Live listings via open backend**: `GET/POST /api/listings`, seed in `data/listings.json`, schema in `schema.sql` (SQLite/libSQL). Every listing has `lat`, `lng`, `coordinates`.
6. **Scripts loaded**: `cleanup.js` and `listings-api.js` before `</body>` in `index.html`.
7. Site deploys from GitHub → Vercel and stays usable on phone + laptop.

## Priority queue (work in this order; one issue per run)
| P | Issue | Title |
|---|-------|--------|
| 1 | #4 | Max 3 badges in index.html |
| 2 | #7 | Review score on map popups |
| 3 | #5 | Simplify filters |
| 4 | #12 | Null-safe filterSellers |
| 5 | #6 | Simplify list-product form |
| 6 | Wire scripts | cleanup.js + listings-api.js in index.html |
| 7 | #8 | Load sellers from /api/listings |
| 8 | #10 | DELETE API |
| 9 | #11 | PUT API |
| 10 | #9 | Turso persistence |
| 11 | #3 | Accessibility (Vercel) |

## Rules for automation agents
- **One concrete deliverable per run** — implement and ship, do not only suggest.
- Prefer **editing existing files** over new feature sprawl.
- Do **not** add more filter types, badges, or form fields.
- After implementing: update `IMPROVEMENTS.md` (append), commit to `main` (or PR), ensure Vercel deploys.
- If an issue is done, close it or mark acceptance checkboxes.
- If all P1–P7 are done, only polish bugs / a11y / mobile — no new product surface area until the cycle ends (60 days after 2026-10-11).
