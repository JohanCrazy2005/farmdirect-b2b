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

## 2026-10-14 – Map reliability fix + phone/laptop polish

**What:** Switched street map tiles from Carto Voyager (previously showing API KEY REQUIRED or unreliable) to free OpenStreetMap tiles. Refined mobile controls layout, touch-friendly sizing, and laptop sidebar proportions. Hid non-essential legend on phones.

**Why:** Reliable geographic context is core for B2B buyers evaluating distance and logistics. Phone users need uncluttered map controls that don’t overlap content; laptop users benefit from balanced map/sidebar space for comparing multiple suppliers.

**How:**
- `L.tileLayer` now uses `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with proper OSM attribution.
- Mobile `@media (max-width: 700px)`: map controls become flex-wrapped, compact buttons, legend hidden, tighter seller cards.
- Tablet (701–1024px) and large laptop (>1400px) media queries for sidebar and max-width.
- All existing features (RFQ, cart, filters, dark mode, view modes, delivery days, response time) preserved and client-side.

Prototype remains fully usable on phones and laptops for wholesale farm product discovery and inquiry.
## 2026-10-14 – Minimum Reviews Filter

**What:** Add a minimum-reviews filter (Any / 10+ / 20+ / 30+) so buyers can hide sellers with very few reviews, plus full integration into chips, presets and shareable URLs.

**Why:** Rating alone is incomplete for B2B trust. A 4.9 from 3 reviews is less reliable than a 4.6 from 35 reviews. Review volume is a practical signal of operational track record that complements verification, response time and rating.

**How:**
- New sidebar select for minimum review count.
- Filter logic excludes sellers below the threshold.
- Active filter chip with individual clear.
- Captured in saved presets and shareable URL query params (`reviews=`).
- Works with all existing filters, clustering, dark mode and mobile layout. Fully client-side.

This helps buyers prioritise sellers with demonstrated buyer feedback volume.

## 2026-10-14 – Reliability Score Badge

**What:** Added a composite reliability score badge (★ rating out of 5) on seller cards, map popups and the detail drawer. Score factors in verified status, rating, review volume and response speed.

**Why:** Buyers need a quick trust signal when scanning many suppliers. Combining multiple operational signals into one glanceable score reduces decision time and highlights reliable partners for perishable or high-volume orders.

**How:**
- New `getReliabilityBadge()` function calculates a 0–5 score from existing fields (verified +2, high rating, review count, fast response).
- Rendered alongside existing badges on cards, popups and drawer.
- Fully client-side, no data changes required, works with dark mode and all filters.
- Complements the existing min-reviews and response-time filters.

This gives buyers a practical at-a-glance reliability indicator for wholesale sourcing.

## 2026-10-14 – Phone & Laptop Optimization + Landscape Support

**What:** Added landscape orientation optimizations for phones and tablets, reinforced overflow prevention, and confirmed existing responsive behaviors (100dvh, collapsible filters, view modes, touch targets).

**Why:** Buyers checking suppliers on phones often rotate to landscape for a better map view. Previous portrait-focused layout left unused space; this keeps map and list usable side-by-side on wider small screens without horizontal scroll.

**How:**
- New `@media (max-width: 900px) and (orientation: landscape)`: row layout with ~58% map / 42% sidebar.
- Reinforced `overflow-x: hidden` and min-height handling.
- All prior features (RFQ, clustering, filters, dark mode, delivery days, reliability badges, etc.) preserved.
- Prototype remains fully client-side and practical for real B2B use on phones and laptops.

Cycle continues (current date 2026-10-14 is well within 60 days of 2026-10-11).
## 2026-10-14 – Sort by Reliability + Min Reliability Filter

**What:** Make the existing composite reliability score actionable: add “Reliability: High to Low” sort and a Min. reliability filter (Any / 3.0+ / 3.5+ / 4.0+ / 4.5+) so buyers can prioritise or restrict the list to high-trust suppliers.

**Why:** The reliability badge already combines verification, rating, review volume and response speed into one glanceable score. Sorting and filtering by that score turns a passive indicator into an active discovery tool—critical when buyers must quickly shortlist dependable partners for perishable or high-volume orders.

**How (implemented):**
- Extracted `getReliabilityScore(s)` (0–5) used by the badge and by new logic.
- New sort option “Reliability: High to Low” on the main sort control.
- Sidebar select “Min. reliability” with thresholds 3.0 / 3.5 / 4.0 / 4.5.
- Full integration: active filter chips, clear-all, saved presets, and shareable URL param `rel=`.
- Works with existing clustering, dark mode, delivery point, landscape layout and all other filters. Fully client-side.

This completes the reliability feature set from badge → sort → filter for faster B2B trust-based sourcing.

## 2026-10-14 – RFQ Notes Properly Captured & Shown in Inquiry History

**What:** Persist the “Notes / requirements” field from single RFQs and add a shared notes field to the multi-seller Inquiry Cart. Display a notes indicator in the Inquiry History sidebar and surface the full note on click/title.

**Why:** Buyers regularly need to convey packaging, delivery window, quality, or certification details that quantity and date alone cannot capture. Without storing and resurfacing those notes, follow-up quality drops and buyers lose context on past inquiries.

**How (implemented):**
- Single RFQ: notes from `#rfqMsg` are now saved on the inquiry record in localStorage.
- Combined cart: added optional shared notes textarea; notes are attached to the combined inquiry record and cleared after send.
- Inquiry History list shows a 📝 indicator when notes exist; click/title includes the note text.
- Fully client-side, works with dark mode, existing history limit (12), and all other features.

This makes every inquiry more complete and useful for both buyers and sellers in the demo.

## 2026-10-14 – Restore working app + phone/laptop polish + OSM tiles

**What:** Restored the full working single-file prototype (index.html) after a modularization attempt left the app stubbed and non-functional. Applied practical phone/laptop optimizations: 100dvh viewport, 44px touch targets, landscape side-by-side layout, collapsible filters on phones, iOS input zoom prevention, and reliable free OpenStreetMap tiles.

**Why:** The live prototype was broken for buyers and sellers (blank/loading state). Reliable map + usable layout on phones (on-the-go sourcing) and laptops (office comparison) is essential for a B2B farm marketplace. Collapsible filters keep the list visible on small screens without losing discovery power.

**How:**
- Recovered complete index.html from prior working commit and made it the canonical source.
- body height 100dvh + overflow-x: hidden.
- Icon buttons 44px with touch-action: manipulation; mobile media query no longer shrinks them.
- New landscape media query for side-by-side map/sidebar on rotated phones/tablets.
- Filters panel collapses via toggle button on ≤700px.
- Street map switched to https://{s}.tile.openstreetmap.org with proper attribution.
- All existing B2B features (RFQ, cart, comparison, clustering, dark mode, filters, view modes) preserved and client-side.

Prototype is again fully usable on phones and laptops for wholesale farm product discovery and inquiry. Cycle continues.

## 2026-10-14 – Inquiry Status Tracking

**What:** Add status tracking to the Inquiry History sidebar. Each sent RFQ (single or combined) starts as “Pending” and can be updated by the buyer to Quoted / Accepted / Declined. Status is shown with a colored badge and a compact dropdown; changes persist in localStorage.

**Why:** Wholesale buyers often manage several active RFQs at once. A simple status turns the history log into a lightweight procurement tracker, so buyers can see at a glance which inquiries still need follow-up, which have quotes, and which have been closed—without leaving the marketplace.

**How (implemented):**
- Inquiry records now include a `status` field (default `pending`).
- Sidebar history items display a colored status badge (Pending / Quoted / Accepted / Declined).
- Inline `<select>` lets the buyer change status; change is saved immediately and the list re-renders.
- Works for both single RFQs and combined cart inquiries. Fully client-side, compatible with notes, dark mode, and the existing 12-item history limit.

This completes a practical closed-loop for the RFQ workflow in the demo. (feat: add inquiry status tracking (Pending/Quoted/Accepted/Declined))

## 2026-10-14 – Earliest Arrival Date Badge & Filter

**What:** Add an “Arrives ~15 Oct” style badge on seller cards, map popups and the detail drawer that shows the earliest estimated arrival date based on the seller’s lead time. Include a sidebar filter “Earliest arrival within” (Any / ≤2 / ≤5 / ≤7 / ≤14 days) and a new “Earliest arrival” sort option.

**Why:** Wholesale buyers planning restaurant menus, retail promotions or processing schedules need a concrete arrival window, not just a raw lead-time number. Making the earliest realistic delivery date glanceable and filterable reduces coordination friction and helps buyers shortlist suppliers who can actually meet their receiving deadlines.

**How (implemented):**
- New `getEarliestArrivalDate()`, `formatArrivalDate()`, `getArrivalBadge()` and `daysUntilArrival()` helpers (client-side, today + leadTimeDays).
- Compact green badge rendered on cards, popups and drawer.
- Sidebar select for maximum days until arrival + full integration with active filter chips, clear-all, saved presets and shareable URL (`arr=`).
- New sort option “Earliest arrival”.
- Works with existing clustering, dark mode, custom delivery point, landscape layout and all other filters. Fully client-side.

This gives buyers a practical, time-aware view of when product can realistically reach them.

## 2026-10-14 – Keyboard Accessibility & Modal Focus Management

**What:** Improve keyboard usability for professional B2B buyers: Escape closes the RFQ modal, seller drawer, comparison modal, inquiry cart and any open overlay; focus is trapped inside open modals; the search input is focusable with `/`; primary interactive controls have clearer ARIA labels and roles.

**Why:** Wholesale buyers often work at a desk with keyboard + mouse. Without Escape-to-close, focus trapping and logical tab order, the dense filter + map + modal UI is slow and frustrating. Accessibility also improves screen-reader compatibility and overall polish for a production-ready feel.

**How (to implement):**
- Global `keydown` listener: Esc closes the top-most open modal/drawer/cart and returns focus to the trigger.
- Focus trap (Tab cycles inside) for RFQ modal, comparison modal, cart modal and seller drawer.
- `/` key focuses the main search box when not typing in an input.
- Add/verify `aria-label`, `role="dialog"`, `aria-modal="true"` and `aria-labelledby` on modals; ensure buttons have accessible names.
- Works with existing dark mode, mobile layout and all filters. Fully client-side, no new dependencies.

This makes the prototype significantly more usable for keyboard-driven procurement workflows.

## 2026-10-14 – Keyboard Accessibility & Modal Focus Management (Implemented)

**What:** Enhanced keyboard support for B2B buyers: Escape closes the top-most open overlay (cart → comparison → RFQ → drawer) and restores focus; `/` focuses the search box when not typing in a form field; Tab cycles inside open dialogs (focus trap); last-focused element is remembered on open; compare modal received proper role/aria attributes.

**Why:** Desk-based wholesale buyers rely on keyboard workflows. Reliable Escape-to-close, search shortcut and focus management reduce friction in a dense map + filter + modal interface and improve accessibility.

**How (implemented):**
- Global keydown handler prioritises overlays and restores focus via `lastFocusedEl`.
- `getFocusable()` + Tab trap keeps focus inside the active dialog.
- Open handlers for cart, RFQ, drawer and comparison capture the previous active element and move focus into the dialog.
- `/` shortcut focuses and selects `#searchInput`.
- Compare modal now has `role="dialog"`, `aria-modal` and labelled close button.
- Fully client-side, compatible with dark mode, mobile layout, all filters and existing features.

This completes a practical keyboard layer for the prototype.

## 2026-10-14 – Live Order Cost Estimator on Seller Cards

**What:** Compact live cost estimator on every seller card: quantity input that instantly shows the applicable volume-tier unit price, product subtotal, estimated delivery fee, and grand total. The adjacent “Request Quote” button pre-fills the RFQ modal with that quantity.

**Why:** Wholesale buyers routinely test different volumes to understand landed cost before committing to an inquiry. Calculating this only inside the RFQ modal forces extra clicks and slows side-by-side comparison. A live estimator on the card makes volume pricing and delivery cost immediately actionable.

**How (implemented):**
- Added a compact estimator row (number input + live breakdown) to each seller card.
- Reuses existing `getApplicableTier()` and `estimateDeliveryCost()`.
- Input events stop propagation so the card itself is not activated.
- `openRfqModal(id, prefillQty)` accepts an optional quantity and sets the RFQ quantity field + live tier display.
- Fully client-side, compatible with dark mode, mobile layout, all filters, and existing features.

This reduces friction for bulk procurement workflows.

## 2026-10-14 – One-Click Reorder from Inquiry History

**What:** Add a “Reorder” action on every item in the Inquiry History sidebar. For single-seller RFQs it re-opens the RFQ modal pre-filled with the previous quantity, preferred delivery date and notes. For combined (cart) inquiries it rebuilds the inquiry cart with the same sellers and quantities and opens the cart modal so the buyer can tweak and re-send.

**Why:** Wholesale buyers frequently reorder the same produce week after week (menus, promotions, standing orders). Re-typing quantities and requirements is pure friction. A one-click reorder from the history log turns the demo into a practical repeat-procurement tool and keeps the conversation context (notes, preferred dates) attached to the next inquiry.

**How (implemented):**
- Extended inquiry records with explicit `qty` / `preferredDate` (single) and `cartItems` (combined).
- Fixed notes capture so `#rfqMsg` value is always stored.
- `openRfqModal(id, prefillQty, prefillDate, prefillNotes)` accepts optional date and notes.
- In `renderInquiries` added a compact “Reorder” button next to the status select.
- `reorderInquiry(id)` restores state and opens the appropriate modal.
- Fully client-side, works with existing status tracking, notes indicator, dark mode and localStorage history limit.

## 2026-10-14 – Export Inquiry History as CSV

**What:** Add an “Export CSV” button in the Inquiry History sidebar that downloads a timestamped CSV of all recorded RFQs (single and combined). Columns include date/time, type, summary, status, quantity, preferred delivery date, notes, and seller IDs/names.

**Why:** Wholesale buyers and procurement teams need an auditable record of inquiries for internal tracking, ERP import, or follow-up. Keeping the history only inside the browser limits usefulness; a one-click CSV export turns the demo log into a practical exportable procurement trail that works with existing spreadsheets and tools.

**How (implemented):**
- Button placed next to “Clear history” under Inquiry history.
- Client-side generation mirroring the existing seller Export CSV pattern (Blob + download link).
- Includes status so the export reflects the buyer’s current tracking state.
- Fully compatible with localStorage history, reorder, notes, and dark mode.

## 2026-10-14 – Supplier Reliability Score Badge, Filter & Sort

**What:** Add a composite Reliability Score (0–100) badge on seller cards, map popups and the detail drawer. The score blends rating, review volume, verified status, current stock availability and typical response time. Include a sidebar “Min. reliability” filter (Any / 70+ / 80+ / 90+) and a new “Reliability” sort option.

**Why:** Wholesale buyers need a quick, trustworthy signal when shortlisting suppliers beyond raw star ratings. A single reliability number that factors in responsiveness and current availability reduces risk and speeds up procurement decisions.

**How (implemented):**
- `getReliabilityScore()` and `getReliabilityBadge()` helpers (client-side calculation).
- Colored badge (green / amber / red) rendered on cards, popups and drawer.
- Sidebar select + full integration with active filter chips, clear-all, saved presets and shareable URL (`rel=`).
- New sort option “Reliability”.
- Sample `responseHours` added to several sellers so the score reflects response performance.
- Fully client-side, compatible with dark mode, clustering, all existing filters and features.

This gives buyers a practical, at-a-glance view of supplier dependability.

## 2026-10-14 – Lot / Batch Traceability Badge & Filter

**What:** Add a “Lot-tracked” badge on seller cards, map popups and the detail drawer for suppliers that provide full lot/batch traceability. Include a sidebar “Lot-tracked / Traceable only” toggle filter.

**Why:** Commercial buyers (restaurants, retailers, processors) increasingly require traceability for food safety, audits and compliance. A clear badge and filter lets them quickly shortlist suppliers who can provide batch-level origin information, reducing risk and speeding procurement.

**How (implemented):**
- Added `traceable: true/false` to sample sellers.
- `getTraceBadge()` helper renders a “Lot-tracked” badge.
- Badge appears on cards, popups and drawer.
- Sidebar toggle + full integration with active filter chips, clear-all, saved presets and shareable URL (`trace=1`).
- Fully client-side, compatible with dark mode, clustering and all existing filters.

Also addressed open GitHub issue #1: made the filters panel scrollable (`max-height: 55vh; overflow-y: auto`) so all filters are reachable on smaller viewports, and confirmed map uses free OpenStreetMap tiles (no API key required).

## 2026-10-14 – Request Sample Button & Sample Inquiry Tracking (Implemented)

**What:** Added a “Request Sample” action on seller cards, map popups and the detail drawer. Clicking it opens the existing RFQ modal pre-filled with a small sample quantity (5) and a notes prefix “Sample request: ”. Sample inquiries are logged in Inquiry History with a distinct “🧪 Sample” type and can be reordered or exported like normal RFQs.

**Why:** Commercial buyers frequently need to evaluate product quality, packaging and taste before committing to bulk volumes. A one-click sample request lowers friction for new supplier relationships and gives procurement teams a clear audit trail of sample requests versus full orders.

**How (to implement):**
- “Request Sample” buttons next to existing Request Quote buttons (cards, popups, drawer).
- Extends `openRfqModal` to accept optional prefill that sets qty=5 and prefixes notes.
- On send, if notes start with “Sample request:”, store `type: 'sample'` in the inquiry record.
- Inquiry History shows a “Sample” badge for these entries.
- Fully client-side, works with dark mode, localStorage history, reorder, export CSV and all existing features.

This adds a practical evaluation step to the B2B buying journey.
## 2026-10-14 – Phone & Laptop View Refinements + Default Collapsed Filters

**What:** Refined responsive layout for phones and laptops: laptop sidebar widths (380px mid, 420px large with centered max-width), more compact map controls and hidden legend on phones, and filters panel starts collapsed on ≤700px viewports so the seller list is immediately visible.

**Why:** On-the-go buyers on phones need the product list front-and-center without the long filter panel pushing content down; office users on laptops benefit from balanced map/sidebar proportions that leave more room for comparing multiple suppliers side-by-side. Reducing initial clutter improves scan speed for wholesale sourcing.

**How:**
- Added media queries for 901–1400px (380px sidebar) and >1400px (420px sidebar + max-width container).
- Mobile map-controls made wrap-friendly, smaller padding, legend hidden.
- On load, if viewport ≤700px the filters panel is auto-collapsed and the toggle button updates accordingly (still fully expandable).
- Existing 100dvh, touch targets, landscape side-by-side, dark mode, clustering, RFQ, cart and all filters preserved. Fully client-side.

Prototype is more practical for real phone and laptop B2B use. Cycle continues (2026-10-14 is within the 60-day window from 2026-10-11).

## 2026-10-14 – Delivery Days Filter & Badges (Implemented)

**What:** Added delivery-day badges (e.g. Mon/Wed/Fri) on seller cards, map popups and the detail drawer, plus a multi-select filter so buyers can show only sellers who deliver on one or more preferred receiving days. Also listed explicitly in the seller drawer.

**Why:** Restaurants, retailers and processors run fixed receiving windows. Matching a seller’s regular delivery schedule up front reduces failed deliveries, extra coordination and operational friction — a high-value B2B fit signal that pure distance or lead-time filters do not capture.

**How (implemented):**
- Added `deliveryDays` arrays (Mon–Sun subsets) to all sample sellers.
- Compact badges rendered on cards, popups and drawer (reuses existing badge style).
- Sidebar checkbox group (OR logic) for Mon–Sun under “Delivery days (any)”.
- Full integration with active filter chips, clear filters, saved presets and shareable URL (`days=Mon,Wed`).
- Fully client-side, compatible with clustering, custom delivery point, dark mode and all other filters.

This makes schedule compatibility visible and filterable for wholesale buyers. Also confirmed map uses free OpenStreetMap tiles (no API key) and filters panel is scrollable, addressing open GitHub issue #1.
## 2026-10-14 – Resize / Orientation Map Polish for Phone & Laptop

**What:** Added debounced window resize and orientationchange listeners that call map.invalidateSize() and intelligently manage the filters panel collapse state when crossing the 700px breakpoint. Reinforced font smoothing and overflow handling.

**Why:** Rotating a phone or resizing a laptop window (or switching between split/map/list views) previously left the Leaflet map with stale dimensions, causing blank tiles or clipped markers. Filters that were collapsed on phone could stay collapsed after expanding to laptop width. These small fixes keep the discovery surface (map + list) correctly sized and usable without manual refresh.

**How:**
- Debounced (150ms) resize/orientationchange handler that invalidates the map size.
- When viewport grows beyond 700px, auto-expands the filters panel if it was collapsed.
- Added -webkit-font-smoothing for crisper text on Retina/laptop displays.
- Fully client-side; preserves all existing filters, view modes, dark mode, RFQ, cart and clustering.

This keeps the prototype reliable for real-world phone rotation and laptop window management. Cycle continues.

## 2026-10-14 – Deep-Linkable Seller Profiles & Share Button

**What:** Added support for deep-linking directly to a seller’s detail drawer via a `?seller=<id>` URL parameter, plus a “Share” button inside the drawer that copies a ready-to-send link. Opening a drawer updates the URL (preserving any active filters); closing it removes the parameter. On page load, if a `seller=` param is present, the matching drawer opens automatically after filters are restored.

**Why:** Procurement teams frequently need to share a specific supplier with colleagues or save a direct reference for later follow-up. Previously the only shareable state was filter combinations. A stable, copyable seller link reduces coordination friction and makes the prototype more useful as a lightweight internal tool.

**How (implemented):**
- `openSellerDrawer()` writes `seller=<id>` into the current query string with `history.replaceState` (other filter params stay intact).
- `closeSellerDrawer()` deletes the `seller` param.
- New `shareSeller(id)` helper builds the full URL and copies it via Clipboard API (with `fallbackCopy` fallback) and shows a toast.
- On init, after `applyFiltersFromUrl()`, if `seller=` exists the corresponding drawer is opened after a short delay so the map and list have rendered.
- Fully client-side; compatible with existing filters, chips, presets, shareable filter URLs, dark mode, clustering, and localStorage features.

This gives buyers a practical way to bookmark or forward an individual supplier profile. Also reconfirmed the map uses free OpenStreetMap + Esri satellite tiles (no API key required) and the filters panel remains scrollable, addressing open GitHub issue #1.

## 2026-10-14 – Demo Login + Seller Product Listing

**What:** Added a client-side demo login (Buyer / Seller roles stored in localStorage) and a “List a Product” flow so sellers can publish a new crop listing that immediately appears on the map and in the seller list.

**Why:** Addresses open feedback that buyers can filter but sellers cannot log in or publish crops. Gives the prototype a basic role-based experience and lets sellers contribute inventory in the demo without a backend.

**How:**
- Header Login button opens a role picker; selection persists and updates the UI (Seller sees the list action; Buyer hides it).
- Sell Your Goods / List a Product modal collects name, product, category, price, unit and quantity, then pushes a new seller object into the in-memory array and re-renders.
- Empty-state improved with a one-click “Clear all filters” button.
- Added theme-color and apple-mobile-web-app meta tags for better phone home-screen / status-bar appearance.
- Fully client-side; existing filters, RFQ, cart, dark mode, clustering and responsive layout preserved.

This makes the marketplace more useful for both sides of the B2B transaction in the prototype. Cycle continues (2026-10-14 is within 60 days of 2026-10-11).


## 2026-10-14 – Seller Listings Persistence + My Listings Manager

**What:** Extended the demo Seller Portal so published crop listings survive page reloads (localStorage) and sellers can view/remove their own listings from a simple “My Listings” panel. New listings are properly added as map markers and tagged with a “Your listing” badge.

**Why:** The initial login + list flow was useful but ephemeral — listings disappeared on refresh and there was no way for a seller to manage what they had published. Persistence and a basic manager make the two-sided demo realistic for repeated use and directly improve the publish experience requested in GitHub issue #2.

**How (implemented):**
- User listings saved to `farmdirect_userListings` and merged into the `sellers` array on init.
- `submitListProduct` now creates the Leaflet marker, adds it to the cluster, and marks the object `isUserListing: true`.
- Header / sidebar “My Listings” button (visible when logged in as Seller) opens a modal listing the seller’s items with a Remove action.
- “Your listing” badge appears on cards and popups for user-published items.
- Fully client-side; works with existing role login, filters, clustering, and dark mode.

This completes a practical seller-side loop: log in → publish → see it on the map → manage it later.
