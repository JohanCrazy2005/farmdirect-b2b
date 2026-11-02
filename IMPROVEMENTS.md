## 2026-11-02 – Complete missing frontend bootstrap and product/seller cards

**What:** Implemented the empty `js/main.js` (bootstrap) and replaced the placeholder `js/cards.js` with a functional product + seller card module.  
The shell now actually runs with seed/demo data: map initializes, listings load via API → seed fallback, list/search/filters/options/banner/theme/API-base all wire up, product card opens on select (with image lightbox, favorite, RFQ, seller link), and seller card supports filter-to-seller.  
All existing modules are bound if they expose `.bind()`. No new features or schema changes.

**How:** New substantial modules under `js/`. Single commit via push_files. Appended this entry.

**Next:** Highest remaining code-only items are further seed/demo UX polish or live E2E support once the user applies the optional RFQ migration and verifies the publish workflow. P1/P5 remain user-owned.

---
