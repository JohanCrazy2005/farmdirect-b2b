## 2026-10-30 – Seed/demo UX: next/prev navigation + listing deep links

**What:** Product card now has “← Prev” / “Next →” buttons and a “N of M” position indicator that cycle through the current filtered set via new `FD_LIST.navigate(delta)`. Keyboard arrows already navigate the list; the buttons make the same flow available while the card is open. Shared individual listing links of the form `#listing=id` are now applied on load so the product card opens automatically.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. Next/prev + deep links make sequential exploration and sharing of specific seed listings frictionless without inventing features or schema changes.

**How:** `js/list.js` (navigate, applyHash, getFiltered), `js/cards.js` (prev/next buttons + position). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Seed/demo UX: random listing picker

**What:** Added “Random” buttons in the offline banner, sidebar header, and Options menu, plus keyboard shortcut <kbd>r</kbd>. Calls new `FD_LIST.selectRandom()` which picks a random listing from the current filtered set, selects it (opens product card), and flies the map to it. Toast confirms the pick.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. Random exploration makes it easier to discover seed listings without inventing new features or schema changes.

**How:** `js/list.js` (selectRandom), `index.html` (buttons + shortcut), `js/main.js` (wiring). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Seed/demo UX: listing counts + summary in banner and data-source modal

**What:** Offline/seed banner now includes the current listing count (seed, demo, or api-empty). Data-source modal adds a one-line summary (count, top categories, price range) plus “Fit all on map” and “Clear filters” buttons so users can explore the loaded data without leaving the modal.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. Showing counts and a quick summary makes the fallback data immediately understandable and actionable without inventing new features or schema changes.

**How:** `js/main.js` (showBanner accepts count; openDatasourceModal computes summary from FD_LIST.getListings and wires two new buttons). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Seed/demo UX: shareable filtered view deep links + seller chip names

**What:** Implemented the missing `FD_LIST.getFilteredViewLink()` so the existing Options → “Copy filtered view link” button now produces a shareable URL with current filters as query params (`q`, `cat`, `vis`, `units`, `seller`, `minprice`, `maxprice`, `radius`, `sort`, `fav`, `inview`). On load, those params are applied once after the filter selects are populated, restoring the filtered view. Seller filter chips now show the human-readable display name instead of the generic “Seller” label.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. The copy-filtered-link control was already in the UI but non-functional; making it work improves exploration and sharing without inventing features or schema changes.

**How:** `js/list.js` (new `getFilteredViewLink` + `applyUrlParams`, seller chip label). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Seed/demo UX: actionable empty state + post-create dashboard shortcut

**What:** Sidebar empty state (when filters match nothing) now includes a “Try sample listing” button in seed/demo mode that calls `FD_FORM.openSampleForm()`. After a successful create in seed/demo, the form status shows an “Open dashboard” button that closes the form and opens the seller dashboard so the user can immediately publish the new draft.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. This removes friction between “no results” / “just created a draft” and the next useful action without inventing unrelated features.

**How:** `js/list.js` (empty-state button), `js/form.js` (success status button + slightly longer auto-close). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Seed/demo UX: one-click sample listing prefill

**What:** Added a “Try sample” button on the offline/seed banner and a “Try sample listing” action in the data-source modal. Both call `FD_FORM.openSampleForm()`, which opens the create form pre-filled with a valid Denver-area produce listing (matching the seed geography and schema). Users can immediately edit, save (persists to local demo), then publish from the dashboard.

**Why:** Highest unfinished code-only item was further seed/demo UX polish. P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned. This gives a zero-friction way to experience the full create → persist → publish loop while the Worker is offline or empty, without inventing unrelated features.

**How:** `js/form.js` (new `openSampleForm`), `js/main.js` (wiring in banner + modal), `index.html` (banner button). Fully client-side; no schema, Worker, or API changes. Works with existing seed fallback and localStorage demo store.

## 2026-10-30 – Complete css/main.css (layout + seed/demo polish)

**What:** Replaced the 15-byte `PLACEHOLDER_CSS` with a full, substantial stylesheet. It implements the transparent top bar (backdrop blur), map, sidebar list (thumbs, badges, chips, empty state), filter/options cards, product/seller cards, all modals, custom Leaflet markers & clusters, legend, offline banner, data-source badge, toasts, and dark-mode variables. Responsive breakpoints declutter the phone view (collapsible sidebar, progressive disclosure of controls, safe-area padding, larger touch targets).

**Why:** Highest unfinished code-only item. GOAL marks the frontend shell and phone declutter done, but the actual CSS was missing, so the map-first UI and seed/demo fallback were unusable. Completing it makes every existing JS module and the index.html shell work visually without inventing features.

**How:** Single file rewrite of `css/main.css`. Fully client-side; no Worker, schema, or API changes. Works offline with seed data.

Cycle continues.
