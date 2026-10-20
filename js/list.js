/**
 * FarmDirect B2B – sidebar list module
 * Filters (category, visibility, price, units, seller, sort, radius, favorites, in-view),
 * active filter chips, keyboard navigation, list-map hover highlight sync,
 * distance sort after Locate me, localStorage + URL query param persistence,
 * export filtered view, favorites (localStorage). Fully client-side for seed/demo.
 * Empty-state clear filters button when no matches.
 */
(function (global) {
  'use strict';

  const FAVORITES_KEY = 'fd-favorites';
  const FILTER_STATE_KEY = 'fd-filter-state';

  let allListings = [];
  let filtered = [];
  let userLatLng = null;
  let mapMoveHandler = null;

  const DEFAULT_FILTERS = {
    q: '',
    category: '',
    visibility: '',
    minprice: '',
    maxprice: '',
    units: '',
    seller: '',
    sort: '',
    radius: '',
    favorites: false,
    inview: false
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
    } catch (_) {}
  }

  let favorites = loadFavorites();

  function isFavorite(id) {
    return favorites.has(id);
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites(favorites);
    applyFilters();
    return favorites.has(id);
  }

  function clearFavorites() {
    favorites.clear();
    saveFavorites(favorites);
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'success');
  }

  function distanceKm(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatDistance(km) {
    if (!isFinite(km)) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }

  function getFiltersFromUI() {
    const f = { ...DEFAULT_FILTERS };
    f.q = (document.getElementById('search-input')?.value || '').trim();
    f.category = document.getElementById('filter-category')?.value || '';
    f.visibility = document.getElementById('filter-visibility')?.value || '';
    f.minprice = document.getElementById('filter-minprice')?.value || '';
    f.maxprice = document.getElementById('filter-maxprice')?.value || '';
    f.units = document.getElementById('filter-units')?.value || '';
    f.seller = document.getElementById('filter-seller')?.value || '';
    f.sort = document.getElementById('filter-sort')?.value || '';
    f.radius = document.getElementById('filter-radius')?.value || '';
    f.favorites = !!document.getElementById('filter-favorites')?.checked;
    f.inview = !!document.getElementById('filter-inview')?.checked;
    return f;
  }

  function setUIFromFilters(f) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val || '';
    };
    set('search-input', f.q);
    set('filter-category', f.category);
    set('filter-visibility', f.visibility);
    set('filter-minprice', f.minprice);
    set('filter-maxprice', f.maxprice);
    set('filter-units', f.units);
    set('filter-seller', f.seller);
    set('filter-sort', f.sort);
    set('filter-radius', f.radius);
    set('filter-favorites', f.favorites);
    set('filter-inview', f.inview);
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) clearBtn.hidden = !f.q;
  }

  function persistFilters(f) {
    try {
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify(f));
    } catch (_) {}
    // URL query params (shareable)
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v && v !== false && v !== '') params.set(k, v === true ? '1' : String(v));
    });
    const qs = params.toString();
    const newUrl = location.pathname + (qs ? '?' + qs : '') + location.hash;
    if (location.search !== '?' + qs && !(location.search === '' && !qs)) {
      history.replaceState(null, '', newUrl);
    }
  }

  function loadPersistedFilters() {
    // Prefer URL query params
    const params = new URLSearchParams(location.search);
    if ([...params.keys()].length) {
      const f = { ...DEFAULT_FILTERS };
      for (const k of Object.keys(DEFAULT_FILTERS)) {
        const v = params.get(k);
        if (v != null) {
          f[k] = (k === 'favorites' || k === 'inview') ? v === '1' : v;
        }
      }
      return f;
    }
    try {
      const raw = localStorage.getItem(FILTER_STATE_KEY);
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch (_) {}
    return { ...DEFAULT_FILTERS };
  }

  function updateSellerOptions() {
    const sel = document.getElementById('filter-seller');
    if (!sel) return;
    const current = sel.value;
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Any</option>' +
      sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    if (sellers.includes(current)) sel.value = current;
  }

  function isInCurrentMapView(listing) {
    if (!global.FD_MAP || typeof global.FD_MAP.getMap !== 'function') return true;
    const map = global.FD_MAP.getMap();
    if (!map) return true;
    const lat = listing.location?.lat;
    const lng = listing.location?.long;
    if (lat == null || lng == null) return false;
    return map.getBounds().contains([lat, lng]);
  }

  function applyFilters() {
    const f = getFiltersFromUI();
    persistFilters(f);

    let list = allListings.slice();

    if (f.q) {
      const q = f.q.toLowerCase();
      list = list.filter(l =>
        (l.headerdescription || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        (l.sellerid || '').toLowerCase().includes(q)
      );
    }
    if (f.category) list = list.filter(l => l.category === f.category);
    if (f.visibility) list = list.filter(l => l.visibility === f.visibility);
    if (f.units) list = list.filter(l => l.units === f.units);
    if (f.seller) list = list.filter(l => l.sellerid === f.seller);
    if (f.minprice) {
      const n = parseFloat(f.minprice);
      if (!isNaN(n)) list = list.filter(l => Number(l.price) >= n);
    }
    if (f.maxprice) {
      const n = parseFloat(f.maxprice);
      if (!isNaN(n)) list = list.filter(l => Number(l.price) <= n);
    }
    if (f.favorites) list = list.filter(l => favorites.has(l.id));
    if (f.inview) list = list.filter(isInCurrentMapView);

    // Distance radius (requires Locate me)
    if (f.radius && userLatLng) {
      const max = parseFloat(f.radius);
      if (!isNaN(max) && max > 0) {
        list = list.filter(l => {
          const lat = l.location?.lat, lng = l.location?.long;
          return distanceKm(userLatLng.lat, userLatLng.lng, lat, lng) <= max;
        });
      }
    } else if (f.radius && !userLatLng) {
      if (global.FD_TOAST) global.FD_TOAST.show('Locate me first to use distance filter', 'info');
    }

    // Sort
    if (f.sort === 'distance' && userLatLng) {
      list.sort((a, b) => {
        const da = distanceKm(userLatLng.lat, userLatLng.lng, a.location?.lat, a.location?.long);
        const db = distanceKm(userLatLng.lat, userLatLng.lng, b.location?.lat, b.location?.long);
        return da - db;
      });
    } else if (f.sort === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (f.sort === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (f.sort === 'name') {
      list.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    } else if (f.sort === 'distance' && !userLatLng) {
      if (global.FD_TOAST) global.FD_TOAST.show('Locate me first for distance sort', 'info');
    }

    filtered = list;
    renderList();
    renderFilterChips(f);

    // Update map (skip fit when in-view filter active to avoid loop)
    if (global.FD_MAP && typeof global.FD_MAP.renderMarkers === 'function') {
      global.FD_MAP.renderMarkers(filtered, { fit: !f.inview });
    }

    // Radius circle
    if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
      const km = f.radius ? parseFloat(f.radius) : 0;
      global.FD_MAP.setRadiusCircle(isNaN(km) ? 0 : km);
    }

    updateCount();
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌾</div>
          <div>No listings match your filters</div>
          <div style="font-size:0.8rem;margin-top:0.35rem">Try adjusting search or filters</div>
          <button type="button" id="empty-clear-filters" class="clear-filters" style="margin-top:0.75rem">Clear filters</button>
        </div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      return;
    }

    container.innerHTML = filtered.map(l => {
      const lat = l.location?.lat, lng = l.location?.long;
      let dist = '';
      if (userLatLng && lat != null && lng != null) {
        const km = distanceKm(userLatLng.lat, userLatLng.lng, lat, lng);
        const fmt = formatDistance(km);
        if (fmt) dist = `<div class="distance">📍 ${fmt}</div>`;
      }
      const fav = isFavorite(l.id) ? ' active' : '';
      return `
        <div class="listing-card" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
          <img src="${escapeHtml(l.image)}" alt="" onerror="this.style.display='none'">
          <div class="listing-info">
            <h3>${escapeHtml(l.headerdescription)}</h3>
            <div class="meta">${escapeHtml(l.category)} · ${escapeHtml(l.sellerid)}</div>
            <div class="price">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)}</div>
            ${dist}
          </div>
          <button class="favorite-btn${fav}" data-id="${escapeHtml(l.id)}" aria-label="Toggle favorite">♥</button>
        </div>`;
    }).join('');

    // Wire clicks / keyboard
    container.querySelectorAll('.listing-card').forEach(card => {
      const id = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) return;
        select(id);
      });
      card.addEventListener('mouseenter', () => {
        if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
          global.FD_MAP.highlightMarker(id);
        }
      });
      card.addEventListener('mouseleave', () => {
        if (global.FD_MAP && typeof global.FD_MAP.clearMarkerHighlight === 'function') {
          global.FD_MAP.clearMarkerHighlight();
        }
      });
    });

    container.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function renderFilterChips(f) {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    const add = (label, key) => chips.push(`<span class="filter-chip">${escapeHtml(label)} <button type="button" data-key="${key}" aria-label="Remove">×</button></span>`);

    if (f.q) add(`Search: ${f.q}`, 'q');
    if (f.category) add(f.category, 'category');
    if (f.visibility) add(f.visibility, 'visibility');
    if (f.minprice) add(`Min $${f.minprice}`, 'minprice');
    if (f.maxprice) add(`Max $${f.maxprice}`, 'maxprice');
    if (f.units) add(f.units, 'units');
    if (f.seller) add(`Seller: ${f.seller}`, 'seller');
    if (f.sort) add(`Sort: ${f.sort}`, 'sort');
    if (f.radius) add(`≤ ${f.radius} km`, 'radius');
    if (f.favorites) add('Favorites', 'favorites');
    if (f.inview) add('In map view', 'inview');

    el.innerHTML = chips.join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => removeFilter(btn.dataset.key));
    });
  }

  function removeFilter(key) {
    const elMap = {
      q: 'search-input',
      category: 'filter-category',
      visibility: 'filter-visibility',
      minprice: 'filter-minprice',
      maxprice: 'filter-maxprice',
      units: 'filter-units',
      seller: 'filter-seller',
      sort: 'filter-sort',
      radius: 'filter-radius',
      favorites: 'filter-favorites',
      inview: 'filter-inview'
    };
    const id = elMap[key];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
    applyFilters();
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    document.querySelectorAll('.listing-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') {
      global.FD_MAP.flyTo(listing);
    }
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
  }

  function highlight(id) {
    const card = document.querySelector(`.listing-card[data-id="${CSS.escape(id)}"]`);
    if (card) {
      card.classList.add('active');
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function sortByDistance(lat, lng) {
    userLatLng = { lat, lng };
    // Prefer distance sort if not already set
    const sortEl = document.getElementById('filter-sort');
    if (sortEl && !sortEl.value) sortEl.value = 'distance';
    applyFilters();
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = `${filtered.length} of ${allListings.length}`;
  }

  function exportFiltered() {
    try {
      const json = JSON.stringify(filtered, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'farmdirect-filtered-listings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} filtered listings`, 'success');
    } catch (err) {
      if (global.FD_TOAST) global.FD_TOAST.show('Export failed: ' + err.message, 'error');
    }
  }

  function clearAllFilters() {
    setUIFromFilters(DEFAULT_FILTERS);
    applyFilters();
  }

  function bindUI() {
    // Restore persisted state
    const persisted = loadPersistedFilters();
    setUIFromFilters(persisted);

    // Search
    const search = document.getElementById('search-input');
    const clearSearch = document.getElementById('clear-search');
    if (search) {
      search.addEventListener('input', () => {
        if (clearSearch) clearSearch.hidden = !search.value;
        applyFilters();
      });
    }
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        if (search) search.value = '';
        clearSearch.hidden = true;
        applyFilters();
      });
    }

    // Filter controls
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-sort'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    ['filter-minprice', 'filter-maxprice', 'filter-radius'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
    document.getElementById('filter-favorites')?.addEventListener('change', applyFilters);
    document.getElementById('filter-inview')?.addEventListener('change', applyFilters);
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);

    // Filter card toggle
    const filterBtn = document.getElementById('filter-btn');
    const filterCard = document.getElementById('filter-card');
    if (filterBtn && filterCard) {
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterCard.classList.toggle('open');
        filterBtn.setAttribute('aria-expanded', filterCard.classList.contains('open'));
      });
    }

    // Keyboard nav on list
    const listEl = document.getElementById('listing-list');
    if (listEl) {
      listEl.addEventListener('keydown', (e) => {
        const cards = [...listEl.querySelectorAll('.listing-card')];
        if (!cards.length) return;
        const focused = document.activeElement;
        const idx = cards.indexOf(focused);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = cards[Math.min(idx + 1, cards.length - 1)] || cards[0];
          next?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = cards[Math.max(idx - 1, 0)];
          prev?.focus();
        } else if (e.key === 'Enter' && focused && focused.classList.contains('listing-card')) {
          e.preventDefault();
          select(focused.dataset.id);
        }
      });
    }

    // Map moveend for in-view filter
    if (global.FD_MAP && typeof global.FD_MAP.getMap === 'function') {
      const map = global.FD_MAP.getMap();
      if (map && !mapMoveHandler) {
        mapMoveHandler = () => {
          if (document.getElementById('filter-inview')?.checked) applyFilters();
        };
        map.on('moveend', mapMoveHandler);
      }
    }
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    updateSellerOptions();
    applyFilters();
  }

  function getListings() {
    return allListings;
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    getListings,
    select,
    highlight,
    sortByDistance,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    exportFiltered,
    applyFilters
  };
})(window);
