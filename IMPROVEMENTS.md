## 2026-10-25 – Restore substantial list.js + main.css for seed/demo UX

**What:** Restored the complete `js/list.js` module (filters, chips, favorites, distance, only-in-view, keyboard nav, copy links, persistence, empty-state) and essential `css/main.css` styles so the map-first shell, sidebar, filter card, and product cards work correctly in pure seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). The list module and main stylesheet had become placeholders, breaking the core sidebar and all filter/list interactions. This code-only restoration returns the specified UI to a working state without new features or schema changes.

**How:** Frontend changes to `js/list.js` and `css/main.css`. Single commit via push_files / create_or_update_file. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---
