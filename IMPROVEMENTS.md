# Improvements log

## 2026-11-02
- Completed `js/main.js` bootstrap: initializes Leaflet map, loads listings via FD_API (seed/demo fallback), wires top bar / sidebar / filter card / options menu / data-source badge & offline banner (persistent dismiss), binds feature modules, and exposes `loadAndRender` for demo-status refresh. Shell now runs end-to-end with seed data.
- Seed/demo UX: richer data-source modal (coverage summary of categories/sellers/images/prices, live last-checked ticker, copy-status button, listing count on badge + banner). Click badge or Details to open. Fully client-side.
- Seed/demo UX polish: offline/seed banner dismiss now persists in localStorage (`fd-banner-dismissed`). Once dismissed it stays hidden across reloads while still showing SEED/DEMO badge; clear the key via Local data to restore the banner. Improves less-cluttered exploration when Worker is offline or empty.
- Wired Options-menu seed/demo controls that were present in HTML but unbound: Export demo, Download backup, Import demo backup (file picker), Reload listings, Load pure seed data, Reset demo data, Add listing, Sample listing. Uses existing FD_API + FD_FORM methods and calls `loadAndRender` so the map/list update without a full reload in most cases. Completes portable local demo backup/restore UX.
