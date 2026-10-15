## 2026-10-15 – Max 3 Badges on Cards & Map Popups (Issue #4)

**What:** Replaced long badge arrays in `buildPopupHtml` and `renderSellers` with a single `getTopBadges(s)` that returns at most 3 badges. Drawer still shows richer detail.

**Why:** Seller cards and map popups were overcrowded with grade/pack/region/production/storage/season/capacity/reliability/trace/cert/delivery badges, making scan-and-compare hard. A strict priority list keeps the UI lean and matches the product constraint of ≤3 badges.

**How (implemented):**
- Added `getTopBadges(s)` with priority: Verified → Organic → Stock status → Your listing → Premium grade → Lot-tracked; `.slice(0, 3)`.
- `buildPopupHtml` and list cards now use only `getTopBadges(s)`.
- Drawer subtitle can still show the fuller set if desired (left as-is for profile depth).
- Addresses GitHub issue #4.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-14 – Accessibility Fixes for Vercel Report (Selects, Toggles, Buttons, Contrast)

**What:** Resolved the accessibility issues flagged by Vercel’s checker (GitHub issue #3): every select now has an accessible name, ARIA switches have aria-labels, icon-only buttons and dynamic controls are named, the distance range is labeled, and muted text contrast was improved.

**Why:** Screen-reader and keyboard users could not reliably identify filter dropdowns, toggles, or certain buttons. The Vercel accessibility overlay reported missing names on selects and form elements, unlabeled ARIA toggles, buttons without discernible text, and contrast failures. These fixes make the marketplace usable with assistive technology and address the open issue.

**How (implemented):**
- Added descriptive `aria-label` to all `<select>` elements (map layers, sort, every filter select, login role, listing category, and inquiry status).
- Added `aria-label` to all `role="switch"` toggles (Organic, Traceable, Year-round, Verified, Available now, Favorites).
- Added `aria-label` to the distance range input and the preset-delete button.
- Darkened the light-mode `--muted` color from `#6b7280` to `#4b5563` for better contrast against white/light backgrounds.
- Preserved all existing behavior, dark mode, filters, seller portal, and localStorage features.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).
