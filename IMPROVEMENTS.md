# FarmDirect B2B – Improvements Log

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
