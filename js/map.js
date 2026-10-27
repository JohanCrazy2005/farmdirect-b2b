/**
 * FarmDirect B2B – Leaflet map module
 * Clusters, category-colored markers, favorite star overlay, radius circle,
 * user location, scale, legend, shareable map view, hover sync, flyTo.
 * Map popups now show visibility badge and seller display name for consistency
 * with product cards and sidebar list. Works fully in seed/demo fallback.
 */
(function (global) {
  'use strict';

  const CATEGORY_COLORS = {
    produce: '#2d6a4f',
    eggs: '#e9c46a',
    grains: '#bc6c25',
    dairy: '#f4a261',
    herbs: '#52b788',
    honey: '#e76f51',
    meat: '#9b2226',
    flowers: '#c77dff',
    nuts: '#6f4e37',
    seafood: '#1d3557',
    bakery: '#e9b44c',
    default: '#40916c'
  };

  let map = null;
  let clusterGroup = null;
  let markersById = new Map();
  let userMarker = null;
  let userLocation = null; // [lat, lng]
  let radiusCircle = null;
  let legend = null;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function visibilityLabel(v) {
    const map = { worldwide: 'Worldwide', country: 'Country', province: 'Province' };
    return map[v] || v || 'Unknown';
  }

  function getCategoryColor(cat) {
    if (!cat) return CATEGORY_COLORS.default;
    const key = String(cat).toLowerCase();
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
  }

  function makeIcon(color, isFav) {
    const star = isFav ? '<span class="fav-star">★</span>' : '';
    return L.divIcon({
      className: 'fd-marker',
      html: `<div class="marker-pin" style="background:${color}">${star}</div>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -32]
    });
  }

  function buildPopupHtml(listing) {
    const price = listing.price != null ? `$${Number(listing.price).toFixed(2)} / ${escapeHtml(listing.units || '')}` : 'Price on request';
    const color = getCategoryColor(listing.category);
    const sellerName = (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
      ? global.FD_SELLERS.getDisplayName(listing.sellerid)
      : (listing.sellerid || '');
    const vis = listing.visibility || '';
    const visLabel = visibilityLabel(vis);
    return `
      <div class="map-popup">
        <strong>${escapeHtml(listing.headerdescription || 'Listing')}</strong><br>
        <span class="muted" style="color:${color}">${escapeHtml(listing.category || '')}</span>
        <span class="visibility-badge vis-${escapeHtml(vis)}" style="margin-left:0.35rem;font-size:0.7rem">${escapeHtml(visLabel)}</span><br>
        ${price}<br>
        <span class="muted small">${escapeHtml(sellerName)}</span><br>
        <button type="button" class="small-btn popup-open" data-id="${escapeHtml(listing.id)}">View details</button>
      </div>`;
  }

  function initMap() {
    const center = (global.FD_CONFIG && global.FD_CONFIG.MAP_CENTER) || [39.7392, -104.9903];
    const zoom = (global.FD_CONFIG && global.FD_CONFIG.MAP_ZOOM) || 11;

    map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Scale
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Clusters
    clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-icon"><span>${count}</span></div>`,
          className: 'fd-cluster',
          iconSize: L.point(40, 40)
        });
      }
    });
    map.addLayer(clusterGroup);

    // Legend
    legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = '<strong>Categories</strong><div id="legend-items"></div>';
      return div;
    };
    legend.addTo(map);
    updateLegend();

    // Hash view restore (simple #z/lat/lng)
    const hash = location.hash || '';
    const vm = hash.match(/#(?:.*&)?z=(\d+)&lat=([\d.-]+)&lng=([\d.-]+)/);
    if (vm) {
      map.setView([parseFloat(vm[2]), parseFloat(vm[3])], parseInt(vm[1], 10));
    }

    // Moveend for only-in-view
    map.on('moveend', () => {
      if (global.FD_LIST && typeof global.FD_LIST.onMapMove === 'function') {
        global.FD_LIST.onMapMove();
      }
    });

    // Click on popup open
    map.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('.popup-open');
      if (btn) {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
            global.FD_LIST.select(id);
          }
        });
      }
    });

    return map;
  }

  function updateLegend(activeCat) {
    const box = document.getElementById('legend-items');
    if (!box) return;
    const cats = Object.keys(CATEGORY_COLORS).filter(k => k !== 'default');
    box.innerHTML = cats.map(c => {
      const active = activeCat && activeCat.toLowerCase() === c ? ' active' : '';
      return `<div class="legend-item${active}"><span class="swatch" style="background:${CATEGORY_COLORS[c]}"></span>${c}</div>`;
    }).join('');
  }

  function updateLegendActive(cat) {
    updateLegend(cat);
  }

  function updateMarkers(listings) {
    if (!clusterGroup) return;
    clusterGroup.clearLayers();
    markersById.clear();

    const favs = (global.FD_LIST && typeof global.FD_LIST.getFavorites === 'function')
      ? global.FD_LIST.getFavorites() : new Set();

    (listings || []).forEach(l => {
      if (!l.location || l.location.lat == null || l.location.long == null) return;
      const isFav = favs.has ? favs.has(l.id) : false;
      const icon = makeIcon(getCategoryColor(l.category), isFav);
      const m = L.marker([l.location.lat, l.location.long], { icon, title: l.headerdescription || '' });
      m.bindPopup(buildPopupHtml(l));
      m.on('mouseover', () => {
        if (global.FD_LIST && typeof global.FD_LIST.highlightListItem === 'function') {
          global.FD_LIST.highlightListItem(l.id);
        }
      });
      m.on('mouseout', () => {
        if (global.FD_LIST && typeof global.FD_LIST.highlightListItem === 'function') {
          global.FD_LIST.highlightListItem(null);
        }
      });
      clusterGroup.addLayer(m);
      markersById.set(l.id, m);
    });
  }

  function highlightMarker(id) {
    // Optional visual emphasis; clusters handle most of it
    markersById.forEach((m, mid) => {
      const el = m.getElement && m.getElement();
      if (el) el.classList.toggle('highlighted', mid === id);
    });
  }

  function flyTo(id) {
    const m = markersById.get(id);
    if (m && map) {
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
      setTimeout(() => m.openPopup(), 400);
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      if (global.FD_TOAST) global.FD_TOAST.show('Geolocation not available', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        userLocation = latlng;
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker(latlng, {
          radius: 8,
          color: '#1d4ed8',
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          weight: 2
        }).addTo(map).bindPopup('You are here');
        map.flyTo(latlng, 12);
        if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
          global.FD_LIST.setUserLocation(latlng);
        }
        const clearBtn = document.getElementById('clear-location-btn');
        if (clearBtn) clearBtn.hidden = false;
        if (global.FD_TOAST) global.FD_TOAST.show('Location set', 'success');
      },
      () => {
        if (global.FD_TOAST) global.FD_TOAST.show('Could not get location', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function clearLocation() {
    userLocation = null;
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    clearRadiusOverlay();
    if (global.FD_LIST && typeof global.FD_LIST.setUserLocation === 'function') {
      global.FD_LIST.setUserLocation(null);
    }
    const clearBtn = document.getElementById('clear-location-btn');
    if (clearBtn) clearBtn.hidden = true;
    if (global.FD_TOAST) global.FD_TOAST.show('Location cleared', 'info');
  }

  function setRadiusOverlay(latlng, km) {
    clearRadiusOverlay();
    if (!map || !latlng || !km) return;
    radiusCircle = L.circle(latlng, {
      radius: km * 1000,
      color: '#40916c',
      fillColor: '#40916c',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4 4'
    }).addTo(map);
  }

  function clearRadiusOverlay() {
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }
  }

  function fitAll() {
    if (!clusterGroup || !map) return;
    const bounds = clusterGroup.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }

  function getMapViewLink() {
    if (!map) return location.href;
    const c = map.getCenter();
    const z = map.getZoom();
    const base = location.origin + location.pathname;
    return `${base}#z=${z}&lat=${c.lat.toFixed(5)}&lng=${c.lng.toFixed(5)}`;
  }

  function getMap() { return map; }
  function getUserLocation() { return userLocation; }

  global.FD_MAP = {
    initMap,
    updateMarkers,
    updateLegendActive,
    highlightMarker,
    flyTo,
    locateMe,
    clearLocation,
    setRadiusOverlay,
    clearRadiusOverlay,
    fitAll,
    getMapViewLink,
    getMap,
    getUserLocation,
    getCategoryColor
  };
})(window);
