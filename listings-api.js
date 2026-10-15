/**
 * FarmDirect — load live listings from open API (/api/listings)
 * Uses API as primary source of truth for window.sellers (embedded data is offline fallback).
 * Ensures coordinates, refreshes map markers to match API data exactly.
 * Also provides publish + delete + update helpers used by the seller portal.
 */
(function () {
  'use strict';

  const API = '/api/listings';

  function ensureCoords(s) {
    if (s.lat == null || s.lng == null) {
      s.lat = 51.51;
      s.lng = -0.08;
    }
    // Normalize array form used by some client paths to object
    if (Array.isArray(s.coordinates) && s.coordinates.length >= 2) {
      s.coordinates = { lat: Number(s.coordinates[0]), lng: Number(s.coordinates[1]) };
    }
    s.coordinates = s.coordinates && s.coordinates.lat != null
      ? s.coordinates
      : { lat: s.lat, lng: s.lng };
    s._baseLat = s._baseLat != null ? s._baseLat : s.lat;
    s._baseLng = s._baseLng != null ? s._baseLng : s.lng;
    return s;
  }

  function addMarker(s) {
    if (!window.L || !window.markerCluster || !window.markers) return;
    if (window.markers[s.id]) return;
    const icon = L.divIcon({
      className: '',
      html: '<div class="custom-marker" style="border-color:' + (s.color || '#84cc16') + '">' + (s.emoji || '🌱') + '</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    const marker = L.marker([s.lat, s.lng], { icon: icon });
    if (typeof window.buildPopupHtml === 'function') {
      marker.bindPopup(window.buildPopupHtml(s));
    }
    window.markerCluster.addLayer(marker);
    window.markers[s.id] = marker;
  }

  function refreshMarkerPopup(s) {
    if (!window.markers || !window.markers[s.id]) return;
    const marker = window.markers[s.id];
    if (typeof window.buildPopupHtml === 'function' && marker.bindPopup) {
      marker.bindPopup(window.buildPopupHtml(s));
    }
    // Move marker if coordinates changed
    if (s.lat != null && s.lng != null && marker.setLatLng) {
      marker.setLatLng([s.lat, s.lng]);
    }
  }

  function syncMarkers(list) {
    if (!window.markers || !window.markerCluster) return;
    const apiIds = new Set(list.map(function (s) { return s.id; }));

    // Remove markers for listings no longer returned by the API
    Object.keys(window.markers).forEach(function (idStr) {
      const id = Number(idStr);
      if (!apiIds.has(id) && window.markers[id]) {
        window.markerCluster.removeLayer(window.markers[id]);
        delete window.markers[id];
      }
    });

    // Update existing or add new markers so the map matches API data
    list.forEach(function (s) {
      if (window.markers[s.id]) {
        refreshMarkerPopup(s);
      } else {
        addMarker(s);
      }
    });
  }

  async function loadFromApi() {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      const list = (data.listings || []).map(ensureCoords);

      // Primary source of truth when API is reachable
      window.sellers = list;
      syncMarkers(list);

      if (typeof window.filterSellers === 'function') window.filterSellers();
      if (typeof showToast === 'function') {
        showToast('Loaded ' + list.length + ' listings from ' + (data.source || 'API'));
      }
      return list;
    } catch (e) {
      console.warn('listings API unavailable, using embedded data', e);
      if (window.sellers) window.sellers.forEach(ensureCoords);
      return null;
    }
  }

  window.publishListingToApi = async function (payload) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'POST failed');
      const listing = ensureCoords(data.listing);
      if (!window.sellers) window.sellers = [];
      if (!window.sellers.some(function (s) { return s.id === listing.id; })) {
        window.sellers.push(listing);
        addMarker(listing);
      }
      if (typeof window.filterSellers === 'function') window.filterSellers();
      return listing;
    } catch (e) {
      console.warn('API publish failed, local only', e);
      return null;
    }
  };

  window.deleteListingFromApi = async function (id) {
    try {
      const res = await fetch(API + '/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('DELETE ' + res.status);
      return true;
    } catch (e) {
      console.warn('API delete failed (local removal still applied)', e);
      return false;
    }
  };

  window.updateListingToApi = async function (id, updates) {
    try {
      const res = await fetch(API + '/' + encodeURIComponent(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(updates || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PUT failed');
      const listing = ensureCoords(data.listing);

      if (window.sellers) {
        const idx = window.sellers.findIndex(function (s) { return s.id === listing.id || s.id == id; });
        if (idx !== -1) {
          window.sellers[idx] = Object.assign({}, window.sellers[idx], listing);
          ensureCoords(window.sellers[idx]);
          refreshMarkerPopup(window.sellers[idx]);
        }
      }
      if (typeof window.filterSellers === 'function') window.filterSellers();
      if (typeof showToast === 'function') showToast('Listing updated');
      return listing;
    } catch (e) {
      console.warn('API update failed', e);
      return null;
    }
  };

  // Patch My Listings modal to support edit (price / qty / stock) via PUT
  function enhanceMyListings() {
    const originalOpen = window.openMyListings;
    if (typeof originalOpen !== 'function') return;

    window.openMyListings = function () {
      originalOpen();
      const body = document.getElementById('myListingsBody');
      if (!body || !window.sellers) return;
      const mine = window.sellers.filter(function (s) { return s.isUserListing; });
      if (mine.length === 0) return;

      body.innerHTML = mine.map(function (s) {
        return (
          '<div style="padding:0.6rem 0;border-bottom:1px solid var(--border)">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem">' +
              '<div>' +
                '<strong>' + (s.product || '') + '</strong> · $' + (s.price || 0) + '/' + (s.unit || 'kg') + '<br>' +
                '<span style="font-size:0.8rem;color:var(--muted)">' + (s.qty || '') + ' · ' + (s.farm || s.name || '') + '</span>' +
              '</div>' +
              '<button type="button" class="btn-sm" onclick="removeMyListing(' + s.id + ')">Remove</button>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.45rem;align-items:center">' +
              '<label style="font-size:0.75rem">Price <input type="number" id="editPrice_' + s.id + '" value="' + (s.price || 0) + '" step="0.01" min="0" style="width:5.5rem;padding:0.2rem;font-size:0.8rem" /></label>' +
              '<label style="font-size:0.75rem">Qty <input type="number" id="editQty_' + s.id + '" value="' + (s.availableQty || 0) + '" min="0" style="width:5.5rem;padding:0.2rem;font-size:0.8rem" /></label>' +
              '<label style="font-size:0.75rem">Stock ' +
                '<select id="editStock_' + s.id + '" style="padding:0.2rem;font-size:0.8rem">' +
                  '<option value="in_stock"' + (s.stockStatus === 'in_stock' ? ' selected' : '') + '>In stock</option>' +
                  '<option value="low"' + (s.stockStatus === 'low' ? ' selected' : '') + '>Low</option>' +
                  '<option value="out"' + (s.stockStatus === 'out' ? ' selected' : '') + '>Out</option>' +
                '</select>' +
              '</label>' +
              '<button type="button" class="btn-sm" style="background:var(--primary);color:#fff" onclick="saveMyListingEdit(' + s.id + ')">Save</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    };

    window.saveMyListingEdit = async function (id) {
      const priceEl = document.getElementById('editPrice_' + id);
      const qtyEl = document.getElementById('editQty_' + id);
      const stockEl = document.getElementById('editStock_' + id);
      const updates = {};
      if (priceEl) updates.price = parseFloat(priceEl.value);
      if (qtyEl) updates.availableQty = parseInt(qtyEl.value, 10);
      if (stockEl) updates.stockStatus = stockEl.value;
      const updated = await window.updateListingToApi(id, updates);
      if (updated && typeof window.openMyListings === 'function') {
        window.openMyListings(); // refresh modal with new values
      }
    };
  }

  const prev = window.submitListProductClean;
  window.submitListProductClean = function () {
    if (typeof prev === 'function') prev();
    const name = (document.getElementById('lpName') || {}).value;
    const product = (document.getElementById('lpProduct') || {}).value;
    const price = parseFloat((document.getElementById('lpPrice') || {}).value);
    if (!name || !product || !(price >= 0)) return;
    window.publishListingToApi({
      name: name.trim(),
      product: product.trim(),
      price: price,
      category: (document.getElementById('lpCategory') || {}).value,
      unit: (document.getElementById('lpUnit') || {}).value,
      qty: (document.getElementById('lpQty') || {}).value,
      lat: parseFloat((document.getElementById('lpLat') || {}).value),
      lng: parseFloat((document.getElementById('lpLng') || {}).value),
    });
  };

  const originalRemove = window.removeMyListing;
  if (typeof originalRemove === 'function') {
    window.removeMyListing = function (id) {
      originalRemove(id);
      window.deleteListingFromApi(id);
    };
  }

  function boot() {
    setTimeout(loadFromApi, 400);
    setTimeout(enhanceMyListings, 600); // after original openMyListings is defined
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
