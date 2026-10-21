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
