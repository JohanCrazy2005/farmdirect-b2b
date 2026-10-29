# FarmDirect B2B – Improvements Log

## 2026-10-29 – Dark mode selector + data-source badge polish

- Fixed dark-mode CSS: switched from `html.dark` to `html[data-theme="dark"]` so it matches the theme-toggle in `js/main.js` (dark mode now actually applies).
- Added distinct colors for the data-source badge: LIVE (green), API+SEED (amber), SEED (blue), DEMO (purple), LOADING (slate).
- Badge title now refreshes relative time ("just now" / "15s ago") every 15s without a full reload.
- Improves seed/demo fallback UX visibility while the Worker is offline or empty.

Highest remaining items are still user-owned (optional RFQ migration, GitHub Actions secrets, live E2E).

## 2026-10-29 – Complete css/main.css (seed/demo UX)

- Replaced placeholder with full stylesheet matching index.html structure.
- Transparent blurred top search bar, full-bleed map, collapsible sidebar, filter/product/seller cards, modals, toasts.
- Responsive phone declutter (sidebar slides in, larger touch targets, progressive disclosure).
- Dark mode support via `html.dark` (pairs with existing theme-toggle).
- Category color helpers that align with map.js marker colors.
- Works fully client-side for seed/demo fallback; no Worker dependency.

Highest remaining items are still user-owned (optional RFQ migration, GitHub Actions secrets, live E2E).
