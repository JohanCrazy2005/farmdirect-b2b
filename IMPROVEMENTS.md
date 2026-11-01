## 2026-10-31 – Import demo backup button (seed/demo UX)

**What:** Added an “Import demo backup” button in the options menu that opens a file picker for a JSON array of listings and calls the existing `FD_API.importDemoData`. On success it reloads the list so the restored data appears immediately. Complements the existing Export demo / Download backup / Reset demo actions.

Improves offline/seed fallback UX without new features or schema changes.

**How:** Frontend changes to `index.html` (button) and `js/main.js` (file-input wiring + toast + reload). Single commit via push_files. Replaced placeholder IMPROVEMENTS.md with this entry.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---
