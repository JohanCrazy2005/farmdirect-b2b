## 2026-10-27 – Clickable addresses in list and product cards (seed UX)

**What:** Addresses (core schema field) are now rendered as clickable Google Maps links in the sidebar list and product cards when coordinates exist, matching the existing map-popup behavior. Clicking does not select the listing.

**Why:** Address + location are core fields. Making them interactive improves map-first exploration and location context in seed/demo mode while the live Worker remains undeployed.

**How:** github___push_files (js/list.js, js/cards.js, css/main.css). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Correct HTML escaping in list and map (seed UX)

**What:** Fixed the no-op `escapeHtml` helpers in `js/list.js` and `js/map.js` so `&`, `<`, `>`, and `"` are properly converted to entities. Addresses, descriptions, seller names, and other seed fields now render safely in list items, chips, popups, and filter options.

**Why:** The previous implementations replaced characters with themselves, so special characters in seed data could break markup or display incorrectly. This is a code-only polish that improves seed/demo reliability while the live Worker remains undeployed.

**How:** github___push_files (js/list.js, js/map.js). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Clickable seller badges in list and map popups (seed UX)

**What:** Seller names (core schema field) are now rendered as clickable badges in the sidebar list and map popups. Clicking sets the seller filter (mirroring category, visibility, and units badges) with toast feedback.

**Why:** Seller filter already existed via dropdown, but interactive badges speed up map-first exploration and comparison of sellers in seed/demo mode while the Worker remains undeployed. Uses display names from seed-sellers.json.

**How:** github___create_or_update_file (js/list.js, js/map.js, css/main.css). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Clickable units badges in list, map popups, and product cards (seed UX)

**What:** Units (core schema field) are now rendered as clickable badges in the sidebar list, map popups, and product cards. Clicking sets the units filter (mirroring category and visibility badges) with toast feedback. Product card badges also close the card after filtering.

**Why:** Units filter already existed but was only accessible via the filter card dropdown. Interactive badges speed up map-first exploration and comparison of pricing units (kg, bunch, etc.) in seed/demo mode while the Worker remains undeployed.

**How:** github___push_files (js/list.js, js/map.js, js/cards.js, css/main.css). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Clickable category badges in list and map popups (seed UX)

**What:** Category badges in the sidebar list and map popups are now clickable buttons that set the category filter (mirroring the existing clickable visibility badges). Toast feedback when filtering from a popup.

**Why:** Category is a core schema field. Interactive badges make map-first exploration faster in seed/demo mode without opening the filter card.

**How:** github___push_files (js/list.js, js/map.js, css/main.css). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

## 2026-10-27 – Show address in map popups (clickable) and sidebar list items (seed UX)

**What:** Map popups now display the listing address as a clickable link that opens Google Maps at the coordinates. Sidebar list items also show the address under the meta line. Improves context for seed/demo exploration of the map-first marketplace.

**Why:** Address is a core schema field. Previous popups and list items omitted it, making it harder to understand location without opening the full product card. Clickable maps link is useful while Worker remains undeployed.

**How:** github___push_files (js/map.js + js/list.js). Appended this.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors).

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
