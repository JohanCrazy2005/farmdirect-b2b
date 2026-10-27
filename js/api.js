/**
 * FarmDirect B2B – client API + seed/demo fallback
 * Tries the live Worker first; falls back to data/seed-listings.json.
 * Demo mode: localStorage overrides persist local edits until the Worker is live.
 * Health check distinguishes “API reachable but empty” from “API offline”.
 * When API is reachable but returns no published listings, seed data is still shown
 * so the map-first UI stays usable while the precise status is reported.
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
   * Probe the Worker health endpoint.
   * @returns {Promise<{ok: boolean, status?: string, features?: string[], error?: string}>}
   */
  async function checkHealth() {
    const apiBase = getApiBase();
    if (!apiBase) return { ok: false, error: 'No API base configured' };
    try {
      const data = await fetchJson(`${apiBase}/api/v1/health`);
      return {
        ok: true,
        status: data.status || 'ok',
        features: data.features || [],
        database: data.database,
      };
    } catch (err) {
      return { ok: false, error: err.message || 'Health check failed' };
    }
  }

  /**
   * Fetch listings from live API or fall back to seed/demo.
   * On API-empty (reachable but no published listings) still returns seed data
   * so the map remains populated, with source 'api-empty'.
   * @returns {Promise<{listings: any[], source: 'api'|'api-empty'|'seed'|'demo', count: number, health?: object, error?: string}>}
   */
  async function fetchListings() {
    const apiBase = getApiBase();
    let health = null;
    if (apiBase) {
      health = await checkHealth();
      try {
        const data = await fetchJson(`${apiBase}/api/v1/listings`);
        const listings = Array.isArray(data.listings) ? data.listings : (Array.isArray(data) ? data : []);
        if (listings.length || data.source === 'd1') {
          clearDemoListings();
          return {
            listings,
            source: 'api',
            count: listings.length,
            health,
          };
        }
        // API reachable but no published listings yet – still show seed so UI is usable
        const seed = await loadSeedListings();
        return {
          listings: seed,
          source: 'api-empty',
          count: seed.length,
          health,
        };
      } catch (err) {
        console.info('Live API listings unavailable, using seed/demo fallback', err.message || err);
      }
    }

    // Fallback path
    const demo = loadDemoListings();
    if (demo && demo.length) {
      return {
        listings: demo,
        source: 'demo',
        count: demo.length,
        health,
      };
    }

    const seed = await loadSeedListings();
    return {
      listings: seed,
      source: 'seed',
      count: seed.length,
      health,
    };
  }

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

  function resetDemoListings() {
    clearDemoListings();
  }

  function getLastSource() {
    try { return localStorage.getItem(SOURCE_KEY) || null; } catch (_) { return null; }
  }

  global.FD_API = {
    fetchListings,
    checkHealth,
    exportDemoData,
    resetDemoListings,
    getLastSource,
    loadSeedListings,
    saveDemoListings,
  };
})(window);
