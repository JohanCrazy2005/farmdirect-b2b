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

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---
