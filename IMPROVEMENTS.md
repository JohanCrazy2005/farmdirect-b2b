## 2026-10-22 – P3: Document exact auth-migration + Worker redeploy commands

**What:** Updated `README.md` with live URLs and a clear P3 section containing the exact `npx wrangler` commands to apply `schema/auth-migration.sql` and redeploy. Refreshed the in-app deploy modal in `index.html` to show the same auth-migration commands. Minor refresh of the last-updated note in `GOAL.md`.

**Why:** Highest unfinished item is the user-owned migration + redeploy step. Frontend and Worker code are already ready; documenting the precise commands unblocks live sessions without inventing new features.

**How:** Docs-only + modal text update. Commands match the existing `schema/auth-migration.sql` and single-Worker architecture.

**Next:** User runs the migration on D1 `b2bistening` and `npx wrangler deploy`. Then real register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3.3: Dashboard drafts / published / archived + Publish controls

**What:** Updated `js/api.js` with `fetchMyListings`, `publishListing`, `unpublishListing`, `archiveListing`. Demo mode now tracks `status` (seed defaults to published; new creates default to draft) and public list filters to published only. `js/dashboard.js` loads owner listings, groups them into Drafts / Published / Archived, and adds Publish / Unpublish / Archive / Republish buttons. Status badges added in `css/main.css`.

**Why:** Highest unfinished code-only item in GOAL.md P3.3. Frontend is now ready for the publication workflow whether the Worker is redeployed or the user stays in local demo mode.

**How:** API layer prefers live `/listings/mine` + action endpoints when `API_BASE` is set and auth headers are present; falls back to localStorage status mutations otherwise. Dashboard refreshes the public map/list after a status change.

**Next:** User runs `schema/auth-migration.sql` on D1 `b2bistening` and redeploys `workers/api.js`. Then real sessions + publish workflow work end-to-end.

---

## 2026-10-22 – P3.3: Frontend auth login/register modal + Bearer token

**What:** Added `js/auth.js` with login/register modal. Token stored in localStorage. `js/api.js` prefers `Authorization: Bearer` on mutations. Dashboard shows Sign in / Register buttons when no session (falls back to temporary seller ID for demo).

**Why:** Next code-only step after Worker/auth migration was prepared. Frontend can now talk to real sessions once the user redeploys the Worker.

**How:** New module + HTML modal + header preference + dashboard wiring. Demo mode unchanged.

**Next:** User runs `schema/auth-migration.sql` on D1 and redeploys `workers/api.js`. Then test register/login and add publish controls in dashboard.

---

## 2026-10-22 – P3: Authentication + listing publication (Worker + migration + goals)

**What:** Refocused `GOAL.md` on seller auth and draft/publish workflow. Added `schema/auth-migration.sql` (sessions table, listing `status` / `published_at`). Replaced `workers/api.js` with session-based auth (register/login/logout/me), Bearer tokens, public listings = published only, owner routes for mine/publish/unpublish/archive. Restored live `API_BASE` and map center near Cuauhtémoc in `js/config.js`.

**Why:** P1 deploy is done; interim `X-Seller-Id` is not real auth. Next product step is accounts + controlled publication of listings.

**How:** One Worker only (no new Cloudflare Worker). User runs migration SQL on D1 and redeploys the same Worker script.

**Next:** User applies migration + redeploys Worker; then frontend login UI and dashboard publish controls.

---

(Previous improvement log entries retained in git history.)
