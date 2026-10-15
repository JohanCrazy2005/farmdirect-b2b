
## 2026-10-15 – Simplified List-Product Form to 7 Fields / 3 Required (Issue #6)

**What:** Tightened the Seller Portal “List a Product” form to exactly 7 fields with only name, product, and price required. Added optional latitude/longitude inputs so sellers can pin exact coordinates; unit defaults to kg.

**Why:** The previous form lacked coordinate controls and did not clearly mark required fields. Matching the product success criterion (≤7 fields, exactly 3 required) keeps onboarding fast while guaranteeing every listing has lat/lng.

**How (implemented):**
- Form now: Farm/Seller name*, Product*, Price*, Category, Available qty, Latitude (optional), Longitude (optional).
- `submitListProduct` validates the three required fields, uses provided lat/lng when valid, otherwise falls back to a random point near London, and sets `coordinates: [lat, lng]`.
- Addresses GitHub issue #6 and GOAL.md success criterion #2.

Fully client-side. Cycle continues (still within 60 days of 2026-10-11).
