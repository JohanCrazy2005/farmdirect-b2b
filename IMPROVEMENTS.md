## 2026-10-21 – P2+: Complete frontend module wiring & options UI

**What:** Updated `index.html` to load every existing `js/` module in dependency order (config, toast, api, map, layers, list, cards, form, dashboard, rfq, recent, shortcuts, stats, sellers, csv, search, fullscreen, geojson, compare, main) and expanded the options menu, filter card, toast container, deploy modal skeleton, and supporting structure. All prior polish features (stats, sellers, CSV/GeoJSON export, search typeahead, fullscreen, layers, favorites, RFQ, recent, theme, etc.) are now loadable and interactive in pure seed/demo mode.

**Why:** Highest remaining pure-code item while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Completes the missing frontend files so the undeployed demo fully exercises the designed map-first UI and all modules without inventing new product features.

**How:** One commit. Updated `index.html` (scripts + UI). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: GeoJSON export of filtered listings

**What:** Added a substantial `js/geojson.js` module and options-menu button that downloads the currently filtered listings as a GeoJSON FeatureCollection (Point features with schema properties: id, sellerid, category, headerdescription, price, units, visibility, address, description, image). Complements existing JSON and CSV exports. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves data portability for GIS/map consumers of the current view in the undeployed demo without inventing new product features.

**How:** One commit series. New `js/geojson.js`. Updated `index.html` (options button + script tag). Updated `js/main.js` (wire bind call + comment). Updated `js/list.js` (expose `getFiltered()`). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Fullscreen map toggle

**What:** Added a substantial `js/fullscreen.js` module and top-bar button that toggles the map into fullscreen (Fullscreen API with CSS class fallback). Sidebar hides in fullscreen for pure map focus. Esc exits. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the map-first exploration experience in the undeployed demo without inventing new product features.

**How:** One commit. New `js/fullscreen.js`. Updated `index.html` (button + script tag). Updated `js/main.js` (wire bind call + comment). Updated `css/main.css` (fullscreen fallback styles). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Search suggestions typeahead

**What:** Added a substantial `js/search.js` module that attaches to the top-bar search. As you type (≥2 chars, debounced), it shows up to 8 matching listings (title, category, seller, price). Click or keyboard (arrows + Enter) opens the product card and flies to the marker. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves discovery and speed of the map-first search experience in the undeployed demo without inventing new product features.

**How:** One commit. New `js/search.js`. Updated `index.html` (suggestions container + script tag + autocomplete="off"). Updated `js/main.js` (wire bind call + comment). Updated `css/main.css` (dropdown styles + mobile note). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: CSV export of filtered listings

**What:** Added a substantial `js/csv.js` module and options-menu button that downloads the currently filtered listings as a properly escaped CSV (id, sellerid, category, headerdescription, price, units, visibility, address, lat, long, description, image). Complements the existing JSON export. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves data portability and sharing of the current view in the undeployed demo without inventing new product features.

**How:** One commit series. New `js/csv.js`. Updated `index.html` (options button + script tag). Updated `js/main.js` (wire bind call + comment). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`. (list.js getFiltered to be refined next if needed.)

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Map base-layer switcher

**What:** Added a substantial `js/layers.js` module that replaces the hardcoded OSM tiles with a Leaflet base-layer control (OpenStreetMap, Carto Light, Carto Dark, Esri Satellite). Choice persists in localStorage. Auto-prefers dark tiles when the theme is dark (unless the user has explicitly chosen a layer). Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the map-first exploration experience in the undeployed demo without inventing new product features.

**How:** One commit. New `js/layers.js`. Updated `index.html` (script tag). Updated `js/main.js` (wire bind call + comment). Updated `css/main.css` (control theming). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Seller directory modal

**What:** Added a substantial `js/sellers.js` module and options-menu button that opens a seller directory modal. It groups current listings by sellerid, showing listing count, categories, average price, and a sample address. A “View listings” button sets the seller filter and closes the modal. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves discovery of unique sellers in the undeployed demo without inventing new product features, complementing the existing seller filter and richer seller profile card.

**How:** One commit. New `js/sellers.js`. Updated `index.html` (options button + modal + script tag). Updated `js/main.js` (wire open + bind call + comment). Updated `css/main.css` (seller directory item styles). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Listing statistics modal

**What:** Added a substantial `js/stats.js` module and options-menu button that opens a statistics modal. It computes totals, unique sellers, price range and average, plus breakdowns by category, visibility, and units from the current in-memory listings. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Gives buyers a quick overview of the current catalog in the undeployed demo without inventing new product features.

**How:** One commit series. New `js/stats.js`. Updated `index.html` (options button + modal + script tag). Updated `js/main.js` (wire open + bind call). Updated `css/main.css` (stats summary styles). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

(Previous entries continue as before.)
