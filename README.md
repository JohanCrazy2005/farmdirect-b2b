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
- **Supplier Reliability Score** – composite 0–100 badge (rating, reviews, verified, stock, response) + Min. reliability filter and Reliability sort
- **Lot / Batch Traceability** – “Lot-tracked” badge on cards/popups/drawer + “Traceable only” filter (full chips/presets/URL support)
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
- **One-click Reorder** – from Inquiry History, restore qty / notes / date (single) or rebuild cart (combined) and re-open the modal
- **Inquiry history** – local log of sent RFQs (single + combined) with timestamps, notes indicator, re-open, status tracking (Pending / Quoted / Accepted / Declined)
- **Request Sample** – one-click sample RFQ with 🧪 type in history
- **Deep-linkable seller profiles** – `?seller=` URL + Share button in drawer
- **Previous inquiry indicator** – 📬 last-contacted badge + “Previously contacted only” filter
- **Seller Portal + Manage My Listings** – login, publish crops, then edit price/qty/stock status or unpublish from the My listings tab; listings persist in localStorage and show a “Your listing” badge on map/list.
- **Delivery days**, region, packaging, grade, production method, storage, year-round, weekly capacity, response time, min reviews, earliest arrival, live order cost estimator, and more filters/badges
- **Shareable filter URLs**, saved filter presets, CSV export of results and inquiry history
- **Mobile / laptop polish** – responsive layout, view modes (map/split/list), resize handling, dark mode

## How to run

Open `index.html` in any modern browser, or serve it:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Live deployment: https://farmdirect-b2b.vercel.app (or project URL from Vercel dashboard)

GitHub: https://github.com/JohanCrazy2005/farmdirect-b2b

## Improvement log

See `IMPROVEMENTS.md` for the hourly suggestion history and the implementation pass notes.
