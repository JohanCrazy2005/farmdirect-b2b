/**
 * FarmDirect B2B – sidebar list + filter module
 * Renders filtered listings (with image thumbnails), handles search/filters/favorites/distance/only-in-view,
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
  let highlightedIndex = -1;
  const FAV_KEY = 'fd-favorites';
  const FILTER_KEY = 'fd-filters';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    }
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function saveFavorites(ids) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); } catch (_) {}
  }

  function isFavorite(id) {
    return loadFavorites().includes(id);
  }

  function toggleFavorite(id) {
    const favs = loadFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    saveFavorites(favs);
    applyFilters();
    showToast(idx >= 0 ? 'Removed from favorites' : 'Added to favorites', 'success');
  }

  function clearFavorites() {
    saveFavorites([]);
    applyFilters();
    showToast('Favorites cleared', 'info');
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) { return {}; }
  }

  function saveFilters(state) {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function getFilterState() {
    return {
      search: (document.getElementById('search-input')?.value || '').trim(),
      category: document.getElementById('filter-category')?.value || '',
      visibility: document.getElementById('filter-visibility')?.value || '',
      units: document.getElementById('filter-units')?.value || '',
      seller: document.getElementById('filter-seller')?.value || '',
      minPrice: document.getElementById('filter-minprice')?.value || '',
      maxPrice: document.getElementById('filter-maxprice')?.value || '',
      radius: document.getElementById('filter-radius')?.value || '',
      sort: document.getElementById('filter-sort')?.value || '',
      favorites: !!document.getElementById('filter-favorites')?.checked,
      inview: !!document.getElementById('filter-inview')?.checked
    };
  }

  function setFilterState(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    set('search-input', state.search);
    set('filter-category', state.category);
    set('filter-visibility', state.visibility);
    set('filter-units', state.units);
    set('filter-seller', state.seller);
    set('filter-minprice', state.minPrice);
    set('filter-maxprice', state.maxPrice);
    set('filter-radius', state.radius);
    set('filter-sort', state.sort);
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = !!state.favorites;
    const inv = document.getElementById('filter-inview');
    if (inv) inv.checked = !!state.inview;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function applyFilters() {
    const state = getFilterState();
    saveFilters(state);

    let list = allListings.slice();

    // Search
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(l =>
        (l.headerdescription || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.sellerid || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q)
      );
    }

    // Category / visibility / units / seller
    if (state.category) list = list.filter(l => (l.category || '') === state.category);
    if (state.visibility) list = list.filter(l => (l.visibility || '') === state.visibility);
    if (state.units) list = list.filter(l => (l.units || '') === state.units);
    if (state.seller) list = list.filter(l => (l.sellerid || '') === state.seller);

    // Price
    const minP = parseFloat(state.minPrice);
    const maxP = parseFloat(state.maxPrice);
    if (!isNaN(minP)) list = list.filter(l => Number(l.price) >= minP);
    if (!isNaN(maxP)) list = list.filter(l => Number(l.price) <= maxP);

    // Favorites
    if (state.favorites) {
      const favs = loadFavorites();
      list = list.filter(l => favs.includes(l.id));
    }

    // Radius (requires user location)
    const radius = parseFloat(state.radius);
    if (!isNaN(radius) && radius > 0 && userLocation) {
      list = list.filter(l => {
        const lat = l.location?.lat;
        const lng = l.location?.long;
        if (lat == null || lng == null) return false;
        return haversine(userLocation.lat, userLocation.lng, lat, lng) <= radius;
      });
      if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
        global.FD_MAP.setRadiusCircle(radius);
      }
    } else if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
      global.FD_MAP.setRadiusCircle(0);
    }

    // Only in view
    if (state.inview && global.FD_MAP && typeof global.FD_MAP.getBounds === 'function') {
      const b = global.FD_MAP.getBounds();
      if (b) {
        list = list.filter(l => {
          const lat = l.location?.lat;
          const lng = l.location?.long;
          if (lat == null || lng == null) return false;
          return lat <= b.north && lat >= b.south && lng <= b.east && lng >= b.west;
        });
      }
    }

    // Distance annotation
    if (userLocation) {
      list.forEach(l => {
        const lat = l.location?.lat;
        const lng = l.location?.long;
        if (lat != null && lng != null) {
          l._dist = haversine(userLocation.lat, userLocation.lng, lat, lng);
        } else {
          l._dist = Infinity;
        }
      });
    } else {
      list.forEach(l => { delete l._dist; });
    }

    // Sort
    if (state.sort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (state.sort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (state.sort === 'name') list.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (state.sort === 'distance' && userLocation) list.sort((a, b) => (a._dist || Infinity) - (b._dist || Infinity));

    filtered = list;
    renderList();
    renderChips(state);
    updateBadge(state);
    updateCount();

    // Sync markers
    if (global.FD_MAP && typeof global.FD_MAP.renderMarkers === 'function') {
      global.FD_MAP.renderMarkers(filtered, { fit: false });
    }

    // Restore highlight if still present
    if (highlightedId && !filtered.some(l => l.id === highlightedId)) {
      highlightedId = null;
      highlightedIndex = -1;
    }
    highlight(highlightedId);
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;

    if (!filtered.length) {
      const state = getFilterState();
      const hasActive = Object.entries(state).some(([k, v]) => v && k !== 'sort');
      container.innerHTML = `
        <div class="empty-state">
          <p>No matching listings.</p>
          ${hasActive ? '<button type="button" id="empty-clear-filters" class="small-btn">Clear filters</button>' : ''}
        </div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      return;
    }

    container.innerHTML = filtered.map((l, i) => {
      const price = Number(l.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)} / ${escapeHtml(l.units || '')}`;
      const dist = (l._dist != null && isFinite(l._dist)) ? `<div class="listing-item-dist">${l._dist.toFixed(1)} km</div>` : '';
      const thumb = l.image
        ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="" loading="lazy">`
        : `<div class="list-thumb placeholder"></div>`;
      const fav = isFavorite(l.id) ? '★' : '☆';
      const active = l.id === highlightedId ? ' active' : '';
      return `
        <div class="listing-item${active}" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
          ${thumb}
          <div class="listing-item-body">
            <div class="listing-item-title">${escapeHtml(l.headerdescription || 'Listing')}</div>
            <div class="listing-item-meta">${escapeHtml(l.category || '')} · ${priceStr}</div>
            <div class="listing-item-addr">${escapeHtml(l.address || '')}</div>
            ${dist}
          </div>
          <button type="button" class="fav-btn" data-id="${escapeHtml(l.id)}" title="Favorite" aria-label="Toggle favorite">${fav}</button>
          <button type="button" class="copy-list-btn" data-id="${escapeHtml(l.id)}" title="Copy link" aria-label="Copy listing link">⧉</button>
        </div>`;
    }).join('');

    // Bind item clicks
    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn, .copy-list-btn')) return;
        const id = el.dataset.id;
        select(id);
      });
      el.addEventListener('mouseenter', () => highlight(el.dataset.id));
      el.addEventListener('mouseleave', () => highlight(null));
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
        const id = btn.dataset.id;
        const url = location.origin + location.pathname + '#listing=' + encodeURIComponent(id);
        try {
          await navigator.clipboard.writeText(url);
          showToast('Listing link copied', 'success');
        } catch (_) {
          showToast('Link: ' + url, 'info');
        }
      });
    });
  }

  function renderChips(state) {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    const chips = [];
    if (state.search) chips.push({ key: 'search', label: `Search: ${state.search}` });
    if (state.category) chips.push({ key: 'category', label: `Category: ${state.category}` });
    if (state.visibility) chips.push({ key: 'visibility', label: `Visibility: ${state.visibility}` });
    if (state.units) chips.push({ key: 'units', label: `Units: ${state.units}` });
    if (state.seller) chips.push({ key: 'seller', label: `Seller: ${state.seller}` });
    if (state.minPrice) chips.push({ key: 'minPrice', label: `Min: $${state.minPrice}` });
    if (state.maxPrice) chips.push({ key: 'maxPrice', label: `Max: $${state.maxPrice}` });
    if (state.radius) chips.push({ key: 'radius', label: `Radius: ${state.radius} km` });
    if (state.favorites) chips.push({ key: 'favorites', label: 'Favorites only' });
    if (state.inview) chips.push({ key: 'inview', label: 'Only in view' });
    if (state.sort) chips.push({ key: 'sort', label: `Sort: ${state.sort}` });

    container.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button type="button" data-key="${c.key}" aria-label="Remove ${escapeHtml(c.label)}">×</button>
      </span>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => clearFilter(btn.dataset.key));
    });
  }

  function clearFilter(key) {
    const map = {
      search: 'search-input',
      category: 'filter-category',
      visibility: 'filter-visibility',
      units: 'filter-units',
      seller: 'filter-seller',
      minPrice: 'filter-minprice',
      maxPrice: 'filter-maxprice',
      radius: 'filter-radius',
      sort: 'filter-sort'
    };
    if (key === 'favorites') {
      const el = document.getElementById('filter-favorites');
      if (el) el.checked = false;
    } else if (key === 'inview') {
      const el = document.getElementById('filter-inview');
      if (el) el.checked = false;
    } else if (map[key]) {
      const el = document.getElementById(map[key]);
      if (el) el.value = '';
    }
    applyFilters();
  }

  function updateBadge(state) {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    let count = 0;
    if (state.search) count++;
    if (state.category) count++;
    if (state.visibility) count++;
    if (state.units) count++;
    if (state.seller) count++;
    if (state.minPrice) count++;
    if (state.maxPrice) count++;
    if (state.radius) count++;
    if (state.favorites) count++;
    if (state.inview) count++;
    if (state.sort) count++;
    if (count > 0) {
      badge.textContent = String(count);
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = String(filtered.length);
  }

  function populateDynamicOptions() {
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();

    const fill = (id, values) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      const opts = ['<option value="">All</option>', ...values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)];
      sel.innerHTML = opts.join('');
      if (values.includes(current)) sel.value = current;
    };
    fill('filter-category', cats);
    fill('filter-units', units);
    fill('filter-seller', sellers);
  }

  function highlight(id) {
    highlightedId = id || null;
    highlightedIndex = id ? filtered.findIndex(l => l.id === id) : -1;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
      if (id) global.FD_MAP.highlightMarker(id);
      else if (typeof global.FD_MAP.clearMarkerHighlight === 'function') global.FD_MAP.clearMarkerHighlight();
    }
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id) || filtered.find(l => l.id === id);
    if (!listing) return;
    highlight(id);
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') {
      global.FD_MAP.flyTo(listing);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(listing);
    }
    // Update hash for deep link
    const base = location.pathname + location.search;
    history.replaceState(null, '', base + '#listing=' + encodeURIComponent(id));
  }

  function navigate(delta) {
    if (!filtered.length) return;
    if (highlightedIndex < 0) highlightedIndex = 0;
    else highlightedIndex = Math.max(0, Math.min(filtered.length - 1, highlightedIndex + delta));
    const item = filtered[highlightedIndex];
    if (item) {
      highlight(item.id);
      const el = document.querySelector(`.listing-item[data-id="${item.id}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function selectHighlighted() {
    if (highlightedId) select(highlightedId);
  }

  function clearAllFilters() {
    setFilterState({});
    applyFilters();
    showToast('Filters cleared', 'info');
  }

  function exportFiltered() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmdirect-listings.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} listings`, 'success');
  }

  function setUserLocation(loc) {
    userLocation = loc;
    applyFilters();
  }

  function sortByDistance() {
    const sel = document.getElementById('filter-sort');
    if (sel) sel.value = 'distance';
    applyFilters();
  }

  function clearDistance() {
    userLocation = null;
    const sel = document.getElementById('filter-sort');
    if (sel && sel.value === 'distance') sel.value = '';
    applyFilters();
  }

  function bindUI() {
    // Restore saved filters
    const saved = loadFilters();
    setFilterState(saved);

    // Filter card toggle
    const filterCard = document.getElementById('filter-card');
    const filterBtn = document.getElementById('filter-btn');
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

    // Live filter changes
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
     'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort',
     'filter-favorites', 'filter-inview', 'search-input'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      applyFilters();
    });

    // Initial render if listings already set
    if (allListings.length) applyFilters();
  }

  function setListings(list) {
    allListings = Array.isArray(list) ? list : [];
    populateDynamicOptions();
    applyFilters();
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    applyFilters,
    getListings: () => allListings,
    getFiltered: () => filtered,
    select,
    isFavorite,
    toggleFavorite,
    highlight,
    setUserLocation,
    sortByDistance,
    clearDistance,
    exportFiltered,
    clearFavorites,
    navigate,
    selectHighlighted,
    clearAllFilters
  };
})(window);
