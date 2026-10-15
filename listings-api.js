/**
 * FarmDirect — load live listings from open API (/api/listings)
 * Merges into window.sellers, ensures coordinates, refreshes map markers.
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
    s.coordinates = s.coordinates || { lat: s.lat, lng: s.lng };
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

  async function loadFromApi() {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      const list = (data.listings || []).map(ensureCoords);
      if (!window.sellers) window.sellers = [];

      list.forEach(function (remote) {
        const idx = window.sellers.findIndex(function (s) {
          return s.id === remote.id;
        });
        if (idx === -1) {
          window.sellers.push(remote);
          addMarker(remote);
        } else {
          window.sellers[idx] = Object.assign({}, window.sellers[idx], remote);
          ensureCoords(window.sellers[idx]);
        }
      });

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
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
