## 2026-10-19 – P2+: Share button in product card for better demo sharing UX

**What:** Added a “Share” button to the product detail card. It uses the Web Share API (`navigator.share`) when available (native share sheet on mobile/desktop), and falls back to the existing copy-link behavior otherwise. Fully client-side; works in pure seed/demo mode with no Worker. Complements the deep-link hash and Copy link button.

**Why:** Highest remaining pure-code polish while P1 remains blocked on user (`npx wrangler login` + documented deploy commands in README). Makes it easier to share individual seed listings from the undeployed experience using the device’s native sharing options (messages, email, social, etc.) without inventing new features.

**How:** One commit. Updated `js/cards.js` (Share button in showProduct + shareListing helper with navigator.share + fallback), `GOAL.md` (new completed P2 item + last-updated), `IMPROVEMENTS.md`.

Next: user-run P1 deploy so the live Worker can replace the seed/demo fallback.

---

