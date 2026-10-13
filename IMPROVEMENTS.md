# FarmDirect B2B – Incremental Improvement Log

This file is updated by Grok automation.
Each entry records a concrete UI or feature improvement that was implemented.

---

## 2026-10-11 – Initial Prototype
- Map + sidebar marketplace UI matching the original mockup
- Leaflet map with emoji markers and popups
- Filters (category, organic, distance, price) + search + sort
- Seller cards with images, ratings, contact buttons
- Responsive basic layout

**Suggested next focus areas:**
1. Real geolocation + “near me”
2. Product detail / bulk RFQ modal
3. Seller profiles & verified badges
4. Cart / multi-item inquiry
5. Dark mode / accessibility
6. Better mobile map experience
7. Sample data expansion + clustering
8. Login / role-based views (buyer vs seller)

---

## 2026-10-12 – Core B2B features (prior passes)
- Marker clustering, RFQ modal, Near Me geolocation
- Verified badges, MOQ/lead time, rating & availability filters
- Payment terms, fulfillment method, volume pricing tiers
- Seller comparison, filter chips, estimated delivery cost
- Private notes, quantity presets, recently viewed, inquiry history
- Product grade, pack format, growing region, stock quantity
- Production method, storage/cold chain, year-round supply
- Search radius circle, expanded sample data
- Mobile Map/List/Split view toggle + dark mode

---

## 2026-10-13 – Phone & Laptop Responsiveness Optimization

**What:** Improved mobile and laptop layouts: dynamic viewport height, larger touch targets, collapsible filters on phones, refined sidebar widths on laptops.

**Why:** Buyers and sellers use phones (on-the-go) and laptops (office). Fixed 100vh issues with mobile browser chrome, small buttons, long filter lists, and suboptimal sidebar proportions.

**How:**
- body uses `height: 100dvh` + `overflow-x: hidden`
- Icon buttons ≥44px with `touch-action: manipulation`
- “Filters” toggle on ≤700px; filters panel collapses by default
- Sidebar: 360px (901–1400px), 400px (larger), 320px (tablets), full-width stacked on phones
- Map/List/Split floating control preserved

---

## 2026-10-13 – Map tiles fix + responsiveness confirmation

**What:** Replaced broken Carto basemap tiles (showing “API KEY REQUIRED”) with free OpenStreetMap tiles. Confirmed phone/laptop responsive CSS and collapsible filters work.

**Why:** Map was unusable for buyers and sellers – the primary discovery surface showed placeholder “API KEY REQUIRED” text instead of geographic context. Reliable map is essential for distance-based sourcing decisions.

**How:**
- Switched `L.tileLayer` to `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with correct OSM attribution
- Removed invalid subdomains and leftover Carto attribution text
- No change to satellite (Esri) layer
- Existing 100dvh, 44px touch targets, filters toggle, and sidebar media queries remain in place

Core features (map, RFQ, cart, comparison, filters, dark mode, view modes) continue to work. Prototype is practical for real phone and laptop B2B use.
