## 2026-10-29 – Clickable category badges, seller links + thumbnails in list rows (seed/demo UX)

**What:** Updated sidebar list rows to show listing thumbnails (or color placeholder), clickable category badges that filter the list, and clickable seller names that filter by seller. Uses existing CSS classes for consistency. Fully client-side; works in seed/demo mode.

**Why:** Further seed/demo UX polish so users can quickly drill into category or seller from the list without opening the product card. Aligns with prior intent and existing styles. Highest unfinished code-only item; P1 optional RFQ and P5 secrets remain user-owned.

**How:** Single commit via push_files updating js/list.js (renderList + event handlers) and this log entry.

**Next:** User can still apply optional RFQ migration or add Cloudflare secrets; seed/demo fallback remains fully usable offline with improved list interactions.

---

## 2026-10-29 – Actionable seed/demo data-source modal + empty-state guidance

**What:** Enhanced the data-source modal (opened from the top-bar badge or banner Details) with source-specific actionable buttons: Open dashboard, Deploy steps, Export demo, Download backup, and Reset to seed. Updated the sidebar empty state to be source-aware, offering a Create listing button and clearer guidance when no listings match in seed/demo/api-empty modes.

**Why:** Further seed/demo UX polish so offline or undeployed users have clear next steps without hunting through Options. Highest unfinished code-only item after prior list.js restore; P1 optional RFQ migration and P5 secrets remain user-owned.

**How:** Single commit via `push_files` updating `js/main.js` (modal buttons + wiring) and `js/list.js` (empty-state HTML + click handlers), plus this log entry.

**Next:** User can still apply optional RFQ migration or add Cloudflare secrets; seed/demo fallback remains fully usable offline with improved guidance.

---

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
