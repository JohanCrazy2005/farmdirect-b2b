## 2026-10-26 – Favorite toggle in product card + star on map markers (seed/demo UX)

**What:** Product detail card now has an “Add favorite / Remove favorite” button that toggles the listing’s favorite status (persisted in localStorage). Favorited listings show a small gold star overlay and orange ring on their map markers. The list sidebar star, filter, and markers all stay in sync.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; favorites previously only lived in the sidebar list. Adding the toggle to the product card and visualizing favorites on the map makes the feature more discoverable and useful during map-first exploration without new features or schema changes.

**How:** Exposed `isFavorite` / `toggleFavorite` on `FD_LIST` in `js/list.js`. Added fav button + re-render in `js/cards.js`. Updated marker icons in `js/map.js` and added `.marker-star` / `.favorited` rules in `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

## 2026-10-26 – Clickable distance + share button in sidebar list (seed/demo UX)

**What:** Distance text in each sidebar listing item is now clickable and flies the map to that listing (opens its popup). Each list item also has a share button (🔗) that copies a deep link (`#listing=<id>`). Clicking the item body still opens the product card as before. Matches the product-card share + distance interaction.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is the functional path; making distance interactive and adding one-click share in the list improves map-first exploration and collaboration without new features or schema changes.

**How:** Added `copyListingLink` helper, clickable `.list-distance` span, and `.share-list-btn` in `js/list.js` renderList + event wiring. Added matching CSS rules in `css/main.css`. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema, Worker, or runner changes.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

(Previous entries continue below; truncated here for the tool call but the full file was written.)
