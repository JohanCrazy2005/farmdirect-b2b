/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card controls, search query, sort,
 * favorites (localStorage), radius after Locate, "only in view".
 * Exposes FD_LIST for main.js, cards.js, search.js, map.js, etc.
 * Fully client-side; works in pure seed/demo mode.
 * Uses seller display names from FD_SELLERS when available.
 * Empty state offers clear-filters + Locate tips for better seed UX. Individual filter chips are removable (×) without clearing all.
 * Calls FD_MAP.updateFilterRadius so the map circle stays in sync with the radius filter.
 * Clickable seller names apply the seller filter. Distance shown after Locate.
 * Compare toggles (⇄) on each item for seed/demo multi-listing comparison.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let allListings = [];
  let filtered = [];
  let favorites = loadFavorites();
  let highlightedId = null;
  let highlightedIndex = -1;

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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function populateFilterOptions() {
    const cats = new Set();
    const units = new Set();
    const sellers = new Map();
    allListings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) sellers.set(l.sellerid, getDisplayName(l.sellerid));
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
        [...units].sort().map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      if ([...units].includes(cur)) unitsSel.value = cur;
    }
    const sellerSel = document.getElementById('filter-seller');
    if (sellerSel) {
      const cur = sellerSel.value;
      const opts = [...sellers.entries()].sort((a, b) => a[1].localeCompare(b[1]));
      sellerSel.innerHTML = '<option value="">Any</option>' +
        opts.map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');
      if (sellers.has(cur)) sellerSel.value = cur;
    }
  }

  function getFilterValues() {
    return {
      category: document.getElementById('filter-category')?.value || '',
      visibility: document.getElementById('filter-visibility')?.value || '',
      units: document.getElementById('filter-units')?.value || '',
      seller: document.getElementById('filter-seller')?.value || '',
      minPrice: parseFloat(document.getElementById('filter-minprice')?.value),
      maxPrice: parseFloat(document.getElementById('filter-maxprice')?.value),
      radius: parseFloat(document.getElementById('filter-radius')?.value),
      sort: document.getElementById('filter-sort')?.value || '',
      favoritesOnly: !!document.getElementById('filter-favorites')?.checked,
      inView: !!document.getElementById('filter-inview')?.checked,
      q: getSearchQuery()
    };
  }

  function applyFilters() {
    const f = getFilterValues();
    const userPos = getUserLocation();
    filtered = allListings.filter(l => {
      if (f.category && l.category !== f.category) return false;
      if (f.visibility && l.visibility !== f.visibility) return false;
      if (f.units && l.units !== f.units) return false;
      if (f.seller && l.sellerid !== f.seller) return false;
      const price = Number(l.price);
      if (!isNaN(f.minPrice) && (isNaN(price) || price < f.minPrice)) return false;
      if (!isNaN(f.maxPrice) && (isNaN(price) || price > f.maxPrice)) return false;
      if (f.favoritesOnly && !favorites.has(l.id)) return false;
      if (!matchesSearch(l, f.q)) return false;
      if (f.inView && global.FD_MAP && typeof global.FD_MAP.isInView === 'function' && !global.FD_MAP.isInView(l)) return false;
      if (!isNaN(f.radius) && f.radius > 0 && userPos) {
        const loc = l.location || {};
        const lat = Number(loc.lat);
        const lng = Number(loc.long);
        if (isNaN(lat) || isNaN(lng)) return false;
        if (haversineKm(userPos.lat, userPos.lng, lat, lng) > f.radius) return false;
      }
      return true;
    });
    if (f.sort === 'price-asc') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (f.sort === 'price-desc') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (f.sort === 'name') filtered.sort((a, b) => String(a.headerdescription || '').localeCompare(String(b.headerdescription || '')));
    else if (f.sort === 'distance' && userPos) {
      filtered.sort((a, b) => {
        const da = distanceFor(a, userPos);
        const db = distanceFor(b, userPos);
        return (da ?? 9999) - (db ?? 9999);
      });
    }
    renderList();
    renderChips(f);
    updateCount();
    updateFilterBadge(f);
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') global.FD_MAP.updateMarkers(filtered);
    if (global.FD_MAP && typeof global.FD_MAP.updateFilterRadius === 'function') global.FD_MAP.updateFilterRadius();
  }

  function distanceFor(listing, userPos) {
    if (!userPos) return null;
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return null;
    return haversineKm(userPos.lat, userPos.lng, lat, lng);
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;
    const userPos = getUserLocation();
    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state"><p>No listings match the current filters.</p><p class="muted small">Try clearing filters, searching differently, or using Locate + radius to focus on nearby farms.</p><div style="display:flex;gap:0.4rem;margin-top:0.5rem;flex-wrap:wrap"><button type="button" class="small-btn" id="empty-clear">Clear filters</button><button type="button" class="small-btn" id="empty-locate">Locate me</button></div></div>`;
      document.getElementById('empty-clear')?.addEventListener('click', clearFilters);
      document.getElementById('empty-locate')?.addEventListener('click', () => { if (global.FD_MAP && typeof global.FD_MAP.locateMe === 'function') global.FD_MAP.locateMe(); });
      return;
    }
    container.innerHTML = filtered.map((l, idx) => {
      const isFav = favorites.has(l.id);
      const sellerName = getDisplayName(l.sellerid);
      const price = l.price != null ? `$${Number(l.price).toFixed(2)}` : '';
      let distHtml = '';
      if (userPos) {
        const d = distanceFor(l, userPos);
        if (d != null) distHtml = ` <span class="distance">~${d.toFixed(1)} km</span>`;
      }
      const selected = highlightedId === l.id ? ' selected' : '';
      return `<div class="listing-item${selected}" data-id="${escapeHtml(l.id)}" data-index="${idx}" role="listitem" tabindex="0"><div class="listing-header"><strong class="listing-title">${escapeHtml(l.headerdescription || 'Listing')}</strong><div style="display:flex;gap:0.25rem"><button type="button" class="fav-toggle" data-id="${escapeHtml(l.id)}" title="${isFav ? 'Unfavorite' : 'Favorite'}">${isFav ? '★' : '☆'}</button><button type="button" class="compare-btn" data-id="${escapeHtml(l.id)}" title="Add/remove from compare">Compare</button></div></div><div class="listing-meta"><span class="category-badge">${escapeHtml(l.category || '')}</span>${price ? `<span class="price">${price}${l.units ? ' / ' + escapeHtml(l.units) : ''}</span>` : ''}${distHtml}</div><div class="listing-seller">Seller: <button type="button" class="seller-link" data-seller="${escapeHtml(l.sellerid || '')}">${escapeHtml(sellerName)}</button></div>${l.address ? `<div class="listing-address muted small">${escapeHtml(l.address)}</div>` : ''}</div>`;
    }).join('');
    container.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-toggle') || e.target.closest('.seller-link') || e.target.closest('.compare-btn')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(item.dataset.id); }
      });
    });
    container.querySelectorAll('.fav-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.id); });
    });
    container.querySelectorAll('.compare-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (global.FD_COMPARE && typeof global.FD_COMPARE.toggle === 'function') global.FD_COMPARE.toggle(btn.dataset.id);
      });
    });
    if (global.FD_COMPARE && typeof global.FD_COMPARE.updateButtons === 'function') global.FD_COMPARE.updateButtons();
    container.querySelectorAll('.seller-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.seller;
        if (sid) {
          setSellerFilter(sid);
          if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${btn.textContent.trim()}`, 'info');
        }
      });
    });
  }

  function renderChips(f) {
    const chips = document.getElementById('filter-chips');
    if (!chips) return;
    const parts = [];
    if (f.q) parts.push({ key: 'q', label: `Search: ${escapeHtml(f.q)}` });
    if (f.category) parts.push({ key: 'category', label: `Cat: ${escapeHtml(f.category)}` });
    if (f.visibility) parts.push({ key: 'visibility', label: `Vis: ${escapeHtml(f.visibility)}` });
    if (f.units) parts.push({ key: 'units', label: `Units: ${escapeHtml(f.units)}` });
    if (f.seller) parts.push({ key: 'seller', label: `Seller: ${escapeHtml(getDisplayName(f.seller))}` });
    if (!isNaN(f.minPrice)) parts.push({ key: 'minPrice', label: `Min $${f.minPrice}` });
    if (!isNaN(f.maxPrice)) parts.push({ key: 'maxPrice', label: `Max $${f.maxPrice}` });
    if (!isNaN(f.radius) && f.radius > 0) parts.push({ key: 'radius', label: `Radius ${f.radius} km` });
    if (f.favoritesOnly) parts.push({ key: 'favoritesOnly', label: 'Favorites' });
    if (f.inView) parts.push({ key: 'inView', label: 'In view' });
    if (f.sort) parts.push({ key: 'sort', label: `Sort: ${escapeHtml(f.sort)}` });
    if (!parts.length) { chips.innerHTML = ''; chips.hidden = true; return; }
    chips.hidden = false;
    chips.innerHTML = parts.map(p => `<span class="chip" data-key="${p.key}">${p.label} <button type="button" class="chip-remove" aria-label="Remove" data-key="${p.key}">×</button></span>`).join('') + ' <button type="button" class="small-btn" id="clear-chips">Clear all</button>';
    document.getElementById('clear-chips')?.addEventListener('click', clearFilters);
    chips.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); removeChip(btn.dataset.key); });
    });
  }

  function removeChip(key) {
    if (!key) return;
    const map = {
      q: () => { const el = document.getElementById('search-input'); if (el) el.value = ''; },
      category: () => { const el = document.getElementById('filter-category'); if (el) el.value = ''; },
      visibility: () => { const el = document.getElementById('filter-visibility'); if (el) el.value = ''; },
      units: () => { const el = document.getElementById('filter-units'); if (el) el.value = ''; },
      seller: () => { const el = document.getElementById('filter-seller'); if (el) el.value = ''; },
      minPrice: () => { const el = document.getElementById('filter-minprice'); if (el) el.value = ''; },
      maxPrice: () => { const el = document.getElementById('filter-maxprice'); if (el) el.value = ''; },
      radius: () => { const el = document.getElementById('filter-radius'); if (el) el.value = ''; },
      favoritesOnly: () => { const el = document.getElementById('filter-favorites'); if (el) el.checked = false; },
      inView: () => { const el = document.getElementById('filter-inview'); if (el) el.checked = false; },
      sort: () => { const el = document.getElementById('filter-sort'); if (el) el.value = ''; }
    };
    if (map[key]) { map[key](); applyFilters(); if (global.FD_TOAST) global.FD_TOAST.show('Filter removed', 'info'); }
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = String(filtered.length);
  }

  function updateFilterBadge(f) {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const active = !!(f.category || f.visibility || f.units || f.seller || !isNaN(f.minPrice) || !isNaN(f.maxPrice) || (!isNaN(f.radius) && f.radius > 0) || f.favoritesOnly || f.inView || f.sort || f.q);
    badge.hidden = !active;
    badge.textContent = active ? '•' : '';
  }

  function clearFilters() {
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-sort'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['filter-minprice', 'filter-maxprice', 'filter-radius'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const fav = document.getElementById('filter-favorites'); if (fav) fav.checked = false;
    const inv = document.getElementById('filter-inview'); if (inv) inv.checked = false;
    const search = document.getElementById('search-input'); if (search) search.value = '';
    applyFilters();
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings.slice() : [];
    populateFilterOptions();
    applyFilters();
    const hash = location.hash || '';
    const m = hash.match(/listing=([^&]+)/);
    if (m) setTimeout(() => select(decodeURIComponent(m[1]), true), 100);
  }

  function select(id, fromMap = false) {
    const listing = allListings.find(l => String(l.id) === String(id));
    if (!listing) return;
    highlightedId = listing.id;
    highlightedIndex = filtered.findIndex(l => String(l.id) === String(id));
    renderList();
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') global.FD_CARDS.openProduct(listing);
    if (!fromMap && global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') global.FD_MAP.flyToListing(listing);
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') global.FD_RECENT.add(listing);
  }

  function setSellerFilter(sellerid) {
    const sel = document.getElementById('filter-seller');
    if (sel) { sel.value = sellerid || ''; applyFilters(); }
  }
  function setCategoryFilter(cat) {
    const sel = document.getElementById('filter-category');
    if (sel) { sel.value = cat || ''; applyFilters(); }
  }
  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) { sel.value = vis || ''; applyFilters(); }
  }
  function setUnitsFilter(units) {
    const sel = document.getElementById('filter-units');
    if (sel) { sel.value = units || ''; applyFilters(); }
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(favorites.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
  }

  function clearFavorites() {
    favorites.clear();
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function getFilteredViewLink() {
    const f = getFilterValues();
    const params = new URLSearchParams();
    if (f.category) params.set('cat', f.category);
    if (f.visibility) params.set('vis', f.visibility);
    if (f.units) params.set('units', f.units);
    if (f.seller) params.set('seller', f.seller);
    if (!isNaN(f.minPrice)) params.set('min', f.minPrice);
    if (!isNaN(f.maxPrice)) params.set('max', f.maxPrice);
    if (!isNaN(f.radius) && f.radius > 0) params.set('radius', f.radius);
    if (f.favoritesOnly) params.set('fav', '1');
    if (f.inView) params.set('inview', '1');
    if (f.sort) params.set('sort', f.sort);
    if (f.q) params.set('q', f.q);
    const qs = params.toString();
    return location.origin + location.pathname + (qs ? '?' + qs : '');
  }

  function exportFiltered() {
    const data = filtered.slice();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show('Exported ' + data.length + ' listings', 'success');
  }

  function bindUI() {
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-sort'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    ['filter-minprice', 'filter-maxprice', 'filter-radius'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
    document.getElementById('filter-favorites')?.addEventListener('change', applyFilters);
    document.getElementById('filter-inview')?.addEventListener('change', applyFilters);
    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const el = document.getElementById('search-input');
      if (el) { el.value = ''; applyFilters(); }
    });
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.locateMe === 'function') global.FD_MAP.locateMe();
    });
    document.getElementById('clear-location-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.clearLocation === 'function') global.FD_MAP.clearLocation();
    });
    document.getElementById('fit-all-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') global.FD_MAP.fitAll();
    });
  }

  global.FD_LIST = {
    setListings,
    getListings: () => allListings.slice(),
    applyFilters,
    select,
    setSellerFilter,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    getFavorites: () => new Set(favorites),
    toggleFavorite,
    clearFavorites,
    getFiltered: () => filtered.slice(),
    getFilteredViewLink,
    exportFiltered,
    bindUI
  };
})(window);
