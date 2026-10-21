## 2026-10-21 – P2+: Persist Locate me location in localStorage

**What:** After a successful Locate me, the user’s latitude, longitude, and accuracy are saved to localStorage (`fd-user-location`). On reload the blue “you are here” marker, accuracy circle, clear-location button, and distance sort are restored automatically (no new geolocation prompt). Clearing the location also removes the saved data. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the already-persisted map view — longer demo exploration sessions now keep both the map region and the buyer’s location context across reloads.

**How:** One commit. Updated `js/map.js` (load/save/restore helpers, call on successful locateMe and clearLocation, delayed restore after init). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Shareable map view via URL hash (#map=lat,lng,zoom)

**What:** Options menu now has a “Copy map view link” button that copies a URL containing the current map center + zoom as `#map=lat,lng,zoom`. On load, if the hash matches that pattern the map restores exactly that view (preferring it over localStorage), then persists it. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Complements the existing filter deep-links and persisted map view — buyers can now share a precise map region (e.g. after Locate me or filtering) so another session or colleague lands on the same view.

**How:** One commit. Updated `js/map.js` (parseMapHash + prefer hash on init, getMapViewLink helper). Updated `index.html` (new options button). Updated `js/main.js` (wire copy button + toast). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Persist map view in localStorage (center + zoom)

**What:** Map now saves its center and zoom to localStorage (`fd-map-view`) on every `moveend` and restores that view on init. The initial auto-fit to all markers is skipped when a saved view exists, so reloads resume exactly where the user left the map. Fit-all, Locate me, and fly-to still work and update the saved view. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Makes longer demo exploration sessions continuous — buyers can pan to a region of interest, reload, and stay there instead of snapping back to the full seed bounds.

**How:** One commit. Updated `js/map.js` (load/save helpers, restore in `initMap`, `moveend` listener, conditional skip of first auto-fit). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-21 – P2+: Recently viewed listings (options menu modal)

**What:** Added a “Recently viewed” button in the options menu that opens a modal listing the last 8 product cards opened in this browser (stored in localStorage `fd-recent`). Each entry shows a thumbnail, title, price/units and category; clicking it closes the modal and opens the product card (via `FD_LIST.select` or `FD_CARDS.showProduct`), flying to the marker. A clear button resets the list. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Makes multi-listing exploration in the undeployed demo faster — buyers can jump back to listings they just inspected without searching again.

**How:** One commit series. New substantial module `js/recent.js` (track/open/render/clear/bind). Updated `index.html` (options button + modal + script). Updated `js/cards.js` (track on `showProduct`). Updated `js/main.js` (wire button + bind). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Clickable RFQs in seller dashboard inbox (open product card)

**What:** Enhanced the seller dashboard Incoming quote requests so each RFQ shows a “View listing” button. Clicking it closes the dashboard and opens the matching product card (via `FD_LIST.select` or `FD_CARDS.showProduct`), flying to the marker when possible. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Sellers can now jump straight from an incoming quote to the listing without leaving the dashboard context, tightening the demo B2B request loop (mirrors the buyer-side clickable RFQs).

**How:** One commit. Updated `js/dashboard.js` (`openListingFromRfq` + “View listing” button + event wiring in RFQ render). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: Clickable RFQs in buyer My quote requests (open product card)

**What:** Enhanced the buyer “My quote requests” modal so each quote request shows a “View listing” button. Clicking it closes the modal and opens the matching product card (via `FD_LIST.select` or `FD_CARDS.showProduct`), flying to the marker when possible. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Buyers can now jump straight from a submitted quote back to the listing without hunting through the sidebar or map, tightening the demo B2B request loop.

**How:** One commit. Updated `js/rfq.js` (`openListingFromRfq` + “View listing” button + event wiring in `renderMyRfqs`). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

## 2026-10-20 – P2+: My quote requests buyer view (seed/demo UX)

**What:** Added a "My quote requests" button in the options menu that opens a modal listing every quote request stored in localStorage (`fd-rfqs`). Each entry shows the matching listing title (looked up from current data), quantity, message, and timestamp. A clear button removes all RFQs. Fully client-side; works in pure seed/demo mode.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Sellers already see incoming RFQs in the dashboard; buyers in the undeployed demo can now review the quotes they submitted, completing the request loop without a live Worker.

**How:** One commit. Updated `index.html` (options button + modal). Updated `js/rfq.js` (`openMyRfqs` / `renderMyRfqs` + clear handler + Escape close). Updated `js/main.js` (wire button). Updated `GOAL.md` (new completed P2 item + last-updated) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

(Previous entries continue as before.)
