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

## 2026-10-13 (Hourly update) – Delivery Days Filter & Badges

**What:** Add delivery-day badges (e.g. Mon/Wed/Fri) on seller cards, map popups and the detail drawer, plus a multi-select filter so buyers can show only sellers who deliver on one or more preferred receiving days.

**Why:** Restaurants, retailers and processors run fixed receiving windows. Matching a seller’s regular delivery schedule up front reduces failed deliveries, extra coordination and operational friction — a high-value B2B fit signal that pure distance or lead-time filters do not capture.

**How:**
- New `deliveryDays` array field on each sample seller (subset of Mon–Sun).
- Compact badges rendered on cards, popups and the drawer.
- Sidebar checkbox group (OR logic) for Mon–Sun.
- Full integration with active filter chips, saved presets and shareable URL state.
- Works with existing clustering, custom delivery point, dark mode and all other filters. Fully client-side.

This makes schedule compatibility visible and filterable for wholesale buyers.

## 2026-10-13 (Hourly update) – Delivery Days Filter & Badges (Implemented)

**What:** Implemented delivery-day badges and multi-select filter.

**Why:** Lets buyers match sellers to their fixed receiving windows so schedule fit is visible and filterable.

**How (implemented):**
- Added `deliveryDays` arrays to all sample sellers.
- Compact badges on cards, map popups and the seller drawer (plus explicit list in the drawer).
- Sidebar checkbox group (OR logic) for Mon–Sun.
- Integrated with active filter chips, clear filters, saved presets and shareable URL query params.
- Fully client-side and compatible with existing map, clustering, custom delivery point, dark mode and other filters.

This completes the delivery-days feature for operational schedule matching.


## 2026-10-13 (Hourly update) – Typical Response Time Badge & Filter

**What:** Add typical response-time badges (e.g. “Replies in 4h”, “Within 1 day”) on seller cards, map popups and the detail drawer, plus a filter so buyers can show only sellers who typically respond within a chosen window (4h / 24h / 48h).

**Why:** For perishable produce and time-sensitive wholesale orders, buyers need confidence that a seller will reply promptly to RFQs. Response speed is a strong operational trust signal that complements ratings, verification and delivery schedule.

**How:**
- New `responseHours` numeric field on each sample seller.
- Compact badge rendered on cards, popups and the drawer.
- Sidebar select (Any / Within 4 hours / Within 24 hours / Within 48 hours).
- Full integration with active filter chips, saved presets and shareable URL state.
- Works with existing clustering, custom delivery point, dark mode and all other filters. Fully client-side.

This makes seller responsiveness visible and filterable for faster procurement decisions.
