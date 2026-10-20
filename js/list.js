/**
 * FarmDirect B2B – filters & list panel
 * Improved empty & loading states
 * + distance sort after geolocation (seed/demo friendly)
 * + general Sort control (distance / price / name) in filter card
 * + distance radius filter after Locate me (client-side, demo friendly)
 * + units filter (schema field; seed/demo friendly)
 * + min price filter (complements max price; seed/demo friendly)
 * + clear-search button in top bar (seed/demo friendly)
 * + proper HTML escaping in list cards (prevents broken markup from special chars in seed data)
 * + favorites: heart toggle, localStorage, Favorites-only filter (seed/demo friendly)
 * + toast notifications for distance sort/radius precondition warnings (non-blocking; seed/demo friendly)
 * + clear all favorites (options menu; localStorage; seed/demo friendly)
 * + persist filter/search state in localStorage (survives reloads; seed/demo friendly)
 * + export filtered view as JSON (options menu; downloads current filtered listings; seed/demo friendly)
 * + shareable filter links via URL query params (options menu copies current view; restores on load; seed/demo friendly)
 * + sellerid filter in filter card (select populated from current data; fully client-side for demo)
 */
(function (global) {
  'use strict';

  const FILTER_KEY = 'fd-filters';
  const FILTER_PARAMS = ['q', 'category', 'visibility', 'minPrice', 'maxPrice', 'sort', 'radius', 'units', 'favoritesOnly', 'seller'];

  let allListings = [];
  let filtered = [];
  let activeFilters = loadFilters();
  let hasLoaded = false;
  let userLatLng = null; // {lat, lng} after Locate me

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (!raw) return defaultFilters();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultFilters(), parsed);
    } catch {
      return defaultFilters();
    }
  }

  function defaultFilters() {
    return { q: '', category: '', visibility: '', minPrice: '', maxPrice: '', sort: '', radius: '', units: '', favoritesOnly: false, seller: '' };
  }

  function saveFilters() {
    try {
      localStorage.setItem(FILTER_KEY, JSON.stringify(activeFilters));
    } catch (e) {
      console.warn('Could not persist filters', e);
    }
  }

  function syncFiltersToURL() {
    try {
      const url = new URL(location.href);
      FILTER_PARAMS.forEach(k => url.searchParams.delete(k));
      if (activeFilters.q) url.searchParams.set('q', activeFilters.q);
      if (activeFilters.category) url.searchParams.set('category', activeFilters.category);
      if (activeFilters.visibility) url.searchParams.set('visibility', activeFilters.visibility);
      if (activeFilters.minPrice) url.searchParams.set('minPrice', activeFilters.minPrice);
      if (activeFilters.maxPrice) url.searchParams.set('maxPrice', activeFilters.maxPrice);
      if (activeFilters.sort) url.searchParams.set('sort', activeFilters.sort);
      if (activeFilters.radius) url.searchParams.set('radius', activeFilters.radius);
      if (activeFilters.units) url.searchParams.set('units', activeFilters.units);
      if (activeFilters.favoritesOnly) url.searchParams.set('favoritesOnly', '1');
      if (activeFilters.seller) url.searchParams.set('seller', activeFilters.seller);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {
      console.warn('Could not sync filters to URL', e);
    }
  }

  function loadFiltersFromURL() {
    try {
      const params = new URLSearchParams(location.search);
      const hasAny = FILTER_PARAMS.some(k => params.has(k));
      if (!hasAny) return false;
      if (params.has('q')) activeFilters.q = params.get('q') || '';
      if (params.has('category')) activeFilters.category = params.get('category') || '';
      if (params.has('visibility')) activeFilters.visibility = params.get('visibility') || '';
      if (params.has('minPrice')) activeFilters.minPrice = params.get('minPrice') || '';
      if (params.has('maxPrice')) activeFilters.maxPrice = params.get('maxPrice') || '';
      if (params.has('sort')) activeFilters.sort = params.get('sort') || '';
      if (params.has('radius')) activeFilters.radius = params.get('radius') || '';
      if (params.has('units')) activeFilters.units = params.get('units') || '';
      if (params.has('favoritesOnly')) {
        const v = (params.get('favoritesOnly') || '').toLowerCase();
        activeFilters.favoritesOnly = ['1', 'true', 'yes'].includes(v);
      }
      if (params.has('seller')) activeFilters.seller = params.get('seller') || '';
      return true;
    } catch (e) {
      console.warn('Could not load filters from URL', e);
      return false;
    }
  }

  function setListings(listings) {
    allListings = listings || [];
    hasLoaded = true;
    updateSellerOptions();
    applyFilters();
  }

  function getListings() {
    return allListings;
  }

  function getFavorites() {
    try {
      const raw = localStorage.getItem('fd-favorites');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    if (!id) return false;
    let favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(id);
    }
    try {
      localStorage.setItem('fd-favorites', JSON.stringify(favs));
    } catch (e) {
      console.warn('Could not save favorites', e);
    }
    applyFilters();
    if (global.FD_CARDS && typeof global.FD_CARDS.updateFavoriteButton === 'function') {
      global.FD_CARDS.updateFavoriteButton(id);
    }
    return favs.includes(id);
  }

  function clearFavorites() {
    try {
      localStorage.removeItem('fd-favorites');
    } catch (e) {
      console.warn('Could not clear favorites', e);
    }
    applyFilters();
    if (global.FD_CARDS && typeof global.FD_CARDS.updateFavoriteButton === 'function') {
      const openCard = document.getElementById('product-card');
      if (openCard && openCard.classList.contains('open')) {
        const btn = openCard.querySelector('.favorite-product-btn');
        if (btn) {
          btn.classList.remove('active');
          btn.innerHTML = '♡ Favorite';
        }
      }
    }
    showToast('Favorites cleared', 'success');
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type);
    } else {
      console.log(msg);
    }
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

  function applySort(items) {
    const mode = activeFilters.sort;
    if (!mode || !items.length) return items;

    const sorted = items.slice();
    if (mode === 'distance' && userLatLng) {
      sorted.sort((a, b) => {
        const da = distanceKm(userLatLng.lat, userLatLng.lng, a.location?.lat, a.location?.long);
        const db = distanceKm(userLatLng.lat, userLatLng.lng, b.location?.lat, b.location?.long);
        return da - db;
      });
    } else if (mode === 'price-asc') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (mode === 'price-desc') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (mode === 'name') {
      sorted.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || '', undefined, { sensitivity: 'base' }));
    }
    return sorted;
  }

  function applyFilters() {
    const q = (activeFilters.q || '').toLowerCase();
    const radiusKm = activeFilters.radius ? Number(activeFilters.radius) : null;
    const minP = activeFilters.minPrice ? Number(activeFilters.minPrice) : null;
    const maxP = activeFilters.maxPrice ? Number(activeFilters.maxPrice) : null;
    const favs = activeFilters.favoritesOnly ? getFavorites() : null;

    let next = allListings.filter(l => {
      if (q && !(
        (l.headerdescription || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q)
      )) return false;
      if (activeFilters.category && l.category !== activeFilters.category) return false;
      if (activeFilters.visibility && l.visibility !== activeFilters.visibility) return false;
      const price = Number(l.price);
      if (minP != null && price < minP) return false;
      if (maxP != null && price > maxP) return false;
      if (activeFilters.units && l.units !== activeFilters.units) return false;
      if (activeFilters.seller && l.sellerid !== activeFilters.seller) return false;
      if (favs && !favs.includes(l.id)) return false;
      if (radiusKm != null && userLatLng && l.location) {
        const d = distanceKm(userLatLng.lat, userLatLng.lng, l.location.lat, l.location.long);
        if (d > radiusKm) return false;
      }
      return true;
    });

    filtered = applySort(next);

    renderList();
    if (global.FD_MAP && global.FD_MAP.renderMarkers) {
      global.FD_MAP.renderMarkers(filtered);
    }
    if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
      global.FD_MAP.setRadiusCircle(radiusKm && userLatLng ? radiusKm : 0);
    }
    updateCount();
    updateMapOverlay();
    updateClearSearchVisibility();
    saveFilters();
    syncFiltersToURL();
  }

  function sortByDistance(lat, lng) {
    userLatLng = { lat, lng };
    activeFilters.sort = 'distance';
    const sortSel = document.getElementById('filter-sort');
    if (sortSel) sortSel.value = 'distance';
    applyFilters();
  }

  function clearDistanceSort() {
    userLatLng = null;
    if (activeFilters.sort === 'distance') {
      activeFilters.sort = '';
      const sortSel = document.getElementById('filter-sort');
      if (sortSel) sortSel.value = '';
    }
    applyFilters();
  }

  function hasActiveFilters() {
    return !!(activeFilters.q || activeFilters.category || activeFilters.visibility || activeFilters.minPrice || activeFilters.maxPrice || activeFilters.sort || activeFilters.radius || activeFilters.units || activeFilters.favoritesOnly || activeFilters.seller);
  }

  function formatDistance(km) {
    if (!isFinite(km)) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;

    if (!hasLoaded) {
      return;
    }

    if (!filtered.length) {
      if (!allListings.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">🗺️</div>
            <h4>No listings yet</h4>
            <p>The map is empty. Deploy the Worker or check the seed file.</p>
          </div>`;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">🔍</div>
            <h4>No matches</h4>
            <p>No listings match your current filters.</p>
            ${hasActiveFilters() ? '<button type="button" id="empty-clear">Clear filters</button>' : ''}
          </div>`;
        const btn = document.getElementById('empty-clear');
        if (btn) btn.addEventListener('click', clearFilters);
      }
      return;
    }

    const showDistance = activeFilters.sort === 'distance' && userLatLng;

    container.innerHTML = filtered.map(l => {
      let distHtml = '';
      if (showDistance && l.location) {
        const km = distanceKm(userLatLng.lat, userLatLng.lng, l.location.lat, l.location.long);
        distHtml = `<div class="distance">${formatDistance(km)}</div>`;
      }
      const fav = isFavorite(l.id);
      const heart = `<button class="favorite-btn${fav ? ' active' : ''}" type="button" aria-label="${fav ? 'Remove from favorites' : 'Add to favorites'}" onclick="event.stopPropagation(); FD_LIST.toggleFavorite('${escapeAttr(l.id)}')">${fav ? '♥' : '♡'}</button>`;
      return `
      <div class="listing-card" data-id="${escapeAttr(l.id)}" onclick="FD_LIST.select('${escapeAttr(l.id)}')" role="listitem" tabindex="0">
        ${heart}
        <img src="${escapeAttr(l.image)}" alt="" onerror="this.style.background='var(--hover-bg)'">
        <div class="listing-info">
          <h3>${escapeHtml(l.headerdescription)}</h3>
          <div class="meta">${escapeHtml(l.category)} · ${escapeHtml(l.visibility)}</div>
          <div class="price">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)}</div>
          ${distHtml}
        </div>
      </div>
    `; }).join('');
  }

  function select(id) {
    document.querySelectorAll('.listing-card').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    const listing = filtered.find(l => l.id === id) || allListings.find(l => l.id === id);
    if (listing) {
      if (global.FD_MAP && global.FD_MAP.flyTo) global.FD_MAP.flyTo(listing);
      if (global.FD_CARDS && global.FD_CARDS.showProduct) global.FD_CARDS.showProduct(listing);
    }
  }

  function highlight(id) {
    document.querySelectorAll('.listing-card').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    const el = document.querySelector(`.listing-card[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = hasLoaded ? `${filtered.length} of ${allListings.length}` : '';
  }

  function updateMapOverlay() {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    if (!hasLoaded) return;

    if (!filtered.length) {
      const msg = !allListings.length
        ? 'No listings available'
        : 'No listings in view';
      overlay.innerHTML = `<div class="overlay-content"><div class="empty-icon" style="font-size:1.6rem;margin-bottom:0.4rem">🗺️</div><div>${msg}</div></div>`;
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  function updateClearSearchVisibility() {
    const btn = document.getElementById('clear-search');
    if (!btn) return;
    const hasQ = !!(activeFilters.q && activeFilters.q.trim());
    if (hasQ) btn.removeAttribute('hidden');
    else btn.setAttribute('hidden', '');
  }

  function clearSearch() {
    activeFilters.q = '';
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    applyFilters();
  }

  function updateSellerOptions() {
    const sel = document.getElementById('filter-seller');
    if (!sel) return;
    const current = activeFilters.seller || '';
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const opts = ['<option value="">Any</option>'].concat(
      sellers.map(s => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`)
    );
    sel.innerHTML = opts.join('');
    if (sellers.includes(current)) {
      sel.value = current;
    } else {
      sel.value = '';
      if (current) activeFilters.seller = '';
    }
  }

  function clearFilters() {
    activeFilters = defaultFilters();
    try { localStorage.removeItem(FILTER_KEY); } catch {}
    const search = document.getElementById('search-input');
    const cat = document.getElementById('filter-category');
    const vis = document.getElementById('filter-visibility');
    const minPrice = document.getElementById('filter-minprice');
    const maxPrice = document.getElementById('filter-maxprice');
    const sort = document.getElementById('filter-sort');
    const radius = document.getElementById('filter-radius');
    const units = document.getElementById('filter-units');
    const seller = document.getElementById('filter-seller');
    const favsOnly = document.getElementById('filter-favorites');
    if (search) search.value = '';
    if (cat) cat.value = '';
    if (vis) vis.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (sort) sort.value = '';
    if (radius) radius.value = '';
    if (units) units.value = '';
    if (seller) seller.value = '';
    if (favsOnly) favsOnly.checked = false;
    applyFilters();
    document.getElementById('filter-card')?.classList.remove('open');
  }

  function restoreFilterUI() {
    const search = document.getElementById('search-input');
    const cat = document.getElementById('filter-category');
    const vis = document.getElementById('filter-visibility');
    const minPrice = document.getElementById('filter-minprice');
    const maxPrice = document.getElementById('filter-maxprice');
    const sort = document.getElementById('filter-sort');
    const radius = document.getElementById('filter-radius');
    const units = document.getElementById('filter-units');
    const seller = document.getElementById('filter-seller');
    const favsOnly = document.getElementById('filter-favorites');
    if (search) search.value = activeFilters.q || '';
    if (cat) cat.value = activeFilters.category || '';
    if (vis) vis.value = activeFilters.visibility || '';
    if (minPrice) minPrice.value = activeFilters.minPrice || '';
    if (maxPrice) maxPrice.value = activeFilters.maxPrice || '';
    if (sort) sort.value = activeFilters.sort || '';
    if (radius) radius.value = activeFilters.radius || '';
    if (units) units.value = activeFilters.units || '';
    if (seller) seller.value = activeFilters.seller || '';
    if (favsOnly) favsOnly.checked = !!activeFilters.favoritesOnly;
    updateClearSearchVisibility();
  }

  function bindUI() {
    if (loadFiltersFromURL()) {
      // URL params take precedence over localStorage for shareable links
    }
    restoreFilterUI();

    const search = document.getElementById('search-input');
    if (search) {
      search.addEventListener('input', e => {
        activeFilters.q = e.target.value;
        applyFilters();
      });
    }
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', clearSearch);
    }
    const cat = document.getElementById('filter-category');
    if (cat) {
      cat.addEventListener('change', e => {
        activeFilters.category = e.target.value;
        applyFilters();
      });
    }
    const vis = document.getElementById('filter-visibility');
    if (vis) {
      vis.addEventListener('change', e => {
        activeFilters.visibility = e.target.value;
        applyFilters();
      });
    }
    const minPrice = document.getElementById('filter-minprice');
    if (minPrice) {
      minPrice.addEventListener('input', e => {
        activeFilters.minPrice = e.target.value;
        applyFilters();
      });
    }
    const maxPrice = document.getElementById('filter-maxprice');
    if (maxPrice) {
      maxPrice.addEventListener('input', e => {
        activeFilters.maxPrice = e.target.value;
        applyFilters();
      });
    }
    const units = document.getElementById('filter-units');
    if (units) {
      units.addEventListener('change', e => {
        activeFilters.units = e.target.value;
        applyFilters();
      });
    }
    const seller = document.getElementById('filter-seller');
    if (seller) {
      seller.addEventListener('change', e => {
        activeFilters.seller = e.target.value;
        applyFilters();
      });
    }
    const sort = document.getElementById('filter-sort');
    if (sort) {
      sort.addEventListener('change', e => {
        activeFilters.sort = e.target.value;
        if (activeFilters.sort === 'distance' && !userLatLng) {
          showToast('Use the Locate me button first to enable distance sorting.', 'warning');
          e.target.value = '';
          activeFilters.sort = '';
        }
        applyFilters();
      });
    }
    const radius = document.getElementById('filter-radius');
    if (radius) {
      radius.addEventListener('input', e => {
        const val = e.target.value;
        if (val && !userLatLng) {
          showToast('Use the Locate me button first to enable distance filtering.', 'warning');
          e.target.value = '';
          activeFilters.radius = '';
        } else {
          activeFilters.radius = val;
        }
        applyFilters();
      });
    }
    const favsOnly = document.getElementById('filter-favorites');
    if (favsOnly) {
      favsOnly.addEventListener('change', e => {
        activeFilters.favoritesOnly = e.target.checked;
        applyFilters();
      });
    }
    const clear = document.getElementById('clear-filters');
    if (clear) {
      clear.addEventListener('click', clearFilters);
    }
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        document.getElementById('filter-card')?.classList.toggle('open');
        filterBtn.classList.toggle('active');
      });
    }
  }

  function exportFiltered() {
    if (!filtered || !filtered.length) {
      showToast('No listings in the current filtered view to export.', 'warning');
      return { ok: false, count: 0 };
    }
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
      showToast(`Exported ${filtered.length} filtered listings`, 'success');
      return { ok: true, count: filtered.length };
    } catch (err) {
      showToast('Export failed: ' + (err.message || 'unknown error'), 'error');
      return { ok: false, error: err.message };
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  global.FD_LIST = { setListings, getListings, select, highlight, applyFilters, bindUI, clearFilters, sortByDistance, clearDistanceSort, clearSearch, toggleFavorite, isFavorite, getFavorites, clearFavorites, exportFiltered };
})(window);
