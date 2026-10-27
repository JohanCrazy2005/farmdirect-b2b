## 2026-10-27 – Distance sort, distance labels, and removable filter chips (seed UX)

**What:** Implemented distance sorting (haversine from user geolocation) and displayed distance in list items when located. Made filter chips clickable to remove individual filters (including search, radius, in-view, sort, price bounds). Updated CSS so chips show pointer and hover state.

**Why:** The Sort dropdown already offered “Distance” but it did nothing. Showing km distances and letting users clear single filters improves map-first seed/demo usability without requiring the live Worker.

**How:** github___push_files (js/list.js + css/main.css). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Functional radius + in-view filters (seed UX)

**What:** Implemented real radius filtering (haversine from user geolocation) and in-view filtering (map bounds) in js/list.js. Exposed getUserPosition/getBounds from js/map.js; map move/zoom and locate/clear now re-apply filters. Fixed broken escapeHtml (was no-op) in both modules so special characters render safely.

**Why:** Radius and in-view checkboxes existed in the filter card but did nothing useful in seed/demo mode. Correct HTML escaping prevents display bugs and XSS risk on untrusted seed data.

**How:** github___push_files. Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

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
