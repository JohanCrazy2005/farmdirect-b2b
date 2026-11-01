## 2026-10-31 – Load pure seed data button (seed/demo UX)

**What:** Added a “Load pure seed data” button in the options menu. It clears any local demo overrides (via existing `resetDemoListings`) and reloads the canonical seed listings so the map and sidebar return to a known baseline. Complements Reload listings, Import/Export/Download, and Reset demo.

Improves offline/seed fallback UX without new features or schema changes. Useful after experimenting with local edits or when demo data becomes cluttered.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (event wiring + confirm + toast + reload). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-10-31 – Reload listings button (seed/demo UX)

**What:** Added a “Reload listings” button in the options menu that re-fetches from the live Worker or seed/demo fallback and refreshes the map + sidebar. Complements the existing Import/Export/Download/Reset demo actions and the offline banner guidance.

Improves offline/seed fallback UX without new features or schema changes. Useful after switching API base, restoring demo data, or retrying a previously empty Worker.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (event wiring + toast). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-10-31 – Import demo backup button (seed/demo UX)

**What:** Added an “Import demo backup” button in the options menu that opens a file picker for a JSON array of listings and calls the existing `FD_API.importDemoData`. On success it reloads the list so the restored data appears immediately. Complements the existing Export demo / Download backup / Reset demo actions.

Improves offline/seed fallback UX without new features or schema changes.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (file-input wiring + toast + reload). Single commit via push_files. Replaced placeholder IMPROVEMENTS.md with this entry.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---
