/**
 * FarmDirect B2B – client API + seed/demo fallback
 * Tries the live Worker first; falls back to data/seed-listings.json.
 * Demo mode: localStorage overrides persist local edits until the Worker is live.
 * Fully client-side; works offline / undeployed.
 */
(function (global) {
  'use strict';

  const DEMO_KEY = 'fd-demo-listings';
  const SOURCE_KEY = 'fd-data-source';

  function getConfig() {
    return global.FD_CONFIG || { API_BASE: '', SEED_URL: 'data/seed-listings.json' };
  }

  function getApiBase() {
    const base = (getConfig().API_BASE || '').replace(/\/$/, '');
    return base;
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function loadDemoListings() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function saveDemoListings(listings) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(listings || []));
      localStorage.setItem(SOURCE_KEY, 'demo');
    } catch (_) {}
  }

  function clearDemoListings() {
    try {
      localStorage.removeItem(DEMO_KEY);
      localStorage.removeItem(SOURCE_KEY);
    } catch (_) {}
  }

  async function loadSeedListings() {
    const seedUrl = getConfig().SEED_URL || 'data/seed-listings.json';
    try {
      const data = await fetchJson(seedUrl);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Seed load failed', err);
      return [];
    }
  }

  /**
   * Fetch listings from live API or fall back to seed/demo.
   * @returns {Promise<{listings: any[], source: 'api'|'seed'|'demo', count: number, error?: string}>}
   */
  async function fetchListings() {
    const apiBase = getApiBase();
    if (apiBase) {
      try {
        const data = await fetchJson(`${apiBase}/api/v1/listings`);
        const listings = Array.isArray(data.listings) ? data.listings : (Array.isArray(data) ? data : []);
        if (listings.length || data.source === 'd1') {
          // Clear demo override when live data arrives
          clearDemoListings();
          return {
            listings,
            source: 'api',
            count: listings.length,
          };
        }
      } catch (err) {
        console.info('Live API unavailable, using seed/demo fallback', err.message || err);
      }
    }

    // Fallback path
    const demo = loadDemoListings();
    if (demo && demo.length) {
      return {
        listings: demo,
        source: 'demo',
        count: demo.length,
      };
    }

    const seed = await loadSeedListings();
    return {
      listings: seed,
      source: 'seed',
      count: seed.length,
    };
  }

  /**
   * Persist the current in-memory listings as demo data (local only).
   */
  async function exportDemoData() {
    try {
      if (!global.FD_LIST || typeof global.FD_LIST.getListings !== 'function') {
        return { ok: false, error: 'No listings available' };
      }
      const listings = global.FD_LIST.getListings() || [];
      saveDemoListings(listings);
      return { ok: true, count: listings.length };
    } catch (err) {
      return { ok: false, error: err.message || 'Export failed' };
    }
  }

  /**
   * Clear local demo overrides so the next load uses fresh seed (or live API).
   */
  function resetDemoListings() {
    clearDemoListings();
  }

  /**
   * Optional helper for other modules that want to know current source.
   */
  function getLastSource() {
    try { return localStorage.getItem(SOURCE_KEY) || null; } catch (_) { return null; }
  }

  global.FD_API = {
    fetchListings,
    exportDemoData,
    resetDemoListings,
    getLastSource,
    loadSeedListings,
    saveDemoListings,
  };
})(window);
