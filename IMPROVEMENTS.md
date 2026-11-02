## 2026-11-02 – Seed/demo UX: listing count on badge + banner + theme attribute fix

**What:** Further polished the seed/demo fallback UX (highest remaining code-only item). The data-source badge and offline banner now display the number of listings shown (e.g. “SEED · 12”). Banner message includes the count. Also fixed dark-mode application so `data-theme="dark"` is set on `<html>` (matching CSS selectors) in addition to the body class, ensuring badge colors and other theme styles apply correctly. No new features or schema changes.

**How:** Updated `js/main.js` (showBanner, loadAndRender, theme toggle/restore, force-seed). Single commit. Appended this entry.

**Next:** Highest remaining code-only items are further seed/demo UX polish or live E2E support once the user applies the optional RFQ migration and verifies the publish workflow. P1/P5 remain user-owned.

---
## 2026-11-02 – Seed/demo UX: last-checked time + source-specific badge styles

**What:** Further polished the seed/demo fallback UX (highest remaining code-only item). The offline banner and clickable data-source badge now show a relative "last checked" timestamp. The badge receives source-specific background/border colors (SEED amber, DEMO blue, API-EMPTY purple) in both light and dark themes so the data source is visually distinguishable at a glance. Data-source modal also reports the last check time. No new features or schema changes.

**How:** Updated `js/main.js` (showBanner, updateSourceModal, loadAndRender) and `css/main.css` (badge variants). Single commit. Appended this entry.

**Next:** Highest remaining code-only items are further seed/demo UX polish or live E2E support once the user applies the optional RFQ migration and verifies the publish workflow. P1/P5 remain user-owned.

---
## 2026-11-02 – Seed/demo UX: interactive badge + actionable data-source modal

**What:** Polished the seed/demo fallback UX (highest remaining code-only item). Data-source badge is now clickable (opens the details modal). The data-source modal now shows clear next-step guidance for the live publish workflow (register → create draft → publish) and includes quick-action buttons (Retry live, Deploy notes, Sign in / Open Dashboard). Banner title updated. No new features or schema changes; pure UX for offline/empty Worker cases.

**How:** Updated `js/main.js` (showBanner, updateSourceModal, wireTopBar). Single commit. Appended this entry.

**Next:** Highest remaining code-only items are further seed/demo UX polish or live E2E support once the user applies the optional RFQ migration and verifies the publish workflow. P1/P5 remain user-owned.

---
## 2026-11-02 – Complete missing frontend bootstrap and product/seller cards

**What:** Implemented the empty `js/main.js` (bootstrap) and replaced the placeholder `js/cards.js` with a functional product + seller card module.  
The shell now actually runs with seed/demo data: map initializes, listings load via API → seed fallback, list/search/filters/options/banner/theme/API-base all wire up, product card opens on select (with image lightbox, favorite, RFQ, seller link), and seller card supports filter-to-seller.  
All existing modules are bound if they expose `.bind()`. No new features or schema changes.

**How:** New substantial modules under `js/`. Single commit via push_files. Appended this entry.

**Next:** Highest remaining code-only items are further seed/demo UX polish or live E2E support once the user applies the optional RFQ migration and verifies the publish workflow. P1/P5 remain user-owned.

---
