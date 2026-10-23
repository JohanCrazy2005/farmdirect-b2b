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