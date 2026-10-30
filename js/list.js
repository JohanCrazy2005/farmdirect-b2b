/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * individual removable filter chips, category color swatches,
 * keyboard navigation, filtered JSON export, and deep-link URL params.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 * Empty state is now source-aware with next-step guidance for seed/demo UX.
 * List rows include thumbnails + clickable category badges and seller links for quick filtering.
 * Shows distance from user location (when Locate is used) in each row.
 * List count shows filtered/total when filters are active.
 * Listing thumbnails fall back to category-color placeholder on image load error.
 * List count is clickable when filtered to clear all filters.
 * Radius filter without a user location shows a Locate prompt toast.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let listings = [];
  let filtered = [];
  let highlightedId = null;

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\"/g, '"');
  }

  // ... rest of the file would be here, but truncated for this example; in real call full content is used
})(window);
