/**
 * FarmDirect B2B – client API + seed/demo fallback
 * Tries the live Worker first; falls back to data/seed-listings.json.
 * Demo mode: localStorage overrides persist local edits until the Worker is live.
 * Health check distinguishes “API reachable but empty” from “API offline”.
 * When API is reachable but returns no published listings, seed data is still shown
 * so the map-first UI stays usable while the precise status is reported.
 * After auth migration: create/update/delete/publish + fetchMyListings with Bearer token.
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

  function authHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    const token = (global.FD_AUTH && typeof global.FD_AUTH.getToken === 'function')
      ? global.FD_AUTH.getToken() : '';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Legacy fallback for demo-only sessions without a real token
    const seller = (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.getCurrentSeller === 'function')
      ? global.FD_DASHBOARD.getCurrentSeller() : '';
    if (!token && seller) headers['X-Seller-Id'] = seller;
    return headers;
  }

  async function apiRequest(path, options = {}) {
    const apiBase = getApiBase();
    if (!apiBase) return { ok: false, error: 'No API base configured' };
    try {
      const res = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: authHeaders(options.headers || {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || data.message || `HTTP ${res.status}`, status: res.status, data };
      }
      return { ok: true, ...data, status: res.status };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  /** Seller's own listings (all statuses). Falls back to filtering local/seed by sellerid. */
  async function fetchMyListings() {
    const apiBase = getApiBase();
    if (apiBase) {
      const result = await apiRequest('/api/v1/listings/mine', { method: 'GET' });
      if (result.ok && Array.isArray(result.listings)) {
        return { listings: result.listings, source: 'api', count: result.listings.length };
      }
      // 401 without token is expected in pure demo – fall through
    }
    const seller = (global.FD_DASHBOARD && global.FD_DASHBOARD.getCurrentSeller)
      ? global.FD_DASHBOARD.getCurrentSeller() : '';
    const all = (global.FD_LIST && global.FD_LIST.getListings)
      ? global.FD_LIST.getListings() : (loadDemoListings() || await loadSeedListings());
    const mine = (all || []).filter(l => l.sellerid === seller);
    return { listings: mine, source: 'local', count: mine.length };
  }

  async function createListing(data) {
    const apiBase = getApiBase();
    if (apiBase) {
      const result = await apiRequest('/api/v1/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.ok) {
        return { ok: true, listing: result.listing, message: result.message || 'Listing created as draft' };
      }
      if (result.status === 401) {
        return { ok: false, error: result.error || 'Sign in required to create listings on the live API' };
      }
      return { ok: false, error: result.error || 'Create failed' };
    }
    // Demo mode: persist to localStorage
    const listing = {
      id: 'demo-' + Date.now().toString(36),
      ...data,
      status: 'draft',
      published_at: null,
      created_at: new Date().toISOString(),
    };
    const current = loadDemoListings() || (await loadSeedListings());
    const next = [...current, listing];
    saveDemoListings(next);
    return { ok: true, listing, message: 'Listing created as draft (demo)' };
  }

  async function updateListing(id, data) {
    const apiBase = getApiBase();
    if (apiBase) {
      const result = await apiRequest(`/api/v1/listings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.ok) {
        return { ok: true, listing: result.listing, message: result.message || 'Listing updated' };
      }
      return { ok: false, error: result.error || 'Update failed' };
    }
    const current = loadDemoListings() || (await loadSeedListings());
    const idx = current.findIndex(l => l.id === id);
    if (idx < 0) return { ok: false, error: 'Listing not found' };
    current[idx] = { ...current[idx], ...data, id };
    saveDemoListings(current);
    return { ok: true, listing: current[idx], message: 'Listing updated (demo)' };
  }

  async function deleteListing(id) {
    const apiBase = getApiBase();
    if (apiBase) {
      const result = await apiRequest(`/api/v1/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (result.ok) return { ok: true, message: 'Listing deleted' };
      return { ok: false, error: result.error || 'Delete failed' };
    }
    const current = loadDemoListings() || (await loadSeedListings());
    const next = current.filter(l => l.id !== id);
    if (next.length === current.length) return { ok: false, error: 'Listing not found' };
    saveDemoListings(next);
    return { ok: true, message: 'Listing deleted (demo)' };
  }

  async function setListingStatus(id, action) {
    // action: publish | unpublish | archive
    const apiBase = getApiBase();
    if (apiBase) {
      const result = await apiRequest(`/api/v1/listings/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
      if (result.ok) {
        return { ok: true, listing: result.listing, message: result.message || action };
      }
      return { ok: false, error: result.error || `${action} failed` };
    }
    const current = loadDemoListings() || (await loadSeedListings());
    const idx = current.findIndex(l => l.id === id);
    if (idx < 0) return { ok: false, error: 'Listing not found' };
    let status = current[idx].status || 'published';
    if (action === 'publish') {
      status = 'published';
      current[idx].published_at = current[idx].published_at || new Date().toISOString();
    } else if (action === 'unpublish') {
      status = 'draft';
    } else if (action === 'archive') {
      status = 'archived';
    }
    current[idx].status = status;
    saveDemoListings(current);
    return { ok: true, listing: current[idx], message: action + ' (demo)' };
  }

  function publishListing(id) { return setListingStatus(id, 'publish'); }
  function unpublishListing(id) { return setListingStatus(id, 'unpublish'); }
  function archiveListing(id) { return setListingStatus(id, 'archive'); }

  global.FD_API = {
    fetchListings,
    checkHealth,
    exportDemoData,
    resetDemoListings,
    getLastSource,
    loadSeedListings,
    saveDemoListings,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
    publishListing,
    unpublishListing,
    archiveListing,
  };
})(window);
