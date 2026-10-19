## 2026-10-19 – P2+: Fix HTML escaping in list panel for safer seed/demo rendering

**What:** Corrected the `escapeHtml` (and `escapeAttr`) helpers in `js/list.js`. Previously the replacements were identity operations (`&` → `&`, `<` → `<`, etc.), so any `&`, `<`, `>`, or `"` in a seed listing’s headerdescription, category, or units would produce broken or unsafe HTML in the sidebar cards. Now uses proper entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`). Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Prevents rendering glitches (or potential markup injection) when exploring seed listings that contain special characters, improving the undeployed experience.

**How:** One commit. Updated `js/list.js` (fixed escape helpers + comment), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Copy address button in product card for better demo UX

**What:** Added a “Copy address” button to the product detail card. It copies the listing’s address string to the clipboard (with fallback alert). Appears only when an address is present. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements Directions and Copy link so buyers can quickly grab the physical address of a seed listing for offline notes or other maps without manually selecting text.

**How:** One commit. Updated `js/cards.js` (Copy address button in showProduct + copyAddress helper), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Directions button in product card for better demo map UX

**What:** Added a “Directions” button to the product detail card. It opens Google Maps directions to the listing’s lat/long coordinates in a new tab. Appears only when location data is present. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the map-first design so buyers can quickly get turn-by-turn directions to a seed listing without leaving the undeployed experience or copying coordinates.

**How:** One commit. Updated `js/cards.js` (Directions button in showProduct + openDirections helper using Google Maps URL), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Clear-search button in top bar for better demo search UX

**What:** Added a circular × clear button inside the top search box. It appears only when the search input has text and clears the query (and re-filters the map + list) with one click. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves the search experience when exploring seed listings so users can quickly reset a query without manually deleting text.

**How:** One commit. Updated `index.html` (clear button in search-box), `css/main.css` (clear-search styles + adjusted input padding), `js/list.js` (visibility toggle + clearSearch handler + bind), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Image lightbox in product card for better demo photo UX

**What:** Clicking the product image in the detail card now opens a full-screen lightbox with the enlarged photo. Close via the × button, Escape key, or click on the dark overlay. Fully client-side; works in pure seed/demo mode with no Worker. Cursor indicates zoom-in on the card image.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Product photos are a key part of the marketplace demo; enlarging them improves inspection of seed listings without leaving the undeployed experience.

**How:** One commit. Updated `index.html` (lightbox modal), `css/main.css` (lightbox styles + product-image cursor), `js/cards.js` (openLightbox/closeLightbox + clickable image in showProduct), `js/main.js` (Escape + click-outside wiring), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Min price filter in filter card for better demo list UX

**What:** Added a Min price number input to the filter card (complements the existing Max price). Listings below the entered minimum are hidden from both the sidebar and the map. Clear filters resets it. Fully client-side; works in pure seed/demo mode with no Worker. Matches the schema `price` field.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements existing category/visibility/units/radius/max-price filters so buyers can focus on a price range without leaving the undeployed experience.

**How:** One commit. Updated `index.html` (min price input in filter card), `js/list.js` (minPrice in activeFilters, filter logic, clear + bind), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Units filter in filter card for better demo list UX

**What:** Added a Units select to the filter card (Any / kg / liter / dozen / ton). Selecting a unit hides non-matching listings from both the sidebar and the map. Clear filters resets it. Fully client-side; works in pure seed/demo mode with no Worker. Matches the schema `units` field and the variety present in seed-listings.json.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements existing category/visibility/price/radius filters so buyers can focus on specific packaging units without leaving the undeployed experience.

**How:** One commit. Updated `index.html` (units select in filter card), `js/list.js` (units in activeFilters, filter logic, clear + bind), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Richer seller profile card for better demo seller discovery

**What:** The seller profile card now lists all other listings by the same `sellerid` from the currently loaded data (seed, demo localStorage, or live). Each item is clickable and opens the corresponding product card. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the existing product card and deep-links so buyers can explore a seller’s full set of offerings without leaving the undeployed experience.

**How:** One commit. Updated `js/cards.js` (showSeller now filters current listings and renders clickable mini-cards), `css/main.css` (seller-listings + seller-listing-item styles + max-height on cards), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-19 – P2+: Deep-linkable listings via URL hash for better demo sharing

**What:** Opening a product card now updates the browser URL to `#listing=<id>`. On page load (after seed or demo data is ready), if the hash matches a listing the app automatically selects it in the list, flies the map to the marker, and opens the product card. The product card includes a “Copy link” button. Closing the card (or Escape) clears the hash. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Makes individual seed listings shareable and bookmarkable, improving the undeployed exploration and demo experience without inventing new features.

**How:** One commit. Updated `js/cards.js` (hash update on showProduct, copyListingLink, clear on close/delete), `js/main.js` (tryOpenDeepLink after fetchListings + Escape clear), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Category legend on map for better demo marker UX

**What:** Added a compact bottom-left Leaflet control that lists the known categories with their colored swatches (produce, dairy, eggs, grains, herbs, honey). Matches the existing category marker colors. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the category-colored markers so buyers can immediately understand what the dots mean without guessing, improving the undeployed map exploration experience.

**How:** One commit. Updated `js/map.js` (addLegend helper using CATEGORY_COLORS, called from initMap), `css/main.css` (map-legend + swatch styles, mobile tweak), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Distance radius filter after Locate me for better demo map UX

**What:** Added a “Max distance (km)” number input to the filter card. After Locate me, listings farther than the entered radius are hidden from both the sidebar and the map. A translucent dashed circle is drawn on the map around the user. Clear filters resets it. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements Locate me + distance sort: buyers can now focus on nearby seed listings (Colorado-focused) without leaving the app.

**How:** One commit. Updated `index.html` (radius input in filter card), `js/list.js` (radius in activeFilters, haversine filter, bind + clear), `js/map.js` (setRadiusCircle helper), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: In-app deploy commands modal for better seed/demo UX

**What:** Added a “View deploy steps” link on the seed/demo banner and in the options menu. Opens a modal with the exact P1 wrangler commands (login, d1 execute, deploy, API base, health check) plus a Copy button. Escape and click-outside close the modal. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Users in the undeployed experience can now see and copy the precise next steps without leaving the app or hunting in the README.

**How:** One commit. Updated `index.html` (banner button + deploy-guide modal), `css/main.css` (banner flex + pre styles), `js/main.js` (open/close/copy handlers + Escape), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Sort control in filter card for better demo list UX

**What:** Added a “Sort by” select to the filter card (Default, Distance after Locate me, Price low→high, Price high→low, Name A–Z). Selecting Distance without a prior Locate me prompts the user. Distance labels still appear on cards only when distance sort is active. Clear filters resets the sort. Fully client-side; works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Builds on Locate me + distance labels so buyers can also order by price or name without reloading. Improves scan-and-compare in the undeployed experience.

**How:** One commit. Updated `index.html` (sort select in filter card), `js/list.js` (general sort modes, auto-set on Locate me, distance-label gating, clear reset), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Distance sort after Locate me for better demo exploration

**What:** After a successful “Locate me”, the sidebar list reorders by straight-line distance to the user and shows a compact distance label (m or km) on each listing card. Filters continue to apply; the sort sticks until page reload or clear. Fully client-side and works in pure seed/demo mode with no Worker.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements Locate me + Fit all: users can now quickly see the nearest seed listings (Colorado-focused) after centering the map on themselves.

**How:** One set of commits. Updated `js/map.js` (expose user coords + call sort), `js/list.js` (haversine, sort, distance labels), `css/main.css` (distance style), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Fit all listings control for better demo map navigation

**What:** Added a “Fit all” button (👀) in the top bar next to Locate me. Clicking it resets the Leaflet map view to fit all currently rendered markers (respects active filters). Fully functional in seed/demo mode with no Worker required.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the Locate me control: after centering on the user or after filtering, one click restores the full set of listings. Improves exploration of the geographically spread seed data.

**How:** One commit. Updated `index.html` (button), `js/map.js` (fitAll helper using marker cluster bounds or fallback latlngs), `js/main.js` (event binding), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: Locate me geolocation control for better demo map UX

**What:** Added a “Locate me” button (📍) in the top bar. Clicking it requests the browser geolocation, centers the Leaflet map on the user, and drops a temporary blue circle marker with popup. Fully functional in seed/demo mode with no Worker required. Button disables briefly while locating and re-enables on success or error.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Improves exploration of the geographically spread seed listings and makes the undeployed experience more interactive.

**How:** One commit. Updated `index.html` (button), `js/map.js` (locateMe + user marker), `js/main.js` (event binding), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: richer seed data for better demo map experience

**What:** Expanded `data/seed-listings.json` from 6 to 10 listings. Added geographic variety (Boulder apples, Castle Rock cheese, Westminster berries, Colorado Springs oats) while keeping all fields schema-compliant and using realistic Unsplash images. Demo mode and seed fallback now show a denser, more interesting map with clustering opportunities.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). A richer seed makes the undeployed experience more representative of a real marketplace and improves testing of map, filters, cards, and list panel.

**How:** One commit. Updated seed JSON, marked new P2 item complete in GOAL.md, appended this entry, updated last-updated note. Existing demo localStorage copies will continue; users can use “Reset demo listings” in the options menu to pick up the new seed.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-18 – P2+: interactive demo mode with localStorage persistence

**What:** Made seed/demo mode fully interactive. When `API_BASE` is unset, create/update/delete now operate on a localStorage-backed copy of the seed listings (`fd-demo-listings`). First mutation copies seed into local storage; subsequent loads prefer the local copy. Options menu gains “Reset demo listings”. Status badge and dismissible banner distinguish pure seed vs. local demo. Form, product cards, and seller dashboard refresh correctly after mutations.

**Why:** Highest remaining pure-code item that improves the undeployed experience. All P2–P5 items were already complete and P1 remains user-only (`npx wrangler login` + documented commands). Users can now exercise the full seller flow (add, edit, delete, dashboard) immediately without a live Worker, reducing friction while waiting for deploy.

**How:** One commit. Updated `js/api.js` (demo load/save/generateId + mutation branches), `js/main.js` (source badges, banner text, reset handler, deploy-status message), `index.html` (reset menu item), `GOAL.md` (new P2 sub-item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. Local demo data is ignored once a real API_BASE is set.

---

