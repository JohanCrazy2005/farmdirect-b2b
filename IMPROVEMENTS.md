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
