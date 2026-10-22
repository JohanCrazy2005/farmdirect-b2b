## 2026-10-21 – P2+: Complete missing modal shells in index.html

**What:** Added the HTML modal structures expected by the existing substantial JS modules so they can open and function in pure seed/demo mode: listing form (`listing-form-modal` + fields), seller dashboard (`dashboard-modal`), RFQ request (`rfq-modal`), buyer My quote requests (`my-rfqs-modal`), recently viewed (`recent-modal`), listing statistics (`stats-modal`), and seller directory (`sellers-modal`). All reuse the existing `.form-modal` styles. No new features; just the missing UI shells that the already-shipped modules (`js/form.js`, `js/dashboard.js`, `js/rfq.js`, `js/recent.js`, `js/stats.js`, `js/sellers.js`) require.

**Why:** Highest remaining pure-code item while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). The modules were implemented and bound, but the corresponding DOM elements were absent from `index.html`, so the designed form, dashboard, RFQ, recent, stats, and seller-directory experiences could not render in the undeployed demo.

**How:** One commit. Updated `index.html` with the modal shells. Updated `GOAL.md` (last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Implement list.js + cards.js core modules

**What:** Replaced the placeholder stubs in `js/list.js` and `js/cards.js` with substantial working modules. `list.js` implements setListings, bindUI (all filter-card controls + search + clear), filtering (category, visibility, units, seller, price range, sort, radius when location known, favorites, in-view when map bounds available), sidebar rendering with favorites, getFiltered, exportFiltered (JSON), clearFavorites, select (opens product card + flies map + recent). `cards.js` implements product detail card (image lightbox, favorite, RFQ button, seller link), seller card (filter-by-seller action), and lightbox close. Fully client-side; works in pure seed/demo mode with existing index.html UI and other modules.

**Why:** Highest remaining pure-code item while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). The designed list/filter/card experience was non-functional because the core modules were placeholders. Completes the missing frontend files so the undeployed demo is usable.

**How:** One commit. New substantial `js/list.js` and `js/cards.js`. Updated `GOAL.md` (last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Complete filter card UI + options menu exports

**What:** Expanded the filter card in `index.html` to fully match the capabilities already implemented in `js/list.js`: fixed price input IDs (`filter-minprice` / `filter-maxprice`), added units select, seller as populated select, sort select, radius input, favorites checkbox, and in-view checkbox. Added the missing `export-csv-btn` and `export-geojson-btn` to the options menu so the existing `js/csv.js` and `js/geojson.js` modules bind and work. All pure client-side; works in seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Previous wiring left the filter card incomplete (price filters broken by ID mismatch) and export buttons absent, so the designed list/filter/export experience was only partially usable in the undeployed demo.

**How:** One commit. Updated `index.html` (filter card + options buttons). Updated `GOAL.md` (last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

(Previous entries continue as before.)
