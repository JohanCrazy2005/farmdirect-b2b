/**
 * FarmDirect B2B – listing list + filter module
 * Sidebar list, filter card, chips, favorites, sort, radius, only-in-view,
 * bidirectional hover highlight with map markers, shareable filtered view links,
 * localStorage persistence of filter state, HTML escaping, empty-state clear.
 * Fully client-side; works with seed/demo fallback.
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

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      favorites = new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      favorites = new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    } catch (_) {}
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveFilters(state) {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getFilterState() {
    return {
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
      search: document.getElementById('search-input')?.value || ''
    };
  }

  function applyFilterState(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    set('filter-category', state.category);
    set('filter-visibility', state.visibility);
    set('filter-units', state.units);
    set('filter-seller', state.seller);
    set('filter-minprice', state.minprice);
    set('filter-maxprice', state.maxprice);
    set('filter-radius', state.radius);
    set('filter-sort', state.sort);
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = !!state.favorites;
    const inv = document.getElementById('filter-inview');
    if (inv) inv.checked = !!state.inview;
    const search = document.getElementById('search-input');
    if (search && state.search != null) search.value = state.search;
  }

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function inCurrentView(listing) {
    if (!listing.location) return false;
    const map = global.FD_MAP && global.FD_MAP.getMap && global.FD_MAP.getMap();
    if (!map) return true;
    const bounds = map.getBounds();
    return bounds.contains([listing.location.lat, listing.location.long]);
  }

  function applyFilters() {
    const state = getFilterState();
    saveFilters(state);

    const q = (state.search || '').toLowerCase().trim();
    const minP = state.minprice !== '' ? parseFloat(state.minprice) : -Infinity;
    const maxP = state.maxprice !== '' ? parseFloat(state.maxprice) : Infinity;
    const radius = state.radius !== '' ? parseFloat(state.radius) : null;

    filtered = allListings.filter(l => {
      if (state.category && l.category !== state.category) return false;
      if (state.visibility && l.visibility !== state.visibility) return false;
      if (state.units && l.units !== state.units) return false;
      if (state.seller && l.sellerid !== state.seller) return false;
      if (state.favorites && !favorites.has(l.id)) return false;
      const price = l.price != null ? Number(l.price) : null;
      if (price != null && (price < minP || price > maxP)) return false;
      if (radius != null && radius > 0 && userLocation && l.location) {
        const d = distanceKm(userLocation[0], userLocation[1], l.location.lat, l.location.long);
        if (d > radius) return false;
      }
      if (state.inview && !inCurrentView(l)) return false;
      if (q) {
        const hay = [
          l.headerdescription, l.description, l.category, l.address,
          l.sellerid, l.units
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Sort
    if (state.sort === 'price-asc') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (state.sort === 'price-desc') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (state.sort === 'name') {
      filtered.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    } else if (state.sort === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const da = a.location ? distanceKm(userLocation[0], userLocation[1], a.location.lat, a.location.long) : Infinity;
        const db = b.location ? distanceKm(userLocation[0], userLocation[1], b.location.lat, b.location.long) : Infinity;
        return da - db;
      });
    }

    renderList();
    renderChips(state);
    updateFilterBadge(state);
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
    if (global.FD_MAP && typeof global.FD_MAP.updateLegendActive === 'function') {
      global.FD_MAP.updateLegendActive(state.category);
    }
    if (global.FD_MAP && typeof global.FD_MAP.setRadiusOverlay === 'function') {
      if (radius && radius > 0 && userLocation) {
        global.FD_MAP.setRadiusOverlay(userLocation, radius);
      } else {
        global.FD_MAP.clearRadiusOverlay();
      }
    }
  }

  function updateFilterBadge(state) {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    let n = 0;
    if (state.category) n++;
    if (state.visibility) n++;
    if (state.units) n++;
    if (state.seller) n++;
    if (state.minprice) n++;
    if (state.maxprice) n++;
    if (state.radius) n++;
    if (state.sort) n++;
    if (state.favorites) n++;
    if (state.inview) n++;
    if (state.search) n++;
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function renderChips(state) {
    const box = document.getElementById('filter-chips');
    if (!box) return;
    const chips = [];
    const add = (label, clearKey) => {
      chips.push(`<span class="chip">${escapeHtml(label)} <button type="button" data-clear="${clearKey}" aria-label="Clear ${escapeHtml(label)}">×</button></span>`);
    };
    if (state.category) add(state.category, 'category');
    if (state.visibility) add(state.visibility, 'visibility');
    if (state.units) add(state.units, 'units');
    if (state.seller) add(state.seller, 'seller');
    if (state.minprice) add(`≥ $${state.minprice}`, 'minprice');
    if (state.maxprice) add(`≤ $${state.maxprice}`, 'maxprice');
    if (state.radius) add(`${state.radius} km`, 'radius');
    if (state.sort) add(state.sort, 'sort');
    if (state.favorites) add('Favorites', 'favorites');
    if (state.inview) add('In view', 'inview');
    if (state.search) add(`“${state.search}”`, 'search');
    box.innerHTML = chips.join('');
    box.querySelectorAll('button[data-clear]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.clear;
        if (key === 'search') {
          const inp = document.getElementById('search-input');
          if (inp) inp.value = '';
        } else if (key === 'favorites' || key === 'inview') {
          const el = document.getElementById('filter-' + key);
          if (el) el.checked = false;
        } else {
          const el = document.getElementById('filter-' + key);
          if (el) el.value = '';
        }
        applyFilters();
      });
    });
  }

  function getCategoryColor(cat) {
    return (global.FD_MAP && global.FD_MAP.getCategoryColor) ? global.FD_MAP.getCategoryColor(cat) : '#40916c';
  }

  function renderList() {
    const list = document.getElementById('listing-list');
    const count = document.getElementById('list-count');
    if (!list) return;
    if (count) count.textContent = String(filtered.length);

    if (!filtered.length) {
      const state = getFilterState();
      const hasFilters = state.category || state.visibility || state.units || state.seller ||
        state.minprice || state.maxprice || state.radius || state.sort || state.favorites ||
        state.inview || state.search;
      list.innerHTML = `<div class="empty-state">
        <p>No listings match the current filters.</p>
        ${hasFilters ? '<button type="button" id="empty-clear-filters" class="small-btn">Clear filters</button>' : ''}
      </div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      return;
    }

    list.innerHTML = filtered.map(l => {
      const color = getCategoryColor(l.category);
      const price = l.price != null ? `$${Number(l.price).toFixed(2)}/${escapeHtml(l.units || '')}` : 'Price on request';
      const isFav = favorites.has(l.id);
      const isActive = l.id === activeId;
      const isHover = l.id === highlightedId;
      return `<div class="listing-item${isActive ? ' active' : ''}${isHover ? ' map-hover' : ''}" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
        <span class="cat-swatch" style="background:${color}"></span>
        <div class="listing-main">
          <div class="listing-title">${escapeHtml(l.headerdescription || 'Listing')}</div>
          <div class="listing-meta">${escapeHtml(l.category || '')} · ${escapeHtml(l.address || '')}</div>
          <div class="listing-price">${price}</div>
        </div>
        <button type="button" class="fav-btn" data-id="${escapeHtml(l.id)}" aria-label="${isFav ? 'Remove favorite' : 'Add favorite'}">${isFav ? '★' : '☆'}</button>
      </div>`;
    }).join('');

    list.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(item.dataset.id);
        }
      });
      item.addEventListener('mouseenter', () => {
        if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
          global.FD_MAP.highlightMarker(item.dataset.id);
        }
      });
      item.addEventListener('mouseleave', () => {
        if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
          global.FD_MAP.highlightMarker(null);
        }
      });
    });
    list.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (favorites.has(id)) favorites.delete(id);
        else favorites.add(id);
        saveFavorites();
        applyFilters();
      });
    });
  }

  function select(id) {
    activeId = id;
    const l = allListings.find(x => x.id === id);
    if (!l) return;
    renderList();
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function') {
      global.FD_MAP.flyTo(id);
    }
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(l);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(l);
    }
    try {
      history.replaceState(null, '', '#listing=' + encodeURIComponent(id));
    } catch (_) {}
  }

  function highlightListItem(id) {
    highlightedId = id;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('map-hover', el.dataset.id === id);
    });
  }

  function onMapMove() {
    const inv = document.getElementById('filter-inview');
    if (inv && inv.checked) {
      applyFilters();
    }
  }

  function setUserLocation(latlng) {
    userLocation = latlng;
    applyFilters();
  }

  function clearAllFilters() {
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
     'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = false;
    const inv = document.getElementById('filter-inview');
    if (inv) inv.checked = false;
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    applyFilters();
  }

  function populateSelects() {
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();

    const fill = (id, values, anyLabel) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      sel.innerHTML = `<option value="">${anyLabel}</option>` +
        values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      if (values.includes(current)) sel.value = current;
    };
    fill('filter-category', cats, 'All');
    fill('filter-units', units, 'Any');
    fill('filter-seller', sellers, 'Any');
  }

  function getFilteredViewLink() {
    const state = getFilterState();
    const params = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => {
      if (v && v !== false) params.set(k, String(v));
    });
    const base = location.origin + location.pathname;
    const mapPart = (global.FD_MAP && global.FD_MAP.getMapViewLink) ? global.FD_MAP.getMapViewLink().split('#')[1] || '' : '';
    const hash = [mapPart, params.toString() ? 'f=' + encodeURIComponent(params.toString()) : ''].filter(Boolean).join('&');
    return base + (hash ? '#' + hash : '');
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

  function clearFavorites() {
    favorites.clear();
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function bindUI() {
    loadFavorites();

    const filterCard = document.getElementById('filter-card');
    const filterBtn = document.getElementById('filter-btn');
    filterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filterCard) {
        const open = !filterCard.hasAttribute('hidden');
        filterCard.toggleAttribute('hidden', open);
        filterBtn.setAttribute('aria-expanded', String(!open));
      }
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      filterCard?.setAttribute('hidden', '');
      filterBtn?.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (e) => {
      if (filterCard && !filterCard.hasAttribute('hidden') &&
          !filterCard.contains(e.target) && e.target.id !== 'filter-btn') {
        filterCard.setAttribute('hidden', '');
        filterBtn?.setAttribute('aria-expanded', 'false');
      }
    });

    const inputs = ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
                    'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort',
                    'filter-favorites', 'filter-inview'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', applyFilters);
      if (el && (el.type === 'number' || el.type === 'text')) {
        el.addEventListener('input', () => {
          clearTimeout(el._debounce);
          el._debounce = setTimeout(applyFilters, 300);
        });
      }
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);

    // Restore saved filters after a short delay so selects exist
    setTimeout(() => {
      const saved = loadFilters();
      if (Object.keys(saved).length) {
        applyFilterState(saved);
        applyFilters();
      }
    }, 100);
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    populateSelects();
    applyFilters();
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    applyFilters,
    select,
    highlightListItem,
    onMapMove,
    setUserLocation,
    getFilteredViewLink,
    exportFiltered,
    clearFavorites,
    getFiltered: () => filtered.slice()
  };
})(window);
