/**
 * FarmDirect B2B – CSV export of current filtered listings
 * Downloads a properly escaped CSV of the listings currently shown in the sidebar.
 * Complements the existing JSON export. Fully client-side; works in pure seed/demo mode.
 * Improves data portability while the Worker is undeployed.
 */
(function (global) {
  'use strict';

  function escapeCsv(value) {
    if (value == null) return '';
    const s = String(value);
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function listingToRow(l) {
    const lat = l.location && l.location.lat != null ? l.location.lat : '';
    const lng = l.location && l.location.long != null ? l.location.long : '';
    return [
      l.id || '',
      l.sellerid || '',
      l.category || '',
      l.headerdescription || '',
      l.price != null ? l.price : '',
      l.units || '',
      l.visibility || '',
      l.address || '',
      lat,
      lng,
      l.description || '',
      l.image || ''
    ].map(escapeCsv).join(',');
  }

  function exportFilteredCsv() {
    try {
      if (!global.FD_LIST || typeof global.FD_LIST.getListings !== 'function') {
        if (global.FD_TOAST) global.FD_TOAST.show('Listings not ready', 'error');
        return;
      }
      // Prefer the currently filtered set if available
      let listings = [];
      if (typeof global.FD_LIST.getFiltered === 'function') {
        listings = global.FD_LIST.getFiltered() || [];
      } else {
        // Fallback: re-apply is not exposed; use all for safety
        listings = global.FD_LIST.getListings() || [];
      }
      if (!listings.length) {
        if (global.FD_TOAST) global.FD_TOAST.show('No listings to export', 'info');
        return;
      }

      const header = [
        'id', 'sellerid', 'category', 'headerdescription', 'price', 'units',
        'visibility', 'address', 'lat', 'long', 'description', 'image'
      ].join(',');

      const rows = listings.map(listingToRow);
      const csv = [header, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmdirect-filtered-listings.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${listings.length} listings as CSV`, 'success');
    } catch (err) {
      if (global.FD_TOAST) global.FD_TOAST.show('CSV export failed: ' + (err.message || err), 'error');
    }
  }

  function bind() {
    const btn = document.getElementById('export-csv-btn');
    if (btn) {
      btn.addEventListener('click', exportFilteredCsv);
    }
  }

  global.FD_CSV = { bind, exportFilteredCsv };
})(window);
