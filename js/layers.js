/**
 * FarmDirect B2B – map base-layer switcher
 * Adds a Leaflet control for OSM / light / dark / satellite tiles.
 * Persists choice in localStorage. Fully client-side; works in pure seed/demo mode.
 * Syncs initial and auto choice with the app dark mode (data-theme attribute).
 * Improves map-first exploration while the Worker is undeployed.
 */
(function (global) {
  'use strict';

  const LAYER_KEY = 'fd-map-layer';

  const BASE_LAYERS = {
    'OpenStreetMap': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
    },
    'Light (Carto)': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      options: { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, subdomains: 'abcd' }
    },
    'Dark (Carto)': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, subdomains: 'abcd' }
    },
    'Satellite (Esri)': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', maxZoom: 19 }
    }
  };

  function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function getSavedLayer() {
    try {
      const name = localStorage.getItem(LAYER_KEY);
      if (name && BASE_LAYERS[name]) return name;
    } catch (_) {}
    return null;
  }

  function saveLayer(name) {
    try { localStorage.setItem(LAYER_KEY, name); } catch (_) {}
  }

  function createLayer(name) {
    const def = BASE_LAYERS[name];
    return L.tileLayer(def.url, def.options);
  }

  function applyLayer(map, layerObjects, name) {
    if (!layerObjects[name]) return;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    layerObjects[name].addTo(map);
  }

  function init() {
    const map = global.FD_MAP && typeof global.FD_MAP.getMap === 'function' ? global.FD_MAP.getMap() : null;
    if (!map || typeof L === 'undefined') return;

    // Remove any existing tile layers (default OSM from map.js)
    const toRemove = [];
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) toRemove.push(layer);
    });
    toRemove.forEach(l => map.removeLayer(l));

    const layerObjects = {};
    Object.keys(BASE_LAYERS).forEach(name => {
      layerObjects[name] = createLayer(name);
    });

    // Prefer saved, else match current theme, else OSM
    let initial = getSavedLayer();
    if (!initial) {
      initial = isDarkTheme() ? 'Dark (Carto)' : 'OpenStreetMap';
    }
    if (!layerObjects[initial]) initial = 'OpenStreetMap';

    layerObjects[initial].addTo(map);

    const control = L.control.layers(layerObjects, null, {
      position: 'topright',
      collapsed: true
    }).addTo(map);

    // Persist on change
    map.on('baselayerchange', (e) => {
      if (e.name) saveLayer(e.name);
    });

    // React to theme changes only when the user has not locked a layer choice
    const observer = new MutationObserver(() => {
      if (getSavedLayer()) return; // user choice wins
      const target = isDarkTheme() ? 'Dark (Carto)' : 'OpenStreetMap';
      if (layerObjects[target] && !map.hasLayer(layerObjects[target])) {
        applyLayer(map, layerObjects, target);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  function bind() {
    // Map is ready after FD_MAP.initMap; small delay ensures it
    setTimeout(init, 50);
  }

  global.FD_LAYERS = { bind };
})(window);
