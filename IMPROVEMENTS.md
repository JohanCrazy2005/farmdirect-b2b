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
