/**
 * FarmDirect B2B — UI cleanup layer
 * - Max 3 badges per listing
 * - Hide unused filters (keep essentials)
 * - Simplified listing form: ≤7 fields, 3 required + coordinates
 * - Review score on map popup card
 * - Live listings DB (localStorage) with required lat/lng on every listing
 */
(function () {
  'use strict';

  const LISTINGS_KEY = 'farmdirect_userListings';
  const MAX_BADGES = 3;

  // —— 1. Max 3 badges (priority order) ——
  function getTopBadges(s) {
    if (!s) return '';
    const stockLabel = { in_stock: 'In stock', low: 'Low stock', out: 'Out of stock' }[s.stockStatus] || '';
    const candidates = [];
    if (s.verified) candidates.push('<span class="badge-verified">✓ Verified</span>');
    if (s.organic) candidates.push('<span class="badge-organic">Organic</span>');
    if (s.stockStatus) candidates.push('<span class="badge-stock ' + s.stockStatus + '">' + stockLabel + '</span>');
    if (s.isUserListing) candidates.push('<span class="badge" style="background:#22c55e;color:#fff;font-size:0.65rem;padding:0.1rem 0.35rem;border-radius:3px">Your listing</span>');
    if (s.grade === 'premium') candidates.push('<span class="badge-grade premium">Premium</span>');
    if (s.traceable) candidates.push('<span class="badge-trace">Lot-tracked</span>');
    return candidates.slice(0, MAX_BADGES).join(' ');
  }

  // Patch buildPopupHtml & renderSellers badge assembly after load
  function patchBadgeBuilders() {
    if (typeof window.buildPopupHtml === 'function') {
      const original = window.buildPopupHtml;
      window.buildPopupHtml = function (s) {
        let html = original(s);
        // Cap badges in popup title and ensure rating is visible near top
        const ratingLine =
          '<div class="qty map-card-rating" style="margin:0.35rem 0;font-size:0.9rem;font-weight:600;color:var(--text)">' +
          '★ ' + (s.rating != null ? s.rating : '—') +
          ' <span style="font-weight:400;color:var(--muted)">(' + (s.reviews || 0) + ' reviews)</span></div>';
        // Inject rating if missing a clear header block
        if (html.indexOf('map-card-rating') === -1 && html.indexOf('popup-card') !== -1) {
          html = html.replace(
            /(<div class="product">[\s\S]*?<\/div>)/,
            '$1' + ratingLine
          );
        }
        // Replace long badge runs with top 3
        const top = getTopBadges(s);
        // Soft-limit: collapse consecutive badge spans in h3
        html = html.replace(
          /(<h3>[^<]*)((?:<span class="badge[^>]*>[^<]*<\/span>\s*)+)/,
          function (m, prefix) {
            return prefix + top + ' ';
          }
        );
        return html;
      };
    }

    // Intercept renderSellers to clamp badges after DOM insert
    if (typeof window.renderSellers === 'function') {
      const origRender = window.renderSellers;
      window.renderSellers = function (list) {
        origRender(list);
        document.querySelectorAll('.seller-card h3').forEach(function (h3) {
          const id = h3.closest('.seller-card') && h3.closest('.seller-card').dataset.id;
          const s = (window.sellers || []).find(function (x) { return String(x.id) === String(id); });
          if (!s) return;
          // Rebuild title with max 3 badges, keep name text
          const name = s.name || '';
          const favBtn = h3.querySelector('.fav-btn');
          const otherBtns = Array.from(h3.querySelectorAll('button'));
          h3.innerHTML = name + ' ' + getTopBadges(s);
          otherBtns.forEach(function (b) { h3.appendChild(b); });
        });
        // Refresh map popups with clamped badges + rating
        if (window.markers && typeof window.buildPopupHtml === 'function') {
          (list || []).forEach(function (s) {
            if (window.markers[s.id]) {
              try { window.markers[s.id].setPopupContent(window.buildPopupHtml(s)); } catch (e) {}
            }
          });
        }
      };
    }
  }

  // —— 2. Hide useless filters (keep essentials) ——
  function simplifyFilters() {
    const keepIds = new Set([
      'distRange', 'distValue',
      'categoryFilter',
      'organicToggle',
      'verifiedToggle',
      'availableToggle',
      'ratingFilter',
      'priceRange',
      'moqFilter'
    ]);

    const panel = document.getElementById('filtersPanel');
    if (!panel) return;

    // Collapse / hide accordion groups that are mostly noise
    ['fg-product', 'fg-commercial', 'fg-logistics', 'fg-location'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      // Keep structure but hide non-essential controls inside
      el.querySelectorAll('.filter-group, .toggle-row').forEach(function (row) {
        const hasKeep = Array.from(row.querySelectorAll('[id]')).some(function (n) {
          return keepIds.has(n.id);
        });
        // also keep labels that reference keep controls
        if (!hasKeep) row.style.display = 'none';
      });
    });

    // Hide saved searches / recent / inquiry history blocks to reduce clutter
    panel.querySelectorAll('.filter-group').forEach(function (g) {
      const label = (g.querySelector('label') || {}).textContent || '';
      if (/Saved searches|Recently viewed|Inquiry history/i.test(label)) {
        g.style.display = 'none';
      }
    });

    // Flatten: open location + product only
    const loc = document.getElementById('fg-location');
    const prod = document.getElementById('fg-product');
    if (loc) loc.open = true;
    if (prod) prod.open = true;
    const com = document.getElementById('fg-commercial');
    const log = document.getElementById('fg-logistics');
    if (com) com.open = false;
    if (log) log.open = false;
  }

  // —— 3. Simplified listing form (5–7 fields, 3 required) + coordinates ——
  function simplifyListingForm() {
    const modal = document.getElementById('listProductModal');
    if (!modal) return;
    const body = modal.querySelector('.modal-body');
    if (!body || body.dataset.cleaned === '1') return;

    body.innerHTML =
      '<p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem">Only 3 fields required. Every listing is saved with map coordinates.</p>' +
      '<div class="filter-group"><label>Farm / Seller name <span style="color:#dc2626">*</span></label>' +
      '<input type="text" id="lpName" required placeholder="My Farm" style="width:100%;padding:0.45rem" /></div>' +
      '<div class="filter-group" style="margin-top:0.6rem"><label>Product <span style="color:#dc2626">*</span></label>' +
      '<input type="text" id="lpProduct" required placeholder="Tomatoes" style="width:100%;padding:0.45rem" /></div>' +
      '<div class="filter-group" style="margin-top:0.6rem"><label>Price / unit <span style="color:#dc2626">*</span></label>' +
      '<input type="number" id="lpPrice" required step="0.01" min="0" value="1.50" style="width:100%;padding:0.45rem" /></div>' +
      '<div class="filter-group" style="margin-top:0.6rem"><label>Category</label>' +
      '<select id="lpCategory" aria-label="Product category" style="width:100%;padding:0.45rem">' +
      '<option value="tomatoes">Tomatoes</option><option value="milk">Milk</option><option value="eggs">Eggs</option>' +
      '<option value="wheat">Wheat</option><option value="herbs">Herbs</option><option value="honey">Honey</option>' +
      '</select></div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:0.6rem">' +
      '<div class="filter-group" style="flex:1"><label>Unit</label><input type="text" id="lpUnit" value="kg" style="width:100%;padding:0.45rem" /></div>' +
      '<div class="filter-group" style="flex:1"><label>Available qty</label><input type="number" id="lpQty" min="1" value="500" style="width:100%;padding:0.45rem" /></div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-top:0.6rem">' +
      '<div class="filter-group" style="flex:1"><label>Latitude</label><input type="number" id="lpLat" step="any" placeholder="51.51" style="width:100%;padding:0.45rem" /></div>' +
      '<div class="filter-group" style="flex:1"><label>Longitude</label><input type="number" id="lpLng" step="any" placeholder="-0.08" style="width:100%;padding:0.45rem" /></div>' +
      '</div>' +
      '<p style="font-size:0.75rem;color:var(--muted);margin-top:0.4rem">Leave lat/lng empty to place near map center. Values are stored in the live listings database.</p>' +
      '<button type="button" class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="submitListProductClean()">Publish Listing</button>';

    body.dataset.cleaned = '1';
  }

  // —— 4. Live listings DB with coordinates ——
  window.submitListProductClean = function () {
    const name = (document.getElementById('lpName').value || '').trim();
    const product = (document.getElementById('lpProduct').value || '').trim();
    const price = parseFloat(document.getElementById('lpPrice').value);
    if (!name || !product || !(price >= 0)) {
      if (typeof showToast === 'function') showToast('Please fill required fields: name, product, price');
      return;
    }
    const category = (document.getElementById('lpCategory') || {}).value || 'tomatoes';
    const unit = ((document.getElementById('lpUnit') || {}).value || 'kg').trim();
    const qty = parseInt((document.getElementById('lpQty') || {}).value, 10) || 100;
    let lat = parseFloat((document.getElementById('lpLat') || {}).value);
    let lng = parseFloat((document.getElementById('lpLng') || {}).value);
    if (isNaN(lat) || isNaN(lng)) {
      lat = 51.51 + (Math.random() - 0.5) * 0.08;
      lng = -0.08 + (Math.random() - 0.5) * 0.08;
    }

    const sellers = window.sellers || [];
    const newId = Math.max.apply(null, sellers.map(function (s) { return s.id; }).concat([0])) + 1;
    const newSeller = {
      id: newId,
      name: name,
      farm: name,
      product: product,
      category: category,
      price: price,
      unit: unit,
      qty: qty + ' ' + unit,
      organic: false,
      verified: false,
      rating: 0,
      reviews: 0,
      distance: 5,
      lat: lat,
      lng: lng,
      coordinates: { lat: lat, lng: lng },
      color: '#84cc16',
      emoji: '🌱',
      img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=128&h=128&fit=crop',
      moq: 10,
      leadTimeDays: 3,
      stockStatus: 'in_stock',
      availableQty: qty,
      paymentTerms: 'due_on_receipt',
      fulfillment: 'both',
      harvestDaysAgo: 1,
      bio: 'Live listing (saved to local database).',
      volumeTiers: [{ minQty: 0, price: price }],
      isUserListing: true,
      _baseLat: lat,
      _baseLng: lng,
      _baseDistance: 5
    };

    sellers.push(newSeller);
    window.sellers = sellers;

    // Persist live DB
    try {
      const existing = JSON.parse(localStorage.getItem(LISTINGS_KEY) || '[]');
      existing.push(newSeller);
      localStorage.setItem(LISTINGS_KEY, JSON.stringify(existing));
    } catch (e) {}

    if (window.L && window.markerCluster && window.markers) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker" style="border-color:' + newSeller.color + '">' + newSeller.emoji + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      const marker = L.marker([newSeller.lat, newSeller.lng], { icon: icon });
      if (typeof window.buildPopupHtml === 'function') {
        marker.bindPopup(window.buildPopupHtml(newSeller));
      }
      window.markerCluster.addLayer(marker);
      window.markers[newSeller.id] = marker;
    }

    if (typeof closeListProduct === 'function') closeListProduct();
    if (typeof filterSellers === 'function') filterSellers();
    if (typeof showToast === 'function') {
      showToast('Listed “' + product + '” at ' + lat.toFixed(4) + ', ' + lng.toFixed(4));
    }
  };

  // Ensure sample + user listings all have coordinates
  function ensureCoordinates() {
    const sellers = window.sellers;
    if (!sellers || !sellers.length) return;
    sellers.forEach(function (s) {
      if (s.lat == null || s.lng == null) {
        s.lat = 51.51;
        s.lng = -0.08;
      }
      s.coordinates = { lat: s.lat, lng: s.lng };
    });
  }

  function run() {
    ensureCoordinates();
    patchBadgeBuilders();
    simplifyFilters();
    simplifyListingForm();
    // Re-run after UI settles (modals may mount late)
    setTimeout(simplifyListingForm, 500);
    if (typeof filterSellers === 'function') {
      try { filterSellers(); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(run, 100);
    });
  } else {
    setTimeout(run, 100);
  }
})();
