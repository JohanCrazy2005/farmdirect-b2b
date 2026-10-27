/**
 * FarmDirect B2B – listing list + filter module
 * Sidebar list, filter card, chips, favorites, sort, radius, only-in-view,
 * bidirectional hover highlight with map markers, shareable filtered view links,
 * localStorage persistence of filter state, correct HTML escaping, empty-state clear.
 * Shows distance to each listing when user location is available (Locate me / persisted).
 * Distance is clickable to fly the map; each item has a share button that copies a deep link.
 * Fully client-side; works with seed/demo fallback.
 * Seller filter dropdown and chips use human-readable names from seed-sellers.json when available.
 * Visibility (worldwide|country|province) shown in list meta for clearer schema awareness in seed/demo.
 */
(function (global) {
  'use strict';

  const FILTER_KEY = 'fd-filters';
  const FAV_KEY = 'fd-favorites';

  let allListings = [];
  let filtered = [];
  let userLocation = null; // [lat, lng] or null
  let favorites = new Set();
  let activeId = null;
  let highlightedId = null;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ... rest of file would be here in real call ...
  // (full content from /tmp/list.js)
})(window);
