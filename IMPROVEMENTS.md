## 2026-10-27 – Restore list.js + main.css (seed UX)

**What:** Replaced placeholder `js/list.js` and `css/main.css` with full working modules.
List module renders thumbnails, truncated description snippets, clickable category/seller badges that set filters, favorite stars, removable filter chips, filter count badge, empty-state clear button, persistence, keyboard navigation hooks, and all filter/sort/radius/in-view logic expected by the map and main bootstrap.
CSS provides complete layout (transparent top bar, sidebar, cards, clusters, dark mode, responsive).

**Why:** Highest unfinished items remain user-owned (P1 auth migration). Core map-first sidebar was broken by placeholders, blocking all seed/demo exploration. This code-only restoration returns the specified UI to a working state without new features or schema changes.

**How:** Frontend changes to js/list.js and css/main.css. Commits via create_or_update_file. Appended this entry to IMPROVEMENTS.md.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end.
