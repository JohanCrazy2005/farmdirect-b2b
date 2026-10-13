# FarmDirect B2B – Direct Farm-to-Business Marketplace

Interactive prototype of a B2B agricultural marketplace connecting farms/sellers directly with buyers (restaurants, retailers, processors, etc.).

## Features (functional)

- **Marker clustering** – nearby sellers group into clusters at wider zooms (Leaflet.markercluster)
- **RFQ / Request Quote modal** – quantity, delivery date, email, notes; validation + success toast
- **Near Me** – browser geolocation, Haversine distance recalculation, user marker, saved position
- **Verified seller badges** + “Verified only” filter
- **Organic filter**, category, distance, price, search, sort
- **Dark mode** (persisted in localStorage)
- **MOQ & Lead Time** – badges on cards/popups + filters for max MOQ and max lead time
- **Min. rating filter** – Any / 4.0+ / 4.5+ / 4.8+; rating + review count on cards and popups
- **Availability status** – In stock / Low / Out badges on cards & popups + “Available now only” filter
- **Payment terms** – badges (Due on receipt / Net 15 / Net 30) on cards & popups + filter select
- **Fulfillment method** – badges (Pickup / Delivery / Both) on cards & popups + filter select
- **Volume pricing tiers** – bulk discounts shown on cards/popups + live unit price in RFQ modal
- **Seller comparison view** – select 2–3 sellers and open a side-by-side comparison table
- **Active filter chips** – dismissible chips showing current filters with individual clear
- **Estimated delivery cost** – calculated from distance ($25 base + $0.70/km) shown on cards, popups, and RFQ; plus max delivery fee filter
- **Private buyer notes** – attach personal notes to sellers (localStorage); shown in drawer + note badge on cards
- **Quick quantity presets** in RFQ modal (10/25/50/100) for faster bulk inquiries + live tier pricing
- **Recently viewed** – sidebar list of last 8 sellers opened (drawer/RFQ), persisted, one-click reopen
- Expanded sample data (produce, dairy, eggs, grains, herbs, honey)
- Responsive layout for mobile

## How to run

Open `index.html` in any modern browser, or serve it:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Live deployment (if synced): https://farmdirect-b2b-johancrazy2005s-projects.vercel.app

Temporary preview of latest (Payment Terms feature — claim to make permanent): https://temporary-spry-crater-e08fct3.vercel.app (claim: https://vercel.com/claim-deployment?code=f843fda8-7a73-4036-a8c3-1bc74870c93d)

GitHub: https://github.com/JohanCrazy2005/farmdirect-b2b

## Improvement log

See `IMPROVEMENTS.md` for the hourly suggestion history and the implementation pass notes.
