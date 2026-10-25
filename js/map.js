/** 
 * FarmDirect B2B – Leaflet map module
 * Markers + fuller clustering (custom icons, spiderfy, zoom behavior)
 * + geolocation “Locate me” + Fit all listings + distance sort for better undeployed demo UX
 * + radius circle after Locate me + radius filter
 * + category legend control (explains colored markers; demo-friendly)
 * + optional fitBounds skip so “only in view” filter does not loop
 * + list-map hover highlight sync (hovering marker highlights list card and vice versa; improves map-first exploration in seed/demo)
 * + correct HTML escaping in popups and legend + richer popup content (price, seller display name, address, visibility)
 * + Locate me polish: toasts instead of alerts, accuracy circle, clear-location control (seed/demo)
 * + Persist map view (center + zoom) in localStorage so reloads resume the last explored area (fully client-side for seed/demo)
 * + Shareable map view via URL hash (#map=lat,lng,zoom) – copy button + restore on load (overrides localStorage; fully client-side for seed/demo)
 * + Persist Locate me location in localStorage (marker + accuracy + distance sort restored on reload; fully client-side for seed/demo)
 * + Location callbacks now also drive FD_LIST.setUserLocation for consistent distance display/filter
 * + getBounds exposed so “Only in view” filter works (client-side, seed/demo friendly)
 * + “Only in view” now re-applies live on map pan/zoom (via moveend → FD_LIST.applyFilters)
 * + Expanded category colors for seed listings (meat, flowers, nuts, seafood, bakery) so new demo markers are distinguishable in the legend
 * + Popups now prefer friendly seller display names from seed meta (seed/demo UX)
 * + Interactive category legend: click a swatch to filter list + markers to that category (toggle to clear). Fully client-side for seed/demo.
 */
(function (global) {
  'use strict';

  let map;
  let markersLayer;
  let listings = [];
  let selectedId = null;
  let userMarker = null;
  let userAccuracyCircle = null;
  let userLatLng = null;
  let radiusCircle = null;
  let skipInitialFit = false;
  let legendControl = null;

  const MAP_VIEW_KEY = 'fd-map-view';
  const USER_LOC_KEY = 'fd-user-location';

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

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function loadSavedView() {
    try {
      const raw = localStorage.getItem(MAP_VIEW_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.zoom === 'number' &&
          isFinite(v.lat) && isFinite(v.lng) && v.zoom >= 1 && v.zoom <= 19) {
        return v;
      }
    } catch (_) {}
    return null;
  }

  function saveView() {
    if (!map) return;
    try {
      const c = map.getCenter();
      localStorage.setItem(MAP_VIEW_KEY, JSON.stringify({
        lat: c.lat,
        lng: c.lng,
        zoom: map.getZoom()
      }));
    } catch (_) {}
  }

  function parseMapHash() {
    const hash = location.hash || '';
    const m = hash.match(/#map=([+-]?\d*\.?\d+),([+-]?\d*\.?\d+),(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    const zoom = parseFloat(m[3]);
    if (isFinite(lat) && isFinite(lng) && isFinite(zoom) && zoom >= 1 && zoom <= 19) {
      return { lat, lng, zoom };
    }
    return null;
  }

  function loadSavedLocation() {
    try {
      const raw = localStorage.getItem(USER_LOC_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (typeof v.lat === 'number' && typeof v.lng === 'number' && isFinite(v.lat) && isFinite(v.lng)) {
        return v;
      }
    } catch (_) {}
    return null;
  }

  function saveLocation(lat, lng, accuracy) {
    try {
      localStorage.setItem(USER_LOC_KEY, JSON.stringify({
        lat, lng, accuracy: accuracy || null, ts: Date.now()
      }));
    } catch (_) {}
  }

  function clearSavedLocation() {
    try { localStorage.removeItem(USER_LOC_KEY); } catch (_) {}
  }

  function restoreLocation() {
    const saved = loadSavedLocation();
    if (!saved || !map) return;
    const { lat, lng, accuracy } = saved;
    userLatLng = { lat, lng };

    if (userMarker) map.removeLayer(userMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

    userMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#1d4ed8',
      fillColor: '#3b82f6',
      fillOpacity: 0.8,
      weight: 2
    }).addTo(map);
    userMarker.bindPopup('You are here (restored)').openPopup();

    if (accuracy && accuracy > 0 && accuracy < 50000) {
      userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.12,
        weight: 1,
        dashArray: '3 6'
      }).addTo(map);
    }

    const clearBtn = document.getElementById('clear-location-btn');
    if (clearBtn) clearBtn.removeAttribute('hidden');

    // Drive list distance display + optional sort
    if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
      global.FD_LIST.setUserLocation({ lat, lng });
    }
    if (global.FD_LIST && typeof global.FD_LIST.sortByDistance === 'function') {
      setTimeout(() => global.FD_LIST.sortByDistance(lat, lng), 300);
    }
  }

  function initMap() {
    const cfg = global.FD_CONFIG || {};
    map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
    }).setView(cfg.MAP_CENTER || [39.7392, -104.9903], cfg.MAP_ZOOM || 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Fuller marker cluster support
    if (typeof L.markerClusterGroup === 'function') {
      markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        spiderfyDistanceMultiplier: 1.5,
        disableClusteringAtZoom: 15,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 10) size = 'large';
          else if (count >= 5) size = 'medium';
          return L.divIcon({
            html: `<div class=\"cluster-icon cluster-${size}\"><span>${count}</span></div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(40, 40),
            iconAnchor: L.point(20, 20)
          });
        }
      });
    } else {
      markersLayer = L.layerGroup();
    }
    map.addLayer(markersLayer);

    addLegend();

    // Prefer URL hash map view (shareable deep link), then localStorage, then default
    const fromHash = parseMapHash();
    const saved = loadSavedView();
    if (fromHash) {
      map.setView([fromHash.lat, fromHash.lng], fromHash.zoom);
      skipInitialFit = true;
      // Persist so subsequent reloads keep it
      try {
        localStorage.setItem(MAP_VIEW_KEY, JSON.stringify(fromHash));
      } catch (_) {}
    } else if (saved) {
      map.setView([saved.lat, saved.lng], saved.zoom);
      skipInitialFit = true;
    }

    // Persist on user pan/zoom (also captures Locate me / Fit all / flyTo)
    map.on('moveend', saveView);

    // Live “Only in view” filter: re-apply when viewport changes and the checkbox is on
    map.on('moveend', () => {
      const inview = document.getElementById('filter-inview');
      if (inview && inview.checked && global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
        global.FD_LIST.applyFilters();
      }
    });

    // Restore previous Locate me if present (after map is ready)
    setTimeout(restoreLocation, 100);

    return map;
  }

  function syncLegendActive() {
    const catSel = document.getElementById('filter-category');
    const active = catSel ? catSel.value : '';
    document.querySelectorAll('.legend-item[data-cat]').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === active);
    });
  }

  function setCategoryFilter(cat) {
    const catSel = document.getElementById('filter-category');
    if (!catSel) return;
    const next = (catSel.value === cat) ? '' : cat; // toggle
    catSel.value = next;
    catSel.dispatchEvent(new Event('change', { bubbles: true }));
    if (global.FD_LIST && typeof global.FD_LIST.applyFilters === 'function') {
      global.FD_LIST.applyFilters();
    }
    syncLegendActive();
    if (global.FD_TOAST) {
      global.FD_TOAST.show(next ? `Filtered to ${next}` : 'Category filter cleared', 'info');
    }
  }

  function addLegend() {
    if (!map) return;
    if (legendControl) map.removeControl(legendControl);
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend');
      const items = Object.entries(CATEGORY_COLORS)
        .filter(([k]) => k !== 'default')
        .map(([cat, color]) => `
          <div class=\"legend-item\" data-cat=\"${escapeHtml(cat)}\" title=\"Filter to ${escapeHtml(cat)}\" role=\"button\" tabindex=\"0\">
            <span class=\"legend-swatch\" style=\"background:${color}\"></span>${escapeHtml(cat)}
          </div>`)
        .join('');
      div.innerHTML = `<strong>Categories</strong>${items}<div class=\"legend-hint muted small\">Click to filter</div>`;

      div.querySelectorAll('.legend-item[data-cat]').forEach(item => {
        const handler = (e) => {
          e.stopPropagation();
          e.preventDefault();
          setCategoryFilter(item.dataset.cat);
        };
        item.addEventListener('click', handler);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') handler(e);
        });
      });

      // Keep legend highlight in sync if filter changes from elsewhere
      const catSel = document.getElementById('filter-category');
      if (catSel) catSel.addEventListener('change', syncLegendActive);
      setTimeout(syncLegendActive, 50);

      return div;
    };
    legend.addTo(map);
    legendControl = legend;
  }

  function clearMarkers() {
    if (markersLayer) markersLayer.clearLayers();
  }

  function makeMarkerIcon(category) {
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
    return L.divIcon({
      className: 'category-marker',
      html: `<div style=\"background:${color}\"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function highlightMarker(id) {
    clearMarkerHighlight();
    const listing = listings.find(l => l.id === id);
    if (listing && listing._marker) {
      const el = listing._marker.getElement();
      if (el) {
        el.classList.add('marker-highlighted');
        listing._marker.setZIndexOffset(1000);
      }
    }
  }

  function clearMarkerHighlight() {
    listings.forEach(l => {
      if (l._marker) {
        const el = l._marker.getElement();
        if (el) el.classList.remove('marker-highlighted');
        l._marker.setZIndexOffset(0);
      }
    });
  }

  function renderMarkers(newListings, options) {
    options = options || {};
    listings = newListings || [];
    clearMarkers();

    listings.forEach(listing => {
      const lat = listing.location?.lat;
      const lng = listing.location?.long;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng], {
        title: listing.headerdescription,
        icon: makeMarkerIcon(listing.category)
      });

      marker.on('click', () => {
        selectListing(listing.id);
        if (global.FD_CARDS && global.FD_CARDS.showProduct) {
          global.FD_CARDS.showProduct(listing);
        }
      });

      // Hover sync with list
      marker.on('mouseover', () => {
        if (global.FD_LIST && typeof global.FD_LIST.highlight === 'function') {
          global.FD_LIST.highlight(listing.id);
        }
        highlightMarker(listing.id);
      });
      marker.on('mouseout', () => {
        clearMarkerHighlight();
        if (global.FD_LIST && typeof global.FD_LIST.highlight === 'function') {
          global.FD_LIST.highlight(null);
        }
      });

      const price = Number(listing.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)} / ${escapeHtml(listing.units || '')}`;
      const addr = listing.address ? `<div class=\"popup-meta\">${escapeHtml(listing.address)}</div>` : '';
      const vis = listing.visibility ? `<div class=\"popup-meta\">Visibility: ${escapeHtml(listing.visibility)}</div>` : '';
      const sellerName = getDisplayName(listing.sellerid);
      const seller = sellerName ? `<div class=\"popup-meta\">Seller: ${escapeHtml(sellerName)}</div>` : '';

      marker.bindPopup(`
        <div class=\"map-popup\">
          <strong>${escapeHtml(listing.headerdescription || 'Listing')}</strong>
          <div class=\"popup-price\">${priceStr}</div>
          <div class=\"popup-meta\">${escapeHtml(listing.category || '')}</div>
          ${seller}
          ${addr}
          ${vis}
          <div class=\"popup-hint\">Click marker or list item for full details</div>
        </div>
      `);

      markersLayer.addLayer(marker);
      listing._marker = marker;
    });

    // Auto-fit only on first load when no saved view exists (preserves demo continuity)
    if (options.fit !== false && listings.length && map && !skipInitialFit) {
      try {
        const bounds = markersLayer.getBounds?.() || L.latLngBounds(listings.map(l => [l.location.lat, l.location.long]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (_) {}
    }
    skipInitialFit = true;
    syncLegendActive();
  }

  function selectListing(id) {
    selectedId = id;
    if (global.FD_LIST && global.FD_LIST.highlight) {
      global.FD_LIST.highlight(id);
    }
  }

  function flyTo(listing) {
    if (!map || !listing?.location) return;
    map.flyTo([listing.location.lat, listing.location.long], 15, { duration: 0.6 });
    if (listing._marker) {
      // Ensure popup opens even if previously clustered
      setTimeout(() => listing._marker.openPopup(), 300);
    }
  }

  function setRadiusCircle(km) {
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }
    if (userLatLng && km > 0) {
      radiusCircle = L.circle([userLatLng.lat, userLatLng.lng], {
        radius: km * 1000,
        color: '#1d4ed8',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 4'
      }).addTo(map);
    }
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    } else {
      // Fallback only if toast module missing
      console.log(msg);
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.', 'error');
      return;
    }
    const btn = document.getElementById('locate-btn');
    if (btn) btn.disabled = true;
    showToast('Getting your location…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy; // meters
        userLatLng = { lat, lng };
        if (userMarker) map.removeLayer(userMarker);
        if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

        userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
          weight: 2
        }).addTo(map);
        userMarker.bindPopup('You are here').openPopup();

        if (accuracy && accuracy > 0 && accuracy < 50000) {
          userAccuracyCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3b82f6',
            fillColor: '#93c5fd',
            fillOpacity: 0.12,
            weight: 1,
            dashArray: '3 6'
          }).addTo(map);
        }

        map.flyTo([lat, lng], 12, { duration: 0.8 });
        if (btn) btn.disabled = false;
        showToast('Located you' + (accuracy ? ` (±${Math.round(accuracy)} m)` : ''), 'success');

        // Persist for reload continuity
        saveLocation(lat, lng, accuracy);

        // Drive list distance display + sort
        if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
          global.FD_LIST.setUserLocation({ lat, lng });
        }
        if (global.FD_LIST && typeof global.FD_LIST.sortByDistance === 'function') {
          global.FD_LIST.sortByDistance(lat, lng);
        }
      },
      (err) => {
        const msg = err.code === 1 ? 'Location permission denied' :
                    err.code === 2 ? 'Location unavailable' :
                    err.code === 3 ? 'Location request timed out' :
                    (err.message || 'Could not get your location');
        showToast(msg, 'error');
        if (btn) btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function clearLocation() {
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    if (userAccuracyCircle) {
      map.removeLayer(userAccuracyCircle);
      userAccuracyCircle = null;
    }
    userLatLng = null;
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }
    clearSavedLocation();
    const clearBtn = document.getElementById('clear-location-btn');
    if (clearBtn) clearBtn.setAttribute('hidden', '');
    if (global.FD_LIST && typeof global.FD_LIST.clearDistance === 'function') {
      global.FD_LIST.clearDistance();
    }
    if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
      global.FD_LIST.setUserLocation(null);
    }
    showToast('Location cleared', 'info');
  }

  function fitAll() {
    if (!map || !markersLayer) return;
    try {
      const bounds = markersLayer.getBounds ? markersLayer.getBounds() : null;
      if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        return;
      }
      if (listings.length) {
        const latlngs = listings
          .filter(l => l.location && l.location.lat != null && l.location.long != null)
          .map(l => [l.location.lat, l.location.long]);
        if (latlngs.length) {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 13 });
        }
      }
    } catch (_) {}
  }

  function getMapViewLink() {
    if (!map) return location.href;
    const c = map.getCenter();
    const z = map.getZoom();
    const base = location.origin + location.pathname + location.search;
    return base + '#map=' + c.lat.toFixed(6) + ',' + c.lng.toFixed(6) + ',' + z;
  }

  function getBounds() {
    if (!map) return null;
    const b = map.getBounds();
    return {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest()
    };
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  global.FD_MAP = { initMap, renderMarkers, selectListing, flyTo, locateMe, clearLocation, fitAll, setRadiusCircle, getMap: () => map, getUserLatLng: () => userLatLng, highlightMarker, clearMarkerHighlight, getMapViewLink, getBounds, syncLegendActive };
})(window);
