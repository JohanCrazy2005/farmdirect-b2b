/** 
 * FarmDirect B2B – data layer with seed fallback + interactive demo mode
 * Tries live Worker API; falls back to seed-listings.json when offline or undeployed.
 * In demo/seed mode, mutations persist to localStorage so create/edit/delete work fully
 * until the Worker is deployed and API_BASE is set.
 * Mutations attach Authorization: Bearer token when logged in (preferred), else interim X-Seller-Id.
 * + demo data export/import (download/upload JSON of localStorage listings; seed/demo friendly)
 * + publication workflow: status (draft|published|archived), fetchMyListings, publish/unpublish/archive
 * + RFQ persistence: createRfq / fetchMyRfqs prefer live API when available, fall back to localStorage
 */
(function (global) {
  'use strict';

  const cfg = global.FD_CONFIG || {};
  const DEMO_KEY = 'fd-demo-listings';
  const RFQ_KEY = 'fd-rfqs';

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = (global.FD_AUTH && typeof global.FD_AUTH.getToken === 'function')
      ? global.FD_AUTH.getToken()
      : '';
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }
    // Interim fallback for pre-auth Worker
    const seller = (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.getCurrentSeller === 'function')
      ? global.FD_DASHBOARD.getCurrentSeller()
      : '';
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

  function ensureStatus(listing) {
    if (!listing.status || !['draft', 'published', 'archived'].includes(listing.status)) {
      listing.status = 'published';
    }
    return listing;
  }

  async function fetchSeedListings() {
    const res = await fetch(cfg.SEED_URL || 'data/seed-listings.json');
    if (!res.ok) throw new Error('Seed fetch failed');
    const listings = await res.json();
    return Array.isArray(listings) ? listings.map(ensureStatus) : [];
  }

  async function getDemoOrSeedListings() {
    const demo = loadDemoListings();
    if (demo) {
      return { listings: demo.map(ensureStatus), source: 'demo' };
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
    // Demo / seed fallback – public view shows only published
    try {
      const { listings, source } = await getDemoOrSeedListings();
      const published = listings.filter(l => (l.status || 'published') === 'published');
      return {
        listings: published,
        source,
        count: published.length,
      };
    } catch (err) {
      console.error('Seed/demo fallback failed:', err);
      return { listings: [], source: 'none', count: 0, error: err.message };
    }
  }

  async function fetchMyListings() {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/listings/mine`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          return { listings: data.listings || [], source: 'api' };
        }
      } catch (err) {
        console.warn('My listings API unavailable, using demo:', err.message);
      }
    }
    // Demo fallback: all statuses for current seller
    const seller = (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.getCurrentSeller === 'function')
      ? global.FD_DASHBOARD.getCurrentSeller()
      : '';
    const { listings } = await getDemoOrSeedListings();
    const mine = seller ? listings.filter(l => l.sellerid === seller) : [];
    return { listings: mine, source: 'demo' };
  }

  async function fetchListing(id) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/listings/${encodeURIComponent(id)}`);
        if (res.ok) return { listing: await res.json(), source: 'api' };
      } catch (_) {}
    }
    const { listings } = await getDemoOrSeedListings();
    const listing = listings.find(l => l.id === id);
    return listing ? { listing, source: 'demo' } : { listing: null, source: 'none' };
  }

  async function createListing(listing) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (!apiBase) {
      // Interactive demo mode – default draft so publish is explicit
      const { listings } = await getDemoOrSeedListings();
      const newListing = ensureStatus({
        ...listing,
        id: listing.id || generateId(),
        status: listing.status || 'draft',
      });
      const updated = [...listings, newListing];
      saveDemoListings(updated);
      return {
        ok: true,
        listing: newListing,
        message: 'Listing created as draft (demo mode – saved locally)',
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
      const updatedListing = ensureStatus({ ...listings[idx], ...listing, id });
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

  async function setListingStatus(id, action) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    const statusMap = { publish: 'published', unpublish: 'draft', archive: 'archived' };
    const newStatus = statusMap[action];
    if (!newStatus) return { ok: false, error: 'Invalid action' };

    if (!apiBase) {
      const { listings } = await getDemoOrSeedListings();
      const idx = listings.findIndex(l => l.id === id);
      if (idx === -1) return { ok: false, error: 'Listing not found in demo data' };
      const updated = listings.slice();
      updated[idx] = { ...updated[idx], status: newStatus, published_at: newStatus === 'published' ? (updated[idx].published_at || new Date().toISOString()) : updated[idx].published_at };
      saveDemoListings(updated);
      return { ok: true, listing: updated[idx], message: `${action} (demo mode)` };
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/listings/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, listing: data.listing || data, message: data.message || action };
      }
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  async function publishListing(id) { return setListingStatus(id, 'publish'); }
  async function unpublishListing(id) { return setListingStatus(id, 'unpublish'); }
  async function archiveListing(id) { return setListingStatus(id, 'archive'); }

  // ---- RFQ (P6) ----
  function loadLocalRfqs() {
    try {
      const raw = localStorage.getItem(RFQ_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveLocalRfqs(list) {
    try {
      localStorage.setItem(RFQ_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  async function createRfq(inquiry) {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/rfqs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: inquiry.listingId,
            name: inquiry.name,
            email: inquiry.email,
            quantity: inquiry.quantity,
            message: inquiry.message,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          return { ok: true, id: data.id, source: 'api', message: 'Quote request sent' };
        }
        // fall through to local on error
        console.warn('RFQ API failed, saving locally:', data.error || res.status);
      } catch (err) {
        console.warn('RFQ API unreachable, saving locally:', err.message);
      }
    }
    // Local fallback
    const local = {
      id: 'rfq-' + Date.now().toString(36),
      listingId: inquiry.listingId,
      name: inquiry.name,
      email: inquiry.email,
      quantity: inquiry.quantity,
      message: inquiry.message,
      created: new Date().toISOString(),
    };
    const list = loadLocalRfqs();
    list.push(local);
    saveLocalRfqs(list);
    return { ok: true, id: local.id, source: 'local', message: 'Quote request saved locally (demo)' };
  }

  async function fetchMyRfqs() {
    const apiBase = (cfg.API_BASE || '').replace(/\/$/, '');
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/v1/rfqs/mine`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          return { rfqs: data.rfqs || [], source: 'api' };
        }
      } catch (err) {
        console.warn('RFQ mine API unavailable:', err.message);
      }
    }
    return { rfqs: loadLocalRfqs(), source: 'local' };
  }

  function resetDemoListings() {
    try {
      localStorage.removeItem(DEMO_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function exportDemoData() {
    try {
      const { listings } = await getDemoOrSeedListings();
      const json = JSON.stringify(listings, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmdirect-demo-listings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true, count: listings.length };
    } catch (err) {
      return { ok: false, error: err.message || 'Export failed' };
    }
  }

  function importDemoData(listings) {
    if (!Array.isArray(listings) || listings.length === 0) {
      return { ok: false, error: 'Invalid data: expected non-empty array of listings' };
    }
    const required = ['location', 'visibility', 'address', 'sellerid', 'category', 'headerdescription', 'price', 'units'];
    for (const l of listings) {
      if (!l || typeof l !== 'object') return { ok: false, error: 'Invalid listing object' };
      for (const f of required) {
        if (l[f] == null) return { ok: false, error: `Missing required field: ${f}` };
      }
      if (l.location.lat == null || l.location.long == null) return { ok: false, error: 'Invalid location (lat/long required)' };
    }
    const withIds = listings.map(l => ensureStatus({ ...l, id: l.id || generateId() }));
    saveDemoListings(withIds);
    return { ok: true, count: withIds.length };
  }

  global.FD_API = {
    fetchListings,
    fetchMyListings,
    fetchListing,
    createListing,
    updateListing,
    deleteListing,
    publishListing,
    unpublishListing,
    archiveListing,
    createRfq,
    fetchMyRfqs,
    resetDemoListings,
    exportDemoData,
    importDemoData,
  };
})(window);
