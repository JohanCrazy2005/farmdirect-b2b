/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * individual removable filter chips, category color swatches,
 * keyboard navigation, filtered JSON export, and deep-link URL params.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 * Empty state is now source-aware with next-step guidance for seed/demo UX.
 * List rows include thumbnails + clickable category badges and seller links for quick filtering.
 * Shows distance from user location (when Locate is used) in each row.
 * List count shows filtered/total when filters are active.
 * Listing thumbnails fall back to category-color placeholder on image load error.
 * List count is clickable when filtered to clear all filters.
 * Radius filter without a user location shows a Locate prompt toast.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let listings = [];
  let filtered = [];
  let highlightedId = null;
  let userLocation = null;

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
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
  }

  function setFavorites(arr) {
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    setFavorites(favs);
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(i >= 0 ? 'Removed from favorites' : 'Added to favorites', 'info');
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(km) {
    if (km == null || isNaN(km)) return '';
    if (km < 1) return Math.round(km * 1000) + ' m';
    return km.toFixed(1) + ' km';
  }

  function getFilters() {
    return {
      q: ($('search-input')?.value || '').trim().toLowerCase(),
      cat: $('filter-category')?.value || '',
      vis: $('filter-visibility')?.value || '',
      units: $('filter-units')?.value || '',
      seller: $('filter-seller')?.value || '',
      minprice: parseFloat($('filter-minprice')?.value) || 0,
      maxprice: parseFloat($('filter-maxprice')?.value) || Infinity,
      radius: parseFloat($('filter-radius')?.value) || 0,
      sort: $('filter-sort')?.value || '',
      fav: $('filter-favorites')?.checked || false,
      inview: $('filter-inview')?.checked || false
    };
  }

  function applyFilters() {
    const f = getFilters();
    if (f.radius > 0 && !userLocation) {
      if (global.FD_TOAST) global.FD_TOAST.show('Use Locate to filter by radius', 'info');
    }
    filtered = listings.filter(l => {
      if (f.q && !(String(l.headerdescription || '') + ' ' + String(l.category || '') + ' ' + String(l.description || '') + ' ' + String(l.sellerid || '')).toLowerCase().includes(f.q)) return false;
      if (f.cat && l.category !== f.cat) return false;
      if (f.vis && l.visibility !== f.vis) return false;
      if (f.units && l.units !== f.units) return false;
      if (f.seller && l.sellerid !== f.seller) return false;
      const price = Number(l.price);
      if (!isNaN(price) && (price < f.minprice || price > f.maxprice)) return false;
      if (f.fav && !getFavorites().includes(l.id)) return false;
      if (f.radius > 0 && userLocation && l.location) {
        const km = haversine(userLocation.lat, userLocation.long || userLocation.lng, l.location.lat, l.location.long);
        if (km > f.radius) return false;
      }
      if (f.inview && global.FD_MAP && typeof global.FD_MAP.isInView === 'function' && !global.FD_MAP.isInView(l)) return false;
      return true;
    });
    if (f.sort === 'price-asc') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (f.sort === 'price-desc') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (f.sort === 'name') filtered.sort((a, b) => String(a.headerdescription || '').localeCompare(String(b.headerdescription || '')));
    else if (f.sort === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const da = a.location ? haversine(userLocation.lat, userLocation.long || userLocation.lng, a.location.lat, a.location.long) : Infinity;
        const db = b.location ? haversine(userLocation.lat, userLocation.long || userLocation.lng, b.location.lat, b.location.long) : Infinity;
        return da - db;
      });
    }
    renderList();
    renderChips(f);
    updateCount();
    if (global.FD_MAP && typeof global.FD_MAP.setMarkers === 'function') global.FD_MAP.setMarkers(filtered);
  }

  function updateCount() {
    const el = $('list-count');
    if (!el) return;
    const total = listings.length;
    const shown = filtered.length;
    if (shown === total) {
      el.textContent = String(total);
      el.title = '';
      el.style.cursor = '';
      el.onclick = null;
    } else {
      el.textContent = shown + '/' + total;
      el.title = 'Click to clear filters';
      el.style.cursor = 'pointer';
      el.onclick = () => {
        clearAllFilters();
        if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
      };
    }
  }

  function clearAllFilters() {
    if ($('search-input')) $('search-input').value = '';
    if ($('filter-category')) $('filter-category').value = '';
    if ($('filter-visibility')) $('filter-visibility').value = '';
    if ($('filter-units')) $('filter-units').value = '';
    if ($('filter-seller')) $('filter-seller').value = '';
    if ($('filter-minprice')) $('filter-minprice').value = '';
    if ($('filter-maxprice')) $('filter-maxprice').value = '';
    if ($('filter-radius')) $('filter-radius').value = '';
    if ($('filter-sort')) $('filter-sort').value = '';
    if ($('filter-favorites')) $('filter-favorites').checked = false;
    if ($('filter-inview')) $('filter-inview').checked = false;
    applyFilters();
  }

  function renderChips(f) {
    const el = $('filter-chips');
    if (!el) return;
    const chips = [];
    if (f.q) chips.push({ label: 'Search: ' + f.q, clear: () => { $('search-input').value = ''; applyFilters(); } });
    if (f.cat) chips.push({ label: f.cat, clear: () => { $('filter-category').value = ''; applyFilters(); } });
    if (f.vis) chips.push({ label: f.vis, clear: () => { $('filter-visibility').value = ''; applyFilters(); } });
    if (f.units) chips.push({ label: f.units, clear: () => { $('filter-units').value = ''; applyFilters(); } });
    if (f.seller) chips.push({ label: 'Seller', clear: () => { $('filter-seller').value = ''; applyFilters(); } });
    if (f.minprice > 0) chips.push({ label: 'Min $' + f.minprice, clear: () => { $('filter-minprice').value = ''; applyFilters(); } });
    if (f.maxprice < Infinity) chips.push({ label: 'Max $' + f.maxprice, clear: () => { $('filter-maxprice').value = ''; applyFilters(); } });
    if (f.radius > 0) chips.push({ label: f.radius + ' km', clear: () => { $('filter-radius').value = ''; applyFilters(); } });
    if (f.fav) chips.push({ label: 'Favorites', clear: () => { $('filter-favorites').checked = false; applyFilters(); } });
    if (f.inview) chips.push({ label: 'In view', clear: () => { $('filter-inview').checked = false; applyFilters(); } });
    el.innerHTML = chips.map((c, i) => `<span class="filter-chip">${escapeHtml(c.label)} <button type="button" data-i="${i}" aria-label="Clear">×</button></span>`).join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => chips[Number(btn.dataset.i)].clear());
    });
  }

  function renderList() {
    const el = $('listing-list');
    if (!el) return;
    if (!filtered.length) {
      const isSeed = !(global.FD_API && global.FD_API.isLive && global.FD_API.isLive());
      el.innerHTML = `<div class="empty-state muted">
        <p>No listings match the current filters.</p>
        ${isSeed ? '<p class="small">Seed/demo mode: try clearing filters or check the data-source badge for next steps.</p>' : ''}
        <button type="button" class="small-btn" id="empty-clear">Clear filters</button>
      </div>`;
      el.querySelector('#empty-clear')?.addEventListener('click', clearAllFilters);
      return;
    }
    const favs = getFavorites();
    el.innerHTML = filtered.map(l => {
      const sellerName = (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
        ? global.FD_SELLERS.getDisplayName(l.sellerid) : (l.sellerid || '');
      const isFav = favs.includes(l.id);
      let dist = '';
      if (userLocation && l.location && l.location.lat != null) {
        const km = haversine(userLocation.lat, userLocation.long || userLocation.lng, l.location.lat, l.location.long);
        dist = `<span class="distance small muted">${formatDistance(km)}</span>`;
      }
      const priceStr = l.price != null ? '$' + Number(l.price).toFixed(2) + (l.units ? ' / ' + l.units : '') : 'Price on request';
      const active = l.id === highlightedId ? ' active' : '';
      const img = l.image ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="" onerror="this.style.background='#ddd';this.src=''">` : `<div class="list-thumb placeholder" data-cat="${escapeHtml(l.category || '')}"></div>`;
      return `<div class="listing-item${active}" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
        ${img}
        <div class="list-body">
          <div class="list-title">${escapeHtml(l.headerdescription || 'Untitled')}</div>
          <div class="list-meta">
            <button type="button" class="category-badge" data-cat="${escapeHtml(l.category || '')}">${escapeHtml(l.category || '')}</button>
            <button type="button" class="visibility-badge vis-${escapeHtml(l.visibility || '')}" data-vis="${escapeHtml(l.visibility || '')}">${escapeHtml(l.visibility || '')}</button>
            ${l.units ? `<button type="button" class="units-badge" data-units="${escapeHtml(l.units)}">${escapeHtml(l.units)}</button>` : ''}
            <span class="price small">${escapeHtml(priceStr)}</span>
            ${dist}
          </div>
          <div class="list-seller small muted">Seller: <button type="button" class="link-btn seller-link" data-seller="${escapeHtml(l.sellerid || '')}">${escapeHtml(sellerName)}</button></div>
        </div>
        <button type="button" class="fav-btn icon-btn" data-id="${escapeHtml(l.id)}" aria-label="Favorite">${isFav ? '★' : '☆'}</button>
      </div>`;
    }).join('');
    el.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', () => select(item.dataset.id));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(item.dataset.id); }
      });
    });
    el.querySelectorAll('.category-badge').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setCategoryFilter(btn.dataset.cat);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to ' + btn.dataset.cat, 'info');
      });
    });
    el.querySelectorAll('.visibility-badge').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setVisibilityFilter(btn.dataset.vis);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to ' + btn.dataset.vis, 'info');
      });
    });
    el.querySelectorAll('.units-badge').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setUnitsFilter(btn.dataset.units);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to ' + btn.dataset.units, 'info');
      });
    });
    el.querySelectorAll('.seller-link').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        setSellerFilter(btn.dataset.seller);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to seller', 'info');
      });
    });
    el.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function select(id) {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    highlightedId = id;
    renderList();
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') global.FD_MAP.flyTo(listing);
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') global.FD_CARDS.openProduct(listing);
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') global.FD_RECENT.add(id);
    const el = document.querySelector(`.listing-item[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function setListings(list) {
    listings = Array.isArray(list) ? list : [];
    listings.forEach((l, i) => { if (!l.id) l.id = 'l' + i; });
    populateSelects();
    applyFilters();
  }

  function populateSelects() {
    const cats = [...new Set(listings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(listings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(listings.map(l => l.sellerid).filter(Boolean))];
    const catSel = $('filter-category');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (cats.includes(cur)) catSel.value = cur;
    }
    const unitSel = $('filter-units');
    if (unitSel) {
      const cur = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      if (units.includes(cur)) unitSel.value = cur;
    }
    const selSel = $('filter-seller');
    if (selSel) {
      const cur = selSel.value;
      selSel.innerHTML = '<option value="">Any</option>' + sellers.map(s => {
        const name = (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function') ? global.FD_SELLERS.getDisplayName(s) : s;
        return `<option value="${escapeHtml(s)}">${escapeHtml(name)}</option>`;
      }).join('');
      if (sellers.includes(cur)) selSel.value = cur;
    }
  }

  function setCategoryFilter(cat) {
    if ($('filter-category')) $('filter-category').value = cat || '';
    applyFilters();
  }
  function setVisibilityFilter(vis) {
    if ($('filter-visibility')) $('filter-visibility').value = vis || '';
    applyFilters();
  }
  function setUnitsFilter(units) {
    if ($('filter-units')) $('filter-units').value = units || '';
    applyFilters();
  }
  function setSellerFilter(seller) {
    if ($('filter-seller')) $('filter-seller').value = seller || '';
    applyFilters();
  }

  function exportFiltered() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function bindUI() {
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', applyFilters);
      if (el && (el.type === 'number' || el.type === 'text')) el.addEventListener('input', applyFilters);
    });
    $('filter-favorites')?.addEventListener('change', applyFilters);
    $('filter-inview')?.addEventListener('change', applyFilters);
    $('search-input')?.addEventListener('input', applyFilters);
    $('clear-filters')?.addEventListener('click', clearAllFilters);
    if (global.FD_MAP && typeof global.FD_MAP.onUserLocation === 'function') {
      global.FD_MAP.onUserLocation(loc => { userLocation = loc; applyFilters(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUI);
  } else {
    bindUI();
  }

  global.FD_LIST = {
    setListings,
    getListings: () => listings,
    applyFilters,
    select,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSellerFilter,
    getFavorites,
    toggleFavorite,
    clearFavorites: () => { setFavorites([]); applyFilters(); },
    exportFiltered,
    setUserLocation: loc => { userLocation = loc; applyFilters(); }
  };
})(window);
