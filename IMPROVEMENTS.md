## 2026-10-23 – Activate Only-in-view filter + shareable map view link

**What:** Exposed `getBounds()` on `FD_MAP` so the existing “Only in view” checkbox in the filter card now correctly restricts listings to the current map viewport. Also added a “Copy map view link” button in the options menu that uses the already-implemented `getMapViewLink()` (hash `#map=lat,lng,zoom`). Fixed incomplete HTML escaping in map popups/legend. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish activates an existing filter control that was non-functional and surfaces the shareable deep-link already coded in the map module. Improves map-first exploration UX without new features or schema changes.

**How:** Frontend changes to js/map.js, index.html, and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Improve seed fallback UX with deploy guidance + reload

**What:** Added a “Deploy steps” button to the offline/seed banner that opens the existing deploy modal, and a “Reload listings” button in the options menu that re-fetches from the API or seed/demo fallback. Banner button group is flex for side-by-side actions. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish further improves seed-fallback UX by surfacing next steps directly from the persistent banner and giving a quick reload without inventing features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---
