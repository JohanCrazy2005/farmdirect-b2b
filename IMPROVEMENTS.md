# FarmDirect B2B – Improvements Log

## 2026-10-29 – Complete css/main.css (seed/demo UX)

- Replaced placeholder with full stylesheet matching index.html structure.
- Transparent blurred top search bar, full-bleed map, collapsible sidebar, filter/product/seller cards, modals, toasts.
- Responsive phone declutter (sidebar slides in, larger touch targets, progressive disclosure).
- Dark mode support via `html.dark` (pairs with existing theme-toggle).
- Category color helpers that align with map.js marker colors.
- Works fully client-side for seed/demo fallback; no Worker dependency.

Highest remaining items are still user-owned (optional RFQ migration, GitHub Actions secrets, live E2E).
