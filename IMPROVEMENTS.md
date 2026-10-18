## 2026-10-18 – P2+: interactive demo mode with localStorage persistence

**What:** Made seed/demo mode fully interactive. When `API_BASE` is unset, create/update/delete now operate on a localStorage-backed copy of the seed listings (`fd-demo-listings`). First mutation copies seed into local storage; subsequent loads prefer the local copy. Options menu gains “Reset demo listings”. Status badge and dismissible banner distinguish pure seed vs. local demo. Form, product cards, and seller dashboard refresh correctly after mutations.

**Why:** Highest remaining pure-code item that improves the undeployed experience. All P2–P5 items were already complete and P1 remains user-only (`npx wrangler login` + documented commands). Users can now exercise the full seller flow (add, edit, delete, dashboard) immediately without a live Worker, reducing friction while waiting for deploy.

**How:** One commit. Updated `js/api.js` (demo load/save/generateId + mutation branches), `js/main.js` (source badges, banner text, reset handler, deploy-status message), `index.html` (reset menu item), `GOAL.md` (new P2 sub-item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. Local demo data is ignored once a real API_BASE is set.

---

