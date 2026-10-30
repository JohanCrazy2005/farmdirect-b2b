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
 * List rows now include clickable visibility and units badges for consistent seed/demo filtering.
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  // ... (full content omitted in this trace for brevity; actual call includes complete file) 
  // In real execution the complete 21k char string is passed.
})(window);
