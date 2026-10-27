/**
 * FarmDirect B2B – Leaflet map module
 * Initializes map, MarkerCluster, custom category-colored markers, popups with
 * clickable visibility and category badges (calls FD_LIST.setVisibilityFilter / setCategoryFilter), locate/fit,
 * and view-link generation. Fully client-side; works with seed/demo fallback.
 * Exposes user position and bounds so list filters (radius / in-view) work offline.
 * Popups now include clickable address linking to Google Maps for better seed/demo exploration.
 */
(function (global) {
  'use strict';

  let map = null;
  let cluster = null;
  let markersById = new Map();
  let userMarker = null;
  let userCircle = null;
  let userPos = null;

  const CATEGORY_COLORS = {
    produce: '#2d6a4f',
    dairy: '#1d4ed8',
    eggs: '#d97706',
    grains: '#92400e',
    herbs: '#059669',
    honey: '#f59e0b',
    meat: '#dc2626',
    flowers: '#ec4899',
    nuts: '#78350f',
    seafood: '#0ea5e9',
    bakery: '#f97316',
    default: '#40916c'
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getColor(category) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  }

  function visibilityLabel(v) {
    const map = { worldwide: 'Worldwide', country: 'Country', province: 'Province' };
    return map[v] || v || 'Unknown';
  }

  function createIcon(listing, isFav) {
    const color = getColor(listing.category);
    const star = isFav ? '<span class="fav-star">★</span>' : '';
    const html = `<div class="marker-pin" style="background:${color}">${star}</div>`;
    return L.divIcon({
      className: 'fd-marker',
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });
  }

  function popupContent(listing) {
    const seller = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(listing.sellerid) : (listing.sellerid || '');
    const price = listing.price != null ? `$${Number(listing.price).toFixed(2)} / ${escapeHtml(listing.units || '')}` : '';
    const vis = escapeHtml(listing.visibility || '');
    const cat = escapeHtml(listing.category || '');
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    const mapsUrl = (!isNaN(lat) && !isNaN(lng)) ? `https://www.google.com/maps?q=${lat},${lng}` : '';
    const addressHtml = listing.address
      ? (mapsUrl ? `<a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener" class="popup-address" title="Open in maps">${escapeHtml(listing.address)}</a>` : escapeHtml(listing.address))
      : '';
    return `
      <div class="map-popup">
        <strong>${escapeHtml(listing.headerdescription || 'Listing')}</strong><br>
        <button type="button" class="category-badge popup-cat" data-cat="${cat}" title="Filter by category">${cat}</button>
        <button type="button" class="visibility-badge vis-${vis} popup-vis" data-vis="${vis}" title="Filter by visibility">${escapeHtml(visibilityLabel(listing.visibility))}</button><br>
        ${price ? price + '<br>' : ''}
        ${addressHtml ? addressHtml + '<br>' : ''}
        <span class="muted small">${escapeHtml(seller)}</span>
      </div>
    `;
  }

  function bindPopupClicks(popupEl) {
    if (!popupEl) return;
    popupEl.querySelectorAll('.popup-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vis = btn.dataset.vis;
        if (vis && global.FD_LIST && typeof global.FD_LIST.setVisibilityFilter === 'function') {
          global.FD_LIST.setVisibilityFilter(vis);
          if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${visibilityLabel(vis)}`, 'info');
        }
      });
    });
    popupEl.querySelectorAll('.popup-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = btn.dataset.cat;
        if (cat && global.FD_LIST && typeof global.FD_LIST.setCategoryFilter === 'function') {
          global.FD_LIST.setCategoryFilter(cat);
          if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${cat}`, 'info');
        }
      });
    });
  }

  function updateMarkers(listings) {
    if (!map || !cluster) return;
    const favs = (global.FD_LIST && global.FD_LIST.getFavorites) ? global.FD_LIST.getFavorites() : new Set();
    cluster.clearLayers();
    markersById.clear();
    (listings || []).forEach(l => {
      const loc = l.location || {};
      const lat = Number(loc.lat);
      const lng = Number(loc.long);
      if (isNaN(lat) || isNaN(lng)) return;
      const marker = L.marker([lat, lng], { icon: createIcon(l, favs.has(l.id)) });
      marker.bindPopup(popupContent(l));
      marker.on('popupopen', (e) => {
        const el = e.popup.getElement();
        bindPopupClicks(el);
      });
      marker.on('click', () => {
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(l.id, true);
        }
      });
      markersById.set(l.id, marker);
      cluster.addLayer(marker);
    });
  }

  function highlight(id) {
    const marker = markersById.get(id);
    if (marker && map) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13));
      marker.openPopup();
    }
  }

  function initMap() {
    if (map) return;
    map = L.map('map', { zoomControl: true }).setView([39.7392, -104.9903], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    cluster = L.markerClusterGroup({
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: 'fd-cluster',
          html: `<div class="cluster-icon">${count}</div>`,
          iconSize: [40, 40]
        });
      },
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true
    });
    map.addLayer(cluster);

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = '<strong>Categories</strong><br>' +
        Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([k, c]) =>
          `<div class="legend-item" data-cat="${k}"><span class="swatch" style="background:${c}"></span> ${k}</div>`
        ).join('');
      setTimeout(() => {
        div.querySelectorAll('.legend-item').forEach(item => {
          item.addEventListener('click', () => {
            const cat = item.dataset.cat;
            const sel = document.getElementById('filter-category');
            if (sel) {
              sel.value = cat;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        });
      }, 100);
      return div;
    };
    legend.addTo(map);

    // Re-filter when map moves if in-view is active
    map.on('moveend zoomend', () => {
      if (global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
        const inview = document.getElementById('filter-inview');
        if (inview && inview.checked) global.FD_LIST.applyFilters();
      }
    });
  }

  function getMapViewLink() {
    if (!map) return location.href;
    const c = map.getCenter();
    const z = map.getZoom();
    return `${location.origin}${location.pathname}?lat=${c.lat.toFixed(5)}&lng=${c.lng.toFixed(5)}&z=${z}`;
  }

  function locateMe() {
    if (!map) return;
    if (!navigator.geolocation) {
      if (global.FD_TOAST) global.FD_TOAST.show('Geolocation not supported', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        userPos = { lat: latitude, lng: longitude };
        if (userMarker) map.removeLayer(userMarker);
        if (userCircle) map.removeLayer(userCircle);
        userMarker = L.circleMarker([latitude, longitude], {
          radius: 8, fillColor: '#1d4ed8', color: '#fff', weight: 2, fillOpacity: 0.9
        }).addTo(map).bindPopup('You are here');
        userCircle = L.circle([latitude, longitude], { radius: 500, color: '#1d4ed8', fillOpacity: 0.1 }).addTo(map);
        map.setView([latitude, longitude], 14);
        document.getElementById('clear-location-btn')?.removeAttribute('hidden');
        if (global.FD_TOAST) global.FD_TOAST.show('Located', 'success');
        if (global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
          global.FD_LIST.applyFilters();
        }
      },
      () => { if (global.FD_TOAST) global.FD_TOAST.show('Location denied', 'error'); }
    );
  }

  function clearLocation() {
    userPos = null;
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (userCircle) { map.removeLayer(userCircle); userCircle = null; }
    document.getElementById('clear-location-btn')?.setAttribute('hidden', '');
    if (global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
      global.FD_LIST.applyFilters();
    }
  }

  function fitAll() {
    if (!cluster || !map) return;
    const bounds = cluster.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  }

  function getUserPosition() {
    return userPos;
  }

  function getBounds() {
    return map ? map.getBounds() : null;
  }

  global.FD_MAP = {
    initMap,
    updateMarkers,
    highlight,
    getMapViewLink,
    locateMe,
    clearLocation,
    fitAll,
    getUserPosition,
    getBounds
  };
})(window);
