## 2026-10-27 – Address in map popups and sidebar list items (seed UX)

**What:** Map marker popups and sidebar listing items now display the listing address (when present). Address is properly HTML-escaped. Complements the existing visibility badge and seller display name.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Address is a core schema field; surfacing it in the map-first views improves seed/demo scanability and location awareness without new features or schema changes.

**How:** Updated `js/map.js` (`buildPopupHtml`) and `js/list.js` (`renderList` template). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-27 – Interactive map legend category filter (seed UX)

**What:** Map category legend items are now clickable (and keyboard-accessible). Clicking a category sets or toggles the category filter, updates the sidebar list, markers, chips, and filter badge. Works fully in seed/demo mode. Consistent with existing filter card.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The legend was visual-only; making it interactive improves map-first category exploration without new features or schema changes.

**How:** Updated `js/map.js` (legend items with data-cat + click/keydown handlers calling FD_LIST.setCategoryFilter) and `js/list.js` (added setCategoryFilter that toggles filterState.category, syncs select, applies filters, updates legend active). Added CSS for pointer/hover. Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

(Previous entries continue as before)
