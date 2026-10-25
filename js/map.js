/**
 * FarmDirect B2B – Leaflet map module
 * Initializes map, marker clusters, category colors, location, fit, view links, and category legend.
 * Fully client-side; works with seed/demo fallback.
 */
(function (global) {
  'use strict';

  let map = null;
  let clusterGroup = null;
  let userMarker = null;
  let userCircle = null;
  const markers = new Map(); // id -> marker

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

  function addCategoryLegend() {
    if (!map) return;
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'category-legend card');
      const entries = Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default');
      div.innerHTML = '<h4>Categories</h4>' + entries.map(([cat, color]) =>
        `<div class="legend-item"><span class="legend-swatch" style="background:${color}"></span> ${cat}</div>`
      ).join('');
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    legend.addTo(map);
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

    // Restore view from URL hash if present
    try {
      const hash = location.hash || '';
      const m = hash.match(/#map=([\d.-]+),([\d.-]+),(\d+)/);
      if (m) {
        map.setView([parseFloat(m[1]), parseFloat(m[2])], parseInt(m[3], 10));
      }
    } catch (_) {}

    map.on('moveend', () => {
      // Notify list for "only in view"
      if (global.FD_LIST && typeof global.FD_LIST.onMapMove === 'function') {
        global.FD_LIST.onMapMove();
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
        html: `<div class="marker-dot" style="background:${color}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const marker = L.marker([l.location.lat, l.location.long], { icon, title: l.headerdescription || '' });
      marker.on('click', () => {
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(l.id);
        }
      });
      marker.bindTooltip(l.headerdescription || 'Listing', { direction: 'top', offset: [0, -10] });
      clusterGroup.addLayer(marker);
      markers.set(l.id, marker);
    });
  }

  function flyTo(id) {
    const marker = markers.get(id);
    if (marker && map) {
      const latlng = marker.getLatLng();
      map.setView(latlng, Math.max(map.getZoom(), 14));
      marker.openTooltip();
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
    getCategoryColor
  };
})(window);
