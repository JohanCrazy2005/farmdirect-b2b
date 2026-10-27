## 2026-10-27 – Implement full map.js + list.js modules (seed UX)

**What:** Replaced truncated stubs in js/map.js and js/list.js with complete modules. Map: Leaflet init, MarkerCluster, category-colored markers, popups with clickable visibility badges. List: filters, chips, favorites (localStorage), clickable visibility, export, deep-link select, calls map update.

**Why:** Previous stubs broke seed/demo fallback and map-first shell. Visibility is a core schema field.

**How:** create_or_update_file. Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Complete truncated list.js + clickable visibility filters (seed UX)

**What:** Restored the full js/list.js module (truncated previously). Added setVisibilityFilter and clickable visibility badges in list and map popups.

**Why:** Seed/demo was broken due to truncation. Visibility is core schema field.

**How:** push_files. Appended this.

**Next:** User runs npx wrangler login then npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql
