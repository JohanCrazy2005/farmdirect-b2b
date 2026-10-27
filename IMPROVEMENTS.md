## 2026-10-27 – Complete truncated list.js + clickable visibility filters (seed UX)

**What:** Restored the full js/list.js module (truncated previously). Added setVisibilityFilter and clickable visibility badges in list and map popups.

**Why:** Seed/demo was broken due to truncation. Visibility is core schema field.

**How:** push_files. Appended this.

**Next:** User runs npx wrangler login then npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql
