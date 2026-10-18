/**
 * FarmDirect B2B – data layer with seed fallback + interactive demo mode
 * Tries live Worker API; falls back to seed-listings.json when offline or undeployed.
 * In demo/seed mode, mutations persist to localStorage so create/edit/delete work fully
 * until the Worker is deployed and API_BASE is set.
 * Mutations attach X-Seller-Id from the current dashboard session (interim RLS) when live.
 */
(function (global) {
  'use strict';

  const cfg = global.FD_CONFIG || {};
  const DEMO_KEY = 'fd-demo-listings';

  function getAuthHeaders() {
    const seller = (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.getCurrentSeller === 'function')
      ? global.FD_DASHBOARD.getCurrentSeller()
      : '';
    const headers = { 'Content-Type': 'application/json' };
    if (seller) headers['X-Seller-Id'] = seller;
    return headers;
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
      localStorage.setItem(DEMO_KEY, JSON.stringify(listings));
    } catch (err) {
      console.warn('Could not persist demo listings:', err);
    }
  }

  function generateId() {
    return 'demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  async function fetchSeedListings() {
    const res = await fetch(cfg.SEED_URL || 'data/seed-listings.json');
    if (!res.ok) throw new Error('Seed fetch failed');
    const listings = await res.json();
    return Array.isArray(listings) ? listings : [];
  }

  async function getDemoOrSeedListings() {
    const demo = loadDemoListings();
    if (demo) {
      return { listings: demo, source: 'demo' };
    }
    const seed = await fetchSeedListings();
    return { listings: seed, source: 'seed' };
  }

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
        console.warn('API unavailable, falling back to seed/demo:', err.message);
      }
    }
    // Demo / seed fallback
    try {
      const { listings, source } = await getDemoOrSeedListings();
      return {
        listings,
        source,
        count: listings.length,
      };
    } catch (err) {
      console.error('Seed/demo fallback failed:', err);
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
    const { listings } = await fetchListings();
    const listing = listings.find(l => l.id === id);
    return listing ? { listing, source: 'demo' } : { listing: null, source: 'none' };
  }

  async function createListing(listing) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (!apiBase) {
      // Interactive demo mode
      const { listings } = await getDemoOrSeedListings();
      const newListing = {
        ...listing,
        id: listing.id || generateId(),
      };
      const updated = [...listings, newListing];
      saveDemoListings(updated);
      return {
        ok: true,
        listing: newListing,
        message: 'Listing created (demo mode – saved locally)',
      };
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/listings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(listing),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, listing: data.listing || data, message: 'Listing created successfully' };
      }
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  async function updateListing(id, listing) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (!apiBase) {
      const { listings } = await getDemoOrSeedListings();
      const idx = listings.findIndex(l => l.id === id);
      if (idx === -1) {
        return { ok: false, error: 'Listing not found in demo data' };
      }
      const updatedListing = { ...listings[idx], ...listing, id };
      const updated = listings.slice();
      updated[idx] = updatedListing;
      saveDemoListings(updated);
      return {
        ok: true,
        listing: updatedListing,
        message: 'Listing updated (demo mode – saved locally)',
      };
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/listings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(listing),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, listing: data.listing || data, message: 'Listing updated successfully' };
      }
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  async function deleteListing(id) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (!apiBase) {
      const { listings } = await getDemoOrSeedListings();
      const updated = listings.filter(l => l.id !== id);
      if (updated.length === listings.length) {
        return { ok: false, error: 'Listing not found in demo data' };
      }
      saveDemoListings(updated);
      return { ok: true, message: 'Listing deleted (demo mode – saved locally)' };
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/listings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, message: 'Listing deleted' };
      }
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  function resetDemoListings() {
    try {
      localStorage.removeItem(DEMO_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  global.FD_API = {
    fetchListings,
    fetchListing,
    createListing,
    updateListing,
    deleteListing,
    resetDemoListings,
  };
})(window);
