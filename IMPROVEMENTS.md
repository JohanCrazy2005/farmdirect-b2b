## 2026-10-31 – Complete frontend shell (index.html + css/main.css)

**What:** Replaced placeholder `index.html` and `css/main.css` with a complete map-first shell.

**Why:** P2 was marked done but the files were still placeholders (`PLACEHOLDER_INDEX` / `PLACEHOLDER_CSS`). Existing JS modules (`map.js`, `list.js`, `main.js`, `search.js`, `cards.js`, etc.) could not render without matching DOM structure and styles.

**How:**
- `index.html`: transparent top bar (search + clear, filter icon with badge slot, options, profile, data-source badge), offline banner, Leaflet map container + legend, sidebar with tools (Locate, Fit, Clear & fit, Nearby, Random, sort, group-by-seller) and `#listings-list`, filter card, options menu, floating product/seller cards, lightbox, toast container, and modal shells for auth/dashboard/form/sellers/deploy/shortcuts/source/compare/recent/stats. Scripts load in dependency order ending with `main.js`.
- `css/main.css`: layout, transparent/blur top bar, sidebar slide, filter/options cards, floating cards, dark-theme variables, responsive phone layout (full-width sidebar, bottom cards, progressive disclosure), marker pins, toasts, and map legend.

Seed/demo fallback continues to work offline. Next polish can wire any remaining list.js render targets or further UX once live E2E is available.
