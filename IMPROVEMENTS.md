# FarmDirect B2B – Improvements Log

## 2026-10-24 – Clickable data-source badge
- P4 polish: Made the persistent SEED/DEMO data-source badge a button.
  - Click opens the existing deploy modal with exact wrangler commands.
  - Hover/focus scale + updated title tooltip.
  - Improves seed/demo UX by surfacing deploy guidance without relying on the dismissible banner.
  - Changes in index.html, css/main.css, js/main.js.

## 2026-10-24
- P4 polish: Added persistent data-source badge (SEED / DEMO) in the top bar.
  - Visible even after dismissing the offline banner.
  - Clear visual cue for seed fallback / demo mode when Worker is unreachable.
  - Styled in css/main.css; logic in js/main.js; markup in index.html.

## Prior
- Frontend shell complete (index.html, css/main.css, js/* modules).
- Auth + publication workflow UI ready (awaiting D1 auth-migration.sql).
- Seed/demo fallback automatic in js/api.js with localStorage persistence.
- Deploy notes documented in README.md and deploy modal.
