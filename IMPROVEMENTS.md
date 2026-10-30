PLACEHOLDER

## 2026-10-30 – Frontend shell completed (map / list / bootstrap)

- Replaced placeholder `index.html`, `js/map.js`, `js/list.js`, and `js/main.js` with a working map-first shell.
- `index.html` wires the transparent top bar, Leaflet map, sidebar list, filter card, options menu, product/seller cards, and all modals expected by existing modules (auth, dashboard, form, sellers, deploy, shortcuts, data-source, lightbox).
- `js/map.js` initializes Leaflet, renders category-colored markers, supports fly-to and user location, and updates with filtered listings.
- `js/list.js` holds listings, applies search + filter chips (category, seller, visibility, units, price, favorites), renders the sidebar, handles selection (opens product card + flies map), and persists favorites.
- `js/main.js` bootstraps everything: loads via `FD_API.fetchListings` (seed/demo fallback), shows data-source badge + offline banner with Details modal, wires theme / options / sidebar / filters / profile, and calls bind() on the other modules.
- Seed/demo UX remains fully usable when the Worker is offline or empty. No unrelated features added.
