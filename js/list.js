/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * filter chips, keyboard navigation, filtered JSON export, and deep-link hash.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 * Applies URL query params (q, cat, vis, seller, units, minprice, maxprice, sort, radius, fav, inview) on load.
 * Category color swatches in the list for visual consistency with the map.
 * Removable individual filter chips under the sidebar header.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let listings = [];
  let filtered = [];
  let highlightedId = null;

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
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
  }

  function saveFavorites(set) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set))); } catch (_) {}
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavorites(favs);
    applyFilters();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(listings);
    }
    return favs.has(id);
  }

  function clearFavorites() {
    saveFavorites(new Set());
    applyFilters();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(listings);
    }
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  const CATEGORY_COLORS = {
    produce: '#2d6a4f', dairy: '#1d4ed8', eggs: '#d97706', grains: '#92400e',
    herbs: '#059669', honey: '#f59e0b', meat: '#dc2626', flowers: '#ec4899',
    nuts: '#78350f', seafood: '#0ea5e9', bakery: '#f97316', default: '#40916c'
  };

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getUserPos() {
    return (global.FD_MAP && global.FD_MAP.getUserLocation) ? global.FD_MAP.getUserLocation() : null;
  }

  function applyFilters() {
    const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value);
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value);
    const radius = parseFloat(document.getElementById('filter-radius')?.value);
    const sort = document.getElementById('filter-sort')?.value || '';
    const favOnly = !!document.getElementById('filter-favorites')?.checked;
    const inViewOnly = !!document.getElementById('filter-inview')?.checked;

    const favs = getFavorites();
    const userPos = getUserPos();

    filtered = listings.filter(l => {
      if (q) {
        const hay = [l.headerdescription, l.description, l.category, getDisplayName(l.sellerid), l.sellerid, l.address, l.units]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      const price = Number(l.price);
      if (!isNaN(minP) && (isNaN(price) || price < minP)) return false;
      if (!isNaN(maxP) && (isNaN(price) || price > maxP)) return false;
      if (favOnly && !favs.has(l.id)) return false;
      if (inViewOnly && global.FD_MAP && typeof global.FD_MAP.isInView === 'function' && !global.FD_MAP.isInView(l)) return false;
      if (!isNaN(radius) && radius > 0 && userPos) {
        const loc = l.location || {};
        const lat = Number(loc.lat), lng = Number(loc.long);
        if (isNaN(lat) || isNaN(lng)) return false;
        const d = haversineKm(userPos.lat, userPos.lng, lat, lng);
        if (d > radius) return false;
      }
      return true;
    });

    // Sort
    if (sort === 'price-asc') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === 'price-desc') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (sort === 'name') filtered.sort((a, b) => String(a.headerdescription || '').localeCompare(String(b.headerdescription || '')));
    else if (sort === 'distance' && userPos) {
      filtered.sort((a, b) => {
        const da = distanceOf(a, userPos);
        const db = distanceOf(b, userPos);
        return da - db;
      });
    }

    renderList();
    renderChips();
    updateFilterBadge();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
    if (global.FD_MAP && typeof global.FD_MAP.updateFilterRadius === 'function') {
      global.FD_MAP.updateFilterRadius();
    }
  }

  function distanceOf(l, userPos) {
    const loc = l.location || {};
    const lat = Number(loc.lat), lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng) || !userPos) return Infinity;
    return haversineKm(userPos.lat, userPos.lng, lat, lng);
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;
    if (countEl) countEl.textContent = String(filtered.length);

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">No listings match the current filters.</div>';
      return;
    }

    const favs = getFavorites();
    const userPos = getUserPos();

    container.innerHTML = filtered.map(l => {
      const price = Number(l.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)}`;
      const color = CATEGORY_COLORS[l.category] || CATEGORY_COLORS.default;
      const swatch = `<span class="category-swatch" style="background:${color}" title="${escapeHtml(l.category || '')}"></span>`;
      const seller = escapeHtml(getDisplayName(l.sellerid));
      let dist = '';
      if (userPos) {
        const d = distanceOf(l, userPos);
        if (isFinite(d)) dist = `<span class="distance">~${d.toFixed(1)} km</span>`;
      }
      const fav = favs.has(l.id);
      return `
        <div class="listing-item" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
          <div class="listing-header">
            <div class="listing-title">${swatch}${escapeHtml(l.headerdescription || 'Listing')}</div>
            <button type="button" class="fav-toggle" data-id="${escapeHtml(l.id)}" title="${fav ? 'Unfavorite' : 'Favorite'}">${fav ? '★' : '☆'}</button>
          </div>
          <div class="listing-meta">
            <span class="category-badge" style="background:${color}">${escapeHtml(l.category || '')}</span>
            ${priceStr ? `<span class="price">${priceStr}${l.units ? ' / ' + escapeHtml(l.units) : ''}</span>` : ''}
            ${dist}
          </div>
          <div class="listing-seller">${seller}</div>
          ${l.address ? `<div class="listing-address muted small">${escapeHtml(l.address)}</div>` : ''}
        </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-toggle')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(item.dataset.id);
        }
      });
    });
    container.querySelectorAll('.fav-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function clearOneFilter(kind) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = false;
      else el.value = val || '';
    };
    if (kind === 'q') setVal('search-input', '');
    else if (kind === 'cat') setVal('filter-category', '');
    else if (kind === 'vis') setVal('filter-visibility', '');
    else if (kind === 'units') setVal('filter-units', '');
    else if (kind === 'seller') setVal('filter-seller', '');
    else if (kind === 'minprice') setVal('filter-minprice', '');
    else if (kind === 'maxprice') setVal('filter-maxprice', '');
    else if (kind === 'radius') setVal('filter-radius', '');
    else if (kind === 'sort') setVal('filter-sort', '');
    else if (kind === 'fav') setVal('filter-favorites', '');
    else if (kind === 'inview') setVal('filter-inview', '');
    applyFilters();
  }

  function renderChips() {
    const box = document.getElementById('filter-chips');
    if (!box) return;
    const chips = [];
    const add = (kind, label) => {
      chips.push(`<span class="chip">${escapeHtml(label)} <button type="button" class="chip-remove" data-kind="${kind}" aria-label="Remove filter">×</button></span>`);
    };

    const q = (document.getElementById('search-input')?.value || '').trim();
    if (q) add('q', `Search: ${q.length > 18 ? q.slice(0, 16) + '…' : q}`);
    const cat = document.getElementById('filter-category')?.value;
    if (cat) add('cat', `Category: ${cat}`);
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) add('vis', `Visibility: ${vis}`);
    const units = document.getElementById('filter-units')?.value;
    if (units) add('units', `Units: ${units}`);
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) add('seller', `Seller: ${getDisplayName(seller)}`);
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) add('minprice', `Min $${minP}`);
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) add('maxprice', `Max $${maxP}`);
    const radius = document.getElementById('filter-radius')?.value;
    if (radius) add('radius', `≤ ${radius} km`);
    const sort = document.getElementById('filter-sort')?.value;
    if (sort) add('sort', `Sort: ${sort}`);
    if (document.getElementById('filter-favorites')?.checked) add('fav', 'Favorites');
    if (document.getElementById('filter-inview')?.checked) add('inview', 'In view');

    box.innerHTML = chips.join('');
    box.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearOneFilter(btn.dataset.kind);
      });
    });
  }

  function countActiveFilters() {
    let n = 0;
    if ((document.getElementById('search-input')?.value || '').trim()) n++;
    if (document.getElementById('filter-category')?.value) n++;
    if (document.getElementById('filter-visibility')?.value) n++;
    if (document.getElementById('filter-units')?.value) n++;
    if (document.getElementById('filter-seller')?.value) n++;
    if (document.getElementById('filter-minprice')?.value) n++;
    if (document.getElementById('filter-maxprice')?.value) n++;
    if (document.getElementById('filter-radius')?.value) n++;
    if (document.getElementById('filter-sort')?.value) n++;
    if (document.getElementById('filter-favorites')?.checked) n++;
    if (document.getElementById('filter-inview')?.checked) n++;
    return n;
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const n = countActiveFilters();
    if (n) {
      badge.hidden = false;
      badge.textContent = String(n);
    } else {
      badge.hidden = true;
    }
  }

  function select(id, fromMap) {
    highlightedId = id;
    const listing = listings.find(l => String(l.id) === String(id));
    if (!listing) return;
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
    if (!fromMap && global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') {
      global.FD_MAP.flyToListing(listing);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(id);
    }
    // Highlight in list
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.id === String(id));
    });
  }

  function setListings(arr) {
    listings = Array.isArray(arr) ? arr : [];
    applyFilters();
  }

  function getListings() { return listings; }

  function setCategoryFilter(cat) {
    const sel = document.getElementById('filter-category');
    if (sel) { sel.value = cat || ''; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) { sel.value = vis || ''; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function setUnitsFilter(u) {
    const sel = document.getElementById('filter-units');
    if (sel) { sel.value = u || ''; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function setSellerFilter(sid) {
    const sel = document.getElementById('filter-seller');
    if (sel) { sel.value = sid || ''; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }

  function exportFiltered() {
    try {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmdirect-filtered-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
    } catch (err) {
      if (global.FD_TOAST) global.FD_TOAST.show('Export failed', 'error');
    }
  }

  function getFilteredViewLink() {
    const params = new URLSearchParams();
    const q = document.getElementById('search-input')?.value?.trim();
    if (q) params.set('q', q);
    const cat = document.getElementById('filter-category')?.value;
    if (cat) params.set('cat', cat);
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) params.set('vis', vis);
    const units = document.getElementById('filter-units')?.value;
    if (units) params.set('units', units);
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) params.set('seller', seller);
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) params.set('minprice', minP);
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) params.set('maxprice', maxP);
    const sort = document.getElementById('filter-sort')?.value;
    if (sort) params.set('sort', sort);
    const radius = document.getElementById('filter-radius')?.value;
    if (radius) params.set('radius', radius);
    if (document.getElementById('filter-favorites')?.checked) params.set('fav', '1');
    if (document.getElementById('filter-inview')?.checked) params.set('inview', '1');
    const base = location.origin + location.pathname;
    return params.toString() ? base + '?' + params.toString() : base;
  }

  function applyUrlParams() {
    const params = new URLSearchParams(location.search);
    const set = (id, key) => {
      const el = document.getElementById(id);
      const val = params.get(key);
      if (el && val != null) el.value = val;
    };
    set('search-input', 'q');
    set('filter-category', 'cat');
    set('filter-visibility', 'vis');
    set('filter-units', 'units');
    set('filter-seller', 'seller');
    set('filter-minprice', 'minprice');
    set('filter-maxprice', 'maxprice');
    set('filter-sort', 'sort');
    set('filter-radius', 'radius');
    if (params.get('fav') === '1') {
      const el = document.getElementById('filter-favorites');
      if (el) el.checked = true;
    }
    if (params.get('inview') === '1') {
      const el = document.getElementById('filter-inview');
      if (el) el.checked = true;
    }
  }

  function init() {
    applyUrlParams();
    // Keyboard nav on list
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      const items = Array.from(document.querySelectorAll('.listing-item'));
      if (!items.length) return;
      let idx = items.findIndex(el => el.dataset.id === highlightedId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        idx = Math.min(idx + 1, items.length - 1);
        if (idx >= 0) select(items[idx].dataset.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        idx = Math.max(idx - 1, 0);
        if (idx >= 0) select(items[idx].dataset.id);
      } else if ((e.key === 'Enter' || e.key === ' ') && highlightedId) {
        e.preventDefault();
        select(highlightedId);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.FD_LIST = {
    setListings,
    getListings,
    applyFilters,
    select,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSellerFilter,
    getFavorites,
    toggleFavorite,
    clearFavorites,
    exportFiltered,
    getFilteredViewLink
  };
})(window);
