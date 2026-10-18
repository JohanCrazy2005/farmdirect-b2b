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

**What:** Replaced basic text loading/empty with skeleton cards in the list, a map loading overlay with spinner, and richer empty states that distinguish “no data at all” from “no filter matches”. Empty list offers a clear-filters button when filters are active. Map overlay reappears with a message when the filtered set is empty.

**Why:** P1 deploy remains user-action only (commands in README). Completing the remaining P2 empty/loading item improves perceived performance and clarity while the Worker is still undeployed and only seed data is available.

**How:** One commit. Updated css/main.css (skeletons, shimmer, map-overlay, improved empty-state), index.html (skeleton placeholders + map overlay), js/list.js (smarter empty rendering + overlay control), js/main.js (hide overlay after fetch), GOAL.md (marked empty/loading done), IMPROVEMENTS.md.

Next: user-run P1 deploy, or move to P3 seller listing form.

---

## 2026-10-17 – P2: fuller marker clustering (custom icons, spiderfy, category markers)

**What:** Upgraded Leaflet marker clustering from basic MarkerClusterGroup to a polished version with custom count-based cluster icons (small/medium/large, primary-colored), category-tinted individual markers, spiderfyOnMaxZoom, disableClusteringAtZoom: 15, zoomToBoundsOnClick, and improved flyTo that opens popups after zoom. Added matching CSS.

**Why:** P1 deploy remains user-action only (commands in README). Completing the remaining P2 clustering item gives a cleaner map experience with seed data while the Worker is undeployed.

**How:** One commit. Updated js/map.js (iconCreateFunction, category divIcons, fuller options), css/main.css (cluster and marker styles), GOAL.md (marked clustering done), IMPROVEMENTS.md.

Next: remaining P2 empty/loading state refinements or user-run deploy, then P3 seller form.

---

## 2026-10-17 – P2 polish: mobile bottom-sheet, a11y, theme system preference

**What:** Enhanced mobile experience with a collapsible bottom-sheet sidebar, improved accessibility (ARIA attributes, focus-visible rings, keyboard Escape to close overlays, role/button on sidebar header), refined theme handling that respects prefers-color-scheme and persists choice, and a simple options dropdown menu. Removed legacy script tags from index.html.

**Why:** P1 deploy remains user-action only (commands already in README). This completes the mobile/a11y/theme portion of P2 polish while the Worker stays undeployed. Seed fallback UX continues to work immediately.

**How:** One commit. Updated css/main.css (mobile media query + focus styles + options menu), js/main.js (theme init with system preference, options menu, sidebar toggle, Escape handler), index.html (ARIA, options menu markup, removed old scripts). GOAL.md marked the item done.

Next: remaining P2 (fuller marker clustering refinements) or user-run deploy, then P3 seller form.

---

## 2026-10-17 – Modular frontend (css/js) + improved seed-fallback UX

**What:** Replaced the monolithic index.html with a clean modular shell and extracted substantial modules under css/ and js/. Implemented transparent top bar, filter card, product + seller cards, side list synced with map, Leaflet + optional marker clustering, and a robust data layer that falls back to data/seed-listings.json when the Worker is not yet deployed.

**Why:** P1 deploy requires user wrangler login / secrets, so exact commands stay documented in README. Completing the missing frontend files unblocks P2 polish and gives a usable map experience immediately via seed data (Denver-area listings).

**How:** One commit. New files: css/main.css, js/config.js, js/api.js, js/map.js, js/cards.js, js/list.js, js/main.js, slim index.html. Old large index.html replaced. Schema/seed/Worker unchanged. Source badge shows “seed fallback” vs “live API”.

Next: P2 polish (mobile layout refinements, a11y, fuller clustering) or user-run deploy.

---

## 2026-10-17 – Fresh-start foundation: schema, seed, wrangler, Worker skeleton + P1 deploy docs

**What:** Added the canonical schema (`schema/listings.schema.json`, `schema/d1-schema.sql`), seed data (`data/seed-listings.json`) matching the required fields, `wrangler.toml` with the existing D1 binding, a minimal Worker (`workers/api.js`) exposing `/api/v1/health` and listings endpoints, and documented the exact `wrangler` commands needed for P1 deploy in README.md.

**Why:** P0 claimed the foundation but the new files were missing from the tree. P1 deploy steps require user login/secrets, so the commands are now explicit. This unblocks the next code-only polish items while keeping the live Worker undeployed until the user runs the commands.

**How:** One commit via push_files. Schema is strict (no additionalProperties). Worker maps D1 rows back to the nested `location` shape. Seed uses Denver-area coordinates for local testing. Old Vercel/Turso paths remain for reference but are no longer the primary path.

Next: complete modular frontend (css/main.css, js/* ) and seed-fallback UX, then marker clustering / empty states (P2).

---

(Older entries from previous cycles remain in git history.)
