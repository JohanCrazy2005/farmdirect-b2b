# FarmDirect B2B – Incremental Improvement Log

This file is updated automatically every hour by a Grok automation.
Each entry proposes **one** concrete UI or feature improvement that can be implemented in the next iteration.

---

## 2026-10-11 – Initial Prototype
- Map + sidebar marketplace UI matching the original mockup
- Leaflet map with emoji markers and popups
- Filters (category, organic, distance, price) + search + sort
- Seller cards with images, ratings, contact buttons
- Responsive basic layout

**Suggested next focus areas for automation:**
1. Real geolocation + “near me”
2. Product detail / bulk RFQ modal
3. Seller profiles & verified badges
4. Cart / multi-item inquiry
5. Dark mode / accessibility
6. Better mobile map experience
7. Sample data expansion + clustering
8. Login / role-based views (buyer vs seller)

## 2026-10-13 (Responsiveness polish) – Mobile Header Compactness + List Clearance

**What:** Refined the phone layout so the header stays usable and the floating Map/List/Split toggle no longer covers the bottom of the seller list.

**Why:** On narrow screens the previous header was cramped and the floating control could obscure the last listings. Compact header + extra bottom padding makes browsing and switching views practical on phones while laptop/desktop layout stays unchanged.

**How (implemented):**
- Header wraps and shrinks padding/logo on ≤700 px; “B2B” text hidden; search drops to full width on its own row.
- Smaller icon buttons.
- `.seller-list` gains bottom padding so the floating toggle never covers content.
- Toggle slightly smaller and raised less from the edge.
- Desktop/laptop side-by-side view untouched.


This completes the freshness signal proposed earlier and makes the marketplace more practical for time-sensitive fresh-produce buying.

## 2026-10-12 (Hourly update) – Volume Pricing Tiers (Implemented)

**What:** Added volume/bulk pricing tiers to every seller. Cards and map popups now show the best bulk rate (e.g. “Bulk from 100 kg: $1.20”). The RFQ modal displays the applicable unit price live as the buyer types a quantity, including the savings versus base price.

**Why:** Wholesale buyers make decisions based on bulk discounts. Surfacing tiers early improves transparency, speeds qualification, and increases the quality of inquiries.

**How (implemented):**
- Extended sample `sellers` with `volumeTiers` arrays of `{minQty, price}`.
- Added `getApplicableTier()` and `tierSummary()` helpers.
- Displayed bulk summary on seller cards and Leaflet popups.
- Added `#rfqTierPrice` element; quantity input updates the live unit price.
- Fully client-side and dark-mode compatible.

This completes the volume pricing signal and makes the marketplace more practical for real B2B volume buyers.

## 2026-10-12 (Hourly update) – Seller Comparison View

**What:** Add the ability to select 2–3 sellers and open a side-by-side comparison table/modal showing key commercial and logistics attributes (base price + best bulk price, MOQ, lead time, rating, stock status, payment terms, fulfillment, freshness, distance, verified/organic badges, and volume tier summary).

**Why:** Wholesale buyers routinely evaluate multiple suppliers against the same criteria before sending RFQs. Without a comparison view they must mentally track differences across cards or re-open popups. A dedicated side-by-side view reduces cognitive load, speeds qualification, and makes the marketplace more practical for real multi-supplier sourcing decisions.

**How:**
- Add a “Compare” toggle/button on each seller card and map popup.
- Maintain a client-side set of selected seller IDs (maximum 3).
- Show a floating “Compare (n)” bar when at least 2 sellers are selected.
- Clicking the bar opens a modal with a responsive comparison table.
- Include a “Request Quote” button per seller inside the comparison that opens the existing RFQ modal.
- Allow clearing the selection. Persist nothing (session-only is fine for the prototype).
- Fully client-side, dark-mode compatible, and mobile-friendly (stacked or horizontal-scroll table).

This is a small, high-impact decision-support improvement that can be implemented in one short coding session and directly helps buyers choose among shortlisted farms.

## 2026-10-12 (Hourly update) – Seller Comparison View (Implemented)

**What:** Implemented the ability to select 2–3 sellers and open a side-by-side comparison table/modal showing key commercial and logistics attributes (base price + best bulk price, MOQ, lead time, rating, stock status, payment terms, fulfillment, freshness, distance, verified/organic badges).

**Why:** Wholesale buyers routinely evaluate multiple suppliers against the same criteria before sending RFQs. The comparison view reduces cognitive load and speeds qualification.

**How (implemented):**
- Added “Compare” buttons on seller cards and map popups.
- Client-side `compareIds` Set (max 3) with floating “Compare (n)” bar when ≥2 selected.
- Modal with responsive table of key attributes and a “Request Quote” button per seller that opens the existing RFQ modal.
- Fully client-side and dark-mode compatible.
- Pushed to GitHub (commit 5c0a5fb). Vercel production update requires re-authentication of the connector.

This completes the seller comparison feature and makes the marketplace more practical for multi-supplier sourcing decisions.

## 2026-10-12 (Hourly update) – Inquiry Cart / Multi-seller Shortlist

**What:** Add a lightweight Inquiry Cart so buyers can collect multiple sellers (with quantities) into a shortlist, then open a cart summary modal from a header button and send a combined inquiry.

**Why:** Real B2B farm sourcing almost always involves more than one supplier in a purchasing cycle. The current single-seller RFQ forces repeated interactions. An inquiry cart turns browsing into a practical multi-item workflow, increases the value of favorites and comparison, and makes the prototype ready for actual buyer use.

**How:**
- Add an “Add to Inquiry” button on each seller card and map popup.
- Maintain a client-side cart (seller ID → quantity), persisted in localStorage.
- Show a header cart icon with a live count badge; clicking it opens a summary modal with editable quantities, remove buttons, and estimated value.
- From the cart modal, provide a “Send Combined Inquiry” button that confirms the list (toast + clear cart).
- Fully client-side, dark-mode compatible, and mobile-friendly.

This is a small, high-impact workflow improvement that can be implemented in one focused coding session and helps buyers manage multi-supplier sourcing.


## 2026-10-12 (Hourly update) – Inquiry Cart / Multi-seller Shortlist (Implemented)

**What:** Implemented a client-side Inquiry Cart. Buyers can add sellers (with quantities) from cards and map popups, view/edit the shortlist in a header-triggered modal, and send a combined inquiry (demo toast).

**Why:** Enables practical multi-supplier sourcing workflows without repeated single RFQs.

**How (implemented):**
- Header cart button with count badge (persisted via localStorage).
- “+ Cart” buttons on seller cards and Leaflet popups.
- Cart modal with editable quantities, remove, estimated total, clear, and Send Combined Inquiry.
- Fully client-side and dark-mode compatible.

This completes the inquiry cart feature and makes multi-seller shortlisting practical for buyers.


## 2026-10-12 (Hourly update) – Marker Clustering

**What:** Add Leaflet.markercluster so nearby seller markers group into numbered clusters at wider zoom levels, expanding into individual emoji markers (or spiderfy) when the buyer zooms in or clicks a cluster.

**Why:** Even with a modest number of sellers the map can look cluttered when many farms sit close together (common in regional produce belts). Clustering keeps the overview clean, reduces visual noise, and improves performance and usability as the catalog grows—while still letting buyers drill down to exact locations.

**How:**
- Include Leaflet.markercluster CSS/JS from CDN.
- Create an L.markerClusterGroup (maxClusterRadius ~60, spiderfyOnMaxZoom, zoomToBoundsOnClick) and add it to the map.
- Add each seller marker to the cluster group instead of directly to the map.
- Keep the existing popup content, favorites, compare, and cart buttons working inside the clusters.
- User location marker remains unclustered on the base map.
- Fully client-side and compatible with the current dark-mode and filter system (map markers always show all sellers; sidebar still filters).

This is a small, high-impact map UX improvement that can be implemented in one short coding session and scales the prototype for denser seller coverage.

## 2026-10-12 (Hourly update) – Marker Clustering (Implemented)

**What:** Implemented Leaflet.markercluster. Nearby sellers now group into clusters at wider zooms and expand cleanly on zoom or click.

**Why:** Cleaner map overview and better scalability for regional farm density.

**How (implemented):**
- Added MarkerCluster CSS + JS via unpkg.
- Initialized markerCluster group and added it to the map.
- Seller markers are now added to the cluster group.
- Existing popups, buttons, and user marker remain functional.
- Fully client-side and dark-mode compatible.

This completes the marker clustering feature and improves map readability for buyers.

## 2026-10-12 (Hourly update) – Seller Detail Drawer / Quick Profile Panel

**What:** Add a slide-out Seller Detail Drawer that opens from a “Details” button (or seller name/image click) on cards and map popups. The drawer shows an expanded profile: larger photo, farm bio, full commercial terms (price tiers, MOQ, lead time, payment, fulfillment, stock, freshness), certifications, location distance, and quick actions (Request Quote, Favorite, Compare, Add to Cart).

**Why:** Seller cards and Leaflet popups are intentionally compact. Wholesale buyers often need richer context (farm story, packaging notes, exact logistics fit) before sending an RFQ. A drawer keeps the map and filtered list visible while providing depth, improving qualification speed without requiring a separate page in the prototype.

**How:**
- Add a right-side drawer (bottom sheet on small screens) with overlay.
- Trigger via new “Details” button on cards/popups and optional click on seller name.
- Populate from existing seller data; add a short `bio` field to sample sellers.
- Reuse existing action handlers (openRfqModal, toggleFavorite, etc.).
- Close on overlay click, Escape, or close button. Fully client-side, dark-mode compatible, and accessible.

This is a small, high-impact browsing improvement that makes the marketplace feel more complete for serious B2B evaluation.

## 2026-10-12 (Hourly update) – Seller Detail Drawer / Quick Profile Panel (Implemented)

**What:** Implemented a slide-out Seller Detail Drawer that opens from “Details” buttons and seller name clicks on cards and map popups. Shows larger photo, farm bio, full commercial terms, volume tiers, freshness, and quick actions.

**Why:** Gives buyers richer context without leaving the map/list view, speeding qualification before RFQ.

**How (implemented):**
- Right-side drawer (bottom sheet on mobile) with overlay.
- Triggered by Details button and name click on cards; View Details on popups.
- Short bio added to sample sellers.
- Actions reuse existing RFQ, favorite, cart, and compare handlers.
- Escape and overlay close. Fully client-side and dark-mode compatible.

This completes the seller detail drawer and improves browsing depth for wholesale buyers.

## 2026-10-12 (Hourly update) – Fit Map to Filtered Results

**What:** Add a “Zoom to results” control on the map (and optional auto-fit after filters change) that recenters and zooms the map so all currently filtered sellers are visible with comfortable padding.

**Why:** After applying category, distance, price, rating, or availability filters the list updates but the map often stays on the previous view, leaving buyers to pan and zoom manually. A one-click “show these sellers on the map” (plus auto-fit when filters change) keeps the map and list in sync and is especially valuable on mobile where screen space is limited.

**How:**
- After `filterSellers()` finishes rendering markers, optionally call `map.fitBounds` on the visible marker LatLngs (with padding).
- Add a small Leaflet control or header button “Zoom to results” that does the same on demand.
- Fallback to a sensible default view when zero or one seller is visible.
- Respect existing user location marker and dark-mode styles. Fully client-side.

This is a small, high-impact map UX improvement that makes filtering feel complete for B2B buyers scanning supply nearby.

## 2026-10-12 (Hourly update) – Fit Map to Filtered Results (Implemented)

**What:** Implemented “Zoom to results” map control + filtered marker visibility. Map markers now appear/disappear with the current filters; a dedicated button fits the map bounds to the matching sellers with padding.

**Why:** Keeps the map in sync with the filtered list so buyers immediately see where the qualifying farms are without manual pan/zoom.

**How (implemented):**
- `updateVisibleMarkers(filtered)` adds/removes layers from the Leaflet.markercluster group based on the current filter set.
- `fitMapToFiltered()` builds LatLngBounds from the filtered sellers and calls `map.fitBounds` (or flyTo for a single result).
- “🔎 Zoom to results” button added to the map controls next to Near Me.
- Fully client-side, works with clusters, dark mode, and existing popups.

This completes the map-filter sync improvement for faster B2B supply scanning.

## 2026-10-12 (Hourly update) – Saved Filter Presets

**What:** Allow buyers to save the current combination of filters (category, organic, verified, distance, price, MOQ, lead time, rating, availability, payment terms, fulfillment, freshness, search text, and sort) under a custom name and quickly reload or delete them later.

**Why:** B2B buyers frequently run the same sourcing criteria (e.g. “Organic tomatoes within 20 km, Net 15, harvested today”). Re-setting filters every session is tedious. Named presets turn recurring procurement searches into one-click actions and make the marketplace more practical for regular wholesale buyers.

**How:**
- Capture all active filter control values into a plain object.
- Store an array of `{ name, state }` in localStorage.
- Compact “Saved searches” section in the sidebar with name input + Save button.
- List of saved presets with Load and Delete actions.
- Loading applies the state and immediately re-filters the list and map markers.
- Fully client-side, works with dark mode, and coexists with existing filter chips.

This is a high-impact productivity feature for repeat B2B buyers that can be implemented in one short coding session.

## 2026-10-12 (Hourly update) – Saved Filter Presets (Implemented)

**What:** Implemented named Saved Filter Presets. Buyers can save the full current filter set under a custom name and reload or delete it later.

**Why:** Removes repetitive filter setup for recurring wholesale sourcing criteria.

**How (implemented):**
- Sidebar “Saved searches” section with name input and Save button.
- localStorage-backed list of presets (`farmdirect_presets`).
- Load applies all controls (category, toggles, ranges, selects, search, sort) and re-runs filtering + marker visibility.
- Delete removes the preset. Fully client-side and dark-mode compatible.

This completes the saved-search feature and improves daily usability for B2B buyers.

## 2026-10-12 (Hourly update) – Export Filtered Results as CSV

**What:** Add an “Export CSV” button in the sidebar that downloads the currently filtered seller list as a spreadsheet-ready CSV (name, farm, product, price/unit, MOQ, lead time, rating, distance, organic, verified, payment terms, fulfillment, stock status, harvest days ago).

**Why:** Wholesale buyers regularly need to share shortlists with colleagues, paste into procurement spreadsheets, or attach to approval emails. One-click export turns the interactive prototype into a practical research and reporting tool without requiring extra manual copying.

**How:**
- Place a clear “Export CSV” button next to Clear all filters.
- On click, serialize `window._lastFilteredList` (or full list if none filtered) into a properly escaped CSV string.
- Trigger a browser download with a timestamped filename (e.g. farmdirect-sellers-2026-10-12.csv).
- Show a toast confirming the export. Fully client-side, works with all existing filters, dark mode, and mobile.

This is a small, high-impact productivity feature for B2B buyers that can be implemented in one short coding session.

## 2026-10-12 (Hourly update) – Export Filtered Results as CSV (Implemented)

**What:** Implemented one-click CSV export of the currently filtered seller list from the sidebar.

**Why:** Lets wholesale buyers download a ready-to-share spreadsheet of matching suppliers for procurement workflows, approvals, or offline review.

**How (implemented):**
- “Export CSV” button added in the filters panel.
- Serializes `window._lastFilteredList` (falls back to full catalog) into a properly escaped CSV with key commercial fields.
- Triggers a timestamped download and shows a confirmation toast.
- Fully client-side, works with all filters, dark mode, and mobile.

This completes the CSV export feature and makes the prototype more practical for real B2B sourcing research.

## 2026-10-13 (Hourly update) – Shareable Filter URL + Copy Link

**What:** Make the current filter state (search, category, toggles, ranges, selects, sort) reflect in the browser URL as query parameters, restore filters on page load from the URL, and add a “Copy link” button so buyers can share or bookmark an exact search view with colleagues.

**Why:** Wholesale procurement is often collaborative. Buyers need to send a precise shortlist view to a purchasing manager or teammate without describing every filter. Shareable deep links turn the prototype into a real shared research tool and improve repeatability.

**How:**
- Serialize active filter state into clean query params (e.g. `?q=tomato&cat=vegetables&organic=1&maxPrice=4&sort=price-asc`).
- On `filterSellers()` / control changes, update `history.replaceState` (no reload).
- On initial page load, parse `location.search` and apply values to all controls before first render.
- Add a compact “Copy link” button near Export CSV / Clear filters; on click, copy the full current URL and show a toast.
- Keep it fully client-side, dark-mode compatible, and mobile-friendly.

This is a high-impact collaboration feature that can be implemented in one focused coding session.

## 2026-10-13 (Hourly update) – Shareable Filter URL + Copy Link (Implemented)

**What:** Filter state is reflected in the browser URL as clean query parameters; loading a shared link restores the exact filters. A “Copy link” button in the sidebar copies the current URL for sharing with colleagues.

**Why:** Enables collaborative B2B sourcing — buyers can send a precise shortlist view instead of describing every filter.

**How (implemented):**
- `stateToQuery` / `queryToState` serialize only non-default filter values into short query keys (`q`, `cat`, `organic`, `dist`, etc.).
- `updateUrlFromFilters` called from `filterSellers` uses `history.replaceState` (no page reload).
- `applyFiltersFromUrl` runs on initial load before first render.
- “Copy link” button next to Export CSV uses Clipboard API (with fallback) and shows a toast.
- Works with all existing filters, dark mode, saved presets, and mobile.

This completes the shareable deep-link feature and makes collaborative research practical.

## 2026-10-13 (Hourly update) – Estimated Delivery Cost Indicator

**What:** Show an estimated delivery fee (based on distance) on seller cards, map popups, and inside the RFQ modal so buyers can compare true landed cost.

**Why:** Wholesale buyers care about total cost of goods, not just farm-gate price. A nearby supplier with a slightly higher unit price can be cheaper once logistics are included. Making delivery estimates visible improves decision quality and reduces surprises in the inquiry stage.

**How:**
- Add a simple client-side formula (e.g. $25 base + $0.70 per km, with a reasonable cap).
- Display “Delivery est. $XX” in the seller meta line on cards and in Leaflet popups.
- Include the estimate in the RFQ modal subtitle or as a live note when quantity is entered.
- Optional lightweight filter for maximum delivery fee (Any / ≤$50 / ≤$100).
- Fully client-side; updates automatically when Near Me recalculates distances. Works with dark mode and existing filters.

This is a high-impact commercial clarity feature for B2B logistics-sensitive buyers that can be implemented in one short coding session.

## 2026-10-13 (Hourly update) – Estimated Delivery Cost Indicator (Implemented)

**What:** Implemented estimated delivery fee on seller cards, map popups, and RFQ modal, plus a Max Delivery Fee filter.

**Why:** Gives buyers a realistic landed-cost view so they can compare nearby vs distant suppliers accurately.

**How (implemented):**
- `estimateDeliveryCost(distanceKm)` uses $25 base + $0.70/km (capped at $180).
- Shown in card meta, Leaflet popups, and RFQ subtitle.
- New “Max Delivery Fee” select (Any / ≤$40 / ≤$60 / ≤$100) integrated into filtering, active chips, saved presets, and shareable URL (`deliv` param).
- Fully client-side; updates with Near Me distance changes. Dark-mode compatible.

This completes the delivery cost visibility feature for more practical B2B procurement decisions.



## 2026-10-13 (Hourly update) – Sort by Delivery Cost & Landed Cost

**What:** Add two new sort options — “Delivery cost: Low to High” and “Landed cost (price + deliv)” — so buyers can rank suppliers by logistics cost and by a simple combined unit+delivery score.

**Why:** Farm-gate price alone is incomplete for B2B buyers. A slightly higher unit price from a nearby farm is often cheaper once delivery is included. Explicit sort options make this comparison instant instead of mental arithmetic across cards.

**How:**
- Extend the Sort by `<select>` with the two new options.
- In `filterSellers`, compute `estimateDeliveryCost(distance)` for pure delivery sort.
- For landed cost, use `price + delivery / 50` (amortizing delivery over a typical small wholesale order) so unit price still dominates but proximity is rewarded.
- Works with existing Near Me distance updates, filters, chips, URL state, and dark mode. No new UI chrome required.

This is a lightweight, high-signal commercial decision aid that builds directly on the delivery-cost indicator already present.

## 2026-10-13 (Hourly update) – Sort by Delivery Cost & Landed Cost (Implemented)

**What:** Implemented “Delivery cost: Low to High” and “Landed cost (price + deliv)” sort options.

**Why:** Lets buyers instantly reorder the list by true logistics-aware cost.

**How (implemented):**
- New options in the Sort by dropdown.
- Pure delivery sort uses existing `estimateDeliveryCost()`.
- Landed-cost score = unit price + (delivery estimate / 50).
- Fully integrated with filter pipeline, shareable URL (`sort` param), saved presets, and active filter chips. No backend required.

This completes the landed-cost ranking feature for more practical B2B procurement decisions.
## 2026-10-13 (Hourly update) – Private Buyer Notes on Sellers

**What:** Let buyers attach private, persistent notes to any seller. Notes are stored locally, shown in the seller detail drawer (editable), and indicated with a small note badge on cards and popups.

**Why:** B2B farm sourcing is relationship- and memory-driven. Buyers routinely track informal details (“prefers WhatsApp”, “great for weekend specials”, “call before 8am”, “delivered late last time”). Private notes turn the prototype into a lightweight personal supplier CRM without needing accounts or a backend.

**How:**
- Store notes as a simple `{ sellerId: text }` object in `localStorage`.
- Add a notes textarea + Save button inside the existing seller detail drawer.
- Show a compact “📝 Note” badge on seller cards (and optionally popups) when a note exists.
- Fully client-side, works with dark mode, favorites, and all existing filters. No new backend.

This is a small, high-impact productivity feature for repeat wholesale buyers that can be implemented in one short coding session.

## 2026-10-13 (Hourly update) – Private Buyer Notes on Sellers (Implemented)

**What:** Implemented private buyer notes on sellers. Notes are saved in localStorage, editable in the seller detail drawer, and indicated with a “📝 Note” badge on cards.

**Why:** Gives B2B buyers a lightweight personal CRM for supplier relationships inside the marketplace.

**How (implemented):**
- `loadNotes` / `saveNotes` / `getNote` / `setNote` using `localStorage` key `farmdirect_notes`.
- Notes textarea + Save button added to the seller drawer; save refreshes the card list so the badge appears immediately.
- Card rendering shows a note badge when a note exists for that seller.
- Fully client-side and dark-mode compatible.

This completes the private notes feature and improves daily usability for repeat buyers.

## 2026-10-13 (Hourly update) – Quick Quantity Presets in RFQ Modal

**What:** Add one-click quantity preset buttons (10 / 25 / 50 / 100) inside the RFQ modal so buyers can instantly set common wholesale order sizes.

**Why:** Typing quantities every time slows the inquiry flow. Most B2B buyers have standard order volumes; presets reduce friction, surface volume pricing faster, and make the RFQ feel more purposeful for repeat wholesale conversations.

**How:**
- Insert a small row of preset buttons under the quantity input in the RFQ modal.
- Clicking a button sets the quantity field and triggers the existing live tier-price calculation.
- Keep styling consistent with existing small buttons; fully client-side and mobile-friendly.
- Works with the current volume pricing tiers and delivery estimate display.

This is a small, high-impact UX improvement that speeds up the core buyer inquiry action.

## 2026-10-13 (Hourly update) – Quick Quantity Presets in RFQ Modal (Implemented)

**What:** Implemented quick quantity preset buttons (10 / 25 / 50 / 100) in the RFQ modal.

**Why:** Lets buyers set common order sizes in one click and immediately see the applicable volume tier price.

**How (implemented):**
- Added preset button row under the quantity input.
- `setRfqPreset(n)` sets the value and dispatches an input event so the existing `updateTier` logic runs.
- Fully client-side, dark-mode compatible, and works with all current RFQ features.

This completes the quantity preset feature and improves the speed of bulk inquiry creation.

## 2026-10-13 (Hourly update) – Recently Viewed Sellers

**What:** Add a “Recently viewed” list in the sidebar that shows the last 5–8 sellers a buyer opened in the detail drawer or RFQ modal, with one-click reopen and a clear button.

**Why:** Wholesale buyers research and return to the same shortlist of farms across sessions. Surfacing recent activity removes friction, turns the prototype into a lightweight personal workspace, and makes repeated comparisons faster without requiring accounts.

**How:**
- Track seller IDs (most-recent first, max 8) in localStorage whenever the drawer or RFQ opens.
- Render compact clickable rows under Saved searches.
- Clicking a row reopens the seller drawer.
- Include a “Clear history” action.
- Fully client-side, dark-mode compatible, and works alongside favorites, notes, and all filters.

This is a small, high-impact productivity feature for repeat B2B buyers that can be implemented in one short coding session.

## 2026-10-13 (Hourly update) – Recently Viewed Sellers (Implemented)

**What:** Implemented a Recently viewed section in the sidebar.

**Why:** Gives buyers instant re-access to sellers they have already researched.

**How (implemented):**
- `trackRecent(id)` called from `openSellerDrawer` and `openRfqModal`.
- Ordered list (max 8) stored in localStorage under `farmdirect_recent`.
- Compact buttons rendered in the sidebar; click reopens the drawer.
- Clear history button + toast.
- Fully client-side and dark-mode compatible.

This completes the recent-activity feature and improves multi-session research workflows.


## 2026-10-13 (Hourly update) – Inquiry History / Sent RFQs Log

**What:** Add a persistent local log of sent inquiries (single-seller RFQs and combined cart inquiries). Show the last 10–12 entries in a new sidebar section with timestamp, seller(s), quantity summary, and a one-click way to re-open the seller or copy details.

**Why:** B2B buyers repeatedly follow up on the same farms. A lightweight inquiry history turns the prototype into a personal procurement notebook — buyers can remember what they asked for, when, and at what quantity without needing accounts or email digests. It also makes demo presentations more realistic.

**How:**
- On successful `submitRfq` and `sendCombinedInquiry`, push a record `{ id, ts, type: 'single'|'combined', sellerIds, summary, email }` into an array in `localStorage` (key `farmdirect_inquiries`, max 12).
- Render compact rows under Recently viewed in the sidebar.
- Clicking a row opens the seller drawer (for single) or shows a toast with the summary.
- Include a “Clear history” button.
- Fully client-side, dark-mode compatible, works with all existing features.

This is a small, high-impact productivity feature that makes the marketplace feel like a real buyer workspace.


## 2026-10-13 (Hourly update) – Inquiry History / Sent RFQs Log (Implemented)

**What:** Implemented a persistent Inquiry history section in the sidebar.

**Why:** Gives buyers a personal log of what they have already inquired about, improving follow-up and demo realism.

**How (implemented):**
- `loadInquiries` / `saveInquiries` / `trackInquiry` / `renderInquiries` / `clearInquiries` using `localStorage` key `farmdirect_inquiries` (max 12).
- Records are created on successful single RFQ submit and combined cart inquiry.
- Compact clickable rows show type, relative time, and summary; single inquiries reopen the seller drawer.
- Fully client-side and dark-mode compatible.

This completes the inquiry history feature and strengthens the prototype as a lightweight buyer workspace.


## 2026-10-13 (Hourly update) – Certification Badges & Required Cert Filter

**What:** Surface food-safety and farming practice certifications (GAP, HACCP, Regenerative) as badges on seller cards, map popups, and the detail drawer. Add sidebar checkboxes so buyers can require one or more certifications when filtering.

**Why:** B2B food buyers frequently need documented certifications for compliance, audits, or retailer programs. Making them visible and filterable reduces qualification time and makes the marketplace more useful for professional procurement.

**How:**
- Extended sample sellers with a `certs` array (e.g. ["organic", "gap"]).
- Added compact certification badges (blue) alongside existing organic/verified badges.
- New “Required certifications” checkbox group (GAP / HACCP / Regenerative) in the filters sidebar.
- Filter logic, active filter chips, and “Clear all filters” all respect the new cert requirements.
- Fully client-side, dark-mode compatible, works with existing organic toggle and other filters.

This strengthens the prototype for real wholesale buying workflows where certification is a hard requirement.

## 2026-10-13 (Hourly update) – Product Grade / Quality Badges & Filter

**What:** Add product quality grades (Premium, Standard, Surplus) as badges on seller cards, map popups, and the detail drawer, plus sidebar checkboxes to filter by one or more grades.

**Why:** Wholesale produce buyers frequently specify grade requirements or intentionally source surplus/imperfect product for cost savings (common on platforms like Full Harvest). Making grade visible and filterable reduces qualification time and expands the prototype’s usefulness for both premium and value-oriented procurement.

**How:**
- Extend sample sellers with a `grade` field ("premium" | "standard" | "surplus").
- Add compact grade badges (distinct colors) next to existing organic/cert/verified badges.
- New “Product grade” checkbox group (Premium / Standard / Surplus) in the filters sidebar.
- Filter logic treats checked grades as an OR include filter; active filter chips and Clear all respect it.
- Fully client-side, dark-mode compatible, works alongside all existing filters.

This is a small, high-impact commercial feature that aligns the marketplace with real B2B produce buying criteria.

## 2026-10-13 (Hourly update) – Product Grade / Quality Badges & Filter (Implemented)

**What:** Implemented product quality grades (Premium, Standard, Surplus) with badges and filter checkboxes.

**Why:** Gives buyers an immediate way to qualify or intentionally seek surplus product.

**How (implemented):**
- Added `grade` field to all sample sellers.
- Grade badges rendered on cards, popups, and drawer (with dark-mode styles).
- Sidebar “Product grade” checkboxes (OR logic when any are selected).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the grade/quality feature and makes the prototype more aligned with professional wholesale produce sourcing.



## 2026-10-13 (Hourly update) – Packaging / Pack Format Badges & Filter

**What:** Add packaging type (Loose, Case, Pallet, Bulk) as badges on seller cards, map popups, and the detail drawer, plus sidebar checkboxes to filter by one or more preferred pack formats.

**Why:** Wholesale buyers and logistics teams care deeply about how product is packed — it affects handling equipment, labor, storage, and freight costs. Making pack format visible and filterable reduces back-and-forth and aligns the prototype with real B2B produce procurement workflows.

**How:**
- Extend sample sellers with a `pack` field ("loose" | "case" | "pallet" | "bulk").
- Add compact pack-format badges (distinct style) next to existing grade/cert/verified badges.
- New “Pack format” checkbox group in the filters sidebar.
- Filter logic treats checked formats as an OR include filter; active filter chips, Clear all, saved presets, and shareable URL all respect it.
- Fully client-side, dark-mode compatible, works alongside all existing filters.

This is a small, high-impact logistics-focused feature that makes the marketplace more practical for professional buyers.

## 2026-10-13 (Hourly update) – Packaging / Pack Format Badges & Filter (Implemented)

**What:** Implemented packaging type (Loose, Case, Pallet, Bulk) badges and filter.

**Why:** Gives buyers an immediate logistics signal for handling and freight planning.

**How (implemented):**
- Added `pack` field to all sample sellers.
- Pack badges rendered on cards, popups, and drawer (dark-mode compatible).
- Sidebar “Pack format” checkboxes (OR logic when any are selected).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the pack-format feature and improves the prototype for real wholesale logistics workflows.


## 2026-10-13 (Hourly update) – Growing Region / County Badges & Filter

**What:** Add growing region (county-level, e.g. Kent, Norfolk, Cornwall, Yorkshire) as badges on seller cards, map popups, and the detail drawer, plus sidebar checkboxes to filter by one or more preferred regions.

**Why:** Professional buyers frequently specify regional preferences for freshness, local-sourcing policies, branding (“Kent tomatoes”), protected designations, or logistics. Making origin visible and filterable shortens qualification and aligns the marketplace with real wholesale procurement criteria.

**How:**
- Extend sample sellers with a `region` field (string).
- Add compact region badges next to existing grade/pack/cert badges.
- New “Growing region” checkbox group in the filters sidebar (OR logic when any are selected).
- Integrate into filter logic, active filter chips, Clear all, saved presets, and shareable URL params.
- Fully client-side, dark-mode compatible, works with all existing filters.

This is a small, high-impact commercial feature that makes regional sourcing practical for B2B buyers.


## 2026-10-13 (Hourly update) – Growing Region / County Badges & Filter (Implemented)

**What:** Implemented growing region badges and filter checkboxes.

**Why:** Lets buyers quickly qualify or prefer specific regional origins for freshness, branding, or local-sourcing policies.

**How (implemented):**
- Added `region` field to all sample sellers.
- Region badges rendered on cards, popups, and drawer (dark-mode compatible).
- Sidebar “Growing region” checkboxes (OR logic when any are selected).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the growing-region feature and improves the prototype for regional B2B sourcing workflows.

## 2026-10-13 (Hourly update) – Available Stock Quantity Badge & Min Stock Filter

**What:** Add a numeric available quantity (stock level) shown as a compact badge on seller cards, map popups, and the detail drawer, plus a sidebar filter for minimum available stock (Any / 100+ / 500+ / 1000+).

**Why:** Wholesale buyers need to know at a glance whether a farm can fulfill a meaningful order size before sending an RFQ. Current stockStatus (In stock / Low / Out) is too coarse; a quantity figure plus min-stock filter lets buyers quickly qualify suppliers for large or recurring orders and reduces wasted inquiries.

**How:**
- Add an `availableQty` numeric field to each sample seller (derived from or alongside the existing qty string).
- Render a stock-quantity badge (e.g. “2,400 kg available”) next to the existing stockStatus badge.
- New “Minimum stock” select in the filters sidebar.
- Filter logic excludes sellers below the threshold; active chips, Clear all, saved presets, and shareable URL params all respect it.
- Fully client-side, dark-mode compatible, works with all existing filters and the Available now toggle.

This makes quantity visibility practical for real B2B procurement decisions.

## 2026-10-13 (Hourly update) – Available Stock Quantity Badge & Min Stock Filter (Implemented)

**What:** Implemented numeric available quantity badges and a minimum stock filter.

**Why:** Lets buyers see and filter by actual available volume so they can qualify large-order suppliers before sending RFQs.

**How (implemented):**
- Added `availableQty` field to all sample sellers.
- Quantity badges (“2,400 kg avail”) rendered on cards, popups, and drawer (dark-mode styles).
- Sidebar “Minimum stock” select (Any / 100+ / 500+ / 1,000+).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features including the Available now toggle.

This completes the stock-quantity feature and improves the prototype for volume-based B2B sourcing.


## 2026-10-13 (Hourly update) – Production Method / Farming System Badges & Filter

**What:** Add production method (Field, Greenhouse, Hydroponic, Pasture) as compact badges on seller cards, map popups, and the detail drawer, plus sidebar checkboxes to filter by one or more preferred farming systems.

**Why:** Wholesale buyers often have preferences or requirements around production method — greenhouse consistency and year-round supply, pasture-raised claims for dairy/eggs, hydroponic controlled environments, or traditional field-grown. Making this visible and filterable reduces qualification time and aligns the prototype with real B2B produce and protein sourcing criteria.

**How:**
- Extend sample sellers with a `production` field ("field" | "greenhouse" | "hydroponic" | "pasture").
- Add distinct production-method badges next to existing grade/pack/region badges.
- New “Production method” checkbox group in the filters sidebar (OR logic when any are selected).
- Integrate into filter logic, active filter chips, Clear all, saved presets, and shareable URL params.
- Fully client-side, dark-mode compatible, works with all existing filters.

This is a small, high-impact commercial feature that makes production-system preferences practical for professional buyers.

## 2026-10-13 (Hourly update) – Production Method / Farming System Badges & Filter (Implemented)

**What:** Implemented production method badges and filter checkboxes.

**Why:** Lets buyers quickly qualify or prefer specific farming systems (greenhouse, pasture, field, hydroponic) for consistency, claims, or seasonality.

**How (implemented):**
- Added `production` field to all sample sellers.
- Production badges rendered on cards, popups, and drawer (dark-mode styles).
- Sidebar “Production method” checkboxes (OR logic when any are selected).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the production-method feature and improves the prototype for system-aware B2B sourcing workflows.


## 2026-10-13 (Hourly update) – Storage / Cold Chain Condition Badges & Filter

**What:** Add storage/temperature condition (Ambient, Chilled, Frozen) as compact badges on seller cards, map popups, and the detail drawer, plus sidebar checkboxes to filter by one or more preferred cold-chain requirements.

**Why:** Wholesale buyers must match product storage needs to their warehouse capacity, delivery equipment, and food-safety protocols. Ambient grains vs chilled produce vs frozen items are fundamentally different logistics. Making the requirement visible and filterable reduces qualification time and prevents mismatched inquiries.

**How:**
- Extend sample sellers with a `storage` field ("ambient" | "chilled" | "frozen").
- Add distinct storage badges next to existing grade/pack/region/production badges.
- New “Storage / cold chain” checkbox group in the filters sidebar (OR logic when any are selected).
- Integrate into filter logic, active filter chips, Clear all, saved presets, and shareable URL params.
- Fully client-side, dark-mode compatible, works with all existing filters.

This is a small, high-impact logistics feature that makes cold-chain matching practical for professional buyers.

## 2026-10-13 (Hourly update) – Storage / Cold Chain Condition Badges & Filter (Implemented)

**What:** Implemented storage/cold-chain badges and filter checkboxes.

**Why:** Lets buyers quickly qualify or prefer specific temperature requirements (ambient, chilled, frozen) for warehouse fit and food-safety compliance.

**How (implemented):**
- Added `storage` field to all sample sellers.
- Storage badges rendered on cards, popups, and drawer (dark-mode styles).
- Sidebar “Storage / cold chain” checkboxes (OR logic when any are selected).
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the cold-chain feature and improves the prototype for logistics-aware B2B sourcing workflows.

## 2026-10-13 (Hourly update) – Year-Round vs Seasonal Availability Badges & Filter

**What:** Add a year-round / seasonal supply indicator as a compact badge on seller cards, map popups, and the detail drawer, plus a “Year-round supply only” sidebar toggle.

**Why:** Wholesale buyers planning continuous or year-round programs (restaurants with fixed menus, processors, retailers) need to quickly distinguish farms that can supply consistently from those limited to harvest seasons. This reduces mismatched inquiries and supports longer-term procurement planning.

**How:**
- Extend sample sellers with a `yearRound: true/false` field.
- Render distinct “Year-round” (green) or “Seasonal” (amber) badges next to existing badges.
- New “Year-round supply only” toggle in the filters sidebar.
- Integrate into filter logic, active filter chips, Clear all, saved presets, and shareable URL params.
- Fully client-side, dark-mode compatible, works with all existing filters.

This is a small, high-impact supply-planning feature that makes continuous vs seasonal availability practical for professional buyers.

## 2026-10-13 (Hourly update) – Year-Round vs Seasonal Availability Badges & Filter (Implemented)

**What:** Implemented year-round / seasonal badges and filter toggle.

**Why:** Lets buyers quickly qualify or prefer continuous year-round suppliers versus seasonal harvest-dependent farms.

**How (implemented):**
- Added `yearRound` field to all sample sellers.
- Season badges rendered on cards, popups, and drawer (dark-mode styles).
- Sidebar “Year-round supply only” toggle.
- Integrated into filter logic, active chips, Clear all, saved presets, and shareable URL params.
- Fully client-side and compatible with existing features.

This completes the seasonal availability feature and improves the prototype for continuous-supply B2B sourcing workflows.

No functional bugs found in this pass; core rendering, filters, RFQ, cart, and map continue to work. Prototype is now cleaner for both phone and laptop users.



## 2026-10-13 (Hourly update) – Search Radius Circle on Map

**What:** Visualize the current max-distance filter as a semi-transparent circle on the Leaflet map, centered on the buyer’s location (or default map center). The circle updates live when the distance slider changes or when Near Me recalculates distances.

**Why:** Wholesale buyers using the map + distance filter currently have no visual sense of the geographic area they are searching. A radius circle immediately shows whether key farms fall inside or outside the range, speeds spatial understanding, and makes the “within X km” filter more intuitive — especially after using Near Me.

**How:**
- Create a Leaflet circle layer (green, low-opacity fill) after map initialization.
- On every filter change and after location updates, set the circle’s center to the current user coordinates (fallback to map center) and its radius to the max-distance value in meters.
- Hide the circle when the distance filter is at its maximum (100 km) to avoid covering the whole view; show it otherwise.
- Fully client-side, dark-mode friendly, works with clustering and existing filters.

This is a small, high-impact visual improvement that makes distance-based sourcing clearer for map-centric buyers.

## 2026-10-13 (Hourly update) – Search Radius Circle on Map (Implemented)

**What:** Implemented a live search-radius circle on the Leaflet map that visualizes the current max-distance filter.

**Why:** Gives buyers an immediate geographic sense of their distance filter, especially useful after Near Me.

**How (implemented):**
- Added a non-interactive Leaflet circle layer.
- `updateRadiusCircle()` sets center to user location (or map center) and radius from the distance slider (km → meters).
- Called from `filterSellers()` so it updates with every filter change and location update.
- Hidden when the distance filter is at maximum (100 km) to keep the map clean.
- Fully client-side and compatible with clustering, dark mode, and all existing features.

This completes the radius visualization and makes distance-based discovery clearer on the map.
