## 2026-10-18 – P2+: interactive demo mode with localStorage persistence

**What:** Made seed/demo mode fully interactive. When `API_BASE` is unset, create/update/delete now operate on a localStorage-backed copy of the seed listings (`fd-demo-listings`). First mutation copies seed into local storage; subsequent loads prefer the local copy. Options menu gains “Reset demo listings”. Status badge and dismissible banner distinguish pure seed vs. local demo. Form, product cards, and seller dashboard refresh correctly after mutations.

**Why:** Highest remaining pure-code item that improves the undeployed experience. All P2–P5 items were already complete and P1 remains user-only (`npx wrangler login` + documented commands). Users can now exercise the full seller flow (add, edit, delete, dashboard) immediately without a live Worker, reducing friction while waiting for deploy.

**How:** One commit. Updated `js/api.js` (demo load/save/generateId + mutation branches), `js/main.js` (source badges, banner text, reset handler, deploy-status message), `index.html` (reset menu item), `GOAL.md` (new P2 sub-item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. Local demo data is ignored once a real API_BASE is set.

---

## 2026-10-18 – docs: correct outdated wire-scripts.yml reference in README

**What:** Updated the P5 CI section in `README.md` to remove the outdated note that `wire-scripts.yml` “should be left alone.” That workflow (which re-injected legacy script tags) was already deleted in a prior cleanup; the note was stale. Clarified that the current `.github/workflows/deploy.yml` is the active CI skeleton and that the old re-wiring workflow no longer exists.

**Why:** Highest remaining pure-documentation hygiene item. All P2–P5 code and documentation items are complete; P1 deploy remains user-only (`npx wrangler login` + commands already in README). Correcting the stale reference keeps the deploy docs accurate and prevents confusion about leftover old runners.

**How:** One commit. Updated `README.md` (CI section), `GOAL.md` (last-updated note), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – chore: remove remaining legacy script tags from index.html

**What:** Removed the two leftover `<script src="cleanup.js">` and `<script src="listings-api.js">` tags from the bottom of `index.html`. The corresponding files were already deleted in a prior cleanup; the tags remained and caused 404s in the browser console. The modular frontend under `js/` is now the only client code loaded.

**Why:** Highest remaining pure-code hygiene item. Previous IMPROVEMENTS entries claimed the tags had been removed, but the committed `index.html` still contained them after the file deletions. P1 deploy remains user-only (`wrangler login` + documented commands). Eliminating the dangling script loads keeps the fresh-start shell accurate and avoids console noise.

**How:** One commit. Updated `index.html` (removed the two script tags), `GOAL.md` (last-updated note), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. All code and documentation items in the priority queue are complete.
