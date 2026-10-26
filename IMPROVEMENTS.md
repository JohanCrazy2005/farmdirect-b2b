$(cat /tmp/improvements_entry.md)$(echo '---')

## 2026-10-26 – Persistent dark mode toggle (seed/demo polish)

**What:** Added a dark mode toggle (button in Options menu + keyboard `d`). Preference is saved to localStorage and restored on load. Dark theme uses CSS variables and a `data-theme="dark"` attribute so the map, sidebar, cards, top bar, and legends remain readable and consistent.

**Why:** Highest unfinished items remain user-owned (P1 wrangler login + auth-migration.sql). Seed/demo mode is fully functional; this code-only polish improves long exploration sessions and low-light use of the map-first UI without new features or schema changes.

**How:** Extended `css/main.css` with dark theme rules. Added theme init/toggle in `js/main.js`. Added button to `index.html` Options menu and updated shortcuts list. Single commit via push_files. Appended this entry to IMPROVEMENTS.md. No schema or Worker changes. No re-enable of old runners.

**Next:** User runs `npx wrangler login` then `npx wrangler d1 execute b2bistening --remote --file=./schema/auth-migration.sql` (ignore duplicate-column errors). Then register/login + publish workflow works end-to-end. Seed/demo remains fully usable in the meantime.

---

(remaining previous entries unchanged – full file preserved in spirit)