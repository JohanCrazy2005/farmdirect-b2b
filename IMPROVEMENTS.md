## 2026-10-27 – Visibility badge + seller name in map popups (seed UX)

**What:** Map marker popups now display a visibility badge (worldwide / country / province) and the seller display name (from seed-sellers.json). HTML is properly escaped. Consistent with product cards and sidebar list items.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Visibility is a core schema field; surfacing it (and human-readable seller names) directly on the map improves seed/demo scanability without new features or schema changes.

**How:** Updated `js/map.js` (`buildPopupHtml`, added escapeHtml + visibilityLabel helpers, FD_SELLERS lookup). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-27 – Complete listing list + filter module (seed UX)

**What:** Replaced the stub `js/list.js` with a full sidebar list + filter module. Supports category/visibility/units/seller/price/radius/sort/favorites/only-in-view filters, filter chips with clear, distance display (clickable to fly map), share buttons, favorites (localStorage), hover sync with markers, empty-state clear, filter count badge, persistence, and shareable filtered view links. Seller names come from seed-sellers.json. Works fully in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The list module was still a placeholder, so the sidebar, filters, and map-list sync were non-functional. Completing it makes the map-first UX fully usable without new features or schema changes.

**How:** Implemented `js/list.js` (escapeHtml, haversine, populateFilters, applyFilters, renderList, chips, bindUI, select/flyTo, favorites, export). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-27 – CSS polish for seller directory, stats, and compare modals

**What:** Added dedicated styles in `css/main.css` for seller directory items (`.seller-dir-item`, headers, counts, bio), statistics summary rows and lists, and the compare table. These elements were previously unstyled beyond base card/modal rules.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seller directory, stats, and compare are part of the map-first options UX and work fully in seed/demo mode; styling them improves readability and consistency without new features.

**How:** Appended CSS rules using existing design tokens (variables, badges, dark mode). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-27 – Complete cards module + map-first CSS shell

**What:** Replaced stub `js/cards.js` with a full product/seller card module (visibility badge, price/units, seller display names from seed-sellers.json, RFQ/favorite/share actions, lightbox). Replaced stub `css/main.css` with a complete map-first stylesheet (transparent top bar, sidebar, cards, clusters, dark mode, responsive, visibility badges).

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). The frontend shell was marked done but the cards and CSS files were still placeholders, so product/seller cards and visual layout were non-functional in seed/demo mode. Completing them makes the map-first UX fully usable without new features.

**How:** Implemented `js/cards.js` (openProduct/openSeller/lightbox, proper escapeHtml, FD_SELLERS integration) and `css/main.css` (CSS variables, dark theme, badges, markers, media queries). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-27 – Visibility display + fixed HTML escaping (seed UX)

**What:** Product cards now show a distinct visibility badge (worldwide / country / province). Sidebar list items include visibility in the meta line. Fixed broken `escapeHtml` in `js/list.js` (was replacing characters with themselves) so listing titles, addresses, and chips render safely and correctly.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Visibility is a core schema field; surfacing it improves seed/demo clarity without new features. The escape bug risked broken display or injection on any special characters in seed data.

**How:** Updated `js/cards.js` (visibility badge + proper escape), `js/list.js` (escapeHtml fix + visibility in meta + header note), and `css/main.css` (`.visibility-badge` styles, dark mode). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-26 – Seller filter uses display names (seed UX)

**What:** Seller filter dropdown and active chips now show human-readable names from `data/seed-sellers.json` instead of raw sellerids.

**Why:** Highest unfinished items remain user-owned (P1). Raw IDs were hard to scan in the filter card during seed/demo exploration.

**How:** Updated list module to look up display names. Appended this entry.

**Next:** User runs the auth-migration.sql command.
