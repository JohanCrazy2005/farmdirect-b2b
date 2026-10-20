## 2026-10-20 – P2+: Seller filter in filter card for better demo browsing by supplier

**What:** Added a Seller select to the filter card. It is dynamically populated with the unique `sellerid` values from the current listings (seed, demo, or live). Selecting a seller filters the list and map to that supplier only. The choice is persisted in localStorage, reflected in the shareable URL query param (`?seller=…`), and cleared with Clear filters. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements category/units/price filters by letting buyers quickly focus on a specific supplier’s offerings in the undeployed demo, which is especially useful for B2B exploration of the seed data.

**How:** One commit. Updated `index.html` (new filter group), `js/list.js` (FILTER_PARAMS + default + URL sync/load + applyFilters check + hasActiveFilters + clear/restore UI + updateSellerOptions helper that rebuilds the select from unique sellerids + change listener + call on setListings), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Shareable filter links via URL query params for better demo sharing of current view

**What:** Current filter/search state (query, category, visibility, min/max price, sort, radius, units, favorites-only) is now reflected in the page URL as query parameters. On load, any such parameters override the localStorage filters and restore the UI + results. Options menu gains a “Copy filter link” button that copies the current URL (with filters) to the clipboard and shows a toast. Fully client-side; works in pure seed/demo mode with no Worker. Preserves existing #listing= deep links.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements localStorage persistence and filtered-JSON export by letting users share an exact filtered/sorted/search view of the demo map via a link, so recipients see the same subset without manual re-filtering.

**How:** One commit. Updated `js/list.js` (syncFiltersToURL + loadFiltersFromURL helpers; call sync at end of applyFilters; apply URL overrides in bindUI), `index.html` (new menu button), `js/main.js` (copy-link wiring with toast), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Export filtered view as JSON for better demo sharing of current results

**What:** Added an “Export filtered view” item to the options menu. It downloads the currently filtered (and sorted) listings as pretty-printed JSON (`farmdirect-filtered-listings.json`). Shows a toast on success or if the filtered set is empty. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the full demo-data export by letting users share or save only the subset that matches their current search/filters/favorites/distance, making demo exploration and subset sharing easier.

**How:** One commit. Updated `js/list.js` (exportFiltered helper that stringifies the internal `filtered` array + download + toast), `index.html` (menu button), `js/main.js` (wiring), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Persist filter/search state in localStorage for better seed/demo UX

**What:** Filter and search state (category, visibility, min/max price, sort, radius, units, favorites-only checkbox, and search query) is now saved to localStorage under `fd-filters`. On load, the UI controls are restored and filters re-applied automatically. Clear filters removes the key. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the undeployed demo experience by remembering the buyer’s last filter set across page reloads or browser restarts, so demo exploration does not reset every time.

**How:** One commit. Updated `js/list.js` (load/save helpers, restoreFilterUI on bind, save on every applyFilters, clear on clearFilters), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Clear favorites option in options menu for better demo UX

**What:** Added a “Clear favorites” item to the options menu. It confirms, then removes the localStorage `fd-favorites` key, re-applies filters (so any Favorites-only view updates), refreshes any open product card heart button, and shows a success toast. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the existing favorites feature by giving a one-click way to reset bookmarks without manually un-hearting each listing or clearing site data.

**How:** One commit. Updated `js/list.js` (clearFavorites helper that removes the key + applyFilters + toast + open-card refresh), `index.html` (menu button), `js/main.js` (wiring with confirm), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Copy product summary button in product card for better demo sharing UX

**What:** Added a “Copy summary” button to the product detail card. It builds a clean multi-line human-readable summary (header, price/units, category, visibility, address, coordinates, description, seller) and copies it to the clipboard, with a toast on success or error. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the JSON copy and Share button by giving a ready-to-paste plain-text blurb ideal for chat, email, or notes without requiring JSON parsing.

**How:** One commit. Updated `js/cards.js` (button in showProduct + copyListingSummary helper that uses FD_LIST.getListings + formatted lines + clipboard + toast), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Category and units selects in listing form for better consistency with filters and seed data

**What:** Replaced free-text inputs for category and units in the add/edit listing form with `<select>` dropdowns. Options match the known values used in the filter card and seed-listings.json (produce/dairy/eggs/grains/herbs/honey for category; kg/liter/dozen/ton for units). Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Free-text fields allowed typos or values that wouldn't match filters, reducing demo data quality. Selects enforce consistency with the canonical categories/units already present in the UI and seed.

**How:** One commit. Updated `index.html` (form selects), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Copy listing JSON button in product card for better demo sharing/export UX

**What:** Added a “Copy JSON” button to the product detail card. It finds the current listing and copies a pretty-printed (2-space) JSON representation of the full listing object to the clipboard, with a toast on success or error. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the full demo-data export/import by letting users grab a single listing’s schema-compliant JSON for sharing, pasting into custom demo sets, or external tools without inventing new features.

**How:** One commit. Updated `js/cards.js` (button in showProduct + copyListingJson helper that uses FD_LIST.getListings + JSON.stringify + clipboard + toast), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Demo data export/import for better seed/demo UX

**What:** Added Export demo data and Import demo data… options in the menu. Export downloads the current localStorage demo listings (or seed if none yet) as pretty-printed JSON. Import accepts a JSON file of listings, validates basic required schema fields (location lat/long, visibility, address, sellerid, category, headerdescription, price, units), assigns missing IDs, saves to localStorage, and reloads. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the undeployed demo experience by letting users back up custom listings they create/edit, share demo data, or load alternative seed sets without losing work on reset or browser clear.

**How:** One commit. Updated `js/api.js` (exportDemoData + importDemoData with validation + generateId), `index.html` (menu buttons + hidden file input), `js/main.js` (wiring with toasts + file reader), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Distance filter precondition toasts (complete non-blocking warnings for Locate me)

**What:** Replaced the remaining `alert()` calls in the filter card (distance sort and radius filter) with non-blocking toasts. When a user selects Distance sort or enters a radius without first using Locate me, a toast warns them and resets the control instead of blocking with a modal. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Finishes the toast migration started earlier so filter precondition checks no longer interrupt the map experience.

**How:** One commit. Updated `js/list.js` (added showToast helper, swapped the two alert() calls), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Toast notifications for non-blocking feedback (copy/share/warnings)

**What:** Added a lightweight toast system (`js/toast.js`) that shows temporary non-blocking messages at the bottom of the screen. Replaced most `alert()` calls in product cards (copy link, address, coordinates, share success, delete success/error) and filter warnings (distance sort/radius requiring Locate me) with toasts. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the undeployed demo UX by avoiding modal alerts that interrupt the map experience when copying details or triggering filter preconditions.

**How:** One commit. Added `js/toast.js`, toast container in `index.html`, styles in `css/main.css`, updated `js/cards.js` and `js/list.js` to use toasts, `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Favorites (heart toggle + localStorage + Favorites-only filter) for better demo UX

**What:** Added client-side Favorites. Heart button (♡/♥) on product detail card and on each list card (absolute top-right, stops propagation so it doesn’t open the card). Persists listing IDs in localStorage under `fd-favorites`. Filter card has a “Favorites only” checkbox that filters the list + map. Toggle updates both the open product card button and the list immediately. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Gives buyers a simple way to bookmark interesting seed listings during the undeployed demo without inventing new backend features.

**How:** One commit. Updated `index.html` (Favorites only checkbox), `js/list.js` (storage helpers, filter, heart in render, bind), `js/cards.js` (Favorite button + toggle/update helpers), `css/main.css` (heart styles), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Share button in product card for better demo sharing UX

**What:** Added a “Share” button to the product detail card. It uses the Web Share API (`navigator.share`) when available (native share sheet on mobile/desktop), and falls back to the existing copy-link behavior otherwise. Fully client-side; works in pure seed/demo mode with no Worker. Complements the deep-link hash and Copy link button.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Makes it easier to share individual seed listings from the undeployed experience using the device’s native sharing options (messages, email, social, etc.) without inventing new features.

**How:** One commit. Updated `js/cards.js` (Share button in showProduct + shareListing helper with navigator.share + fallback), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Coordinates display + copy button in product card for better demo UX

**What:** Product detail card now shows the listing’s lat/long coordinates (formatted to 5 decimal places) under the address, and includes a “Copy coordinates” button that copies “lat, long” to the clipboard (with fallback alert). Appears only when location data is present. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements Directions, Copy address, and distance labels so buyers can quickly grab exact coordinates of a seed listing for external maps, notes, or sharing without manually reading or selecting text.

**How:** One commit. Updated `js/cards.js` (coords display in showProduct + copyCoordinates helper), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.
