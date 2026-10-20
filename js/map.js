/** 
 * FarmDirect B2B – Leaflet map module
 * Markers + fuller clustering (custom icons, spiderfy, zoom behavior)
 * + geolocation “Locate me” + Fit all listings + distance sort for better undeployed demo UX
 * + radius circle after Locate me + radius filter
 * + category legend control (explains colored markers; demo-friendly)
 * + optional fitBounds skip so “only in view” filter does not loop
 * + list-map hover highlight sync (hovering marker highlights list card and vice versa; improves map-first exploration in seed/demo)
 * + correct HTML escaping in popups and legend + richer popup content (price, seller, address, visibility)
 * + Locate me polish: toasts instead of alerts, accuracy circle, clear-location control (seed/demo)
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

  const CATEGORY_COLORS = {
    produce: '#2d6a4f',
    dairy: '#1d4ed8',
    eggs: '#d97706',
    grains: '#92400e',
    herbs: '#059669',
    honey: '#f59e0b',
    default: '#40916c'
  };

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
            html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
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

    return map;
  }

  function addLegend() {
    if (!map) return;
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend');
      const items = Object.entries(CATEGORY_COLORS)
        .filter(([k]) => k !== 'default')
        .map(([cat, color]) => `<div class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${escapeHtml(cat)}</div>`)
        .join('');
      div.innerHTML = `<strong>Categories</strong>${items}`;
      return div;
    };
    legend.addTo(map);
  }

  function clearMarkers() {
    if (markersLayer) markersLayer.clearLayers();
  }

  function makeMarkerIcon(category) {
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
    return L.divIcon({
      className: 'category-marker',
      html: `<div style="background:${color}"></div>`,
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
      });

      const price = Number(listing.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)} / ${escapeHtml(listing.units || '')}`;
      const addr = listing.address ? `<div class="popup-meta">${escapeHtml(listing.address)}</div>` : '';
      const vis = listing.visibility ? `<div class="popup-meta">Visibility: ${escapeHtml(listing.visibility)}</div>` : '';
      const seller = listing.sellerid ? `<div class="popup-meta">Seller: ${escapeHtml(listing.sellerid)}</div>` : '';

      marker.bindPopup(`
        <div class="map-popup">
          <strong>${escapeHtml(listing.headerdescription || 'Listing')}</strong>
          <div class="popup-price">${priceStr}</div>
          <div class="popup-meta">${escapeHtml(listing.category || '')}</div>
          ${seller}
          ${addr}
          ${vis}
          <div class="popup-hint">Click marker or list item for full details</div>
        </div>
      `);

      markersLayer.addLayer(marker);
      listing._marker = marker;
    });

    if (options.fit !== false && listings.length && map) {
      try {
        const bounds = markersLayer.getBounds?.() || L.latLngBounds(listings.map(l => [l.location.lat, l.location.long]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (_) {}
    }
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

        // Trigger distance sort in list panel
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
    if (global.FD_LIST && typeof global.FD_LIST.clearDistance === 'function') {
      global.FD_LIST.clearDistance();
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

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.FD_MAP = { initMap, renderMarkers, selectListing, flyTo, locateMe, clearLocation, fitAll, setRadiusCircle, getMap: () => map, getUserLatLng: () => userLatLng, highlightMarker, clearMarkerHighlight };
})(window);
