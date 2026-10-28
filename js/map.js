/**
 * FarmDirect B2B – Leaflet map module
 * Initializes map, MarkerCluster, custom category-colored markers, popups with
 * clickable visibility, category, units, and seller badges (calls FD_LIST.setVisibilityFilter / setCategoryFilter / setUnitsFilter / setSellerFilter), locate/fit,
 * and view-link generation. Fully client-side; works with seed/demo fallback.
 * Exposes user position and bounds so list filters (radius / in-view) work offline.
 * Popups now include clickable address linking to Google Maps and units/seller for better seed/demo exploration.
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
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
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

  // ... rest of the file with flyToListing ...
  function flyToListing(listing) {
    if (!map || !listing) return;
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return;
    const marker = markersById.get(listing.id);
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.5 });
    if (marker) {
      setTimeout(() => { try { marker.openPopup(); } catch (_) {} }, 550);
    }
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
    getUserLocation,
    getBounds,
    isInView,
    flyToListing
  };
})(window);
