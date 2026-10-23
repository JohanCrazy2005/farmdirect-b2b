## 2026-10-23 – Live “Only in view” filter on map move

**What:** The existing “Only in view” filter now re-applies automatically whenever the map is panned or zoomed. Exposed `applyFilters` on `FD_LIST` and added a `moveend` listener in the map module that calls it only when the checkbox is active. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes the viewport filter useful during exploration instead of a one-shot snapshot. Improves map-first UX without new features or schema changes.

**How:** Frontend changes to js/list.js and js/map.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Activate Only-in-view filter + shareable map view link

**What:** Exposed `getBounds()` on `FD_MAP` so the existing “Only in view” checkbox in the filter card now correctly restricts listings to the current map viewport. Also added a “Copy map view link” button in the options menu that uses the already-implemented `getMapViewLink()` (hash `#map=lat,lng,zoom`). Fixed incomplete HTML escaping in map popups/legend. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish activates an existing filter control that was non-functional and surfaces the shareable deep-link already coded in the map module. Improves map-first exploration UX without new features or schema changes.

**How:** Frontend changes to js/map.js, index.html, and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Empty-state clear filters + filter count badge

**What:** When the sidebar shows no matching listings, the empty state now includes a “Clear filters” button (only when filters or search are active). Also added a small badge on the filter icon that shows the number of active filters (including search). Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish improves map-first filtering UX by making it obvious how to recover from an empty result set and how many constraints are applied, without new features or schema changes.

**How:** Frontend changes to js/list.js, index.html, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.
