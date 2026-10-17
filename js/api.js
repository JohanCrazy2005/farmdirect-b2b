/**
 * FarmDirect B2B – data layer with seed fallback
 * Tries live Worker API; falls back to seed-listings.json when offline or undeployed.
 */
(function (global) {
  'use strict';

  const cfg = global.FD_CONFIG || {};

  async function fetchListings() {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/listings`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          return {
            listings: data.listings || [],
            source: 'api',
            count: data.count || 0,
          };
        }
      } catch (err) {
        console.warn('API unavailable, falling back to seed:', err.message);
      }
    }
    // Seed fallback
    try {
      const res = await fetch(cfg.SEED_URL || 'data/seed-listings.json');
      if (!res.ok) throw new Error('Seed fetch failed');
      const listings = await res.json();
      return {
        listings: Array.isArray(listings) ? listings : [],
        source: 'seed',
        count: listings.length,
      };
    } catch (err) {
      console.error('Seed fallback failed:', err);
      return { listings: [], source: 'none', count: 0, error: err.message };
    }
  }

  async function fetchListing(id) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/listings/${encodeURIComponent(id)}`);
        if (res.ok) return { listing: await res.json(), source: 'api' };
      } catch (_) {}
    }
    // Fallback: search in already-loaded or re-fetch seed
    const { listings } = await fetchListings();
    const listing = listings.find(l => l.id === id);
    return listing ? { listing, source: 'seed' } : { listing: null, source: 'none' };
  }

  global.FD_API = { fetchListings, fetchListing };
})(window);
