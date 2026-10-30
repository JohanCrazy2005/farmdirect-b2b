/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * filter chips, keyboard navigation, filtered JSON export, and deep-link hash.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 * Applies URL query params (q, cat, vis, seller, units, minprice, maxprice, sort, radius, fav, inview) on load.
 * Category color swatches in the list for visual consistency with the map.
 * Removable individual filter chips under the sidebar header.
 * + Thumbnail images (or color placeholder) on each list row for faster scanning.
 * + Actionable empty state with one-click clear-all-filters.
 * + Clickable category badges (apply category filter) and seller names (open seller card).
 * + Correct HTML escaping in list rows.
 * + Thumbnail load-error fallback to category-colored placeholder (seed images may fail).
 * + List count shows filtered / total when filters are active.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let listings = [];
  let filtered = [];
  let highlightedId = null;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#39;');
  }
  // ... rest of the file would be here, but truncated for this example; in real it is full
  global.FD_LIST = { setListings, getListings, applyFilters, select, setCategoryFilter, setVisibilityFilter, setUnitsFilter, setSellerFilter, getFavorites, toggleFavorite, clearFavorites, clearAllFilters, exportFiltered, getFilteredViewLink };
})(window);
