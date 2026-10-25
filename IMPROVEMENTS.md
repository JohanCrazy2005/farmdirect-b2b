## 2026-10-25 – Restore substantial list.js + cards.js modules for seed/demo UX

**What:** Replaced placeholder `js/list.js` and `js/cards.js` with full client-side modules. List now renders thumbnails, filter chips (removable), favorites (persisted), distance, only-in-view, keyboard navigation, and prefers friendly seller display names. Cards show product/seller detail with max 3 badges, lightbox, and RFQ/filter actions. Fully works offline with seed data.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The sidebar list and product/seller cards were stubs, so the map-first seed fallback UX was incomplete. This restores the primary interactive surface without new features or schema changes.

**How:** New substantial implementations in js/list.js and js/cards.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

PLACEHOLDER_IMP
