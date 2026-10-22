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

## 2026-10-22 – P3: Explicit published status in seed data for consistent demo fallback

**What:** Added `"status": "published"` to every listing in `data/seed-listings.json`. Updated Done table and last-updated note in `GOAL.md`.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. Explicit status makes the seed/demo fallback match the publication workflow (public views filter to published) out of the box, without relying solely on the ensureStatus helper. Supports P3.3 demo mode while waiting on the user step.

**How:** Data + docs only. No new features or second Worker.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3: Auth column-error button opens deploy modal

**What:** Updated `js/auth.js` so a detected D1 column-missing error renders a "Show migration command" button that closes the auth modal and opens the deploy modal (with the exact `npx wrangler d1 execute` command). Updated Done table and last-updated note in `GOAL.md`.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. Previous text-only error was helpful; a one-click path to the command reduces friction without new features or a second Worker.

**How:** Frontend-only change in the existing auth module + docs. Deploy modal already contains the full command block.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3: Clarify seed banner and dashboard auth notes

**What:** Updated seed-banner default text in `index.html` and dynamic logic in `js/main.js` so it accurately describes demo mode when no API base is set. Updated the temporary-seller note in `js/dashboard.js` to point to the exact migration command and Options menu. Refreshed last-updated note in `GOAL.md`.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. Clearer UI copy reduces confusion about demo vs live and where to find the one remaining command, without adding features.

**How:** Frontend text + banner logic + docs only. Same single-Worker architecture.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3: Clarify sole remaining user step is D1 auth migration

**What:** Updated `GOAL.md` last-updated note and Done table to explicitly state that the sole remaining blocker for live sessions is the user-owned D1 migration. Enhanced the in-app deploy modal in `index.html` with clearer title, full command block including the ignore-duplicate note, and confirmation that Worker is already deployed.

**Why:** Highest unfinished item remains the user action on D1 `b2bistening`. All code (Worker auth routes, frontend modal, dashboard publish controls, error UX) is ready. Clearer status and modal unblocks the user without new features.

**How:** Docs + HTML modal text only. Same single-Worker architecture.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3: Clearer auth error when D1 migration not applied

**What:** Updated `js/auth.js` so the login/register modal detects D1 "no column named …" (email / password_hash / password_salt) errors returned as Internal error and shows the exact `npx wrangler d1 execute` command. Help text in the modal now points to the migration.

**Why:** Highest unfinished item is still the user-owned D1 migration. Live register fails with a column error; surfacing the precise fix in the UI unblocks the user without new features or a second Worker.

**How:** Frontend-only change in the existing auth module. Worker already returns the D1 message on 500.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – P3: Make auth-migration.sql immediately executable

**What:** Updated `schema/auth-migration.sql` so the three `ALTER TABLE sellers ADD COLUMN` statements (email, password_hash, password_salt) are active instead of commented. Cleaned comments to say "ignore duplicate column name errors". Minor refresh of the P3 section in `README.md` and the last-updated note in `GOAL.md`.

**Why:** Highest unfinished item remains the user-owned D1 migration. Live register currently fails with `table sellers has no column named email` because the original sellers table lacks the auth columns. Making the ALTERs executable unblocks the user without inventing new features. Worker auth routes are already deployed.

**How:** Schema + docs only. Same single-Worker architecture.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (or pastes the file in the D1 Console). Ignore duplicate-column errors. Then register/login + publish workflow works end-to-end.

---

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
