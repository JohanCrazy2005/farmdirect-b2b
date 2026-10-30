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
