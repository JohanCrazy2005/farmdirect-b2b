## 2026-11-01 – Fix HTML escaping in sidebar list (seed/demo UX)

**What:** Corrected the broken `escapeHtml` helper in `js/list.js`. It previously replaced special characters with themselves (no-op), so titles, categories, seller names, or descriptions containing `& < > "` could break the sidebar list HTML or introduce markup. It now properly escapes to `& < > "` matching the safe implementation already used in product/seller cards.

This makes list rendering robust for any seed/demo data and prevents display issues or injection when exploring offline.

**How:** Updated only the four `.replace` lines inside `escapeHtml` in `js/list.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---

## 2026-11-01 – Quick Favorites toggle in sidebar (seed/demo UX)

**What:** Added a “Favorites” quick-toggle button in the sidebar tools (next to Nearby). It turns the existing favorites-only filter on/off with one click, highlights when active, and stays in sync with the filter card checkbox and removable chips. Complements Nearby, Random, and Group-by-seller for faster exploration of starred listings in seed/demo mode.

Fully client-side; works offline with seed data.

**How:** Button in `index.html`, toggle + visual state in `js/list.js` (also highlights Nearby for consistency). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** Optional user actions remain: RFQ migration (`npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql`) and GitHub Actions secrets. Seed/demo continues to work fully client-side.

---
