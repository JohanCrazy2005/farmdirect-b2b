## 2026-10-23 – Wire seller directory module

**What:** Completed the existing `js/sellers.js` module by adding the `#sellers-modal` UI, a “Seller directory” button in the options menu, script load + bind in `main.js`, and basic styles for the directory items. Users can now open a list of unique sellers (with listing counts, categories, and average price) and click to filter the map/list to that seller.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for browsing sellers without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire keyboard shortcuts module

**What:** Completed the existing `js/shortcuts.js` module by adding the `#shortcuts-modal` UI, a “Keyboard shortcuts” button in the options menu, script load + bind in `main.js`, and styles for the help list. Escape now correctly closes overlays that use either the `hidden` attribute or the `.open` class. Users can press `/` or `s` to focus search, `l` to locate, `f` to fit all, etc., or open the help modal.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for faster map exploration without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, js/shortcuts.js, and css/main.css. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire compare listings module

**What:** Completed the existing `js/compare.js` module by adding the `#compare-modal` UI, a “Compare listings” button in the options menu, script load + bind in `main.js`. Users can now open the side-by-side comparison (2–4 listings) from Options. Selection persists in localStorage.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already implemented but not wired into the shell. Works fully in seed/demo mode and improves UX for comparing products without new features or schema changes.

**How:** Frontend changes to index.html and js/main.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-23 – Wire recently-viewed module

**What:** Completed the existing `js/recent.js` module by adding the `#recent-modal` UI, a “Recently viewed” button in the options menu, script load + bind in `main.js`, and an `add` alias for `track` so `FD_LIST.select` correctly records views. Image rendering is now null-safe.

**Why:** Highest unfinished items are user-owned (P1 auth migration). This code-only polish activates a substantial client-side module that was already referenced from the list but not wired into the shell. Works fully in seed/demo mode and improves UX for exploring listings without new features or schema changes.

**How:** Frontend changes to index.html, js/main.js, and js/recent.js. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Polish: dynamically populate units filter select

**What:** Extended `populateFilterSelects` in `js/list.js` so the Units `<select id=\"filter-units\">` is filled with unique, sorted values from the current listings (same pattern as Category and Seller). Also corrected the broken `escapeHtml` helper (was emitting literal `&` instead of `&amp;` etc.).

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. The filter card already had a Units control and the filter logic already respected it, but the dropdown stayed empty (only \"Any\"). Completing the dynamic population makes the filter fully usable in both seed/demo and live modes without new features or schema changes.

**How:** Frontend-only change to `js/list.js`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Publish workflow UI feedback (P3)

**What:** Added a visible draft-guidance note (`#form-draft-note`) in the listing form that appears only in create mode. On successful create/update the form status now includes next-step text and a success toast is shown via FD_TOAST. Close delay slightly increased so the message is readable. Edit mode hides the note.

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. Completes the remaining UI feedback for the publish workflow promised in GOAL.md. Works in both demo (localStorage) and live modes; no schema or second Worker required.

**How:** Frontend changes to index.html and js/form.js. Updated GOAL.md to mark the UI-feedback item complete. Single commit via push_files.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Clearer offline/seed banner (P4 seed fallback UX)

**What:** Added a dismissible fixed banner (`#offline-banner`) that appears below the top bar when listings load from seed or demo fallback. Text distinguishes seed (read-only until Worker live) vs demo (local changes persist). Dismiss is remembered for the session via sessionStorage. Styles in `css/main.css` (amber warning, responsive). Wired in `js/main.js` after `fetchListings`.

**Why:** Highest unfinished code-only item after user-owned P1 auth migration. The toast was easy to miss; a persistent but dismissible banner improves seed-fallback UX as noted in GOAL.md without inventing features or requiring a second Worker. Works in both demo and live modes.

**How:** Frontend-only changes to index.html, css/main.css, and js/main.js. Updated GOAL.md to mark the optional banner complete. Single commit via push_files.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Complete frontend shell (index.html + css/main.css + js/main.js)

**What:** Replaced the three PLACEHOLDER files with a full map-first UI shell. `index.html` provides the transparent top search bar, profile icon, options menu, filter button → filter card, sidebar listing list, product + seller cards, lightbox, dashboard/form/auth/deploy modals. `css/main.css` supplies layout, cards, clusters, legend, responsive behavior. `js/main.js` bootstraps Leaflet via FD_MAP, binds FD_LIST / search / dashboard / form / auth, loads listings (live API or seed/demo fallback), and wires options (API base override, deploy commands, demo export/reset).

**Why:** Highest unfinished item after the user-owned D1 auth migration. The modules (map.js, list.js, cards.js, api.js, …) were already substantial but the shell that wires them was missing, so the app could not run. Pure code-only change; no second Worker; works in both demo and live modes.

**How:** Single commit via push_files. Updated GOAL.md priority queue to mark P2 complete and keep P1 as the user action.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Polish: Options menu close button

**What:** Added a × close button (`#close-options-btn.close-card`) to the options menu in `index.html`. Bound it in `js/main.js` so the menu closes and aria-expanded updates. Added shared `.close-card` styles in `css/main.css` (positioned absolute, hover, focus) that also cover the existing filter-card close button for visual consistency.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. This pure code-only polish completes the options menu interaction promised in the fresh-start design (matching the recent filter-card close button). Works in both demo and live modes; no new features or second Worker.

**How:** Frontend-only changes in HTML, main bootstrap, and CSS. Demo fallback and live data both benefit.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

## 2026-10-22 – Polish: Profile icon reflects logged-in seller

**What:** Added `updateProfileIndicator` in `js/dashboard.js` so the top-bar `#profile-btn` gains a `.logged-in` class, updated title, and aria-label when a seller session (live Bearer or demo temporary ID) is active. Called on bind, after login/logout, and from `setSession` in `js/auth.js`. Added matching accent ring styles in `css/main.css`.

**Why:** Highest unfinished item remains the user-owned D1 auth migration. This pure code-only polish completes the profile icon promised in the fresh-start design, gives clearer feedback in both demo and live modes, and requires no second Worker or schema change.

**How:** Frontend-only changes in dashboard, auth, and CSS modules. Demo fallback and live data both benefit.

**Next:** User runs `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.

---

(Previous improvement log entries retained in git history.)
