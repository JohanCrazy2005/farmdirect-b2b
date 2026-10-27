## 2026-10-27 – Visibility display + fixed HTML escaping (seed UX)

**What:** Product cards now show a distinct visibility badge (worldwide / country / province). Sidebar list items include visibility in the meta line. Fixed broken `escapeHtml` in `js/list.js` (was replacing characters with themselves) so listing titles, addresses, and chips render safely and correctly.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Visibility is a core schema field; surfacing it improves seed/demo clarity without new features. The escape bug risked broken display or injection on any special characters in seed data.

**How:** Updated `js/cards.js` (visibility badge + proper escape), `js/list.js` (escapeHtml fix + visibility in meta + header note), and `css/main.css` (`.visibility-badge` styles, dark mode). Single commit via push_files. Appended this entry.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish works end-to-end and the badge switches to LIVE.

---

## 2026-10-26 – Seller filter uses display names (seed UX)
...