/**
 * FarmDirect B2B – listings sidebar + filtering
 * Holds the current set of listings (from API / seed / demo), applies filters,
 * renders the list, handles selection (opens product card + flies map),
 * favorites (localStorage), and navigation. Fully client-side.
 * Includes random listing picker, Nearby quick filter (25 km toggle + distance sort),
 * sidebar sort (price ↑/↓ or distance when location is known), Fit map,
 * Only-in-map-view filter, Favorites quick toggle, shareable filtered-view links,
 * Clear & fit reset, Locate button, active-filter count badge on the filter icon,
 * clickable filtered/total count, Group-by-seller toggle, and removable filter chips.
 * Works with seed/demo and live modes. Matches current index.html IDs.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  const NEARBY_KM = 25;
  let allListings = [];
  let filtered = [];
  let selectedId = null;
  let filters = {
    q: '',
    category: '',
    seller: '',
    visibility: '',
    units: '',
    minPrice: null,
    maxPrice: null,
    favoritesOnly: false,
    nearby: false,
    inView: false,
    sort: 'default'
  };
  let groupBySeller = false;

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveFavorites(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function isFavorite(id) { return getFavorites().includes(id); }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(id);
    saveFavorites(favs);
    render();
    if (global.FD_TOAST) global.FD_TOAST.show(idx >= 0 ? 'Removed from favorites' : 'Added to favorites', 'info');
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function getUserLocation() {
    return (global.FD_MAP && global.FD_MAP.getUserLocation) ? global.FD_MAP.getUserLocation() : null;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanceFor(listing, userPos) {
    if (!userPos || !listing?.location) return null;
    const lat = Number(listing.location.lat), lng = Number(listing.location.long);
    if (isNaN(lat) || isNaN(lng)) return null;
    return haversineKm(userPos.lat, userPos.lng || userPos.long, lat, lng);
  }

  function isInCurrentView(listing) {
    if (!filters.inView) return true;
    const map = global.FD_MAP?.getMap?.();
    if (!map?.getBounds) return true;
    const bounds = map.getBounds();
    const loc = listing.location || {};
    const lat = Number(loc.lat), lng = Number(loc.long);
    return !isNaN(lat) && !isNaN(lng) && bounds.contains([lat, lng]);
  }

  function applyFilters() {
    const q = (filters.q || '').toLowerCase();
    const favs = filters.favoritesOnly ? new Set(getFavorites()) : null;
    const userPos = (filters.nearby || filters.sort === 'distance') ? getUserLocation() : null;
    filtered = allListings.filter(l => {
      if (filters.category && l.category !== filters.category) return false;
      if (filters.seller && l.sellerid !== filters.seller) return false;
      if (filters.visibility && l.visibility !== filters.visibility) return false;
      if (filters.units && l.units !== filters.units) return false;
      const price = Number(l.price);
      if (filters.minPrice != null && (isNaN(price) || price < filters.minPrice)) return false;
      if (filters.maxPrice != null && (isNaN(price) || price > filters.maxPrice)) return false;
      if (favs && !favs.has(l.id)) return false;
      if (filters.nearby && userPos) {
        const d = distanceFor(l, userPos);
        if (d == null || d > NEARBY_KM) return false;
      }
      if (!isInCurrentView(l)) return false;
      if (q) {
        const hay = [l.headerdescription, l.description, l.category, getDisplayName(l.sellerid), l.sellerid, l.address, l.units]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sortKey = filters.sort || 'default';
    if (sortKey === 'price-asc') {
      filtered.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
    } else if (sortKey === 'price-desc') {
      filtered.sort((a, b) => (Number(b.price) || -Infinity) - (Number(a.price) || -Infinity));
    } else if (sortKey === 'distance' || filters.nearby) {
      const pos = userPos || getUserLocation();
      if (pos) filtered.sort((a, b) => (distanceFor(a, pos) ?? Infinity) - (distanceFor(b, pos) ?? Infinity));
    }

    render();
    updateFilterBadge();
    updateCount();
    renderFilterChips();
    if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
      global.FD_MAP.setListings(filtered);
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

  function render() {
    const container = document.getElementById('listings-list');
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state"><p>No listings match the current filters.</p><button type="button" class="small-btn" id="clear-filters-empty">Clear filters</button></div>`;
      document.getElementById('clear-filters-empty')?.addEventListener('click', resetFilters);
      return;
    }

    const favs = new Set(getFavorites());
    let html = '';

    if (groupBySeller) {
      const groups = {};
      filtered.forEach(l => {
        const key = l.sellerid || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(l);
      });
      Object.keys(groups).sort().forEach(sid => {
        const name = getDisplayName(sid);
        html += `<div class="seller-group"><div class="group-header" data-seller="${escapeHtml(sid)}">${escapeHtml(name)} (${groups[sid].length})</div>`;
        groups[sid].forEach(l => { html += renderItem(l, favs.has(l.id)); });
        html += '</div>';
      });
    } else {
      filtered.forEach(l => { html += renderItem(l, favs.has(l.id)); });
    }

    container.innerHTML = html;

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(el.dataset.id);
      });
    });
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
    container.querySelectorAll('.group-header').forEach(h => {
      h.addEventListener('click', () => {
        setSellerFilter(h.dataset.seller);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to seller', 'info');
      });
    });
  }

  function renderItem(l, isFav) {
    const price = Number(l.price);
    const priceStr = isNaN(price) ? 'Price on request' : `$${price.toFixed(2)} / ${escapeHtml(l.units || '')}`;
    const seller = escapeHtml(getDisplayName(l.sellerid));
    const thumb = l.image
      ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="">`
      : `<div class="list-thumb placeholder">${escapeHtml((l.category || '?').slice(0, 3).toUpperCase())}</div>`;
    return `
      <div class="listing-item ${selectedId === l.id ? 'selected' : ''}" data-id="${escapeHtml(l.id)}">
        ${thumb}
        <div class="list-body">
          <div class="list-title">${escapeHtml(l.headerdescription || 'Listing')}</div>
          <div class="list-meta">
            <span class="price">${priceStr}</span>
            <span class="muted">${escapeHtml(l.category || '')}</span>
          </div>
          <div class="list-seller muted small">${seller}</div>
        </div>
        <button type="button" class="icon-btn fav-btn" data-id="${escapeHtml(l.id)}" aria-label="Favorite">${isFav ? '★' : '☆'}</button>
      </div>`;
  }

  function renderFilterChips() {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
    if (filters.category) chips.push({ key: 'category', label: filters.category });
    if (filters.seller) chips.push({ key: 'seller', label: getDisplayName(filters.seller) });
    if (filters.visibility) chips.push({ key: 'visibility', label: filters.visibility });
    if (filters.units) chips.push({ key: 'units', label: filters.units });
    if (filters.minPrice != null) chips.push({ key: 'minPrice', label: `Min $${filters.minPrice}` });
    if (filters.maxPrice != null) chips.push({ key: 'maxPrice', label: `Max $${filters.maxPrice}` });
    if (filters.favoritesOnly) chips.push({ key: 'favoritesOnly', label: 'Favorites' });
    if (filters.nearby) chips.push({ key: 'nearby', label: 'Nearby' });
    if (filters.inView) chips.push({ key: 'inView', label: 'In view' });
    if (filters.sort && filters.sort !== 'default') chips.push({ key: 'sort', label: `Sort: ${filters.sort}` });

    if (!chips.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = chips.map(c =>
      `<span class="filter-chip">${escapeHtml(c.label)} <button type="button" data-key="${c.key}" aria-label="Remove">×</button></span>`
    ).join('');
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => clearOneFilter(btn.dataset.key));
    });
  }

  function clearOneFilter(key) {
    if (key === 'q') {
      filters.q = '';
      const input = document.getElementById('search-input');
      if (input) input.value = '';
    } else if (key === 'minPrice' || key === 'maxPrice') {
      filters[key] = null;
      const el = document.getElementById(key === 'minPrice' ? 'filter-min-price' : 'filter-max-price');
      if (el) el.value = '';
    } else if (key === 'favoritesOnly' || key === 'nearby' || key === 'inView') {
      filters[key] = false;
      const el = document.getElementById(key === 'favoritesOnly' ? 'filter-favorites' : key === 'nearby' ? 'nearby-btn' : 'filter-in-view');
      if (el) {
        if (el.type === 'checkbox') el.checked = false;
        else el.classList.remove('active');
      }
    } else if (key === 'sort') {
      filters.sort = 'default';
      const sel = document.getElementById('sort-select');
      if (sel) sel.value = 'default';
    } else {
      filters[key] = '';
      const map = { category: 'filter-category', seller: 'filter-seller', visibility: 'filter-visibility', units: 'filter-units' };
      const el = document.getElementById(map[key]);
      if (el) el.value = '';
    }
    applyFilters();
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    let count = 0;
    if (filters.q) count++;
    if (filters.category) count++;
    if (filters.seller) count++;
    if (filters.visibility) count++;
    if (filters.units) count++;
    if (filters.minPrice != null) count++;
    if (filters.maxPrice != null) count++;
    if (filters.favoritesOnly) count++;
    if (filters.nearby) count++;
    if (filters.inView) count++;
    if (filters.sort && filters.sort !== 'default') count++;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function updateCount() {
    const btn = document.getElementById('list-count');
    if (btn) btn.textContent = `${filtered.length} / ${allListings.length}`;
  }

  function select(id) {
    selectedId = id;
    const listing = allListings.find(l => String(l.id) === String(id));
    if (!listing) return;
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') {
      global.FD_MAP.flyToListing(listing);
    }
    render();
  }

  function navigate(delta) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => String(l.id) === String(selectedId));
    if (idx < 0) idx = 0;
    idx = (idx + delta + filtered.length) % filtered.length;
    select(filtered[idx].id);
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    populateFilterSelects();
    applyFilters();
  }

  function populateFilterSelects() {
    const catSel = document.getElementById('filter-category');
    const unitSel = document.getElementById('filter-units');
    const sellerSel = document.getElementById('filter-seller');
    if (!catSel || !unitSel || !sellerSel) return;

    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();

    catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    unitSel.innerHTML = '<option value="">All</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
    sellerSel.innerHTML = '<option value="">All</option>' + sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getDisplayName(s))}</option>`).join('');
  }

  function applyFiltersFromParams(params) {
    if (!params) return;
    filters.q = params.get('q') || '';
    filters.category = params.get('cat') || params.get('category') || '';
    filters.seller = params.get('seller') || '';
    filters.visibility = params.get('vis') || params.get('visibility') || '';
    filters.units = params.get('units') || '';
    const min = params.get('min');
    const max = params.get('max');
    filters.minPrice = min != null && min !== '' ? Number(min) : null;
    filters.maxPrice = max != null && max !== '' ? Number(max) : null;
    filters.favoritesOnly = params.get('fav') === '1' || params.get('favorites') === '1';
    filters.nearby = params.get('nearby') === '1';
    filters.inView = params.get('inview') === '1';
    filters.sort = params.get('sort') || 'default';

    // Sync UI
    const search = document.getElementById('search-input');
    if (search) search.value = filters.q;
    const cat = document.getElementById('filter-category'); if (cat) cat.value = filters.category;
    const seller = document.getElementById('filter-seller'); if (seller) seller.value = filters.seller;
    const vis = document.getElementById('filter-visibility'); if (vis) vis.value = filters.visibility;
    const units = document.getElementById('filter-units'); if (units) units.value = filters.units;
    const minEl = document.getElementById('filter-min-price'); if (minEl) minEl.value = filters.minPrice ?? '';
    const maxEl = document.getElementById('filter-max-price'); if (maxEl) maxEl.value = filters.maxPrice ?? '';
    const favEl = document.getElementById('filter-favorites'); if (favEl) favEl.checked = filters.favoritesOnly;
    const invEl = document.getElementById('filter-in-view'); if (invEl) invEl.checked = filters.inView;
    const sortEl = document.getElementById('sort-select'); if (sortEl) sortEl.value = filters.sort;
    document.getElementById('nearby-btn')?.classList.toggle('active', filters.nearby);
    document.getElementById('favorites-btn')?.classList.toggle('active', filters.favoritesOnly);

    applyFilters();
  }

  function getFilteredViewLink() {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.category) p.set('cat', filters.category);
    if (filters.seller) p.set('seller', filters.seller);
    if (filters.visibility) p.set('vis', filters.visibility);
    if (filters.units) p.set('units', filters.units);
    if (filters.minPrice != null) p.set('min', filters.minPrice);
    if (filters.maxPrice != null) p.set('max', filters.maxPrice);
    if (filters.favoritesOnly) p.set('fav', '1');
    if (filters.nearby) p.set('nearby', '1');
    if (filters.inView) p.set('inview', '1');
    if (filters.sort && filters.sort !== 'default') p.set('sort', filters.sort);
    const base = location.origin + location.pathname;
    return p.toString() ? `${base}#${p.toString()}` : base;
  }

  function copyFilteredLink() {
    const link = getFilteredViewLink();
    navigator.clipboard.writeText(link).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success');
    }).catch(() => {
      if (global.FD_TOAST) global.FD_TOAST.show(link, 'info');
    });
  }

  function exportFilteredJson() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered.json';
    a.click();
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function copyFilterSummary() {
    const parts = [];
    if (filters.q) parts.push(`q=${filters.q}`);
    if (filters.category) parts.push(`category=${filters.category}`);
    if (filters.seller) parts.push(`seller=${getDisplayName(filters.seller)}`);
    if (filters.visibility) parts.push(`visibility=${filters.visibility}`);
    if (filters.units) parts.push(`units=${filters.units}`);
    if (filters.minPrice != null) parts.push(`min=${filters.minPrice}`);
    if (filters.maxPrice != null) parts.push(`max=${filters.maxPrice}`);
    if (filters.favoritesOnly) parts.push('favorites');
    if (filters.nearby) parts.push('nearby');
    if (filters.inView) parts.push('in-view');
    if (filters.sort && filters.sort !== 'default') parts.push(`sort=${filters.sort}`);
    const summary = parts.length ? parts.join(', ') : 'No filters';
    navigator.clipboard.writeText(summary).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Filter summary copied', 'success');
    }).catch(() => {});
  }

  function setCategoryFilter(cat) { filters.category = cat || ''; applyFilters(); }
  function setSellerFilter(sid) { filters.seller = sid || ''; applyFilters(); }
  function setVisibilityFilter(v) { filters.visibility = v || ''; applyFilters(); }
  function setUnitsFilter(u) { filters.units = u || ''; applyFilters(); }

  function resetFilters() {
    filters = {
      q: '', category: '', seller: '', visibility: '', units: '',
      minPrice: null, maxPrice: null, favoritesOnly: false, nearby: false, inView: false, sort: 'default'
    };
    groupBySeller = false;
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    ['filter-category', 'filter-seller', 'filter-visibility', 'filter-units', 'sort-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const sort = document.getElementById('sort-select');
    if (sort) sort.value = 'default';
    ['filter-min-price', 'filter-max-price'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = false;
    const inv = document.getElementById('filter-in-view');
    if (inv) inv.checked = false;
    document.getElementById('group-by-seller') && (document.getElementById('group-by-seller').checked = false);
    document.getElementById('nearby-btn')?.classList.remove('active');
    document.getElementById('favorites-btn')?.classList.remove('active');
    applyFilters();
    if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') global.FD_MAP.fitAll();
  }

  function bind() {
    // Search input drives filters.q
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      filters.q = e.target.value.trim();
      applyFilters();
    });

    // Filter card controls
    document.getElementById('filter-category')?.addEventListener('change', (e) => { filters.category = e.target.value; applyFilters(); });
    document.getElementById('filter-seller')?.addEventListener('change', (e) => { filters.seller = e.target.value; applyFilters(); });
    document.getElementById('filter-visibility')?.addEventListener('change', (e) => { filters.visibility = e.target.value; applyFilters(); });
    document.getElementById('filter-units')?.addEventListener('change', (e) => { filters.units = e.target.value; applyFilters(); });
    document.getElementById('filter-min-price')?.addEventListener('change', (e) => {
      filters.minPrice = e.target.value === '' ? null : Number(e.target.value);
      applyFilters();
    });
    document.getElementById('filter-max-price')?.addEventListener('change', (e) => {
      filters.maxPrice = e.target.value === '' ? null : Number(e.target.value);
      applyFilters();
    });
    document.getElementById('filter-favorites')?.addEventListener('change', (e) => {
      filters.favoritesOnly = e.target.checked;
      document.getElementById('favorites-btn')?.classList.toggle('active', filters.favoritesOnly);
      applyFilters();
    });
    document.getElementById('filter-in-view')?.addEventListener('change', (e) => {
      filters.inView = e.target.checked;
      applyFilters();
    });

    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('reset-filters')?.addEventListener('click', resetFilters);

    // Sidebar quick actions
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      filters.sort = e.target.value;
      applyFilters();
    });
    document.getElementById('group-by-seller')?.addEventListener('change', (e) => {
      groupBySeller = e.target.checked;
      render();
    });
    document.getElementById('nearby-btn')?.addEventListener('click', () => {
      filters.nearby = !filters.nearby;
      document.getElementById('nearby-btn')?.classList.toggle('active', filters.nearby);
      if (filters.nearby && !getUserLocation()) {
        if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
          global.FD_MAP.locateUser(() => applyFilters());
        }
      }
      applyFilters();
    });
    document.getElementById('favorites-btn')?.addEventListener('click', () => {
      filters.favoritesOnly = !filters.favoritesOnly;
      document.getElementById('favorites-btn')?.classList.toggle('active', filters.favoritesOnly);
      const cb = document.getElementById('filter-favorites');
      if (cb) cb.checked = filters.favoritesOnly;
      applyFilters();
    });
    document.getElementById('random-btn')?.addEventListener('click', () => {
      if (!filtered.length) return;
      const item = filtered[Math.floor(Math.random() * filtered.length)];
      select(item.id);
    });
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') global.FD_MAP.locateUser();
    });
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') global.FD_MAP.fitAll();
    });
    document.getElementById('clear-fit-btn')?.addEventListener('click', () => {
      resetFilters();
    });
    document.getElementById('list-count')?.addEventListener('click', () => {
      if (global.FD_TOAST) global.FD_TOAST.show(`${filtered.length} of ${allListings.length} listings`, 'info');
    });

    // Live in-view updates on map move
    const map = global.FD_MAP?.getMap?.();
    if (map) {
      map.on('moveend', () => {
        if (filters.inView) applyFilters();
      });
    }
  }

  global.FD_LIST = {
    setListings,
    select,
    navigate,
    bind,
    applyFilters,
    applyFiltersFromParams,
    copyFilteredLink,
    exportFilteredJson,
    copyFilterSummary,
    getFavorites,
    getFiltered: () => filtered,
    getListings: () => allListings,
    isFavorite,
    toggleFavorite,
    setCategoryFilter,
    setSellerFilter,
    setVisibilityFilter,
    setUnitsFilter,
    resetFilters
  };
})(window);
