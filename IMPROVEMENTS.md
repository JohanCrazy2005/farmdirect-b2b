## 2026-10-30 – Clickable visibility & units badges in sidebar list (seed/demo UX)

**What:** Sidebar list rows now show clickable visibility and units badges next to the category badge. Clicking them applies the corresponding filter (same as map popups and product cards). Fully client-side; works in seed/demo mode.

**Why:** Further seed/demo UX polish so offline or undeployed users can quickly filter by visibility or units directly from the list without opening the filter card or product card. Matches the interaction model already present on map popups and product cards. Highest unfinished code-only item; P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned.

**How:** Single commit via push_files updating js/list.js (renderList badges + event handlers), css/main.css (badge styles), and this log entry.

**Next:** User can still apply optional RFQ migration or add Cloudflare secrets; seed/demo fallback remains fully usable offline with improved list filtering.

---

## 2026-10-30 – List count filtered/total + thumbnail error fallback (seed/demo UX)

**What:** Sidebar list count now shows filtered/total (e.g. 4 / 12) when filters are active, with a tooltip. Listing row thumbnails that fail to load are replaced by the category-color placeholder. Fully client-side; works in seed/demo mode.

**Why:** Further seed/demo UX polish so offline or undeployed users immediately see how many listings match current filters and never see broken image icons in the list. Highest unfinished code-only item; P1 optional RFQ migration and P5 GitHub Actions secrets remain user-owned.

**How:** Single commit via push_files updating js/list.js (count display + onerror handler on thumbs) and this log entry.

**Next:** User can still apply optional RFQ migration or add Cloudflare secrets; seed/demo fallback remains fully usable offline with clearer list feedback.

---

PLACEHOLDER_IMP
