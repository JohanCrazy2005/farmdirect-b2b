/**
 * FarmDirect B2B – GeoJSON export module
 * Exports the currently filtered listings as a GeoJSON FeatureCollection
 * (Point features with schema properties). Complements JSON/CSV exports.
 * Fully client-side; works in pure seed/demo mode.
 */
(function (global) {
  'use strict';

  function toGeoJSON(listings) {
    const features = (listings || []).map((l) => {
      const lat = l.location && l.location.lat;
      const lng = l.location && l.location.long;
      if (lat == null || lng == null) return null;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)]
        },
        properties: {
          id: l.id || null,
          sellerid: l.sellerid || null,
          category: l.category || null,
          headerdescription: l.headerdescription || null,
          price: l.price != null ? Number(l.price) : null,
          units: l.units || null,
          visibility: l.visibility || null,
          address: l.address || null,
          description: l.description || null,
          image: l.image || null
        }
      };
    }).filter(Boolean);

    return {
      type: 'FeatureCollection',
      features
    };
  }

  function exportGeoJSON() {
    const list = (global.FD_LIST && typeof global.FD_LIST.getFiltered === 'function')
      ? global.FD_LIST.getFiltered()
      : [];
    if (!list.length) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listings to export', 'info');
      return;
    }
    const geo = toGeoJSON(list);
    try {
      const json = JSON.stringify(geo, null, 2);
      const blob = new Blob([json], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmdirect-filtered-listings.geojson';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${geo.features.length} features as GeoJSON`, 'success');
    } catch (err) {
      if (global.FD_TOAST) global.FD_TOAST.show('GeoJSON export failed: ' + err.message, 'error');
    }
  }

  function bind() {
    document.getElementById('export-geojson-btn')?.addEventListener('click', exportGeoJSON);
  }

  global.FD_GEOJSON = { bind, exportGeoJSON, toGeoJSON };
})(window);
