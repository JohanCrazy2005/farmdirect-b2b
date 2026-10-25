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
