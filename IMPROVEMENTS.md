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

## 2026-10-11 (Hourly update) – Inquiry / RFQ Modal
**What:** Replace the current `alert()` on “Contact Seller / Buy Direct” with a proper modal form for bulk inquiry / RFQ.

**Why:** The contact action is the primary call-to-action for buyers, but an alert provides no real value and breaks the professional B2B feel. A modal lets buyers immediately specify quantity, delivery window, and notes, capturing real intent and making the prototype feel usable for actual purchasing conversations.

**How:**
- Add a modal overlay + form in `index.html` (quantity, preferred delivery date, message, contact email).
- Prefill seller/product details from the selected seller.
- Wire the existing buttons (card + popup) to open the modal instead of `alert()`.
- Include simple client-side validation and a “Send Inquiry” button that currently shows a success toast/alert (full backend later).
- Style to match the existing green/accent design system; ensure it works on mobile (full-screen or bottom sheet on small screens).

This is a small, high-impact change that directly improves the core buyer flow.

## 2026-10-11 (Hourly update) – Near Me / Geolocation
**What:** Add a “Use my location” / “Near Me” control that requests the browser’s Geolocation API, centers the map on the user, and recalculates real distances to every seller.

**Why:** Distances are currently static and the map is hard-coded around a London placeholder. Buyers (chefs, retailers, processors) primarily care about proximity for freshness, logistics cost, and same-day delivery. Real location instantly makes the marketplace feel personal and actionable.

**How:**
- Place a clear “📍 Near Me” button in the map controls or sidebar header.
- On click, call `navigator.geolocation.getCurrentPosition`.
- Success: fly the map to the coordinates (zoom ~11–12), drop a distinct user marker, compute distances with a simple Haversine formula, update each seller’s `distance` property, then re-run `filterSellers()`.
- Handle denial or error gracefully (inline message or toast: “Location access denied – showing default area”).
- Optionally store the last known position in `localStorage` so subsequent loads stay relevant.
- Keep everything client-side; no backend required for the prototype.

This is a small, high-impact change that directly improves the core “find nearby suppliers” experience.

## 2026-10-11 (Hourly update) – Verified Seller Badges
**What:** Add a “Verified” badge (shield or checkmark) to seller cards and map popups, plus a simple “Verified only” filter toggle.

**Why:** Trust is critical in B2B farm sourcing—buyers need confidence in food safety, certifications, and legitimate businesses. A visible verified badge immediately signals reliability, helps high-quality suppliers stand out, and makes the marketplace feel more professional without requiring a full profile system yet.

**How:**
- Extend the `sellers` array with a `verified: true/false` field (mark 2–3 of the existing sample sellers as verified).
- In `renderSellers()` and the Leaflet popup template, append a small badge next to the seller name (style similarly to the existing organic badge, e.g. blue/gold background).
- Add a “Verified only” toggle in the filters panel using the same toggle component already used for organic.
- Update `filterSellers()` to exclude non-verified sellers when the toggle is on.
- Keep the change purely client-side and consistent with the current green/accent design.

This is a small, high-impact trust signal that improves buyer confidence and can be implemented in one short coding session.

## 2026-10-11 (Hourly update) – Dark Mode Toggle
**What:** Add a dark mode toggle (moon/sun icon) in the header that switches the entire UI to a dark theme.

**Why:** Many buyers and sellers work in low-light environments (early morning farm checks, late-night ordering). A dark mode reduces eye strain, improves readability in dim conditions, and gives the prototype a more modern, polished feel while staying consistent with the green accent brand.

**How:**
- Add a simple toggle button in `.header-actions`.
- Define dark-mode CSS variables (e.g. `--bg: #111827`, `--card: #1f2937`, `--text: #f9fafb`, darker borders) under a `.dark` class on `<html>` or `<body>`.
- On toggle, add/remove the class and persist the preference in `localStorage`.
- Ensure map tiles, popups, cards, filters, and buttons all adapt (Leaflet popups may need a small style override).
- Keep the primary green accents for buttons and badges so the brand identity remains clear.
- Test on mobile so the toggle remains easily reachable.

This is a small, high-impact UX polish that can be fully implemented client-side in one short session.

## 2026-10-11 (Hourly update) – Mobile Map / List View Toggle
**What:** Add a simple mobile-only toggle (or floating segmented control) that switches between a full-height map view and a full-height seller list view.

**Why:** On small screens the current layout stacks the map (~55% height) above a short sidebar (~45%), making both the map and the seller cards cramped and hard to use. Buyers need to either scan the geographic spread of farms clearly or browse product details and ratings comfortably. A dedicated full-view toggle removes the compromise and feels much more usable on phones.

**How:**
- In the existing `@media (max-width: 700px)` styles, introduce a class (e.g. `.mobile-map-only` / `.mobile-list-only`) that sets one container to `height: 100%` / `flex: 1` and hides the other.
- Add a small floating control (bottom-center or top-right) visible only on mobile with two buttons or a segmented switch: “Map” / “List”.
- Wire the control to toggle the class on `.main` or `body` and update button states.
- Default to list view on first mobile load (or remember last choice in `sessionStorage`).
- Ensure the map is invalidated / resized when shown so Leaflet tiles render correctly (`map.invalidateSize()`).
- Keep desktop layout unchanged.

This is a small, high-impact mobile UX fix that can be implemented with a few dozen lines of CSS + JS and immediately makes the prototype more practical for buyers on the go.

## 2026-10-11 – Implementation pass (functional prototype)
Implemented for real use (not just suggestions):
- **RFQ / Inquiry modal** – Contact / Request Quote opens a form (qty, delivery date, email, notes); client-side validation + success toast
- **Near Me** – Geolocation button recalculates Haversine distances, centers map, persists last position
- **Verified seller badges** + “Verified only” filter toggle
- **Dark mode** toggle with localStorage persistence
- Expanded sample data (6 sellers: herbs + honey)
- Toasts instead of blocking alerts for secondary actions
- Improved price/distance defaults and category options

Prototype is now usable end-to-end for demo buyer flows without backend.

## 2026-10-11 (Hourly update) – Favorites / Shortlist
**What:** Add a simple “Save” (heart or star) button on each seller card and map popup that lets buyers favorite suppliers, with a “Saved only” filter toggle and localStorage persistence.

**Why:** B2B buyers typically shortlist several farms before requesting quotes or arranging visits. Without a way to save options, users must remember or re-filter every time they return. A favorites list makes the prototype immediately more useful for real purchasing workflows and encourages repeat engagement.

**How:**
- Add a small heart icon button to `.seller-card` and the Leaflet popup template.
- Maintain a `savedIds` Set (or array) in memory, persisted to `localStorage` under a key like `farmdirect-saved`.
- On click, toggle the seller’s saved state, update the icon (filled vs outline), and optionally show a short toast (“Saved” / “Removed”).
- Add a “Saved only” toggle in the filters panel (same style as the organic and verified toggles).
- Update `filterSellers()` to include the saved filter.
- On page load, restore the saved set and re-render so previously favorited sellers appear marked.
- Keep it fully client-side; no backend required.

This is a small, high-impact feature that turns the marketplace from a one-time browse into a reusable shortlist tool for buyers.

## 2026-10-11 (Hourly update) – Marker Clustering

**What:** Add marker clustering so nearby farm markers group into numbered clusters on the map; clusters expand (zoom or spiderfy) when the user interacts with them.

**Why:** The map currently places individual emoji markers. With only six sample sellers this is fine, but as more farms are added (or in any realistic B2B dataset) overlapping pins become hard to click and the map looks cluttered at wider zoom levels. Clustering keeps the overview clean, improves performance, and makes dense agricultural areas explorable—exactly the behavior buyers expect from modern map-based marketplaces.

**How:**
- Include Leaflet.markercluster (CSS + JS) via CDN alongside the existing Leaflet includes.
- Create a `L.markerClusterGroup` and add the seller markers to it instead of directly to the map.
- Style the cluster icons to fit the green/accent brand (or keep a simple numbered circle that matches the existing marker size).
- On cluster click, zoom to the cluster bounds (or enable spiderfy for small clusters).
- Update the filter / Near Me / clear logic so markers are added to and removed from the cluster group correctly, then refresh the cluster layer.
- Call `map.invalidateSize()` and refresh clusters after any layout change (including the mobile map/list toggle).
- Keep everything client-side; no backend needed.

This is a small, high-impact map UX improvement that prepares the prototype for richer sample data and feels more professional immediately.

## 2026-10-11 (Hourly update) – Inquiry Cart / Multi-seller Shortlist

**What:** Add a lightweight “Inquiry Cart” so buyers can collect multiple sellers/products (with quantities) into a single shortlist, then open a combined RFQ modal from a floating cart icon in the header.

**Why:** Real B2B farm sourcing almost always involves more than one item or supplier in a single purchasing cycle (e.g., a restaurant needing herbs + produce + honey, or a processor consolidating volume). The current single-seller RFQ modal forces repeated interactions. An inquiry cart turns browsing into a practical multi-item workflow, increases the value of the existing favorites and RFQ features, and makes the prototype feel ready for actual buyer use.

**How:**
- Add a small “Add to Inquiry” (or cart-plus) button on each seller card and map popup.
- Maintain an `inquiryItems` array (seller id, product, qty, notes) in memory, persisted to `localStorage`.
- Show a header icon/button with a live count badge; clicking it opens a simple cart summary modal (editable quantities, remove buttons, total estimated value if prices are available).
- From the cart modal, provide a “Send Combined Inquiry” button that reuses/extends the existing RFQ modal, pre-filled with the selected items.
- Clear the cart on successful send (or after a confirmation toast).
- Keep the feature fully client-side and consistent with the current design system and mobile layout.

This is a small, high-impact extension of the core purchasing flow that can be implemented in one focused coding session and immediately makes the marketplace more useful for real buyer workflows.

## 2026-10-11 (Hourly update) – Seller Detail Drawer / Quick Profile Panel

**What:** Add a slide-in (or bottom-sheet on mobile) seller detail drawer that opens when a buyer clicks a seller card (outside action buttons) or a “View details” link. The panel shows extended info without leaving the marketplace view.

**Why:** Compact cards and popups are good for scanning, but B2B buyers need more context (farm story, certifications, lead time, MOQ, delivery options, larger image) before starting an RFQ or adding to a shortlist. A lightweight detail view reduces back-and-forth, increases confidence, and makes the prototype feel substantially more complete and professional while reusing existing data and design patterns.

**How:**
- Extend the sample `sellers` array with a few optional fields (`description`, `moq`, `leadTime`, `deliveryOptions`, `certifications` array).
- Add a fixed-position drawer overlay + panel in `index.html` (reuse modal styling where possible; full-height on mobile, ~400 px wide on desktop).
- On card click (or new small “Details” button), populate the drawer from the seller object and open it; close via overlay click, X button, or Escape.
- Include key facts, badges, larger image, and quick actions (Request Quote, Save, Add to Inquiry) that call existing functions.
- Ensure map popups can also trigger the same drawer.
- Keep fully client-side and consistent with the current green accent / dark-mode system.

This is a small, high-impact addition that enriches the buyer decision flow and can be implemented in one focused coding session.

## 2026-10-11 (Hourly update) – MOQ & Lead Time Filters

**What:** Add Minimum Order Quantity (MOQ) and Lead Time as first-class filter controls (and surface them on cards).

**Why:** B2B buyers routinely disqualify suppliers based on order size floors and delivery lead times. The current filters (category, organic, verified, distance, price) cover product and logistics basics, but miss two of the most decisive commercial criteria. Exposing them early reduces wasted RFQs and makes the marketplace feel purpose-built for wholesale purchasing.

**How:**
- Extend the sample `sellers` array with numeric `moq` (in the product’s unit) and `leadTimeDays` (integer) fields (some sellers already conceptually have these from the prior drawer suggestion).
- Add two compact controls in the filters panel: a numeric/range input for “Max MOQ” and a select or range for “Max lead time (days)”.
- Update `filterSellers()` to exclude sellers whose MOQ exceeds the chosen max or whose lead time exceeds the chosen max.
- Show the values as small meta lines on seller cards and in map popups (e.g. “MOQ: 50 kg · Lead time: 3 days”).
- Default the filters to “any” so existing results are unchanged until the user tightens them.
- Keep everything client-side, consistent with the existing filter styling and dark-mode variables.

This is a small, high-impact addition that can be implemented in one focused coding session and immediately improves buyer qualification speed.

## 2026-10-11 (Hourly update) – Seller Comparison View

**What:** Add a lightweight comparison mode that lets buyers select 2–3 sellers and open a side-by-side comparison table (price, unit, MOQ, lead time, rating, distance, organic/verified badges, availability).

**Why:** B2B buyers almost always evaluate multiple suppliers before committing to an RFQ. Sequential cards force mental comparison or repeated filtering; a compact side-by-side view surfaces the decisive commercial differences (especially once MOQ and lead time are visible) and shortens the path from shortlist to inquiry.

**How:**
- Add a small checkbox or “Compare” button on each seller card (and optionally in the map popup).
- Maintain a `compareIds` Set (max 3) in memory; show a floating bar at the bottom (“Compare (2)”) once at least two are selected.
- Clicking the bar opens a modal containing a responsive comparison table populated from the existing seller objects (plus any extra fields already planned for the detail drawer).
- Include quick actions in the modal (Request Quote for one, or “Add all to Inquiry” if the cart feature is present).
- Clear the selection after closing or provide an explicit “Clear” control.
- Keep fully client-side, reuse existing modal/toast patterns, and ensure the table remains readable in dark mode and on mobile (stacked cards or horizontal scroll).

This is a small, high-impact decision-support feature that can be implemented in one focused coding session and makes the marketplace noticeably more useful for real wholesale purchasing.

## 2026-10-12 (Hourly update) – Fulfillment Method Filter & Badges

**What:** Add fulfillment preference as a visible badge and filter: Pickup available, Delivery available, or Both.

**Why:** Logistics is one of the first filters real B2B buyers apply. Some restaurants and processors need reliable delivery; others prefer to collect for lower cost or maximum freshness. Surfacing this early (on cards, popups, and as a filter) cuts irrelevant options and reduces wasted inquiries, especially once more sellers are added.

**How:**
- Extend the sample `sellers` array with a `fulfillment` field (`"pickup"`, `"delivery"`, or `"both"`).
- Show a small badge on seller cards and map popups (e.g. “🚚 Delivery”, “📍 Pickup”, or “Both”).
- Add a simple select or segmented control in the filters panel: “Any / Pickup / Delivery / Both”.
- Update `filterSellers()` to respect the choice (treat “Both” as matching either request).
- Keep the default as “Any” so current results stay unchanged.
- Style consistently with existing organic/verified badges and dark-mode variables; fully client-side.

This is a small, high-impact commercial filter that can be implemented in one short coding session and makes the marketplace more practical for real purchasing decisions.

## 2026-10-12 (Hourly update) – Volume Pricing Tiers

**What:** Add optional volume / bulk pricing tiers to sellers and surface them on cards, map popups, and inside the RFQ modal (with live price calculation based on the quantity the buyer enters).

**Why:** Wholesale buyers decide largely on volume discounts. Showing the price breaks up front (e.g. base price vs. better rates at higher quantities) helps them self-qualify, encourages larger orders, and makes the prototype feel commercially realistic. It also reduces back-and-forth in the inquiry.

**How:**
- Extend the sample `sellers` array with an optional `priceTiers` array (e.g. `[{ minQty: 1, price: 1.35 }, { minQty: 50, price: 1.20 }, { minQty: 200, price: 1.05 }]`).
- On seller cards and popups, show the base price plus a compact indicator such as “from $1.05 at 200+” or a small expandable list.
- In the existing RFQ modal, when the quantity input changes, calculate and display the applicable unit price (and estimated line total) based on the matching tier.
- Keep everything client-side, consistent with the current design system and dark mode.
- Default to the existing single price when no tiers are defined so current sellers remain unchanged.

This is a small, high-impact commercial enhancement that can be implemented in one focused coding session and directly improves the core buying decision flow.

## 2026-10-12 (Hourly update) – Availability Status Indicators & Filter

**What:** Add clear availability status badges (In stock / Low stock / Out of stock or Coming soon) to seller cards and map popups, plus a simple “Available now” filter toggle.

**Why:** The existing quantity field is present but not actionable at a glance. B2B buyers of perishable goods need an immediate signal of whether a supplier can fulfill in the near term so they don’t waste time on inquiries that cannot be filled. Surfacing status reduces friction in the scanning and filtering flow.

**How:**
- Extend the sample `sellers` array with a `stockStatus` field (`"in_stock"`, `"low"`, or `"out"`).
- Display a small colored badge on cards and popups (green / amber / gray), styled consistently with the organic and verified badges.
- Add a toggle or compact select in the filters panel labeled “Available now only”.
- Update `filterSellers()` to exclude sellers with `"out"` (or `"low"` if desired) when the toggle is active.
- Keep the default off so existing results remain unchanged.
- Fully client-side and compatible with dark mode.

This is a small, high-impact visibility improvement that can be implemented in one short coding session and makes the marketplace more practical for time-sensitive purchasing.

## 2026-10-12 (Hourly update) – Active Filter Chips

**What:** Add a compact row of dismissible filter chips that appears under the filters panel (or above the seller list) whenever any filter is active, showing the current criteria (e.g. “Organic”, “Verified”, “≤ 25 km”, “Price ≤ $2.50”, “Category: Vegetables”) with an × to clear each one individually.

**Why:** Filters are accumulating (organic, verified, distance, price, category, and upcoming ones like MOQ, lead time, fulfillment, availability). Buyers currently have no at-a-glance view of what is restricting results and must open the panel or hit “Clear all” to adjust. Chips make the active state visible, let users refine one constraint without resetting others, and reduce friction in the iterative search that is normal for wholesale sourcing.

**How:**
- After any change to filters, compute the set of active constraints from the existing controls.
- Render a small flex-wrap row of chips (styled like the existing badges) only when at least one filter is non-default.
- Each chip has a short label and an × button that resets only that control (range to max, toggle off, select to “any”) and re-runs `filterSellers()`.
- Include a “Clear all” link at the end of the chip row for convenience.
- Keep fully client-side, reuse existing CSS variables so chips work in dark mode, and hide the row when no filters are applied.
- Position it so it remains visible on both desktop and mobile without covering the map or list.

This is a small, high-impact UX improvement that can be implemented in one short coding session and makes the growing filter set much more usable for real buyers.

## 2026-10-12 (Hourly update) – Payment Terms Filter & Badges

**What:** Add payment terms (e.g. Due on receipt, Net 15, Net 30) as a first-class attribute on sellers, displayed as a small badge or meta line on cards/popups, plus a compact filter control.

**Why:** Payment schedule and credit terms are decisive for B2B buyers managing cash flow and purchasing cycles. The current filters cover product attributes, logistics, and verification, but ignore commercial payment conditions that often determine whether a supplier is viable. Exposing terms early lets buyers self-qualify faster and reduces mismatched RFQs.

**How:**
- Extend the sample `sellers` array with a `paymentTerms` string field (e.g. `"Net 30"`, `"Due on receipt"`, `"Net 15"`).
- Display it as a muted badge or inline meta on seller cards, map popups, and (when implemented) the detail drawer, styled consistently with existing organic/verified badges.
- Add a simple `<select>` in the filters panel: “Any terms”, “Due on receipt”, “Net 15 or better”, “Net 30 or better”.
- Update `filterSellers()` to respect the selected term preference (map “or better” to inclusive matching).
- Default to “Any” so current results are unchanged.
- Keep fully client-side and compatible with dark-mode CSS variables.

This is a small, high-impact commercial filter that can be implemented in one focused coding session and makes the marketplace more practical for real wholesale buyers.

## 2026-10-12 (Hourly update) – Harvest / Pack Date Freshness Indicator & Sort

**What:** Add a harvest or pack date field to each seller/product and surface it as a small freshness meta line on cards and popups, plus a “Freshest first” sort option (and optionally a “Harvested within X days” filter).

**Why:** For produce, dairy, eggs and other perishables, absolute price and distance matter less than how recently the product was harvested or packed. Buyers currently have no signal of freshness, which is a primary commercial decision factor for restaurants, retailers and processors. Showing “Harvested 2 days ago” or “Packed today” lets them prioritize quality and reduces post-RFQ surprises.

**How:**
- Extend the sample `sellers` array with a `harvestDate` ISO date string (or days-ago number for simplicity).
- Compute a human-readable label (“Harvested today”, “2 days ago”, “1 week ago”) and display it as a muted meta line next to quantity or rating on seller cards and map popups.
- Add “Freshest first” as a new option in the existing sort `<select>`.
- Optionally add a compact range or select filter (“Any”, “Within 2 days”, “Within 7 days”) that filters on the date.
- Default sort and filter so current behaviour is unchanged.
- Keep fully client-side, style consistently with existing meta text, and ensure it works in dark mode.

This is a small, high-impact freshness signal that can be implemented in one focused coding session and makes the marketplace more useful for time-sensitive fresh-produce buying.

## 2026-10-12 (Hourly update) – MOQ & Lead Time Indicators and Filters

**What:** Add Minimum Order Quantity (MOQ) and Lead Time fields to each seller, display them as badges/meta on cards and map popups, and add simple filters so buyers can restrict results by maximum acceptable MOQ and maximum lead time.

**Why:** Wholesale purchasing decisions are heavily constrained by volume commitments and delivery timing. Without visible MOQ and lead time, buyers waste time contacting sellers who cannot meet their order size or schedule. Surfacing these commercial terms early improves self-qualification and reduces irrelevant RFQs.

**How:**
- Extend the sample `sellers` array with `moq` (number) and `leadTimeDays` (number) fields.
- Show them as small muted badges or meta lines on seller cards and popups (e.g. “MOQ 50 kg”, “Lead 2 days”).
- Add two compact controls in the filters panel: a select or number input for “Max MOQ” and a select for “Max lead time” (Any / ≤1 day / ≤3 days / ≤7 days).
- Update `filterSellers()` to exclude sellers that exceed the chosen limits.
- Default both filters to “Any” so existing behaviour is unchanged.
- Keep fully client-side and compatible with dark mode.

This is a small, high-impact commercial filter that can be implemented in one focused coding session and makes the marketplace more practical for real B2B buyers.

## 2026-10-12 (Hourly update) – Availability Status Indicators & Filter

**What:** Add clear availability status badges (In stock / Low stock / Out of stock) to seller cards and map popups, plus a simple “Available now” filter toggle.

**Why:** The existing quantity field is present but not actionable at a glance. B2B buyers of perishable goods need an immediate signal of whether a supplier can fulfill in the near term so they don’t waste time on inquiries that cannot be filled. Surfacing status reduces friction in the scanning and filtering flow.

**How:**
- Extend the sample `sellers` array with a `stockStatus` field (`"in_stock"`, `"low"`, or `"out"`).
- Display a small colored badge on cards and popups (green / amber / gray), styled consistently with the organic and verified badges.
- Add a toggle in the filters panel labeled “Available now only”.
- Update `filterSellers()` to exclude sellers with `"out"` when the toggle is active.
- Keep the default off so existing results remain unchanged.
- Fully client-side and compatible with dark mode.

This is a small, high-impact visibility improvement that can be implemented in one short coding session and makes the marketplace more practical for time-sensitive purchasing.


## 2026-10-12 (Hourly update) – Minimum Rating Filter

**What:** Add a “Min. rating” filter (Any / 4.0+ / 4.5+ / 4.8+) so buyers can exclude lower-rated suppliers, and ensure review count is consistently visible next to stars on cards and map popups.

**Why:** Star ratings and review counts are already present on seller cards but cannot be used as a filter. Wholesale buyers often set a quality threshold (especially for new suppliers or high-volume orders) and currently have to scan every result manually. A simple min-rating control speeds self-qualification and pairs well with the existing verified badge.

**How:**
- Add a compact `<select>` in the filters panel labeled “Min. rating” with options Any, 4.0+, 4.5+, 4.8+.
- Update `filterSellers()` to drop sellers whose `rating` is below the chosen threshold (default Any so current results stay the same).
- Confirm cards already show “★ 4.8 (32)” and add the same rating line to map popups for consistency.
- Include the control in `clearFilters()`.
- Keep fully client-side and compatible with dark mode.

This is a small, high-impact trust filter that can be implemented in one short coding session and makes the marketplace more practical for quality-conscious B2B buyers.


## 2026-10-12 (Hourly update) – Availability Status Indicators & Filter

**What:** Add clear availability status badges (In stock / Low stock / Out of stock) to seller cards and map popups, plus a simple “Available now only” filter toggle.

**Why:** The existing quantity field is present but not actionable at a glance. B2B buyers of perishable goods need an immediate signal of whether a supplier can fulfill in the near term so they don’t waste time on inquiries that cannot be filled. Surfacing status reduces friction in the scanning and filtering flow.

**How:**
- Extend the sample `sellers` array with a `stockStatus` field (`"in_stock"`, `"low"`, or `"out"`).
- Display a small colored badge on cards and popups (green / amber / gray), styled consistently with the organic and verified badges.
- Add a toggle in the filters panel labeled “Available now only”.
- Update `filterSellers()` to exclude sellers with `"out"` when the toggle is active.
- Keep the default off so existing results remain unchanged.
- Fully client-side and compatible with dark mode.

This is a small, high-impact visibility improvement that can be implemented in one short coding session and makes the marketplace more practical for time-sensitive purchasing.

## 2026-10-12 (Hourly update) – Active Filter Chips

**What:** Add a compact row of dismissible filter chips that appears under the filters panel (or above the seller list) whenever any filter is active, showing the current criteria (e.g. “Organic”, “Verified”, “≤ 25 km”, “Price ≤ $2.50”, “Category: Vegetables”) with an × to clear each one individually.

**Why:** Filters are accumulating (organic, verified, distance, price, category, MOQ, lead time, rating, availability). Buyers currently have no at-a-glance view of what is restricting results and must open the panel or hit “Clear all” to adjust. Chips make the active state visible, let users refine one constraint without resetting others, and reduce friction in the iterative search that is normal for wholesale sourcing.

**How:**
- After any change to filters, compute the set of active constraints from the existing controls.
- Render a small flex-wrap row of chips (styled like the existing badges) only when at least one filter is non-default.
- Each chip has a short label and an × button that resets only that control (range to max, toggle off, select to “any”) and re-runs `filterSellers()`.
- Include a “Clear all” link at the end of the chip row for convenience.
- Keep fully client-side, reuse existing CSS variables so chips work in dark mode, and hide the row when no filters are applied.
- Position it so it remains visible on both desktop and mobile without covering the map or list.

This is a small, high-impact UX improvement that can be implemented in one short coding session and makes the growing filter set much more usable for real buyers.

## 2026-10-12 (Hourly update) – Favorites / Shortlist

**What:** Add a heart icon on each seller card and map popup that toggles a favorite, persist the list in localStorage, and add a “Favorites only” filter toggle so buyers can quickly return to sellers they are evaluating.

**Why:** Wholesale buyers typically research and compare several farms before sending RFQs. Without a shortlist, they must remember names or re-apply filters every session. Favorites give a persistent personal shortlist, reduce re-work, and make the marketplace more useful for multi-seller sourcing decisions.

**How:**
- Add a heart button (♡ / ♥) to seller cards and popups.
- Store favorited seller IDs in localStorage under `farmdirect_favorites`.
- Add a “Favorites only” toggle in the filters panel (default off).
- Update `filterSellers()` to respect the toggle and include a dismissible chip when active.
- Update hearts immediately on toggle and re-filter when the favorites-only view is active.
- Keep fully client-side, style with existing CSS variables (works in dark mode), and preserve all current filter behaviour.

This is a small, high-impact workflow improvement that can be implemented in one focused coding session and helps buyers manage their shortlist of potential suppliers.

## 2026-10-12 (Hourly update) – Payment Terms Filter & Badges

**What:** Add payment terms (Due on receipt / Net 15 / Net 30) to each seller, display them as a small badge on cards and map popups, and add a “Payment terms” select filter so buyers can restrict results to sellers offering a specific term.

**Why:** Cash-flow and payment timing are decisive in wholesale purchasing. Buyers often have strict requirements (e.g. only Net 30 suppliers, or only due-on-receipt for new relationships). Surfacing terms early lets buyers self-qualify and avoids RFQs that will be rejected on commercial grounds.

**How:**
- Extend the sample `sellers` array with a `paymentTerms` field (`"due_on_receipt"`, `"net_15"`, or `"net_30"`).
- Show a compact gold/yellow badge next to existing badges on cards and popups (and include the label in the meta line).
- Add a `<select id="paymentFilter">` in the filters panel with options Any / Due on receipt / Net 15 / Net 30.
- Update `filterSellers()` to exclude sellers whose terms do not match when the select is not “any”.
- Add a dismissible chip when a specific term is selected and reset it in `clearFilters()`.
- Keep fully client-side and compatible with dark mode.

This is a small, high-impact commercial signal that can be implemented in one short coding session and makes the marketplace more practical for real B2B buyers.

## 2026-10-12 (Hourly update) – Fulfillment Method Filter & Badges

**What:** Add fulfillment method (Pickup only / Delivery only / Both) to each seller, display it as a small badge on seller cards and map popups, and add a “Fulfillment” select filter so buyers can restrict results to sellers matching their logistics preference.

**Why:** Delivery versus farm pickup is a decisive logistics constraint for wholesale buyers. Restaurants and retailers often need delivery, while processors or high-volume buyers may prefer or require pickup. Surfacing the option early lets buyers self-qualify and avoids RFQs that cannot be fulfilled on logistics grounds.

**How:**
- Extend the sample `sellers` array with a `fulfillment` field (`"pickup"`, `"delivery"`, or `"both"`).
- Show a compact badge (e.g. blue/teal) next to existing badges on cards and popups (and include the short label in the meta line).
- Add a `<select id="fulfillmentFilter">` in the filters panel with options Any / Pickup only / Delivery only / Both.
- Update `filterSellers()` to exclude sellers whose fulfillment does not match when the select is not “any” (treat “both” as matching either pickup or delivery requests if desired, or exact match).
- Add a dismissible chip when a specific method is selected and reset it in `clearFilters()`.
- Keep fully client-side and compatible with dark mode.

This is a small, high-impact logistics signal that can be implemented in one short coding session and makes the marketplace more practical for real B2B buyers.

## 2026-10-12 (Hourly update) – Harvest / Pack Date Freshness Indicator & Sort (Implemented)

**What:** Added harvest/pack freshness to every seller: a human-readable label on cards and map popups (“Harvested / packed today”, “1 day ago”, etc.), a “Freshest first” sort option, and a “Harvested within” filter (Any / Today–1 day / ≤2 days / ≤7 days) with active filter chip support.

**Why:** For produce, dairy, eggs and other perishables, absolute price and distance matter less than how recently the product was harvested or packed. Buyers previously had no freshness signal. Showing this early lets restaurants, retailers and processors prioritize quality and reduces post-RFQ surprises.

**How (implemented):**
- Extended sample `sellers` with `harvestDaysAgo` (0–14).
- Added `freshnessLabel()` helper for readable text.
- Displayed the label in green/primary on seller cards and Leaflet popups.
- Added “Freshest first” to the sort `<select>` and sorting logic.
- Added `#freshnessFilter` select + chip + clearFilters support.
- Fully client-side and dark-mode compatible.

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
