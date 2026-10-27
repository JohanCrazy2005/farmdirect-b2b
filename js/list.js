/**
 * FarmDirect B2B – listing list + filter module
 * Sidebar list, filter card, chips, favorites, sort, radius, only-in-view,
 * bidirectional hover highlight with map markers, shareable filtered view links,
 * localStorage persistence of filter state, correct HTML escaping, empty-state clear.
 * Shows distance to each listing when user location is available (Locate me / persisted).
 * Distance is clickable to fly the map; each item has a share button that copies a deep link.
 * Fully client-side; works with seed/demo fallback.
 * Seller filter dropdown and chips use human-readable names from seed-sellers.json when available.
 * Visibility (worldwide|country|province) shown in list meta for clearer schema awareness in seed/demo.
 */
(function (global) {
  'use strict';

  const FILTER_KEY = 'fd-filters';
  const FAV_KEY = 'fd-favorites';

  let allListings = [];
  let filtered = [];
  let userLocation = null; // [lat, lng] or null
  let favorites = new Set();
  let activeId = null;
  let highlightedId = null;
  let filterState = {
    category: '',
    visibility: '',
    units: '',
    seller: '',
    minPrice: '',
    maxPrice: '',
    radius: '',
    sort: '',
    favoritesOnly: false,
    onlyInView: false,
    search: ''
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getSellerName(sellerid) {
    if (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function') {
      return global.FD_SELLERS.getDisplayName(sellerid) || sellerid;
    }
    return sellerid || '';
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) favorites = new Set(JSON.parse(raw));
    } catch (_) {}
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); } catch (_) {}
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        filterState = { ...filterState, ...saved };
      }
    } catch (_) {}
  }

  function saveFilters() {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(filterState)); } catch (_) {}
  }

  function populateFilters() {
    const cats = new Set();
    const units = new Set();
    const sellers = new Map();
    allListings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) sellers.set(l.sellerid, getSellerName(l.sellerid));
    });

    const catSel = document.getElementById('filter-category');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' +
        [...cats].sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (cur) catSel.value = cur;
    }

    const unitSel = document.getElementById('filter-units');
    if (unitSel) {
      const cur = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' +
        [...units].sort().map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      if (cur) unitSel.value = cur;
    }

    const sellerSel = document.getElementById('filter-seller');
    if (sellerSel) {
      const cur = sellerSel.value;
      sellerSel.innerHTML = '<option value="">Any</option>' +
        [...sellers.entries()].sort((a, b) => a[1].localeCompare(b[1]))
          .map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');
      if (cur) sellerSel.value = cur;
    }
  }

  function applyFilters() {
    let list = allListings.slice();

    const q = (filterState.search || '').toLowerCase().trim();
    if (q) {
      list = list.filter(l =>
        (l.headerdescription || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        getSellerName(l.sellerid).toLowerCase().includes(q)
      );
    }

    if (filterState.category) list = list.filter(l => l.category === filterState.category);
    if (filterState.visibility) list = list.filter(l => l.visibility === filterState.visibility);
    if (filterState.units) list = list.filter(l => l.units === filterState.units);
    if (filterState.seller) list = list.filter(l => l.sellerid === filterState.seller);

    const minP = parseFloat(filterState.minPrice);
    if (!isNaN(minP)) list = list.filter(l => l.price != null && Number(l.price) >= minP);
    const maxP = parseFloat(filterState.maxPrice);
    if (!isNaN(maxP)) list = list.filter(l => l.price != null && Number(l.price) <= maxP);

    if (filterState.favoritesOnly) list = list.filter(l => favorites.has(l.id));

    if (userLocation && filterState.radius) {
      const km = parseFloat(filterState.radius);
      if (!isNaN(km) && km > 0) {
        list = list.filter(l => {
          if (!l.location || l.location.lat == null) return false;
          return haversine(userLocation[0], userLocation[1], l.location.lat, l.location.long) <= km;
        });
        if (global.FD_MAP && typeof global.FD_MAP.setRadiusOverlay === 'function') {
          global.FD_MAP.setRadiusOverlay(userLocation, km);
        }
      } else if (global.FD_MAP && typeof global.FD_MAP.clearRadiusOverlay === 'function') {
        global.FD_MAP.clearRadiusOverlay();
      }
    } else if (global.FD_MAP && typeof global.FD_MAP.clearRadiusOverlay === 'function') {
      global.FD_MAP.clearRadiusOverlay();
    }

    if (filterState.onlyInView && global.FD_MAP && typeof global.FD_MAP.getMap === 'function') {
      const map = global.FD_MAP.getMap();
      if (map) {
        const b = map.getBounds();
        list = list.filter(l => {
          if (!l.location || l.location.lat == null) return false;
          return b.contains([l.location.lat, l.location.long]);
        });
      }
    }

    // Distance for sorting / display
    list.forEach(l => {
      l._dist = null;
      if (userLocation && l.location && l.location.lat != null) {
        l._dist = haversine(userLocation[0], userLocation[1], l.location.lat, l.location.long);
      }
    });

    const sort = filterState.sort;
    if (sort === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'name') list.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (sort === 'distance') list.sort((a, b) => (a._dist || Infinity) - (b._dist || Infinity));

    filtered = list;
    renderList();
    renderChips();
    updateFilterBadge();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
    saveFilters();
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;
    if (countEl) countEl.textContent = filtered.length;

    if (!filtered.length) {
      const hasFilters = filterState.category || filterState.visibility || filterState.units ||
        filterState.seller || filterState.minPrice || filterState.maxPrice ||
        filterState.radius || filterState.favoritesOnly || filterState.onlyInView || filterState.search;
      container.innerHTML = `
        <div class="empty-state">
          <p>No listings match the current filters.</p>
          ${hasFilters ? '<button type="button" class="small-btn clear-empty">Clear filters</button>' : ''}
        </div>`;
      container.querySelector('.clear-empty')?.addEventListener('click', clearFilters);
      return;
    }

    container.innerHTML = filtered.map(l => {
      const isFav = favorites.has(l.id);
      const distHtml = l._dist != null
        ? `<button type="button" class="dist-btn" data-id="${escapeHtml(l.id)}" title="Fly to">${l._dist.toFixed(1)} km</button>`
        : '';
      const vis = l.visibility ? `<span class="visibility-badge vis-${escapeHtml(l.visibility)}">${escapeHtml(l.visibility)}</span>` : '';
      return `
        <div class="listing-item${l.id === activeId ? ' active' : ''}${l.id === highlightedId ? ' highlighted' : ''}" data-id="${escapeHtml(l.id)}" role="listitem">
          ${l.image ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="" loading="lazy">` : ''}
          <div class="list-body">
            <div class="list-title">${escapeHtml(l.headerdescription || 'Listing')} ${isFav ? '<span class="fav-star">★</span>' : ''}</div>
            <div class="list-meta">
              <span class="category-badge">${escapeHtml(l.category || '')}</span>
              ${vis}
              <span class="price">${l.price != null ? '$' + Number(l.price).toFixed(2) + (l.units ? ' / ' + escapeHtml(l.units) : '') : ''}</span>
              ${distHtml}
            </div>
            <div class="list-seller muted">${escapeHtml(getSellerName(l.sellerid))}</div>
          </div>
          <button type="button" class="icon-btn share-list-btn" data-id="${escapeHtml(l.id)}" title="Share" aria-label="Share listing">↪</button>
        </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.share-list-btn') || e.target.closest('.dist-btn')) return;
        select(el.dataset.id);
      });
      el.addEventListener('mouseenter', () => highlightListItem(el.dataset.id));
      el.addEventListener('mouseleave', () => highlightListItem(null));
    });

    container.querySelectorAll('.dist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') {
          global.FD_MAP.flyTo(btn.dataset.id);
        }
      });
    });

    container.querySelectorAll('.share-list-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const url = location.origin + location.pathname + '#listing=' + encodeURIComponent(id);
        try {
          await navigator.clipboard.writeText(url);
          if (global.FD_TOAST) global.FD_TOAST.show('Listing link copied', 'success');
        } catch (_) {
          if (global.FD_TOAST) global.FD_TOAST.show(url, 'info');
        }
      });
    });
  }

  function renderChips() {
    const box = document.getElementById('filter-chips');
    if (!box) return;
    const chips = [];
    if (filterState.search) chips.push({ key: 'search', label: 'Search: ' + filterState.search });
    if (filterState.category) chips.push({ key: 'category', label: filterState.category });
    if (filterState.visibility) chips.push({ key: 'visibility', label: filterState.visibility });
    if (filterState.units) chips.push({ key: 'units', label: filterState.units });
    if (filterState.seller) chips.push({ key: 'seller', label: getSellerName(filterState.seller) });
    if (filterState.minPrice) chips.push({ key: 'minPrice', label: 'Min $' + filterState.minPrice });
    if (filterState.maxPrice) chips.push({ key: 'maxPrice', label: 'Max $' + filterState.maxPrice });
    if (filterState.radius) chips.push({ key: 'radius', label: filterState.radius + ' km' });
    if (filterState.favoritesOnly) chips.push({ key: 'favoritesOnly', label: 'Favorites' });
    if (filterState.onlyInView) chips.push({ key: 'onlyInView', label: 'In view' });

    box.innerHTML = chips.map(c =>
      `<button type="button" class="chip" data-key="${escapeHtml(c.key)}">${escapeHtml(c.label)} ×</button>`
    ).join('');

    box.querySelectorAll('.chip').forEach(ch => {
      ch.addEventListener('click', () => {
        const k = ch.dataset.key;
        if (k === 'search') {
          filterState.search = '';
          const inp = document.getElementById('search-input');
          if (inp) inp.value = '';
        } else if (k === 'favoritesOnly' || k === 'onlyInView') {
          filterState[k] = false;
          const id = k === 'favoritesOnly' ? 'filter-favorites' : 'filter-inview';
          const cb = document.getElementById(id);
          if (cb) cb.checked = false;
        } else {
          filterState[k] = '';
          const idMap = {
            category: 'filter-category',
            visibility: 'filter-visibility',
            units: 'filter-units',
            seller: 'filter-seller',
            minPrice: 'filter-minprice',
            maxPrice: 'filter-maxprice',
            radius: 'filter-radius'
          };
          const el = document.getElementById(idMap[k]);
          if (el) el.value = '';
        }
        applyFilters();
      });
    });
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    let n = 0;
    if (filterState.category) n++;
    if (filterState.visibility) n++;
    if (filterState.units) n++;
    if (filterState.seller) n++;
    if (filterState.minPrice) n++;
    if (filterState.maxPrice) n++;
    if (filterState.radius) n++;
    if (filterState.favoritesOnly) n++;
    if (filterState.onlyInView) n++;
    if (filterState.search) n++;
    if (n > 0) {
      badge.textContent = n;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function clearFilters() {
    filterState = {
      category: '',
      visibility: '',
      units: '',
      seller: '',
      minPrice: '',
      maxPrice: '',
      radius: '',
      sort: '',
      favoritesOnly: false,
      onlyInView: false,
      search: ''
    };
    const ids = ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
                 'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const favCb = document.getElementById('filter-favorites');
    if (favCb) favCb.checked = false;
    const invCb = document.getElementById('filter-inview');
    if (invCb) invCb.checked = false;
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    if (global.FD_MAP && typeof global.FD_MAP.clearRadiusOverlay === 'function') {
      global.FD_MAP.clearRadiusOverlay();
    }
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
  }

  function bindFilterInputs() {
    const map = {
      'filter-category': 'category',
      'filter-visibility': 'visibility',
      'filter-units': 'units',
      'filter-seller': 'seller',
      'filter-minprice': 'minPrice',
      'filter-maxprice': 'maxPrice',
      'filter-radius': 'radius',
      'filter-sort': 'sort'
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        filterState[map[id]] = el.value;
        applyFilters();
      });
      if (el.type === 'number') {
        el.addEventListener('input', () => {
          filterState[map[id]] = el.value;
          applyFilters();
        });
      }
    });

    document.getElementById('filter-favorites')?.addEventListener('change', (e) => {
      filterState.favoritesOnly = e.target.checked;
      applyFilters();
    });
    document.getElementById('filter-inview')?.addEventListener('change', (e) => {
      filterState.onlyInView = e.target.checked;
      applyFilters();
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);

    // Filter card open/close
    const card = document.getElementById('filter-card');
    document.getElementById('filter-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (card) card.toggleAttribute('hidden');
      document.getElementById('filter-btn')?.setAttribute('aria-expanded', String(!card?.hasAttribute('hidden')));
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      card?.setAttribute('hidden', '');
      document.getElementById('filter-btn')?.setAttribute('aria-expanded', 'false');
    });
  }

  function select(id) {
    activeId = id;
    const listing = allListings.find(l => l.id === id);
    if (listing && global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') {
      global.FD_MAP.flyTo(id);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.record === 'function') {
      global.FD_RECENT.record(id);
    }
    renderList();
    // Update hash
    try {
      const url = new URL(location.href);
      url.hash = 'listing=' + encodeURIComponent(id);
      history.replaceState(null, '', url);
    } catch (_) {}
  }

  function highlightListItem(id) {
    highlightedId = id;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('highlighted', el.dataset.id === id);
    });
    if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
      global.FD_MAP.highlightMarker(id);
    }
  }

  function onMapMove() {
    if (filterState.onlyInView) applyFilters();
  }

  function setUserLocation(latlng) {
    userLocation = latlng;
    applyFilters();
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    applyFilters();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
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

  function getFavorites() { return favorites; }

  function getFilteredViewLink() {
    const base = location.origin + location.pathname;
    const params = new URLSearchParams();
    if (filterState.category) params.set('cat', filterState.category);
    if (filterState.visibility) params.set('vis', filterState.visibility);
    if (filterState.units) params.set('units', filterState.units);
    if (filterState.seller) params.set('seller', filterState.seller);
    if (filterState.minPrice) params.set('min', filterState.minPrice);
    if (filterState.maxPrice) params.set('max', filterState.maxPrice);
    if (filterState.radius) params.set('r', filterState.radius);
    if (filterState.sort) params.set('sort', filterState.sort);
    if (filterState.favoritesOnly) params.set('fav', '1');
    if (filterState.onlyInView) params.set('view', '1');
    if (filterState.search) params.set('q', filterState.search);
    const hash = params.toString() ? '#filters=' + params.toString() : '';
    return base + hash;
  }

  function exportFiltered() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered-listings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    populateFilters();
    // Restore search input if present
    const searchInp = document.getElementById('search-input');
    if (searchInp && filterState.search) searchInp.value = filterState.search;
    applyFilters();
  }

  function setSearch(q) {
    filterState.search = q || '';
    applyFilters();
  }

  function bindUI() {
    loadFavorites();
    loadFilters();
    bindFilterInputs();
    // Restore checkbox states
    const favCb = document.getElementById('filter-favorites');
    if (favCb) favCb.checked = !!filterState.favoritesOnly;
    const invCb = document.getElementById('filter-inview');
    if (invCb) invCb.checked = !!filterState.onlyInView;
    // Sync other inputs from state (after populate)
    const restore = {
      'filter-category': 'category',
      'filter-visibility': 'visibility',
      'filter-units': 'units',
      'filter-seller': 'seller',
      'filter-minprice': 'minPrice',
      'filter-maxprice': 'maxPrice',
      'filter-radius': 'radius',
      'filter-sort': 'sort'
    };
    Object.keys(restore).forEach(id => {
      const el = document.getElementById(id);
      if (el && filterState[restore[id]]) el.value = filterState[restore[id]];
    });
  }

  function setCategoryFilter(cat) {
    // Toggle: if already set to this cat, clear it; else set
    const newCat = (filterState.category === cat) ? '' : (cat || '');
    filterState.category = newCat;
    const sel = document.getElementById('filter-category');
    if (sel) sel.value = newCat;
    applyFilters();
    if (global.FD_MAP && typeof global.FD_MAP.updateLegendActive === 'function') {
      global.FD_MAP.updateLegendActive(newCat || null);
    }
    if (global.FD_TOAST) {
      global.FD_TOAST.show(newCat ? `Filtered to ${newCat}` : 'Category filter cleared', 'info');
    }
  }

  global.FD_LIST = {
    setListings,
    bindUI,
    select,
    highlightListItem,
    onMapMove,
    setUserLocation,
    toggleFavorite,
    clearFavorites,
    getFavorites,
    getFilteredViewLink,
    exportFiltered,
    setSearch,
    setCategoryFilter,
    applyFilters,
    getListings: () => filtered
  };
})(window);
