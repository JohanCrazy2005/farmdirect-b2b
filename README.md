# FarmDirect B2B – Direct Farm-to-Business Marketplace

Interactive prototype of a B2B agricultural marketplace connecting farms/sellers directly with buyers (restaurants, retailers, processors, etc.).

## Features (functional)

- **Interactive map** (Leaflet + Carto/Esri) with product emoji markers and popups
- **RFQ / Request Quote modal** – quantity, delivery date, email, notes; validation + success toast
- **Near Me** – browser geolocation, Haversine distance recalculation, user marker, saved position
- **Verified seller badges** + “Verified only” filter
- **Organic filter**, category, distance, price, search, sort
- **Dark mode** (persisted in localStorage)
- **MOQ & Lead Time** – badges on cards/popups + filters for max MOQ and max lead time
- **Min. rating filter** – Any / 4.0+ / 4.5+ / 4.8+; rating + review count on cards and popups
- **Availability status** – In stock / Low / Out badges on cards & popups + “Available now only” filter
- **Active filter chips** – dismissible chips showing current filters with individual clear
- Seller cards: ratings, stock, click-to-focus map
- Expanded sample data (produce, dairy, eggs, grains, herbs, honey)
- Responsive layout for mobile

## How to run

Open `index.html` in any modern browser, or serve it:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Live deployment (if synced): see project Vercel URL in project notes.

## Improvement log

See `IMPROVEMENTS.md` for the hourly suggestion history and the implementation pass notes.
