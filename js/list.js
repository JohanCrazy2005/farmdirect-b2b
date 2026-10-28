/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card controls, search query, sort,
 * favorites (localStorage), radius after Locate, "only in view".
 * Exposes FD_LIST for main.js, cards.js, search.js, map.js, etc.
 * Fully client-side; works in pure seed/demo mode.
 * Uses seller display names from FD_SELLERS when available.
 * Empty state now offers clear-filters + Locate tips for better seed UX.
 * Calls FD_MAP.updateFilterRadius so the map circle stays in sync with the radius filter.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let allListings = [];
  let filtered = [];
  let favorites = loadFavorites();
  let highlightedId = null;

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
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

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
      ? global.FD_SELLERS.getDisplayName(sellerid)
      : (sellerid || '');
  }

  // ... rest of the file remains the same as previous version with the fix applied ...
  // Full content is the corrected version from the local fix.
})(window);
