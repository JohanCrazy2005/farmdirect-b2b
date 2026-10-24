/**
 * FarmDirect B2B – sidebar list + filter module
 * Renders filtered listings, handles search/filters/favorites/distance/only-in-view,
 * keyboard navigation, persistence, empty-state, filter badge, copy links,
 * removable filter chips.
 * Fully client-side; works in seed/demo and live modes.
 */
(function (global) {
  'use strict';

  let allListings = [];
  let filtered = [];
  let userLocation = null;
  let highlightedId = null;
  const FAV_KEY = 'fd-favorites';
  const FILTER_KEY = 'fd-filters';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveFavorites(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (_) {}
  }
  function isFavorite(id) {
    return loadFavorites().includes(id);
  }
  function toggleFavorite(id) {
    const favs = loadFavorites();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    saveFavorites(favs);
    renderList();
    if (global.FD_CARDS && global.FD_CARDS.refresh) global.FD_CARDS.refresh();
  }
  function clearFavorites() {
    saveFavorites([]);
    renderList();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getSearchQuery() {
    return (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  }

  function getActiveFilterCount() {
    let n = 0;
    if (getSearchQuery()) n++;
    if (document.getElementById('filter-category')?.value) n++;
    if (document.getElementById('filter-visibility')?.value) n++;
    if (document.getElementById('filter-units')?.value) n++;
    if (document.getElementById('filter-seller')?.value) n++;
    if (document.getElementById('filter-minprice')?.value) n++;
    if (document.getElementById('filter-maxprice')?.value) n++;
    if (document.getElementById('filter-radius')?.value) n++;
    if (document.getElementById('filter-favorites')?.checked) n++;
    if (document.getElementById('filter-inview')?.checked) n++;
    return n;
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const n = getActiveFilterCount();
    if (n > 0) {
      badge.textContent = n;
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  function saveFilters() {
    try {
      const state = {
        category: document.getElementById('filter-category')?.value || '',
        visibility: document.getElementById('filter-visibility')?.value || '',
        units: document.getElementById('filter-units')?.value || '',
        seller: document.getElementById('filter-seller')?.value || '',
        minprice: document.getElementById('filter-minprice')?.value || '',
        maxprice: document.getElementById('filter-maxprice')?.value || '',
        radius: document.getElementById('filter-radius')?.value || '',
        sort: document.getElementById('filter-sort')?.value || '',
        favorites: !!document.getElementById('filter-favorites')?.checked,
        inview: !!document.getElementById('filter-inview')?.checked,
        q: document.getElementById('search-input')?.value || ''
      };
      localStorage.setItem(FILTER_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function restoreFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
      set('filter-category', s.category);
      set('filter-visibility', s.visibility);
      set('filter-units', s.units);
      set('filter-seller', s.seller);
      set('filter-minprice', s.minprice);
      set('filter-maxprice', s.maxprice);
      set('filter-radius', s.radius);
      set('filter-sort', s.sort);
      const fav = document.getElementById('filter-favorites');
      if (fav) fav.checked = !!s.favorites;
      const inv = document.getElementById('filter-inview');
      if (inv) inv.checked = !!s.inview;
      const q = document.getElementById('search-input');
      if (q && s.q) q.value = s.q;
    } catch (_) {}
  }

  function populateSelects() {
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
    const fill = (id, arr) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="">Any</option>' + arr.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      if (cur && arr.includes(cur)) sel.value = cur;
    };
    fill('filter-category', cats);
    fill('filter-units', units);
    fill('filter-seller', sellers);
  }

  function clearOneFilter(key) {
    if (key === 'q') {
      const el = document.getElementById('search-input');
      if (el) el.value = '';
    } else if (key === 'favorites') {
      const el = document.getElementById('filter-favorites');
      if (el) el.checked = false;
    } else if (key === 'inview') {
      const el = document.getElementById('filter-inview');
      if (el) el.checked = false;
    } else {
      const el = document.getElementById('filter-' + key);
      if (el) el.value = '';
    }
    applyFilters();
  }

  function renderFilterChips() {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    const chips = [];
    const q = getSearchQuery();
    if (q) chips.push({ key: 'q', label: `Search: “${q}”` });
    const cat = document.getElementById('filter-category')?.value;
    if (cat) chips.push({ key: 'category', label: `Category: ${cat}` });
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) chips.push({ key: 'visibility', label: `Visibility: ${vis}` });
    const units = document.getElementById('filter-units')?.value;
    if (units) chips.push({ key: 'units', label: `Units: ${units}` });
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) chips.push({ key: 'seller', label: `Seller: ${seller}` });
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) chips.push({ key: 'minprice', label: `Min ≥ $${minP}` });
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) chips.push({ key: 'maxprice', label: `Max ≤ $${maxP}` });
    const radius = document.getElementById('filter-radius')?.value;
    if (radius) chips.push({ key: 'radius', label: `Radius ≤ ${radius} km` });
    const sort = document.getElementById('filter-sort')?.value;
    if (sort) {
      const labels = { 'price-asc': 'Price ↑', 'price-desc': 'Price ↓', 'name': 'Name', 'distance': 'Distance' };
      chips.push({ key: 'sort', label: `Sort: ${labels[sort] || sort}` });
    }
    if (document.getElementById('filter-favorites')?.checked) chips.push({ key: 'favorites', label: 'Favorites only' });
    if (document.getElementById('filter-inview')?.checked) chips.push({ key: 'inview', label: 'Only in view' });

    if (!chips.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button type="button" class="chip-clear" data-key="${escapeHtml(c.key)}" title="Remove filter" aria-label="Remove ${escapeHtml(c.label)}">×</button>
      </span>
    `).join('');
    container.querySelectorAll('.chip-clear').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearOneFilter(btn.dataset.key);
      });
    });
  }

  function applyFilters() {
    const q = getSearchQuery();
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value) || 0;
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value) || Infinity;
    const radius = parseFloat(document.getElementById('filter-radius')?.value) || 0;
    const favOnly = document.getElementById('filter-favorites')?.checked;
    const inView = document.getElementById('filter-inview')?.checked;
    const sort = document.getElementById('filter-sort')?.value || '';

    let bounds = null;
    if (inView && global.FD_MAP && typeof global.FD_MAP.getBounds === 'function') {
      bounds = global.FD_MAP.getBounds();
    }

    filtered = allListings.filter(l => {
      if (q) {
        const hay = [l.headerdescription, l.category, l.sellerid, l.address, l.description].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      const p = Number(l.price) || 0;
      if (p < minP || p > maxP) return false;
      if (favOnly && !isFavorite(l.id)) return false;
      if (bounds && l.location) {
        const lat = l.location.lat, lng = l.location.long;
        if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) return false;
      }
      if (radius > 0 && userLocation && l.location) {
        const d = distanceKm(userLocation.lat, userLocation.lng, l.location.lat, l.location.long);
        if (d > radius) return false;
      }
      return true;
    });

    // Sort
    if (sort === 'price-asc') filtered.sort((a,b) => (Number(a.price)||0) - (Number(b.price)||0));
    else if (sort === 'price-desc') filtered.sort((a,b) => (Number(b.price)||0) - (Number(a.price)||0));
    else if (sort === 'name') filtered.sort((a,b) => (a.headerdescription||'').localeCompare(b.headerdescription||''));
    else if (sort === 'distance' && userLocation) {
      filtered.sort((a,b) => {
        const da = a.location ? distanceKm(userLocation.lat, userLocation.lng, a.location.lat, a.location.long) : Infinity;
        const db = b.location ? distanceKm(userLocation.lat, userLocation.lng, b.location.lat, b.location.long) : Infinity;
        return da - db;
      });
    }

    renderList();
    renderFilterChips();
    updateFilterBadge();
    saveFilters();

    // Radius circle
    if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
      global.FD_MAP.setRadiusCircle(radius);
    }

    // Update map markers to filtered set
    if (global.FD_MAP && typeof global.FD_MAP.renderMarkers === 'function') {
      global.FD_MAP.renderMarkers(filtered, { fit: false });
    }
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;
    if (countEl) countEl.textContent = filtered.length;

    if (!filtered.length) {
      const hasFilters = getActiveFilterCount() > 0;
      container.innerHTML = `<div class="empty-state">
        <p>No listings match your filters.</p>
        ${hasFilters ? '<button type="button" id="empty-clear-filters" class="small-btn">Clear filters</button>' : ''}
      </div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      return;
    }

    container.innerHTML = filtered.map(l => {
      const fav = isFavorite(l.id) ? '★' : '☆';
      const price = Number(l.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)} / ${escapeHtml(l.units || '')}`;
      let dist = '';
      if (userLocation && l.location) {
        const d = distanceKm(userLocation.lat, userLocation.lng, l.location.lat, l.location.long);
        dist = `<div class="listing-item-dist">📍 ${d < 1 ? (d*1000).toFixed(0)+' m' : d.toFixed(1)+' km'}</div>`;
      }
      const active = l.id === highlightedId ? ' active' : '';
      return `<div class="listing-item${active}" data-id="${escapeHtml(l.id)}" role="listitem">
        <div class="listing-item-body">
          <div class="listing-item-title">${escapeHtml(l.headerdescription || 'Untitled')}</div>
          <div class="listing-item-meta">${escapeHtml(l.category || '')} · ${priceStr}</div>
          <div class="listing-item-addr">${escapeHtml(l.address || '')}</div>
          ${dist}
        </div>
        <button type="button" class="copy-list-btn" data-id="${escapeHtml(l.id)}" title="Copy link">🔗</button>
        <button type="button" class="fav-btn" data-id="${escapeHtml(l.id)}" title="Favorite">${fav}</button>
      </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.copy-list-btn') || e.target.closest('.fav-btn')) return;
        select(el.dataset.id);
      });
    });
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
    container.querySelectorAll('.copy-list-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const link = location.origin + location.pathname + location.search + '#listing=' + encodeURIComponent(btn.dataset.id);
        try {
          await navigator.clipboard.writeText(link);
          if (global.FD_TOAST) global.FD_TOAST.show('Listing link copied', 'success');
        } catch (_) {
          if (global.FD_TOAST) global.FD_TOAST.show('Could not copy', 'info');
        }
      });
    });
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    highlightedId = id;
    renderList();
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') global.FD_MAP.flyTo(listing);
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') global.FD_CARDS.showProduct(listing);
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') global.FD_RECENT.add(id);
    // scroll into view
    const el = document.querySelector(`.listing-item[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function highlight(id) {
    highlightedId = id;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    if (id && global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
      global.FD_MAP.highlightMarker(id);
    }
  }

  function navigate(dir) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => l.id === highlightedId);
    if (idx < 0) idx = dir > 0 ? -1 : 0;
    idx = (idx + dir + filtered.length) % filtered.length;
    const next = filtered[idx];
    if (next) {
      highlightedId = next.id;
      highlight(next.id);
      if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
        global.FD_MAP.highlightMarker(next.id);
      }
      const el = document.querySelector(`.listing-item[data-id="${CSS.escape(next.id)}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }

  function selectHighlighted() {
    if (highlightedId) select(highlightedId);
  }

  function setUserLocation(loc) {
    userLocation = loc;
    applyFilters();
  }

  function sortByDistance(lat, lng) {
    userLocation = { lat, lng };
    const sortSel = document.getElementById('filter-sort');
    if (sortSel) sortSel.value = 'distance';
    applyFilters();
  }

  function clearDistance() {
    userLocation = null;
    const sortSel = document.getElementById('filter-sort');
    if (sortSel && sortSel.value === 'distance') sortSel.value = '';
    applyFilters();
  }

  function clearAllFilters() {
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = false;
    const inv = document.getElementById('filter-inview');
    if (inv) inv.checked = false;
    const q = document.getElementById('search-input');
    if (q) q.value = '';
    applyFilters();
  }

  function exportFiltered() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-listings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function setListings(list) {
    allListings = Array.isArray(list) ? list : [];
    // Ensure ids
    allListings.forEach((l, i) => { if (!l.id) l.id = 'l' + i; });
    populateSelects();
    restoreFilters();
    applyFilters();
  }

  function bindUI() {
    const filterBtn = document.getElementById('filter-btn');
    const filterCard = document.getElementById('filter-card');
    filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = filterCard && !filterCard.hasAttribute('hidden');
      if (filterCard) filterCard.toggleAttribute('hidden', open);
      filterBtn.setAttribute('aria-expanded', String(!open));
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      filterCard?.setAttribute('hidden', '');
      filterBtn?.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);

    // Live filter changes
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort','filter-favorites','filter-inview'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });

    // Search is handled by search.js, but we listen for its events if needed; applyFilters called from search
  }

  function getListings() { return allListings; }
  function getFiltered() { return filtered; }

  global.FD_LIST = {
    bindUI,
    setListings,
    applyFilters,
    exportFiltered,
    clearFavorites,
    select,
    highlight,
    navigate,
    selectHighlighted,
    setUserLocation,
    sortByDistance,
    clearDistance,
    isFavorite,
    toggleFavorite,
    getListings,
    getFiltered,
    clearAllFilters
  };
})(window);
