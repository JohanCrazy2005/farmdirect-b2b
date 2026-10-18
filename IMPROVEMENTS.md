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

