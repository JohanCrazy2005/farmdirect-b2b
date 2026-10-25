## 2026-10-25 – Densify Denver metro seed listings for better demo UX

**What:** Expanded `data/seed-listings.json` from 2 to 10 listings. Added eggs, wheat, apples, aged cheddar, Yukon Gold potatoes, culinary herbs, peaches, and organic oats, all using existing sellerids from `seed-sellers.json` and coordinates clustered in the Denver metro area. Each includes unique Unsplash images, varied visibility, categories, prices, and units.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The previous seed was too sparse for a realistic map-first demo; the sidebar, filters, clusters, and cards looked empty. This code-only change makes seed/demo fallback immediately useful for exploration without touching schema or backend.

**How:** Updated `data/seed-listings.json` only. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-25 – Restore substantial list.js + cards.js modules for seed/demo UX

**What:** Replaced placeholder `js/list.js` and `js/cards.js` with full client-side modules. List now renders thumbnails, filter chips (removable), favorites (persisted), distance, only-in-view, keyboard navigation, and prefers friendly seller display names. Cards show product/seller detail with max 3 badges, lightbox, and RFQ/filter actions. Fully works offline with seed data.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The sidebar list and product/seller cards were stubs, so the map-first seed fallback UX was incomplete. This restores the primary interactive surface without new features or schema changes.

**How:** New substantial implementations in js/list.js and js/cards.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

PLACEHOLDER_IMP
