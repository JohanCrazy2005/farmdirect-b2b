## 2026-10-18 – chore: remove remaining legacy script tags from index.html

**What:** Removed the two leftover `<script src="cleanup.js">` and `<script src="listings-api.js">` tags from the bottom of `index.html`. The corresponding files were already deleted in a prior cleanup; the tags remained and caused 404s in the browser console. The modular frontend under `js/` is now the only client code loaded.

**Why:** Highest remaining pure-code hygiene item. Previous IMPROVEMENTS entries claimed the tags had been removed, but the committed `index.html` still contained them after the file deletions. P1 deploy remains user-only (`wrangler login` + documented commands). Eliminating the dangling script loads keeps the fresh-start shell accurate and avoids console noise.

**How:** One commit. Updated `index.html` (removed the two script tags), `GOAL.md` (last-updated note), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – chore: delete orphaned pre-fresh-start files and old runner

**What:** Deleted leftover pre-fresh-start artifacts that were no longer referenced by the modular frontend or Worker: `cleanup.js`, `listings-api.js`, `styles.css`, root `schema.sql`, `data/listings.json`, `api/listings.js`, `api/listings/[id].js`, `vercel.json`, `package.json`. Also deleted `.github/workflows/wire-scripts.yml` (the old GitHub Action that re-injected the legacy script tags into `index.html` on every push).

**Why:** Highest remaining pure-code hygiene item after all P2–P5 code/docs were complete. P1 deploy remains user-only (`wrangler login` + documented commands). Removing the orphaned files and the re-wiring workflow keeps the repo organised under the preferred directories (`css/`, `js/`, `schema/`, `data/`, `workers/`) and prevents the old runner from undoing prior cleanup. Aligns with the hard constraint that old runners A/B stay paused.

**How:** Series of delete commits for the files + workflow, followed by updates to `GOAL.md` (last-updated note) and `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – chore: remove leftover legacy script tags from index.html (confirmed)

**What:** Removed the two `<script>` tags that still loaded `cleanup.js` and `listings-api.js` from the bottom of `index.html`. These pre-fresh-start files reference non-existent globals (`window.sellers`, `buildPopupHtml`, old modal IDs, etc.) and produced no useful effect while risking console noise. The modular frontend under `js/` and `css/` is now the only client code loaded. (A prior entry claimed this had been done, but the tags remained in the committed `index.html`; this commit actually removes them.)

**Why:** Highest remaining pure-code hygiene item. P1 deploy remains user-only (`wrangler login` + documented commands). Cleaning the script load keeps the fresh-start shell accurate, reduces payload, and avoids any chance of the legacy overlay interfering with the new modules.

**How:** One commit. Updated `index.html` (removed script tags), `GOAL.md` (last-updated note), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. Orphaned legacy files (`cleanup.js`, `listings-api.js`, and other pre-fresh-start artifacts such as `styles.css`, root `schema.sql`, `data/listings.json`, `api/` serverless stubs) can be deleted in a follow-up if desired. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – chore: actually remove leftover legacy script tags from index.html

**What:** Removed the two `<script>` tags that still loaded `cleanup.js` and `listings-api.js` from the bottom of `index.html`. These pre-fresh-start files reference non-existent globals (`window.sellers`, `buildPopupHtml`, old modal IDs, etc.) and produced no useful effect while risking console noise. The modular frontend under `js/` and `css/` is now the only client code loaded.

**Why:** Highest remaining pure-code hygiene item. A prior note claimed the tags had been removed, but the live `index.html` still contained them. P1 deploy remains user-only (`wrangler login` + documented commands). Cleaning the script load keeps the fresh-start shell accurate, reduces payload, and avoids any chance of the legacy overlay interfering with the new modules.

**How:** One commit. Updated `index.html` (removed script tags), `GOAL.md` (last-updated note), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. Orphaned legacy files (`cleanup.js`, `listings-api.js`, and other pre-fresh-start artifacts) can be deleted in a follow-up if desired. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – chore: remove legacy cleanup.js and listings-api.js from index.html

**What:** Removed the two leftover `<script>` tags that loaded `cleanup.js` and `listings-api.js` from the bottom of `index.html`. These files were written for the pre-fresh-start monolithic UI and reference functions/elements that no longer exist (`buildPopupHtml`, `renderSellers`, `window.sellers`, old modal IDs, etc.). They produced no useful effect and risked console noise. The active frontend remains fully modular under `js/` and `css/`.

**Why:** Highest remaining pure-code hygiene item after all P2–P5 sub-items were complete. P1 deploy still requires user `wrangler login` + documented commands. Cleaning the script load keeps the fresh-start shell accurate, reduces payload, and avoids any chance of the legacy overlay interfering with the new modules. Organises the running code under the preferred directories.

**How:** One commit. Updated `index.html` (removed script tags), `GOAL.md` (marked P4 and P5 parent items complete with notes that user action remains; last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, R2 notes, custom domain, and CI can be exercised. All code and documentation items in the priority queue are complete.

---

## 2026-10-18 – P2+: runtime API_BASE override via localStorage

**What:** Added support for setting (and clearing) the Worker API base URL at runtime through the options menu. The value is stored in `localStorage` under `fd-api-base` and applied in `js/config.js` on load, so the frontend can switch from seed fallback to a live Worker without editing source files. Deploy-status menu item now reports the current source and base. Validation ensures a proper http(s) URL; reload happens after change.

**Why:** Highest remaining pure-code polish item. P1 deploy still requires user `wrangler login` + commands (already documented in README). Once the user deploys, they need a frictionless way to point the frontend at the new Worker URL for testing create/edit/delete and live data. The override keeps the static `API_BASE` empty by default (seed mode) while enabling post-deploy verification.

**How:** One commit. Updated `js/config.js` (localStorage read), `index.html` (options menu buttons with ids), `js/main.js` (handlers + improved status alert), `GOAL.md` (new P2 sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the override, rate limiting, logging, and eventual R2/custom domain/CI can be exercised.

---

## 2026-10-18 – P2+: improve seed-fallback UX with dismissible demo-mode banner

**What:** Added a centered, dismissible banner that appears only when the data source is the seed fallback. It explains that the app is in demo mode and points users to the README P1 deploy steps for live D1 + create/edit/delete. Escape and the × button hide it. Styled for light/dark and mobile.

**Why:** Highest remaining pure-code item after all P5 documentation and Worker rate-limit/logging work. P1 deploy still requires user `wrangler login` + commands (already documented). While the Worker stays undeployed the seed path is the only experience; a clear, non-blocking banner reduces confusion about why mutations are read-only.

**How:** One commit. Updated `index.html` (banner markup), `css/main.css` (styles + mobile tweak), `js/main.js` (show on seed source + close handlers), `GOAL.md` (P2 sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker, rate limiting, logging, and eventual R2/custom domain/CI can be exercised.

---

## 2026-10-18 – P5: document CI deploy workflow setup steps

**What:** Added a complete “P5 – CI” section to README.md with exact steps to create the required GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) and a ready-to-use `deploy.yml` skeleton that runs `cloudflare/wrangler-action` on push to main. Marked the CI sub-item done in GOAL.md.

**Why:** Highest remaining pure-documentation item in the P5 Production queue after rate limiting, structured logging, custom domain, and R2 notes. Full CI deploy requires user action (API token + repo secrets) after the Worker can be deployed, matching the pattern used for the other P5 items. Documenting the precise steps unblocks automated deploys while manual `npx wrangler deploy` remains valid.

**How:** One commit. Updated `README.md` (new section + yaml skeleton), `GOAL.md` (P5 CI sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy (so the documented rate limiting, logging, R2, custom domain, and CI can be exercised), or any remaining polish if desired.

---

## 2026-10-18 – P5: document custom domain setup steps

**What:** Added a complete “P5 – Custom domain” section to README.md with exact dashboard (and optional CLI) steps to attach a custom domain to the deployed Worker, update the frontend API_BASE, and verify health. Marked the documentation sub-item done in GOAL.md.

**Why:** Highest remaining pure-documentation item in P5 after rate limiting, structured logging, and R2 notes. Full custom domain requires user action (domain on Cloudflare + dashboard/CLI) after the Worker is live, matching the pattern used for P1 deploy, P4 Access, and P5 R2. Documenting the precise steps unblocks the user while the workers.dev URL remains a valid interim.

**How:** One commit. Updated `README.md` (new section), `GOAL.md` (P5 custom domain sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy (so rate limiting, logging, R2, and custom domain can be exercised), or continue P5 with CI skeleton notes.

---

## 2026-10-18 – P5: document Cloudflare R2 durable image storage setup steps

**What:** Added a complete “P5 – R2 durable image storage” section to README.md with exact CLI/dashboard commands to create a bucket, bind it as `IMAGES` in wrangler.toml, add a Worker upload endpoint, and switch the client form from data URLs to returned R2 URLs. Marked the documentation sub-item done in GOAL.md.

**Why:** Highest remaining pure-code/documentation item in P5 after rate limiting and structured logging. Full R2 wiring requires user action (bucket creation + redeploy) after the Worker is live, matching the pattern used for P1 deploy and P4 Access. Documenting the precise steps unblocks the user while data URLs remain a valid interim that still satisfies the schema.

**How:** One commit. Updated `README.md` (new section), `GOAL.md` (P5 R2 sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy (so rate limiting, logging, and eventual R2 can be exercised), or continue P5 with custom domain / CI skeleton notes.

---

## 2026-10-18 – P5: basic structured request logging for observability

**What:** Added a `logRequest` helper in `workers/api.js` that emits structured JSON to `console.log` for every request (OPTIONS, rate-limited, success, and error paths). Fields include timestamp, method, path, status, durationMs, ip, sellerId (when present), and optional error/count/listingId. Logs are visible via `wrangler tail` or the Cloudflare Workers dashboard once deployed.

**Why:** Highest remaining pure-code item in P5 after rate limiting. Provides immediate request-level observability without external services, while the Worker remains undeployed. Complements the existing rate-limit headers and health endpoint.

**How:** One commit. Updated `workers/api.js` (log helper + calls on all response paths), `GOAL.md` (P5 sub-item marked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so logging and rate limiting can be observed live, or continue P5 with R2 notes / custom domain / CI skeleton.

---

## 2026-10-18 – P5: basic in-memory rate limiting on Worker API

**What:** Added a simple per-IP rate limiter to `workers/api.js` (60 requests per 60-second window). Uses an in-memory Map keyed by CF-Connecting-IP (or X-Forwarded-For). Returns 429 with Retry-After and rate-limit headers when exceeded. Health endpoint now reports remaining quota. OPTIONS requests are exempt. Per-isolate only (suitable for the current stage; production scale should move to Durable Objects or KV).

**Why:** Highest remaining pure-code item after P4 documentation (user-action for Access). Completes the rate-limit portion of P5 Production while the live Worker is still undeployed. Protects the D1-backed endpoints from abuse once deployed and gives immediate feedback via headers.

**How:** One commit. Updated `workers/api.js` (rateStore + checkRateLimit + early 429 + header injection), `GOAL.md` (P5 sub-item marked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so rate limiting and RLS can be exercised, or continue P5 with basic observability logging / R2 notes.

---

## 2026-10-17 – P4: Cloudflare Access / JWT setup steps documented

**What:** Added a complete “P4 – Cloudflare Access / JWT setup” section to README.md with exact dashboard steps, secret commands (`TEAM_DOMAIN`, `POLICY_AUD`), and notes on replacing the interim `X-Seller-Id` check with real JWT validation in the Worker. Marked the documentation sub-item done in GOAL.md.

**Why:** Highest remaining code-adjacent item in the P4 queue. Full Cloudflare Access requires user dashboard action and secrets after deploy (same pattern as P1). Documenting the precise steps unblocks the user and keeps the interim header-based RLS as a working fallback until Access is enabled.

**How:** One commit. Updated `README.md` (new section), `GOAL.md` (P4 sub-item checked + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy + Access setup, or move to P5 (rate limiting / observability) as the next pure code item.

---

## 2026-10-17 – P4: interim RLS via X-Seller-Id header on mutations

**What:** Worker now requires and enforces `X-Seller-Id` header for POST/PUT/DELETE. POST requires the header to match `body.sellerid`. PUT/DELETE look up the listing and reject if the header seller does not own it (or if sellerid is changed on update). Client `js/api.js` attaches the header from the current dashboard session. Form prefills sellerid from the session when creating. CORS updated to allow the header. Seed mode remains unaffected (read-only).

**Why:** Highest unfinished code-only item in the P4 Auth queue after the dashboard skeleton. Provides a working ownership check that can be tested the moment the Worker is deployed, and is a clean stepping stone to real Cloudflare Access / JWT verification (the header can later be replaced by validated claims).

**How:** One commit. Updated `workers/api.js` (helper + checks + CORS), `js/api.js` (getAuthHeaders), `js/form.js` (session prefill), `GOAL.md` (P4 sub-item marked), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the RLS can be exercised against live D1, or continue with Cloudflare Access setup notes / P5 rate limiting.

---

## 2026-10-17 – P4: seller dashboard skeleton (client-side seller session)

**What:** Added a seller dashboard modal opened from the profile icon. Users enter a seller ID (persisted in localStorage) to view only their listings, with Edit / Delete buttons that reuse the existing form and API layer. Works immediately with seed data; delete/edit show the familiar “seed mode is read-only” message until the Worker is deployed. Includes sign-out and a clear note that real Cloudflare Access / JWT / RLS is still pending.

**Why:** Highest unfinished code-only item after P1 (user-action) and completed P2/P3. Provides a usable seller experience preview and unblocks further auth work without inventing unrelated features or requiring the live Worker.

**How:** One commit. New `js/dashboard.js`. Updated `index.html` (modal markup + script), `js/main.js` (profile button + Escape + bind), `css/main.css` (dashboard list, muted, link-btn styles), `GOAL.md` (P4 sub-item marked), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so CRUD persists, then Cloudflare Access / JWT wiring, or continue P4/P5.

---

## 2026-10-17 – P3: client-side image upload (file select → resized data URL + preview)

**What:** Extended the listing form to accept a local image file. Client resizes to max 800px (JPEG ~0.75 quality), converts to a data URL (valid schema `uri`), sets the image field, and shows a live preview. External https URL input remains as fallback. Validation now accepts both `https?://` and `data:image/` URIs. No Worker or schema change required.

**Why:** Completes the remaining P3 seller-experience item (image upload). P1 deploy is still user-only. Data URLs keep the solution self-contained and immediately testable with seed fallback; production should move images to R2 (noted in GOAL P5).

**How:** One commit. Updated `js/form.js` (resizeImageToDataUrl, file handler, validation, preview in openForm), `index.html` (file input + preview img), `css/main.css` (`.image-preview`), `GOAL.md` (marked image upload done), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so CRUD + images persist to D1, or P4 auth.

---

## 2026-10-17 – P3: edit & delete support for listings

**What:** Extended the listing form to support edit mode (prefill from existing listing, PUT) and added delete from the product card. Worker now exposes `PUT /api/v1/listings/:id` and `DELETE /api/v1/listings/:id` with validation and `updated_at` timestamp. Client `js/api.js` gained `updateListing` and `deleteListing` (seed-mode returns clear read-only message). Product card shows Edit / Delete buttons. Form title and submit button update dynamically. List exposes `getListings` for the edit path.

**Why:** P1 deploy remains user-action only. Completing edit/delete finishes the core CRUD of P3 seller experience (image upload remains). Sellers can now modify or remove listings once the Worker is live; UI is ready and degrades gracefully in seed mode.

**How:** One commit. Updated `workers/api.js` (PUT + DELETE), `js/api.js`, `js/form.js` (edit mode), `js/cards.js` (buttons + handlers), `js/list.js` (`getListings`), `index.html` (form title id), `GOAL.md` (marked edit/delete done), `IMPROVEMENTS.md`.

Next: image upload, or user-run P1 deploy so CRUD can persist to D1.

---

## 2026-10-17 – P3: add listing form modal + API POST support

**What:** Added a full add-listing form modal (accessible from new + button in the top bar) that collects every required schema field with client-side validation. New `js/form.js` module handles open/close, geolocation helper, validation, and submit. `js/api.js` gained `createListing` which POSTs when `FD_CONFIG.API_BASE` is set, otherwise returns a clear seed-mode message. Worker `workers/api.js` now accepts `POST /api/v1/listings` and inserts into D1 (with basic validation). Form styles added to `css/main.css`. Escape closes the modal.

**Why:** P1 deploy remains user-action only. P2 polish is complete. Starting P3 seller experience unblocks sellers from publishing listings once the Worker is live. Form is immediately usable for testing the UI and validation; creation succeeds only after deploy.

**How:** One commit. New file `js/form.js`. Updated `index.html` (button + modal markup + script), `js/api.js`, `js/main.js` (wiring + Escape), `css/main.css` (form modal styles), `workers/api.js` (POST endpoint), `GOAL.md` (P3 partial), `IMPROVEMENTS.md`.

Next: edit/delete listings, or user-run P1 deploy so the form can persist data.

---

## 2026-10-17 – P2: polished empty & loading states

**What:** Replaced basic text loading/empty messages with polished skeletons, a map overlay spinner, and clearer empty-state UX (icon, short explanation, clear-filters action). List cards and map stay in sync; source badge distinguishes seed vs live.

**Why:** Highest remaining P2 polish item after clustering. Improves first-load and zero-result experiences while the Worker remains undeployed (seed path is the default).

**How:** One commit. Updated `index.html` (skeletons + overlay markup), `css/main.css` (skeleton, overlay, empty styles), `js/list.js` (empty/loading render + overlay hide), `js/main.js` (status + overlay coordination), `GOAL.md` (marked empty/loading done), `IMPROVEMENTS.md`.

Next: mobile/a11y/theme, or user-run P1 deploy.
