# Improvements log

## 2026-11-02
- Completed `js/main.js` bootstrap: initializes Leaflet map, loads listings via FD_API (seed/demo fallback), wires top bar / sidebar / filter card / options menu / data-source badge & offline banner, binds feature modules, and exposes `loadAndRender` for demo-status refresh. Shell now runs end-to-end with seed data.
- Seed/demo UX: richer data-source modal (coverage summary of categories/sellers/images/prices, live last-checked ticker, copy-status button, listing count on badge + banner). Click badge or Details to open. Fully client-side.
