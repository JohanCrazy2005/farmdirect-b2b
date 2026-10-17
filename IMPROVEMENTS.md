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
