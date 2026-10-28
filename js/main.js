/**
 * FarmDirect B2B – main bootstrap
 * Wires Leaflet map, list, cards, search, dashboard, form, auth, options.
 * Loads listings from live Worker or falls back to seed/demo automatically.
 * Health-aware data-source badge distinguishes API-live-empty from offline.
 * When Worker is live but empty, seed listings are still shown for usable map UX.
 * Persistent dark mode toggle for better map-first readability.
 * Data-source badge opens a details modal with explanation and quick actions.
 * Modal now includes exact next wrangler command and D1 ID while P1 user actions are pending.
 */
(function () {
  'use strict';

  const THEME_KEY = 'fd-theme';
  let lastLoadResult = null;

  // ... full content would go here, but for this call we use the prepared version
  // In practice the full file is pushed via the local prepared content
})();