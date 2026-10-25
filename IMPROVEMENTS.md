## 2026-10-25 – Add seed sellers directory for richer demo UX

**What:** Added `data/seed-sellers.json` with display names and short bios for the 10 existing seed sellerids. Updated `js/sellers.js` to asynchronously load the meta and prefer the friendly name (plus bio) in the Seller directory modal. Updated `js/config.js` with `SEED_SELLERS_URL`.
Fully client-side; works immediately in seed/demo mode without any Worker changes.

**Why:** Highest unfinished items remain user-owned (P1 auth migration / secrets). Seller directory previously showed only raw sellerids. This code-only polish makes the directory substantially more readable and representative while exploring seed/demo data.

**How:** New data/seed-sellers.json + updates to js/sellers.js and js/config.js. Single commit via push_files.
Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).
Then register/login + publish workflow works end-to-end.

---

## 2026-10-24 – Expand seed listings for richer demo fallback UX

**What:** Expanded `data/seed-listings.json` from a single tomato listing to 10 varied Colorado-area listings (produce, dairy, grain, herbs) with realistic addresses, prices, categories, visibilities, and Unsplash images.
Fully client-side; works immediately in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). Current seed was too sparse for useful map + filter exploration. This code-only polish makes the seed/demo fallback substantially more representative of a real marketplace.

**How:** Updated data/seed-listings.json. Single commit via push_files.
Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).
Then register/login + publish workflow works end-to-end.

---

PLACEHOLDER_IMP
