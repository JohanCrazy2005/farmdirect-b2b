/**
 * FarmDirect B2B – map base-layer switcher
 * Adds a Leaflet control for OSM / light / dark / satellite tiles.
 * Persists choice in localStorage. Fully client-side; works in pure seed/demo mode.
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

    // Prefer saved, else dark if theme is dark, else OSM
    const isDark = document.documentElement.classList.contains('dark');
    let initial = getSavedLayer();
    if (!initial) {
      initial = isDark ? 'Dark (Carto)' : 'OpenStreetMap';
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

    // Optional: react to theme toggle (if user hasn't locked a choice)
    const observer = new MutationObserver(() => {
      if (getSavedLayer()) return; // user choice wins
      const nowDark = document.documentElement.classList.contains('dark');
      const target = nowDark ? 'Dark (Carto)' : 'OpenStreetMap';
      if (layerObjects[target] && !map.hasLayer(layerObjects[target])) {
        map.eachLayer(l => {
          if (l instanceof L.TileLayer) map.removeLayer(l);
        });
        layerObjects[target].addTo(map);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  function bind() {
    // Map is ready after FD_MAP.initMap; small delay ensures it
    setTimeout(init, 50);
  }

  global.FD_LAYERS = { bind };
})(window);
