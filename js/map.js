/**
 * FarmDirect B2B – Leaflet map module
 * Initializes the map, renders markers for listings, supports fly-to and user location.
 * Works fully with seed/demo fallback. Clustering via simple DivIcon groups is optional;
 * markers use category-colored pins. Exposes getMap / flyToListing / getUserLocation / setListings.
 */
(function (global) {
  'use strict';

  let map = null;
  let markersLayer = null;
  let userMarker = null;
  let userLocation = null;
  let currentListings = [];

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

  function getConfig() {
    return global.FD_CONFIG || { MAP_CENTER: [39.7392, -104.9903], MAP_ZOOM: 11 };
  }

  function colorFor(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
  }

  function initMap() {
    if (map) return map;
    const cfg = getConfig();
    const center = cfg.MAP_CENTER || [39.7392, -104.9903];
    const zoom = cfg.MAP_ZOOM || 11;
    map = L.map('map', { zoomControl: true }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    return map;
  }

  function makeIcon(listing) {
    const color = colorFor(listing.category);
    const html = `<div class="marker-pin" style="background:${color}"><span class="fav-star" style="opacity:${isFavorite(listing.id) ? 1 : 0}">★</span></div>`;
    return L.divIcon({
      className: 'fd-marker',
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });
  }

  function isFavorite(id) {
    return global.FD_LIST && typeof global.FD_LIST.isFavorite === 'function'
      ? global.FD_LIST.isFavorite(id)
      : false;
  }

  function popupHtml(listing) {
    const seller = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(listing.sellerid)
      : (listing.sellerid || '');
    const price = listing.price != null ? `$${Number(listing.price).toFixed(2)} / ${listing.units || ''}` : '';
    return `<div class="map-popup">
      <strong>${escapeHtml(listing.headerdescription || 'Listing')}</strong>
      <div class="muted small">${escapeHtml(listing.category || '')} · ${escapeHtml(seller)}</div>
      <div>${escapeHtml(price)}</div>
      <button type="button" class="link-btn popup-open" data-id="${escapeHtml(listing.id)}">Open details</button>
    </div>`;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setListings(listings) {
    currentListings = Array.isArray(listings) ? listings : [];
    if (!markersLayer) return;
    markersLayer.clearLayers();
    const bounds = [];
    currentListings.forEach(l => {
      const loc = l.location || {};
      const lat = Number(loc.lat);
      const lng = Number(loc.long);
      if (isNaN(lat) || isNaN(lng)) return;
      const marker = L.marker([lat, lng], { icon: makeIcon(l) });
      marker.bindPopup(popupHtml(l));
      marker.on('popupopen', () => {
        const btn = document.querySelector('.popup-open[data-id="' + CSS.escape(String(l.id)) + '"]');
        if (btn) {
          btn.onclick = () => {
            if (global.FD_LIST && typeof global.FD_LIST.select === 'function') global.FD_LIST.select(l.id);
            map.closePopup();
          };
        }
      });
      marker.on('click', () => {
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') global.FD_LIST.select(l.id);
      });
      marker.addTo(markersLayer);
      bounds.push([lat, lng]);
    });
    if (bounds.length && map) {
      // Do not force fit on every update; only on first load if no user pan
      if (!map._fdFitted) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        map._fdFitted = true;
      }
    }
  }

  function flyToListing(listing) {
    if (!map || !listing || !listing.location) return;
    const lat = Number(listing.location.lat);
    const lng = Number(listing.location.long);
    if (isNaN(lat) || isNaN(lng)) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // Open popup of matching marker if possible
    markersLayer.eachLayer(m => {
      const ll = m.getLatLng();
      if (Math.abs(ll.lat - lat) < 0.0001 && Math.abs(ll.lng - lng) < 0.0001) {
        m.openPopup();
      }
    });
  }

  function locateUser() {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          color: '#1d4ed8',
          fillColor: '#60a5fa',
          fillOpacity: 0.9,
          weight: 2
        }).addTo(map).bindPopup('Your location');
        map.flyTo([userLocation.lat, userLocation.lng], 13);
        if (global.FD_TOAST) global.FD_TOAST.show('Location updated', 'info');
      },
      () => {
        if (global.FD_TOAST) global.FD_TOAST.show('Could not get location', 'error');
      }
    );
  }

  function getMap() { return map; }
  function getUserLocation() { return userLocation; }

  global.FD_MAP = {
    initMap,
    setListings,
    flyToListing,
    locateUser,
    getMap,
    getUserLocation
  };
})(window);
