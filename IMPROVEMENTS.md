## 2026-10-22 – P6: RFQ persistence foundation (schema + Worker routes + frontend API prefer)

**What:** Added `schema/rfq-migration.sql` (rfqs table with listing_id, sellerid, buyer fields, status). Extended `workers/api.js` with public `POST /api/v1/rfqs` (resolves sellerid from listing) and seller `GET /api/v1/rfqs/mine`. Updated `js/api.js` with `createRfq` / `fetchMyRfqs` that prefer the live API when `API_BASE` is set and fall back to localStorage. `js/rfq.js` submit now calls `FD_API.createRfq`. Health endpoint advertises `rfq` feature. GOAL.md and README notes refreshed.

**Why:** Highest unfinished code-only item after the user-owned D1 auth migration. RFQ was fully client-side; this prepares durable storage on the same single Worker + D1 without inventing unrelated features. Demo/local fallback remains intact.

**How:** Schema file + Worker routes + frontend data layer. User must still run `auth-migration.sql` first (sole blocker for sessions), then optionally `rfq-migration.sql`. No new Worker.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login works. Optionally run the RFQ migration for live quote storage.

---

## 2026-10-22 – Polish: Distance in list items + getListings export

**What:** Updated `js/list.js` to show distance (m or km) under each listing in the sidebar when the user has used Locate me. Added `getListings()` and exported it so the existing search typeahead (`js/search.js`) can read the current set of listings.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. This is a pure code-only polish on the core map/list experience that works in both demo and live modes, and fixes the missing export the typeahead already expected.

**How:** Frontend-only change in the listings module + docs. No new features, no second Worker, no schema change.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P5: Document GitHub Actions CI secrets for optional Worker auto-deploy

**What:** Added an "Optional: GitHub Actions auto-deploy (P5)" section to `README.md` explaining the existing `.github/workflows/deploy.yml` and the two repository secrets required (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Updated `GOAL.md` Done table, last-updated note, and the P5 CI line in later priorities.

**Why:** Highest unfinished item remains the user-owned D1 auth migration (P3). Documenting the next code-adjacent user step (CI secrets) keeps the priority queue moving without inventing features or requiring a second Worker. Secrets are user-owned, same as the migration.

**How:** Docs only. Workflow file was already present and correct.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Optionally add the CI secrets for auto-deploy.

---

## 2026-10-22 – P3: Dynamic seed banner on API fallback

**What:** Updated `js/main.js` so the seed banner appears not only when no API base is set, but also when an API base is configured and the live fetch falls back to seed/demo (or fails). Banner text now distinguishes pure demo mode from "API set but unavailable (migration pending or Worker offline)". Added a Done item in `GOAL.md` and refreshed the last-updated note.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. Improving the seed/demo fallback UX makes the fallback path clearer and more actionable when the configured live API cannot serve data yet, without new features or a second Worker.

**How:** Frontend-only change in the existing main bootstrap + docs. Banner still links to the deploy modal with the exact migration command.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

(Previous improvement log entries retained in git history.)
