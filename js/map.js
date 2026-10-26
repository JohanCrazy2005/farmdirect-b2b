/**
 * FarmDirect B2B – Leaflet map module
 * Initializes map, marker clusters, category colors, location, fit, view links, interactive category legend, and marker popups.
 * Bidirectional hover highlight sync with sidebar list items.
 * Persists map view (center + zoom) to localStorage so reloads resume the last explored area (seed/demo).
 * Draws a radius circle when the radius filter is active and a user location is set.
 * Fully client-side; works with seed/demo fallback.
 */
(function (global) {
  'use strict';

  let map = null;
  let clusterGroup = null;
  let userMarker = null;
  let userCircle = null;
  let radiusCircle = null;
  const markers = new Map(); // id -> marker
  const VIEW_KEY = 'fd-map-view';

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

  function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  function saveMapView() {
    if (!map) return;
    try {
      const c = map.getCenter();
      const z = map.getZoom();
      localStorage.setItem(VIEW_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: z }));
    } catch (_) {}
  }

  function loadMapView() {
    try {
      const raw = localStorage.getItem(VIEW_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (v && typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.zoom === 'number') {
        return v;
      }
    } catch (_) {}
    return null;
  }

  function setRadiusOverlay(latlng, radiusKm) {
    if (!map || !latlng || !(radiusKm > 0)) {
      clearRadiusOverlay();
      return;
    }
    const radiusM = radiusKm * 1000;
    if (radiusCircle) {
      radiusCircle.setLatLng(latlng);
      radiusCircle.setRadius(radiusM);
    } else {
      radiusCircle = L.circle(latlng, {
        radius: radiusM,
        color: '#2d6a4f',
        weight: 2,
        opacity: 0.7,
        fillColor: '#2d6a4f',
        fillOpacity: 0.08,
        interactive: false
      }).addTo(map);
    }
  }

  function clearRadiusOverlay() {
    if (radiusCircle && map) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }
  }

  function addCategoryLegend() {
    if (!map) return;
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'category-legend card');
      const entries = Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default');
      div.innerHTML = '<h4>Categories</h4>' + entries.map(([cat, color]) =>
        `<div class=\"legend-item\" data-category=\"${cat}\" role=\"button\" tabindex=\"0\" title=\"Filter by ${cat}\"><span class=\"legend-swatch\" style=\"background:${color}\"></span> ${cat}</div>`
      ).join('');
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      return div;
    };
    legend.addTo(map);

    // Bind clicks after the control is in the DOM
    setTimeout(() => {
      const items = document.querySelectorAll('.legend-item');
      items.forEach(item => {
        const handler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const cat = item.dataset.category;
          const sel = document.getElementById('filter-category');
          if (!sel) return;
          // Toggle: if already selected, clear; else set
          const newVal = (sel.value === cat) ? '' : cat;
          sel.value = newVal;
          if (global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
            global.FD_LIST.applyFilters();
          }
          updateLegendActive(newVal);
        };
        item.addEventListener('click', handler);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler(e);
          }
        });
      });
    }, 50);
  }

  function updateLegendActive(activeCat) {
    document.querySelectorAll('.legend-item').forEach(el => {
      el.classList.toggle('active', el.dataset.category === activeCat && activeCat !== '');
    });
  }

  function initMap() {
    const center = (global.FD_CONFIG && global.FD_CONFIG.MAP_CENTER) || [39.7392, -104.9903];
    const zoom = (global.FD_CONFIG && global.FD_CONFIG.MAP_ZOOM) || 11;
    map = L.map('map', { zoomControl: true }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    });
    map.addLayer(clusterGroup);

    // Restore view: URL hash takes priority, then localStorage, else default
    let restored = false;
    try {
      const hash = location.hash || '';
      const m = hash.match(/#map=([\\d.-]+),([\\d.-]+),(\\d+)/);
      if (m) {
        map.setView([parseFloat(m[1]), parseFloat(m[2])], parseInt(m[3], 10));
        restored = true;
      }
    } catch (_) {}

    if (!restored) {
      const saved = loadMapView();
      if (saved) {
        map.setView([saved.lat, saved.lng], saved.zoom);
      }
    }

    map.on('moveend', () => {
      saveMapView();
      // Notify list for \"only in view\"
      if (global.FD_LIST && typeof global.FD_LIST.onMapMove === 'function') {
        global.FD_LIST.onMapMove();
      }
    });

    // Handle \"View details\" buttons inside marker popups
    map.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('.popup-view-btn');
      if (btn) {
        btn.onclick = (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const id = btn.dataset.id;
          if (id && global.FD_LIST && typeof global.FD_LIST.select === 'function') {
            global.FD_LIST.select(id);
          }
          map.closePopup();
        };
      }
    });

    addCategoryLegend();
  }

  function getMap() {
    return map;
  }

  function getMapViewLink() {
    if (!map) return location.href.split('#')[0];
    const c = map.getCenter();
    const z = map.getZoom();
    const base = location.origin + location.pathname;
    return `${base}#map=${c.lat.toFixed(5)},${c.lng.toFixed(5)},${z}`;
  }

  function locateMe() {
    if (!map || !navigator.geolocation) {
      if (global.FD_TOAST) global.FD_TOAST.show('Geolocation not available', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (userMarker) map.removeLayer(userMarker);
        if (userCircle) map.removeLayer(userCircle);
        userMarker = L.marker(latlng, { title: 'You are here' }).addTo(map).bindPopup('Your location');
        userCircle = L.circle(latlng, { radius: 500, color: '#2563eb', fillOpacity: 0.1 }).addTo(map);
        map.setView(latlng, 13);
        document.getElementById('clear-location-btn')?.removeAttribute('hidden');
        if (global.FD_TOAST) global.FD_TOAST.show('Located', 'success');
        if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
          global.FD_LIST.setUserLocation(latlng);
        }
      },
      () => {
        if (global.FD_TOAST) global.FD_TOAST.show('Could not get location', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function clearLocation() {
    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    if (userCircle) { map.removeLayer(userCircle); userCircle = null; }
    clearRadiusOverlay();
    document.getElementById('clear-location-btn')?.setAttribute('hidden', '');
    if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
      global.FD_LIST.setUserLocation(null);
    }
  }

  function fitAll(listings) {
    if (!map || !clusterGroup) return;
    const bounds = clusterGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (listings && listings.length) {
      const pts = listings.filter(l => l.location).map(l => [l.location.lat, l.location.long]);
      if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    }
  }

  function updateMarkers(listings) {
    if (!clusterGroup) return;
    clusterGroup.clearLayers();
    markers.clear();
    (listings || []).forEach(l => {
      if (!l.location || l.location.lat == null || l.location.long == null) return;
      const color = getCategoryColor(l.category);
      const icon = L.divIcon({
        className: 'listing-marker',
        html: `<div class=\"marker-dot\" style=\"background:${color}\"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const marker = L.marker([l.location.lat, l.location.long], { icon, title: l.headerdescription || '' });
      const price = l.price != null ? `$${Number(l.price).toFixed(2)}/${l.units || ''}` : 'Price on request';
      const popupHtml = `
        <div class=\"map-popup\">
          <strong>${escapeHtml(l.headerdescription || 'Listing')}</strong><br>
          <span class=\"popup-swatch\" style=\"background:${color}\"></span> ${escapeHtml(l.category || '')}<br>
          ${escapeHtml(price)}<br>
          <button type=\"button\" class=\"popup-view-btn small-btn\" data-id=\"${escapeHtml(l.id)}\">View details</button>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(l.id);
        }
      });
      // Bidirectional hover: highlight corresponding list item
      marker.on('mouseover', () => {
        if (global.FD_LIST && typeof global.FD_LIST.highlightListItem === 'function') {
          global.FD_LIST.highlightListItem(l.id);
        }
      });
      marker.on('mouseout', () => {
        if (global.FD_LIST && typeof global.FD_LIST.highlightListItem === 'function') {
          global.FD_LIST.highlightListItem(null);
        }
      });
      clusterGroup.addLayer(marker);
      markers.set(l.id, marker);
    });
  }

  function flyTo(id) {
    const marker = markers.get(id);
    if (marker && map) {
      const latlng = marker.getLatLng();
      map.setView(latlng, Math.max(map.getZoom(), 14));
      marker.openPopup();
    }
  }

  function highlightMarker(id) {
    markers.forEach((m, mid) => {
      const el = m.getElement?.();
      if (el) el.classList.toggle('highlight', mid === id);
    });
  }

  global.FD_MAP = {
    initMap,
    getMap,
    getMapViewLink,
    locateMe,
    clearLocation,
    fitAll,
    updateMarkers,
    flyTo,
    highlightMarker,
    getCategoryColor,
    updateLegendActive,
    setRadiusOverlay,
    clearRadiusOverlay
  };
})(window);
