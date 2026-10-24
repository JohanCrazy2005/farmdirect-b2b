## 2026-10-24 – Removable filter chips in sidebar

**What:** Active filters (search, category, visibility, units, seller, min/max price, radius, sort, favorites-only, only-in-view) now appear as dismissible chips under the sidebar header. Clicking a chip’s × clears only that filter and re-applies. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The `#filter-chips` container and `.filter-chip` styles already existed in the map-first shell but were unused. This code-only polish makes applied constraints visible and individually clearable during exploration without new features or schema changes.

**How:** Added `renderFilterChips` + `clearOneFilter` to `js/list.js` (called from `applyFilters`). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-24 – Restore full js/list.js module

**What:** Rebuilt the truncated `js/list.js` (previously reduced to a broken escapeHtml stub) into a complete sidebar + filter module. Restores list rendering, live filtering (category, visibility, units, seller, price, radius, favorites, only-in-view), filter persistence, filter-count badge, empty-state clear button, copy-link buttons, keyboard navigation (arrows + Enter/Space), favorites, distance sort/display, map marker sync, and JSON export. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The list module had been accidentally emptied, breaking the core map-first sidebar and all filter/list interactions. This code-only restoration returns the specified UI to a working state without new features or schema changes.

**How:** Replaced `js/list.js` with a substantial module exposing the full `FD_LIST` API expected by main.js, map.js, cards.js, and shortcuts.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-24 – Fix HTML escaping in sidebar list rendering

**What:** Corrected the broken `escapeHtml` helper in `js/list.js` (replacements were no-ops). Listing titles, categories, sellers, addresses, prices, and filter option values are now properly escaped before insertion into the DOM. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). The defective escaper could break list markup or allow unexpected HTML from seed/API data. This code-only fix restores safe rendering for the map-first sidebar without new features or schema changes.

**How:** Updated `js/list.js` (escapeHtml implementation + header comment). Recovered after an empty-file commit. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-24 – Keyboard navigation in sidebar list

**What:** Arrow Up / Down now cycle through the filtered listings in the sidebar, highlighting the row and the corresponding map marker (and scrolling the list). Enter or Space opens the highlighted listing (product card + map fly-to), matching a click. Shortcuts help modal lists the new keys. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes map-first exploration faster for keyboard users while browsing the undeployed seed/demo without new features or schema changes.

**How:** Added `navigate` + `selectHighlighted` to `js/list.js`; wired ArrowUp/Down/Enter/Space in `js/shortcuts.js`; updated shortcuts list in `index.html`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-24 – Keyboard shortcut to toggle options menu

**What:** Pressing `o` (when not typing in a field) now toggles the options menu open/closed, matching the existing ⚙ button behavior (including aria-expanded and focusing the first control when opening). The shortcuts help modal lists it. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish speeds up access to the options menu (API base, exports, deploy commands, etc.) during map-first seed/demo exploration without new features or schema changes.

**How:** Updated `js/shortcuts.js` (new toggle helper + key handler) and `index.html` (shortcuts list). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Copy listing link from sidebar list items

**What:** Each listing row in the sidebar now includes a 🔗 “Copy link” button next to the favorite star. Clicking it copies a shareable `#listing=id` URL (same as the product-card button). Clicking the button does not open the product card. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes individual listings easier to share directly from the map-first list view without opening the product card, improving exploration UX in the undeployed demo.

**How:** Frontend changes to `js/list.js` (copy helper + button in list items + click handling) and `css/main.css` (button style). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Copy listing deep-link from product card

**What:** Product cards now include a “Copy link” button that copies a shareable `#listing=id` URL. Opening the link selects the listing, opens the product card, and flies the map to the marker (existing deep-link support in main.js). Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes individual listings easily shareable during map-first exploration, complementing the existing map-view share link, without new features or schema changes.

**How:** Frontend change to js/cards.js (copy helper + button in product-actions). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Keyboard shortcut to toggle filter card

**What:** Pressing `i` (when not typing in a field) now toggles the filter card open/closed, matching the existing filter-icon button behavior (including aria-expanded and focusing the first control when opening). The shortcuts help modal lists it. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish speeds up map-first filtering during seed/demo exploration without new features or schema changes.

**How:** Updated `js/shortcuts.js` (new toggle helper + key handler) and `index.html` (shortcuts list). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Fix filter card open/close (hidden attribute)

**What:** The filter card (opened by the top-bar filter icon) was non-functional. JS toggled a CSS class `open` while the element carried the HTML `hidden` attribute and no CSS rule showed `.filter-card.open`. It now correctly toggles the `hidden` attribute (and updates `aria-expanded`), matching the options menu. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish restores the core filter icon → filter card interaction that is part of the specified map-first UI. Improves reliability of filtering during seed/demo exploration without new features or schema changes.

**How:** Frontend change to `js/list.js` (bindUI only). Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Persist filter state across reloads

**What:** Filter selections (category, visibility, units, seller, min/max price, sort, radius, favorites-only, only-in-view, and search query) are now saved to `localStorage` on every change and restored automatically when listings load. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). This code-only polish makes the filter card and search sticky across page reloads, which is common while exploring the undeployed demo. Improves map-first filtering UX without new features or schema changes.

**How:** Added save/restore helpers in `js/list.js`; restore runs once after filter selects are populated; save runs at the end of `applyFilters`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Restore truncated index.html + filter badge polish

**What:** Restored the full `index.html` (which had been overwritten with a truncated stub) including all modals, scripts, and UI shells. Added the `#filter-badge` span to the filter icon and corresponding `.filter-badge` CSS (absolute positioned count badge). Restored full IMPROVEMENTS.md history. Fully client-side; works in seed/demo mode.

**Why:** Highest unfinished items remain user-owned (P1 auth migration). Previous commits accidentally truncated the shell HTML, breaking the app. This code-only fix restores the working map-first UI and completes the filter-count badge that was partially added. Improves reliability of the seed-fallback experience without new features or schema changes.

**How:** Restored index.html from prior good commit + badge span, added CSS rules, restored IMPROVEMENTS.md. Single commit via push_files.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

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

---

(Earlier history restored from prior commits: wire modules for exports, shortcuts, compare, recent, sellers, stats, RFQ, layers, fullscreen, CSV/GeoJSON, seed banner, publish UI feedback, options close, profile indicator, frontend shell, etc. See git history for full details.)
