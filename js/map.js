/**
 * FarmDirect B2B – Leaflet map module
 * Markers, clustering (optional), popup → product card
 */
(function (global) {
  'use strict';

  let map;
  let markersLayer;
  let listings = [];
  let selectedId = null;

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

    // Marker cluster if library loaded
    if (typeof L.markerClusterGroup === 'function') {
      markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
      });
    } else {
      markersLayer = L.layerGroup();
    }
    map.addLayer(markersLayer);

    return map;
  }

  function clearMarkers() {
    if (markersLayer) markersLayer.clearLayers();
  }

  function renderMarkers(newListings) {
    listings = newListings || [];
    clearMarkers();

    listings.forEach(listing => {
      const lat = listing.location?.lat;
      const lng = listing.location?.long;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng], {
        title: listing.headerdescription,
      });

      marker.on('click', () => {
        selectListing(listing.id);
        if (global.FD_CARDS && global.FD_CARDS.showProduct) {
          global.FD_CARDS.showProduct(listing);
        }
      });

      // Simple popup
      marker.bindPopup(`
        <strong>${escapeHtml(listing.headerdescription)}</strong><br>
        <span>${escapeHtml(listing.category)} · $${listing.price} / ${escapeHtml(listing.units)}</span>
      `);

      markersLayer.addLayer(marker);
      listing._marker = marker;
    });

    if (listings.length && map) {
      try {
        const bounds = markersLayer.getBounds?.() || L.latLngBounds(listings.map(l => [l.location.lat, l.location.long]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (_) {}
    }
  }

  function selectListing(id) {
    selectedId = id;
    listings.forEach(l => {
      if (l._marker) {
        // Could style selected marker later
      }
    });
    if (global.FD_LIST && global.FD_LIST.highlight) {
      global.FD_LIST.highlight(id);
    }
  }

  function flyTo(listing) {
    if (!map || !listing?.location) return;
    map.flyTo([listing.location.lat, listing.location.long], 14, { duration: 0.6 });
    if (listing._marker) listing._marker.openPopup();
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.FD_MAP = { initMap, renderMarkers, selectListing, flyTo, getMap: () => map };
})(window);
