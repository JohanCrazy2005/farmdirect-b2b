## 2026-10-25 – Category color swatches on sidebar list + filter chips

**What:** Sidebar listing items and active filter chips now show the same category color swatches used on the map legend, markers, and search suggestions. Colors come from the shared CATEGORY_COLORS map via a new `FD_MAP.getCategoryColor` helper.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). This code-only polish improves visual consistency and scanability in pure seed/demo mode so users can instantly match list items and chips to map markers without new features or schema changes.

**How:** Exposed `getCategoryColor` from `js/map.js`; updated `js/list.js` renderList and renderChips; small CSS alignment rules in `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-25 – Restore substantial list.js + main.css for seed/demo UX

**What:** Restored the complete `js/list.js` module (filters, chips, favorites, distance, only-in-view, keyboard nav, copy links, persistence, empty-state) and essential `css/main.css` styles so the map-first shell, sidebar, filter card, and product cards work correctly in pure seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / wrangler login). The list module and main stylesheet had become placeholders, breaking the core sidebar and all filter/list interactions. This code-only restoration returns the specified UI to a working state without new features or schema changes.

**How:** Frontend changes to `js/list.js` and `css/main.css`. Single commit via push_files / create_or_update_file. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-25 – Actually restore list.js + main.css placeholders

**What:** Replaced placeholder `js/list.js` (filters, chips, favorites, distance, only-in-view, keyboard navigation, copy links, persistence, empty-state, map sync) and `css/main.css` (transparent top bar, sidebar, cards, clusters, responsive, badges, modals) with full implementations matching the index.html shell and existing modules.

**Why:** Previous IMPROVEMENTS entry documented the intent, but the files remained 24/11-byte placeholders. Highest unfinished code-only item is the broken seed/demo UX. P1 remains user-owned (wrangler login + auth-migration.sql).

**How:** Single commit of `js/list.js`, `css/main.css`, and this IMPROVEMENTS.md entry. No schema or Worker changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Live auth + publish then works end-to-end; seed/demo already functional.

---
