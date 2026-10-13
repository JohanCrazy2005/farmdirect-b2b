# FarmDirect B2B – Incremental Improvement Log

This file is updated automatically every hour by a Grok automation.
Each entry proposes **one** concrete UI or feature improvement that can be implemented in the next iteration.

---

## 2026-10-13 (Hourly update) – Sort by Delivery Cost & Landed Cost

**What:** Add two new sort options — “Delivery cost: Low to High” and “Landed cost (price + deliv)” — so buyers can rank suppliers by logistics cost and by a simple combined unit+delivery score.

**Why:** Farm-gate price alone is incomplete for B2B buyers. A slightly higher unit price from a nearby farm is often cheaper once delivery is included. Explicit sort options make this comparison instant instead of mental arithmetic across cards.

**How:**
- Extend the Sort by `<select>` with the two new options.
- In `filterSellers`, compute `estimateDeliveryCost(distance)` for pure delivery sort.
- For landed cost, use `price + delivery / 50` (amortizing delivery over a typical small wholesale order) so unit price still dominates but proximity is rewarded.
- Works with existing Near Me distance updates, filters, chips, URL state, and dark mode. No new UI chrome required.

This is a lightweight, high-signal commercial decision aid that builds directly on the delivery-cost indicator already present.

## 2026-10-13 (Hourly update) – Sort by Delivery Cost & Landed Cost (Implemented)

**What:** Implemented “Delivery cost: Low to High” and “Landed cost (price + deliv)” sort options.

**Why:** Lets buyers instantly reorder the list by true logistics-aware cost.

**How (implemented):**
- New options in the Sort by dropdown.
- Pure delivery sort uses existing `estimateDeliveryCost()`.
- Landed-cost score = unit price + (delivery estimate / 50).
- Fully integrated with filter pipeline, shareable URL (`sort` param), saved presets, and active filter chips. No backend required.

This completes the landed-cost ranking feature for more practical B2B procurement decisions.
