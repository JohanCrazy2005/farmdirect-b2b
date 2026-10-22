## 2026-10-22 – P3: Authentication + listing publication (Worker + migration + goals)

**What:** Refocused `GOAL.md` on seller auth and draft/publish workflow. Added `schema/auth-migration.sql` (sessions table, listing `status` / `published_at`). Replaced `workers/api.js` with session-based auth (register/login/logout/me), Bearer tokens, public listings = published only, owner routes for mine/publish/unpublish/archive. Restored live `API_BASE` and map center near Cuauhtémoc in `js/config.js`.

**Why:** P1 deploy is done; interim `X-Seller-Id` is not real auth. Next product step is accounts + controlled publication of listings.

**How:** One Worker only (no new Cloudflare Worker). User runs migration SQL on D1 and redeploys the same Worker script.

**Next:** User applies migration + redeploys Worker; then frontend login UI and dashboard publish controls.

---

(Previous improvement log entries retained in git history.)
