## 2026-10-29 – Restore complete sidebar list module (seed/demo UX)

**What:** Replaced the stub `js/list.js` with a full client-side sidebar module.
Renders listings into `#listing-list`, applies all filter-card + search criteria (category, visibility, units, seller, price range, radius, favorites-only, only-in-view), shows individual removable filter chips, category color swatches, favorites (localStorage), sorting, selection that opens the product card and flies the map, empty-state clear-filters button, filter-count badge, deep-link URL query param restore, and filtered JSON export.
Fully works in pure seed/demo mode.

**Why:** `js/list.js` had been reduced to a placeholder, breaking the sidebar list that is core to the map-first experience and to ongoing seed/demo UX polish.
P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned; this is the highest unfinished code-only item.

**How:** Single commit via `push_files` restoring the module and appending this entry.
Uses existing `FD_SELLERS.getDisplayName`, `FD_MAP` helpers (when present), and DOM ids from `index.html`.

**Next:** User can still apply optional RFQ migration or add Cloudflare secrets; seed/demo fallback continues to be usable offline.

---

PLACEHOLDER_IMP
