/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * individual removable filter chips, category color swatches,
 * keyboard navigation, filtered JSON export, and deep-link URL params.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 * Empty state is now source-aware with next-step guidance for seed/demo UX.
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
      .replace(/"/g, '&quot;');
  }

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function setFavorites(ids) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(ids || [])); } catch (_) {}
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    setFavorites(favs);
    applyFilters();
    return favs.includes(id);
  }

  function clearFavorites() {
    setFavorites([]);
    applyFilters();
  }

  function categoryColor(cat) {
    if (!cat) return '#888';
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 45%)`;
  }

  function getSellerName(id) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(id) : id;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getUserLocation() {
    return (global.FD_MAP && global.FD_MAP.getUserLocation) ? global.FD_MAP.getUserLocation() : null;
  }

  function getMapBounds() {
    return (global.FD_MAP && global.FD_MAP.getBounds) ? global.FD_MAP.getBounds() : null;
  }

  function inView(loc) {
    const b = getMapBounds();
    if (!b || !loc || loc.lat == null || loc.long == null) return true;
    return loc.lat >= b.south && loc.lat <= b.north && loc.long >= b.west && loc.long <= b.east;
  }

  function applyFilters() {
    const q = ($('search-input')?.value || '').trim().toLowerCase();
    const cat = $('filter-category')?.value || '';
    const vis = $('filter-visibility')?.value || '';
    const units = $('filter-units')?.value || '';
    const seller = $('filter-seller')?.value || '';
    const minP = parseFloat($('filter-minprice')?.value);
    const maxP = parseFloat($('filter-maxprice')?.value);
    const radius = parseFloat($('filter-radius')?.value);
    const sort = $('filter-sort')?.value || '';
    const favOnly = !!$('filter-favorites')?.checked;
    const inViewOnly = !!$('filter-inview')?.checked;
    const userLoc = getUserLocation();

    filtered = listings.filter(l => {
      if (q) {
        const hay = [l.headerdescription, l.description, l.category, l.sellerid, getSellerName(l.sellerid), l.address, l.units]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      if (!isNaN(minP) && (l.price == null || l.price < minP)) return false;
      if (!isNaN(maxP) && (l.price == null || l.price > maxP)) return false;
      if (favOnly && !isFavorite(l.id)) return false;
      if (inViewOnly && !inView(l.location)) return false;
      if (!isNaN(radius) && radius > 0 && userLoc && l.location) {
        const d = haversine(userLoc.lat, userLoc.long || userLoc.lng, l.location.lat, l.location.long);
        if (d > radius) return false;
      }
      return true;
    });

    // Sort
    if (sort === 'price-asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price-desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'name') filtered.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (sort === 'distance' && userLoc) {
      filtered.sort((a, b) => {
        const da = a.location ? haversine(userLoc.lat, userLoc.long || userLoc.lng, a.location.lat, a.location.long) : Infinity;
        const db = b.location ? haversine(userLoc.lat, userLoc.long || userLoc.lng, b.location.lat, b.location.long) : Infinity;
        return da - db;
      });
    }

    renderList();
    renderChips();
    updateFilterBadge();
    updateUrl();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
  }

  function renderList() {
    const el = $('listing-list');
    const count = $('list-count');
    if (count) count.textContent = filtered.length;
    if (!el) return;

    if (!filtered.length) {
      const hasFilters = hasActiveFilters();
      const source = (global.FD_MAIN && global.FD_MAIN.getCurrentSource) ? global.FD_MAIN.getCurrentSource() : 'seed';
      let emptyMsg = 'No matching listings.';
      if (!hasFilters && (source === 'seed' || source === 'demo' || source === 'api-empty')) {
        emptyMsg = 'No listings loaded yet. Seed data should appear automatically, or create one in demo mode from the dashboard.';
      }
      el.innerHTML = `<div class="empty-state muted">${emptyMsg}${hasFilters ? '<br><button type="button" class="small-btn" id="empty-clear">Clear filters</button>' : ''}${!hasFilters && source !== 'api' ? '<br><button type="button" class="small-btn" id="empty-create" style="margin-top:0.4rem">Create listing</button>' : ''}</div>`;
      $('empty-clear')?.addEventListener('click', clearAllFilters);
      $('empty-create')?.addEventListener('click', () => {
        global.FD_FORM?.open?.() || global.FD_DASHBOARD?.open?.();
      });
      return;
    }

    el.innerHTML = filtered.map(l => {
      const fav = isFavorite(l.id);
      const color = categoryColor(l.category);
      const name = getSellerName(l.sellerid);
      const price = l.price != null ? `$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units || '')}` : '';
      return `
        <div class="listing-item${highlightedId === l.id ? ' highlighted' : ''}" role="listitem" data-id="${escapeHtml(l.id)}" tabindex="0">
          <div class="listing-swatch" style="background:${color}" title="${escapeHtml(l.category || '')}"></div>
          <div class="listing-body">
            <div class="listing-header">
              <strong>${escapeHtml(l.headerdescription || 'Untitled')}</strong>
              <button type="button" class="fav-btn${fav ? ' active' : ''}" data-id="${escapeHtml(l.id)}" title="${fav ? 'Remove favorite' : 'Add favorite'}" aria-label="Favorite">${fav ? '★' : '☆'}</button>
            </div>
            <div class="listing-meta muted small">${escapeHtml(name)} · ${escapeHtml(l.category || '')} · ${price}</div>
            <div class="listing-addr muted small">${escapeHtml(l.address || '')}</div>
          </div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(item.dataset.id); }
      });
    });
    el.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function renderChips() {
    const el = $('filter-chips');
    if (!el) return;
    const chips = [];
    const q = ($('search-input')?.value || '').trim();
    if (q) chips.push({ key: 'q', label: `Search: ${q}` });
    const cat = $('filter-category')?.value;
    if (cat) chips.push({ key: 'cat', label: `Category: ${cat}` });
    const vis = $('filter-visibility')?.value;
    if (vis) chips.push({ key: 'vis', label: `Visibility: ${vis}` });
    const units = $('filter-units')?.value;
    if (units) chips.push({ key: 'units', label: `Units: ${units}` });
    const seller = $('filter-seller')?.value;
    if (seller) chips.push({ key: 'seller', label: `Seller: ${getSellerName(seller)}` });
    const minP = $('filter-minprice')?.value;
    if (minP) chips.push({ key: 'minprice', label: `Min ≥ $${minP}` });
    const maxP = $('filter-maxprice')?.value;
    if (maxP) chips.push({ key: 'maxprice', label: `Max ≤ $${maxP}` });
    const radius = $('filter-radius')?.value;
    if (radius) chips.push({ key: 'radius', label: `Radius ≤ ${radius} km` });
    if ($('filter-favorites')?.checked) chips.push({ key: 'fav', label: 'Favorites' });
    if ($('filter-inview')?.checked) chips.push({ key: 'inview', label: 'In view' });
    const sort = $('filter-sort')?.value;
    if (sort) chips.push({ key: 'sort', label: `Sort: ${sort}` });

    el.innerHTML = chips.map(c => `<span class="chip" data-key="${c.key}">${escapeHtml(c.label)} <button type="button" class="chip-remove" aria-label="Remove">×</button></span>`).join('');
    el.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.parentElement.dataset.key;
        clearChip(key);
      });
    });
  }

  function clearChip(key) {
    if (key === 'q') { const s = $('search-input'); if (s) s.value = ''; }
    else if (key === 'cat') { const e = $('filter-category'); if (e) e.value = ''; }
    else if (key === 'vis') { const e = $('filter-visibility'); if (e) e.value = ''; }
    else if (key === 'units') { const e = $('filter-units'); if (e) e.value = ''; }
    else if (key === 'seller') { const e = $('filter-seller'); if (e) e.value = ''; }
    else if (key === 'minprice') { const e = $('filter-minprice'); if (e) e.value = ''; }
    else if (key === 'maxprice') { const e = $('filter-maxprice'); if (e) e.value = ''; }
    else if (key === 'radius') { const e = $('filter-radius'); if (e) e.value = ''; }
    else if (key === 'fav') { const e = $('filter-favorites'); if (e) e.checked = false; }
    else if (key === 'inview') { const e = $('filter-inview'); if (e) e.checked = false; }
    else if (key === 'sort') { const e = $('filter-sort'); if (e) e.value = ''; }
    applyFilters();
  }

  function hasActiveFilters() {
    return !!(($('search-input')?.value || '').trim() ||
      $('filter-category')?.value ||
      $('filter-visibility')?.value ||
      $('filter-units')?.value ||
      $('filter-seller')?.value ||
      $('filter-minprice')?.value ||
      $('filter-maxprice')?.value ||
      $('filter-radius')?.value ||
      $('filter-favorites')?.checked ||
      $('filter-inview')?.checked ||
      $('filter-sort')?.value);
  }

  function updateFilterBadge() {
    const badge = $('filter-badge');
    if (!badge) return;
    const n = [
      ($('search-input')?.value || '').trim() ? 1 : 0,
      $('filter-category')?.value ? 1 : 0,
      $('filter-visibility')?.value ? 1 : 0,
      $('filter-units')?.value ? 1 : 0,
      $('filter-seller')?.value ? 1 : 0,
      $('filter-minprice')?.value ? 1 : 0,
      $('filter-maxprice')?.value ? 1 : 0,
      $('filter-radius')?.value ? 1 : 0,
      $('filter-favorites')?.checked ? 1 : 0,
      $('filter-inview')?.checked ? 1 : 0
    ].reduce((a, b) => a + b, 0);
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function clearAllFilters() {
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort'].forEach(id => {
      const el = $(id); if (el) el.value = '';
    });
    const fav = $('filter-favorites'); if (fav) fav.checked = false;
    const inv = $('filter-inview'); if (inv) inv.checked = false;
    const search = $('search-input'); if (search) search.value = '';
    applyFilters();
  }

  function select(id) {
    highlightedId = id;
    const l = listings.find(x => x.id === id);
    if (!l) return;
    renderList();
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(l);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function' && l.location) {
      global.FD_MAP.flyTo(l.location.lat, l.location.long);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(l);
    }
  }

  function updateUrl() {
    const params = new URLSearchParams();
    const q = ($('search-input')?.value || '').trim();
    if (q) params.set('q', q);
    const cat = $('filter-category')?.value; if (cat) params.set('cat', cat);
    const vis = $('filter-visibility')?.value; if (vis) params.set('vis', vis);
    const units = $('filter-units')?.value; if (units) params.set('units', units);
    const seller = $('filter-seller')?.value; if (seller) params.set('seller', seller);
    const minP = $('filter-minprice')?.value; if (minP) params.set('minprice', minP);
    const maxP = $('filter-maxprice')?.value; if (maxP) params.set('maxprice', maxP);
    const radius = $('filter-radius')?.value; if (radius) params.set('radius', radius);
    const sort = $('filter-sort')?.value; if (sort) params.set('sort', sort);
    if ($('filter-favorites')?.checked) params.set('fav', '1');
    if ($('filter-inview')?.checked) params.set('inview', '1');
    const qs = params.toString();
    const url = location.pathname + (qs ? '?' + qs : '') + location.hash;
    history.replaceState(null, '', url);
  }

  function restoreFromUrl() {
    const params = new URLSearchParams(location.search);
    const set = (id, val) => { const el = $(id); if (el && val != null) el.value = val; };
    if (params.has('q')) set('search-input', params.get('q'));
    if (params.has('cat')) set('filter-category', params.get('cat'));
    if (params.has('vis')) set('filter-visibility', params.get('vis'));
    if (params.has('units')) set('filter-units', params.get('units'));
    if (params.has('seller')) set('filter-seller', params.get('seller'));
    if (params.has('minprice')) set('filter-minprice', params.get('minprice'));
    if (params.has('maxprice')) set('filter-maxprice', params.get('maxprice'));
    if (params.has('radius')) set('filter-radius', params.get('radius'));
    if (params.has('sort')) set('filter-sort', params.get('sort'));
    if (params.get('fav') === '1') { const e = $('filter-favorites'); if (e) e.checked = true; }
    if (params.get('inview') === '1') { const e = $('filter-inview'); if (e) e.checked = true; }
  }

  function getFilteredViewLink() {
    return location.href;
  }

  function exportFiltered() {
    const data = filtered.map(l => ({ ...l }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function setListings(arr) {
    listings = Array.isArray(arr) ? arr.slice() : [];
    restoreFromUrl();
    applyFilters();
  }

  function getListings() { return listings.slice(); }

  function getFiltered() { return filtered.slice(); }

  // Keyboard nav support (called from shortcuts if desired)
  function navigate(dir) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => l.id === highlightedId);
    if (idx < 0) idx = 0;
    else idx = (idx + dir + filtered.length) % filtered.length;
    select(filtered[idx].id);
    const item = document.querySelector(`.listing-item[data-id="${filtered[idx].id}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }

  global.FD_LIST = {
    setListings,
    getListings,
    getFiltered,
    applyFilters,
    select,
    setCategoryFilter: (v) => { const e = $('filter-category'); if (e) { e.value = v || ''; applyFilters(); } },
    setVisibilityFilter: (v) => { const e = $('filter-visibility'); if (e) { e.value = v || ''; applyFilters(); } },
    setUnitsFilter: (v) => { const e = $('filter-units'); if (e) { e.value = v || ''; applyFilters(); } },
    setSellerFilter: (v) => { const e = $('filter-seller'); if (e) { e.value = v || ''; applyFilters(); } },
    getFavorites,
    toggleFavorite,
    clearFavorites,
    exportFiltered,
    getFilteredViewLink,
    navigate,
    clearAllFilters
  };
})(window);
