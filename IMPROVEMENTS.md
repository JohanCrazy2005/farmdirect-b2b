## 2026-10-25 – Surface friendly seller names across list, cards, and filters

**What:** Extended `js/sellers.js` to expose `getDisplayName` / `getBio` (with eager meta load). Updated `js/list.js` so sidebar items, filter dropdown, filter chips, and search all prefer the display name from `data/seed-sellers.json`. Updated `js/cards.js` so product badges and seller cards show the friendly name + bio. Also fixed duplicate Unsplash image on the organic oats seed listing.

Fully client-side; works immediately in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / secrets). After adding seller meta, raw sellerids still appeared in the primary list and product cards. This polish makes the marketplace substantially more readable while exploring seed data.

**How:** Updates to js/sellers.js, js/list.js, js/cards.js, and data/seed-listings.json. Single commit via push_files.
Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).
Then register/login + publish workflow works end-to-end.

---

PLACEHOLDER_IMP
