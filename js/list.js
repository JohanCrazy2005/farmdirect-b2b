/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card controls, search query, sort,
 * favorites (localStorage), radius after Locate, "only in view".
 * Exposes FD_LIST for main.js, cards.js, search.js, map.js, etc.
 * Fully client-side; works in pure seed/demo mode.
 * Uses seller display names from FD_SELLERS when available.
 * Empty state now offers clear-filters + Locate tips for better seed UX.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let allListings = [];
  let filtered = [];
  let favorites = loadFavorites();
  let highlightedId = null;

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    } catch (_) {}
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
      ? global.FD_SELLERS.getDisplayName(sellerid)
      : (sellerid || '');
  }

  function getSearchQuery() {
    return (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  }

  function matchesSearch(listing, q) {
    if (!q) return true;
    const fields = [
      listing.headerdescription,
      listing.description,
      listing.category,
      listing.address,
      listing.units,
      listing.sellerid,
      getDisplayName(listing.sellerid)
    ];
    return fields.some(f => f && String(f).toLowerCase().includes(q));
  }

  function getUserLocation() {
    return global.FD_MAP && typeof global.FD_MAP.getUserLocation === 'function'
      ? global.FD_MAP.getUserLocation()
      : null;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function applyFilters() {
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value);
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value);
    const radius = parseFloat(document.getElementById('filter-radius')?.value);
    const favOnly = document.getElementById('filter-favorites')?.checked || false;
    const inView = document.getElementById('filter-inview')?.checked || false;
    const q = getSearchQuery();
    const userLoc = getUserLocation();

    filtered = allListings.filter(l => {
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      const price = Number(l.price);
      if (!isNaN(minP) && (isNaN(price) || price < minP)) return false;
      if (!isNaN(maxP) && (isNaN(price) || price > maxP)) return false;
      if (favOnly && !favorites.has(l.id)) return false;
      if (!matchesSearch(l, q)) return false;

      if (!isNaN(radius) && radius > 0 && userLoc) {
        const loc = l.location || {};
        const lat = Number(loc.lat);
        const lng = Number(loc.long);
        if (isNaN(lat) || isNaN(lng)) return false;
        const d = haversineKm(userLoc.lat, userLoc.lng, lat, lng);
        if (d > radius) return false;
      }

      if (inView && global.FD_MAP && typeof global.FD_MAP.isInView === 'function') {
        if (!global.FD_MAP.isInView(l)) return false;
      }

      return true;
    });

    sortFiltered();
    renderList();
    renderChips();
    updateFilterBadge();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
  }

  function sortFiltered() {
    const sort = document.getElementById('filter-sort')?.value || '';
    const userLoc = getUserLocation();
    filtered.sort((a, b) => {
      if (sort === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sort === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sort === 'name') {
        return (a.headerdescription || '').localeCompare(b.headerdescription || '');
      }
      if (sort === 'distance' && userLoc) {
        const da = distanceTo(a, userLoc);
        const db = distanceTo(b, userLoc);
        return da - db;
      }
      return 0;
    });
  }

  function distanceTo(listing, userLoc) {
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    return haversineKm(userLoc.lat, userLoc.lng, lat, lng);
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;

    if (countEl) countEl.textContent = String(filtered.length);

    if (!filtered.length) {
      const hasFilters = [
        document.getElementById('filter-category')?.value,
        document.getElementById('filter-visibility')?.value,
        document.getElementById('filter-units')?.value,
        document.getElementById('filter-seller')?.value,
        document.getElementById('filter-minprice')?.value,
        document.getElementById('filter-maxprice')?.value,
        document.getElementById('filter-radius')?.value,
        document.getElementById('filter-favorites')?.checked,
        document.getElementById('filter-inview')?.checked,
        getSearchQuery()
      ].some(Boolean);
      const tip = hasFilters
        ? 'Try clearing filters or widening the radius after using Locate.'
        : 'Seed data is loaded. Use Locate + radius, or open the filter card to explore categories.';
      container.innerHTML = `
        <div style="padding:1rem">
          <p class="muted">No listings match the current filters.</p>
          <p class="muted small">${escapeHtml(tip)}</p>
          ${hasFilters ? '<button type="button" class="small-btn" id="empty-clear-filters">Clear filters</button>' : ''}
          <button type="button" class="small-btn" id="empty-locate" style="margin-left:0.5rem">Locate me</button>
        </div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', () => {
        document.getElementById('clear-filters')?.click();
      });
      document.getElementById('empty-locate')?.addEventListener('click', () => {
        if (global.FD_MAP && typeof global.FD_MAP.locateMe === 'function') {
          global.FD_MAP.locateMe();
        }
      });
      return;
    }

    container.innerHTML = filtered.map(l => {
      const isFav = favorites.has(l.id);
      const seller = escapeHtml(getDisplayName(l.sellerid));
      const price = Number(l.price);
      const priceStr = isNaN(price) ? 'On request' : `$${price.toFixed(2)} / ${escapeHtml(l.units || '')}`;
      let distStr = '';
      const userLoc = getUserLocation();
      if (userLoc) {
        const d = distanceTo(l, userLoc);
        if (isFinite(d)) distStr = ` · ${d.toFixed(1)} km`;
      }
      return `
        <div class="listing-item${highlightedId === l.id ? ' highlighted' : ''}" role="listitem" data-id="${escapeHtml(l.id)}" tabindex="0">
          <div class="listing-thumb">
            ${l.image ? `<img src="${escapeHtml(l.image)}" alt="">` : '<div class="no-image"></div>'}
          </div>
          <div class="listing-body">
            <div class="listing-title">${escapeHtml(l.headerdescription || 'Listing')} ${isFav ? '★' : ''}</div>
            <div class="listing-meta">
              <span class="cat-badge">${escapeHtml(l.category || '')}</span>
              <span class="price-small">${priceStr}${distStr}</span>
            </div>
            <div class="listing-seller muted small seller-link" data-seller="${escapeHtml(l.sellerid)}" title="Filter by this seller">${seller}</div>
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', () => select(el.dataset.id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(el.dataset.id);
        }
      });
    });
    container.querySelectorAll('.seller-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = el.dataset.seller;
        if (sid) {
          setSellerFilter(sid);
          if (global.FD_TOAST) global.FD_TOAST.show('Filtered by seller', 'info');
        }
      });
    });
  }

  function renderChips() {
    const box = document.getElementById('filter-chips');
    if (!box) return;
    const chips = [];
    const cat = document.getElementById('filter-category')?.value;
    if (cat) chips.push({ label: cat, clear: () => setCategoryFilter('') });
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) chips.push({ label: vis, clear: () => setVisibilityFilter('') });
    const units = document.getElementById('filter-units')?.value;
    if (units) chips.push({ label: units, clear: () => setUnitsFilter('') });
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) chips.push({ label: getDisplayName(seller), clear: () => {
      const sel = document.getElementById('filter-seller');
      if (sel) { sel.value = ''; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }});
    const q = getSearchQuery();
    if (q) chips.push({ label: `"${q}"`, clear: () => {
      const input = document.getElementById('search-input');
      if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
    }});
    if (document.getElementById('filter-favorites')?.checked) {
      chips.push({ label: 'Favorites', clear: () => {
        const cb = document.getElementById('filter-favorites');
        if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); }
      }});
    }

    box.innerHTML = chips.map((c, i) =>
      `<button type="button" class="chip" data-i="${i}">${escapeHtml(c.label)} ×</button>`
    ).join('');
    box.querySelectorAll('.chip').forEach((btn, i) => {
      btn.addEventListener('click', () => chips[i].clear());
    });
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const active = [
      document.getElementById('filter-category')?.value,
      document.getElementById('filter-visibility')?.value,
      document.getElementById('filter-units')?.value,
      document.getElementById('filter-seller')?.value,
      document.getElementById('filter-minprice')?.value,
      document.getElementById('filter-maxprice')?.value,
      document.getElementById('filter-radius')?.value,
      document.getElementById('filter-favorites')?.checked,
      document.getElementById('filter-inview')?.checked,
      getSearchQuery()
    ].filter(Boolean).length;
    if (active) {
      badge.textContent = String(active);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function populateFilterOptions() {
    const cats = new Set();
    const unitsSet = new Set();
    const sellers = new Set();
    allListings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) unitsSet.add(l.units);
      if (l.sellerid) sellers.add(l.sellerid);
    });

    const catSel = document.getElementById('filter-category');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' +
        [...cats].sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if ([...cats].includes(cur)) catSel.value = cur;
    }

    const unitsSel = document.getElementById('filter-units');
    if (unitsSel) {
      const cur = unitsSel.value;
      unitsSel.innerHTML = '<option value="">Any</option>' +
        [...unitsSet].sort().map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      if ([...unitsSet].includes(cur)) unitsSel.value = cur;
    }

    const sellerSel = document.getElementById('filter-seller');
    if (sellerSel) {
      const cur = sellerSel.value;
      sellerSel.innerHTML = '<option value="">Any</option>' +
        [...sellers].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getDisplayName(s))}</option>`).join('');
      if ([...sellers].includes(cur)) sellerSel.value = cur;
    }
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    highlightedId = id;
    renderList();
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') {
      global.FD_MAP.flyToListing(listing);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(id);
    }
    // Update hash for deep link
    try {
      history.replaceState(null, '', '#listing=' + encodeURIComponent(id));
    } catch (_) {}
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings.slice() : [];
    populateFilterOptions();
    applyFilters();
  }

  function getListings() {
    return allListings.slice();
  }

  function getFiltered() {
    return filtered.slice();
  }

  function getFavorites() {
    return favorites;
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) {
      global.FD_TOAST.show(favorites.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
    }
  }

  function clearFavorites() {
    favorites.clear();
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function setCategoryFilter(cat) {
    const sel = document.getElementById('filter-category');
    if (sel) {
      sel.value = cat || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) {
      sel.value = vis || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setUnitsFilter(units) {
    const sel = document.getElementById('filter-units');
    if (sel) {
      sel.value = units || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setSellerFilter(sid) {
    const sel = document.getElementById('filter-seller');
    if (sel) {
      sel.value = sid || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function getFilteredViewLink() {
    const params = new URLSearchParams();
    const cat = document.getElementById('filter-category')?.value;
    if (cat) params.set('cat', cat);
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) params.set('vis', vis);
    const q = getSearchQuery();
    if (q) params.set('q', q);
    const base = location.origin + location.pathname;
    return base + (params.toString() ? '?' + params.toString() : '') + location.hash;
  }

  function exportFiltered() {
    const data = filtered.map(l => ({
      id: l.id,
      headerdescription: l.headerdescription,
      category: l.category,
      price: l.price,
      units: l.units,
      sellerid: l.sellerid,
      address: l.address,
      visibility: l.visibility,
      lat: l.location?.lat,
      long: l.location?.long
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered-listings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${data.length} listings`, 'success');
  }

  function bindUI() {
    const ids = [
      'filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
      'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort',
      'filter-favorites', 'filter-inview'
    ];
    ids.forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });

    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      applyFilters();
    });

    document.getElementById('clear-filters')?.addEventListener('click', () => {
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
      const search = document.getElementById('search-input');
      if (search) search.value = '';
      applyFilters();
    });

    // Filter card toggle
    document.getElementById('filter-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = document.getElementById('filter-card');
      if (card) {
        const open = !card.hasAttribute('hidden');
        card.toggleAttribute('hidden', open);
        document.getElementById('filter-btn')?.setAttribute('aria-expanded', String(!open));
      }
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      document.getElementById('filter-card')?.setAttribute('hidden', '');
      document.getElementById('filter-btn')?.setAttribute('aria-expanded', 'false');
    });

    // Keyboard nav for list (arrows)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...document.querySelectorAll('.listing-item')];
        if (!items.length) return;
        e.preventDefault();
        let idx = items.findIndex(el => el.dataset.id === highlightedId);
        if (e.key === 'ArrowDown') idx = Math.min(idx + 1, items.length - 1);
        else idx = Math.max(idx - 1, 0);
        if (idx >= 0) select(items[idx].dataset.id);
      }
    });
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    getListings,
    getFiltered,
    select,
    getFavorites,
    toggleFavorite,
    clearFavorites,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSellerFilter,
    getFilteredViewLink,
    exportFiltered,
    applyFilters
  };
})(window);
