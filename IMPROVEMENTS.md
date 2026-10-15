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

