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
