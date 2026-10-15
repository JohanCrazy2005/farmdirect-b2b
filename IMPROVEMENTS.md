## 2026-10-14 – Accessibility Fixes for Vercel Report (Selects, Toggles, Buttons, Contrast)

**What:** Resolved the accessibility issues flagged by Vercel’s checker (GitHub issue #3): every select now has an accessible name, ARIA switches have aria-labels, icon-only buttons and dynamic controls are named, the distance range is labeled, and muted text contrast was improved.

**Why:** Screen-reader and keyboard users could not reliably identify filter dropdowns, toggles, or certain buttons. The Vercel accessibility overlay reported missing names on selects and form elements, unlabeled ARIA toggles, buttons without discernible text, and contrast failures. These fixes make the marketplace usable with assistive technology and address the open issue.

**How (implemented):**
- Added descriptive `aria-label` to all `<select>` elements (map layers, sort, every filter select, login role, listing category, and inquiry status).
- Added `aria-label` to all `role="switch"` toggles (Organic, Traceable, Year-round, Verified, Available now, Favorites).
- Added `aria-label` to the distance range input and the preset-delete button.
- Darkened the light-mode `--muted` color from `#6b7280` to `#4b5563` for better contrast against white/light backgrounds.
- Preserved all existing behavior, dark mode, filters, seller portal, and localStorage features.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-14 – Further Phone/Laptop Polish: Active Filter Count & Layout Density

**What:** Added an active-filter count badge on the mobile filters toggle button and tightened a few layout details for better density on phones and mid-size laptops. Map resize after view-mode changes is more robust.

**Why:** On phones the collapsed filters button gave no indication how many filters were active, so buyers had to open the panel to check. Slight density improvements help both phone list scrolling and laptop sidebar use during multi-listing reviews.

**How (implemented):**
- Filters toggle now shows “(N)” when filters are active (client-side count of non-default filters).
- Minor CSS tweaks for tighter card gaps and safe bottom padding on phones.
- Extra map.invalidateSize() call after view-mode and orientation changes.

Fully client-side; preserves all existing features, dark mode, and seller portal.

Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-14 – Phone & Laptop Layout Polish + Reliable Filter Collapse

**What:** Strengthened mobile and laptop responsiveness: larger touch targets, tighter card layouts, safe-area padding for notched devices, laptop sidebar width tweak, and more reliable automatic collapse of the dense filters panel on phones (with delayed re-checks and user-preference memory).

**Why:** The previous mobile view could leave filters expanded by default (eating list space) and had slightly small tap targets / tight spacing on small screens. Laptop mid-widths benefited from a slightly narrower sidebar. These changes make the marketplace usable on phones during market visits and comfortable on laptops for buyers/sellers reviewing many listings.

**How (implemented):**
- Added phone-specific CSS: min 44px controls, smaller seller images/cards, touch scrolling, overflow guards.
- Laptop range (701–1200px) sidebar set to 340px.
- Safe-area inset support for header and bottom view-mode bar.
- Filter collapse logic now runs immediately + on short timeouts, respects user expansion via sessionStorage, and re-evaluates cleanly on resize/orientation change.

Fully client-side; no impact on map clustering, seller portal, RFQ, or existing filters.

## 2026-10-14 – Manage My Listings (Edit / Unpublish from Seller Portal)

**What:** Extended the Seller Portal with a “My listings” tab so logged-in sellers can view every crop they have published, edit price / available quantity / stock status in place, and unpublish listings. Changes sync immediately to the map, list, popups, and localStorage.

**Why:** Publish-only left sellers unable to correct prices, mark stock as low/out, or remove sold-out items. Without management the two-sided demo becomes stale after the first listing. A lightweight edit/remove flow keeps inventory accurate and makes the seller experience credible for demos and testing.

**How (implemented):**
- Seller Portal now has two tabs when logged in: “Publish new” and “My listings (N)”.
- My listings shows cards for the current farm’s user-published sellers with inline price, qty, and stock-status controls plus Save / Remove / View on map.
- `saveUserListingEdits` updates the in-memory seller, volume tiers, marker popup, persists via `farmdirect_userListings`, and re-runs filters.
- `removeUserListing` removes from array + marker cluster + storage after confirm.
- After a successful publish the UI switches to the Manage tab so the new listing is visible immediately.
- Fully client-side; works with clustering, dark mode, filters, inquiry flows, and existing “Your listing” badges.

This completes the basic seller loop: login → publish → manage inventory.

## 2026-10-14 – Next Available Delivery Window Badge

**What:** Added a dynamic “Next delivery” badge on seller cards, map popups and the detail drawer that shows the soonest regular delivery day from today (e.g. “Delivers today (Wed)”, “Next: tomorrow (Thu)”, “Next delivery: Mon”).

**Why:** Buyers already see the full list of delivery days, but calculating the next receiving opportunity still requires mental work against today’s date. A one-glance next-window indicator reduces coordination friction for restaurants, retailers and processors that operate on tight receiving schedules.

**How (implemented):**
- New `getNextDeliveryBadge(s)` helper that walks the seller’s `deliveryDays` array starting from the current weekday and returns the nearest match.
- Compact blue badge rendered alongside existing delivery-day and certification badges on cards, popups and drawer.
- Fully client-side; no new data fields required; works with dark mode, clustering, filters and all other existing features.

This makes schedule fit immediately scannable for wholesale buyers. Cycle continues (2026-10-14 is within the 60-day window from 2026-10-11).


## 2026-10-14 – Quick Contact Links + Copy Seller Summary

**What:** Added one-click Call and Email actions plus a “Copy summary” button that places a clean, procurement-ready text block (price, MOQ, lead time, delivery days, payment terms, contact details and shareable link) on the clipboard. Contact details are shown in the seller drawer and a 📋 button appears on list cards.

**Why:** After discovering a farm, B2B buyers frequently need to call or email immediately to confirm freshness or volume, and they also paste supplier terms into Slack, email threads or internal procurement tools. These shortcuts reduce friction from map/list discovery to first contact and internal approval.

**How (implemented):**
- Helpers `getSellerPhone`, `getSellerEmail` and `buildSellerSummary` generate consistent mock contact details and a formatted multi-line summary.
- Drawer actions now include 📞 Call (tel:), ✉️ Email (mailto:) and 📋 Copy summary (clipboard + toast).
- Contact line added to the drawer body; 📋 button added to seller cards.
- Fully client-side; works with existing preferred-contact filter, dark mode, share links, RFQ and all other features.

This makes the path from discovery to conversation and internal sharing much faster for restaurant, retail and processor buyers. Cycle continues (2026-10-14 is within the 60-day window from 2026-10-11).

## 2026-10-15 – Collapsible Filter Groups (Accordion Sidebar)

**What:** Reorganized the dense filter sidebar into four collapsible groups — Location & Distance, Product & Quality, Commercial Terms, Logistics & Availability — with expand/collapse headers that show active-filter counts per group. Open/closed state is remembered in sessionStorage for the session.

**Why:** The prototype accumulated 20+ filters; the single long list forced excessive scrolling on both phones and laptops and made it harder for buyers to locate the commercial or logistics controls they need. Grouping keeps the most-used controls reachable while still exposing the full power of the marketplace.

**How (implemented):**
- Wrapped related controls in four `<details class="filter-accordion">` sections with summary headers and active-count badges.
- `countActiveInGroup` / `updateFilterGroupCounts` keep per-group badges in sync with chips and filters.
- Open/closed state persisted in sessionStorage; Location + Product open by default.
- CSS for accordion headers, dark-mode compatibility and mobile-friendly targets.
- Fully client-side; no change to filter logic, chips, presets, shareable URLs or map behaviour.

This improves scannability and reduces friction for wholesale buyers reviewing many listings. Cycle continues (2026-10-15 is within the 60-day window from 2026-10-11).

## 2026-10-14 – Accessibility Improvements (Skip Link, Live Regions, Focus Styles)

**What:** Added a skip-to-content link, aria-live regions for toast notifications and filter result counts, stronger visible focus indicators, and basic landmark roles so screen-reader and keyboard users can navigate the marketplace more effectively.

**Why:** GitHub issue #3 flagged accessibility problems (likely from Vercel/Lighthouse audits). Buyers using keyboards or assistive tech currently have to tab through the entire header and filters before reaching seller results, and dynamic filter changes or success messages are not announced. These fixes make core flows (search, filter, request quote) usable without a mouse and keep the demo compliant with basic WCAG expectations.

**How (implemented):**
- Skip link at the top of the page that becomes visible on focus and jumps to `#mainContent`.
- Toast element upgraded to `role="status"` + `aria-live="polite"`.
- New visually-hidden live region that announces the number of matching sellers after every filter change (or “no matching sellers”).
- `:focus-visible` outline styles for all interactive elements.
- Search input given an explicit `aria-label`; seller list marked with `role="list"`; main container given `role="main"`.

Fully client-side; no impact on existing features, dark mode, or seller portal. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Max 3 Badges on Cards and Map Popups

**What:** Enforced a maximum of 3 badges on seller cards and map popups via a new `getTopBadges(s)` helper. Priority order: Verified → Organic → Stock status → Your listing → Premium grade → Lot-tracked.

**Why:** Cards and popups had accumulated long badge strings (grade, pack, region, production, storage, certs, delivery days, reliability, etc.), making titles hard to scan and violating the product goal of ≤3 badges. Capping them improves readability while still surfacing the most important commercial signals. Drawer can still show richer detail.

**How (implemented):**
- Added `getTopBadges(s)` that builds a candidate list in priority order and returns at most 3 HTML badge spans.
- Replaced the long badge arrays in `buildPopupHtml` and `renderSellers` with a single call to `getTopBadges`.
- Preserved all other popup/card content, dark mode, clustering, filters, and seller portal behavior.

Addresses GitHub issue #4. Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Restore index.html and confirm scripts wired for live API listings

**What:** Restored the full `index.html` (from the last known-good commit that included the frontend) so that `cleanup.js` and `listings-api.js` are loaded before `</body>`. This enables page load to fetch `GET /api/listings` and use it as the primary source of sellers (with embedded fallback).

**Why:** Current `main` had replaced `index.html` with a placeholder, breaking the marketplace UI, script loading, and the live listings path required by success criteria #6 and #5. Without the real HTML the cleanup layer and API loader could not run.

**How (implemented):**
- Replaced placeholder with the complete static frontend from commit 998b4b5 (which already contains the script tags for `cleanup.js` and `listings-api.js`).
- Confirmed seed data in `data/listings.json` and schema already require `lat`/`lng`/`coordinates` on every listing.
- `listings-api.js` continues to merge API results into `window.sellers`, add markers, and fall back gracefully.

Addresses the P6 priority (scripts wired + listings load from API). Fully client-side + existing serverless API. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – Review Score Prominently on Map Popups (Issue #7)

**What:** Added a dedicated, high-contrast rating line near the top of every map popup: `★ X.X (N reviews)`. Also capped popup badges at 3 (Verified / Organic / stock status) to keep the card scannable.

**Why:** Buyers glance at map popups while exploring. The previous rating was buried in a muted secondary line mixed with payment and fulfillment terms, so quality was easy to miss. A clear near-top score matches the product success criterion and supports quick decisions. Capping badges prevents the popup from becoming overcrowded.

**How (implemented):**
- In `buildPopupHtml`, inserted a `.seller-rating` block immediately after the product line.
- Rating and review count are null-safe (default to 0) so newly published user listings still render cleanly.
- Gold ★ via existing `.stars` color; text uses `var(--text)` for readability in light and dark mode.
- Popup badge list limited to the top 3 priority items so the header stays lean.
- Rating removed from the lower payment/fulfillment line.
- Addresses GitHub issue #7 acceptance criteria (visible without scrolling, works for 0 reviews, readable in both themes).

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).

## 2026-10-15 – DELETE /api/listings/[id] + Wire My Listings Remove (Issue #10)

**What:** Added `DELETE /api/listings/:id` serverless route that removes a listing from ephemeral `/tmp` storage and optional Turso/libSQL. Wired the Seller Portal “Remove” button so it calls the API after the local update, keeping map markers and list in sync.

**Why:** Sellers could only remove listings client-side (localStorage + in-memory). A real DELETE endpoint completes the open backend CRUD loop for user listings and matches the product goal of live listings via the API. Coordinates remain required on every surviving listing.

**How (implemented):**
- New `api/listings/[id].js` handles DELETE (CORS updated to allow DELETE/PUT).
- Removes matching id from `/tmp/farmdirect-listings-extra.json`.
- If `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` are set, executes `DELETE FROM listings WHERE id = ?`.
- Seed `data/listings.json` stays immutable (demo); only user-created extras/Turso rows are deleted.
- `listings-api.js` exposes `deleteListingFromApi` and overrides `window.removeMyListing` to also hit the API (local removal still happens first for snappy UI).
- Marker is removed by the original local handler; API call is best-effort and logged on failure.

Addresses GitHub issue #10. Every listing continues to carry lat/lng/coordinates. Cycle continues (still within 60 days of 2026-10-11).
