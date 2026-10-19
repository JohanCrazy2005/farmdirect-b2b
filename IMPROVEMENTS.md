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

**What:** Added a “Fit all” button (🔚) in the top bar next to Locate me. Clicking it resets the Leaflet map view to fit all currently rendered markers (respects active filters). Fully functional in seed/demo mode with no Worker required.

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

