/**
 * FarmDirect B2B – sidebar list + filter module
 * Renders filtered listings with thumbnails, description snippets, clickable seller/category badges,
 * handles search/filters/favorites/distance/only-in-view, keyboard navigation, persistence,
 * empty-state, filter badge, copy links, removable filter chips.
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
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch (_) {}
  }

  function isFavorite(id) {
    return getFavorites().has(id);
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    saveFavorites(favs);
    applyFilters();
    if (global.FD_MAP && global.FD_MAP.updateMarkers) {
      global.FD_MAP.updateMarkers(filtered);
    }
  }

  function clearFavorites() {
    saveFavorites(new Set());
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function getSellerName(sellerid) {
    if (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function') {
      return global.FD_SELLERS.getDisplayName(sellerid);
    }
    return sellerid || '';
  }

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function applyFilters() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value) || 0;
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value) || Infinity;
    const radius = parseFloat(document.getElementById('filter-radius')?.value) || 0;
    const sort = document.getElementById('filter-sort')?.value || '';
    const favOnly = document.getElementById('filter-favorites')?.checked;
    const inview = document.getElementById('filter-inview')?.checked;
    const favs = getFavorites();
    userLocation = global.FD_MAP && global.FD_MAP.getUserPosition ? global.FD_MAP.getUserPosition() : null;
    const bounds = inview && global.FD_MAP && global.FD_MAP.getBounds ? global.FD_MAP.getBounds() : null;

    filtered = allListings.filter(l => {
      if (favOnly && !favs.has(l.id)) return false;
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      const price = Number(l.price) || 0;
      if (price < minP || price > maxP) return false;
      if (q) {
        const hay = [l.headerdescription, l.description, l.category, l.address, getSellerName(l.sellerid)].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (radius > 0 && userLocation && l.location) {
        const d = distanceKm(userLocation.lat, userLocation.lng, Number(l.location.lat), Number(l.location.long));
        if (d > radius) return false;
      }
      if (bounds && l.location) {
        const lat = Number(l.location.lat);
        const lng = Number(l.location.long);
        if (!bounds.contains([lat, lng])) return false;
      }
      return true;
    });

    if (sort === 'price-asc') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === 'price-desc') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (sort === 'name') filtered.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (sort === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const da = a.location ? distanceKm(userLocation.lat, userLocation.lng, Number(a.location.lat), Number(a.location.long)) : Infinity;
        const db = b.location ? distanceKm(userLocation.lat, userLocation.lng, Number(b.location.lat), Number(b.location.long)) : Infinity;
        return da - db;
      });
    }

    renderList();
    updateFilterChips();
    updateFilterBadge();
    if (global.FD_MAP && global.FD_MAP.updateMarkers) {
      global.FD_MAP.updateMarkers(filtered);
    }
    try {
      const state = { q, cat, vis, units, seller, minP: document.getElementById('filter-minprice')?.value, maxP: document.getElementById('filter-maxprice')?.value, radius: document.getElementById('filter-radius')?.value, sort, favOnly, inview };
      localStorage.setItem(FILTER_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function renderList() {
    const listEl = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!listEl) return;
    if (countEl) countEl.textContent = String(filtered.length);
    if (filtered.length === 0) {
      const hasFilters = hasActiveFilters();
      listEl.innerHTML = `<div class="empty-state">${hasFilters ? 'No listings match the current filters.' : 'No listings available.'}${hasFilters ? '<br><button type="button" class="small-btn" id="empty-clear-filters">Clear filters</button>' : ''}</div>`;
      document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      return;
    }
    listEl.innerHTML = filtered.map(l => {
      const fav = isFavorite(l.id);
      const priceStr = l.price != null ? `$${Number(l.price).toFixed(2)}` : '';
      const seller = escapeHtml(getSellerName(l.sellerid));
      const desc = escapeHtml((l.description || '').slice(0, 80)) + ((l.description || '').length > 80 ? '…' : '');
      const img = l.image ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="" loading="lazy">` : '';
      const active = l.id === highlightedId ? ' active' : '';
      return `
        <div class="listing-item${active}" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
          ${img}
          <div class="list-body">
            <div class="list-header">
              <strong>${escapeHtml(l.headerdescription || 'Untitled')}</strong>
              <button type="button" class="fav-star${fav ? ' active' : ''}" data-fav="${escapeHtml(l.id)}" title="${fav ? 'Unfavorite' : 'Favorite'}">${fav ? '★' : '☆'}</button>
            </div>
            <div class="list-meta">
              <button type="button" class="category-badge" data-cat="${escapeHtml(l.category || '')}">${escapeHtml(l.category || '')}</button>
              · ${priceStr}${l.units ? ' / ' + escapeHtml(l.units) : ''}
            </div>
            <div class="list-desc">${desc}</div>
            <div class="list-footer">
              <button type="button" class="seller-badge" data-seller="${escapeHtml(l.sellerid || '')}">${seller}</button>
              ${l.address ? `<span class="list-address">${escapeHtml(l.address)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-star, .category-badge, .seller-badge')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(item.dataset.id);
        }
      });
    });
    listEl.querySelectorAll('.fav-star').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
      });
    });
    listEl.querySelectorAll('.category-badge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setCategoryFilter(btn.dataset.cat);
      });
    });
    listEl.querySelectorAll('.seller-badge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setSellerFilter(btn.dataset.seller);
      });
    });
  }

  function select(id, fromMap) {
    highlightedId = id;
    const item = document.querySelector(`.listing-item[data-id="${CSS.escape(id)}"]`);
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    document.querySelectorAll('.listing-item').forEach(el => {
      if (el.dataset.id !== id) el.classList.remove('active');
    });
    if (!fromMap && global.FD_MAP && global.FD_MAP.highlight) {
      global.FD_MAP.highlight(id);
    }
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      const listing = allListings.find(l => l.id === id);
      if (listing) global.FD_CARDS.showProduct(listing);
    }
  }

  function highlight(id) {
    highlightedId = id;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    const item = document.querySelector(`.listing-item[data-id="${CSS.escape(id)}"]`);
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

  function hasActiveFilters() {
    const q = (document.getElementById('search-input')?.value || '').trim();
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = document.getElementById('filter-minprice')?.value;
    const maxP = document.getElementById('filter-maxprice')?.value;
    const radius = document.getElementById('filter-radius')?.value;
    const sort = document.getElementById('filter-sort')?.value || '';
    const favOnly = document.getElementById('filter-favorites')?.checked;
    const inview = document.getElementById('filter-inview')?.checked;
    return !!(q || cat || vis || units || seller || minP || maxP || radius || sort || favOnly || inview);
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const count = [
      document.getElementById('search-input')?.value.trim(),
      document.getElementById('filter-category')?.value,
      document.getElementById('filter-visibility')?.value,
      document.getElementById('filter-units')?.value,
      document.getElementById('filter-seller')?.value,
      document.getElementById('filter-minprice')?.value,
      document.getElementById('filter-maxprice')?.value,
      document.getElementById('filter-radius')?.value,
      document.getElementById('filter-sort')?.value,
      document.getElementById('filter-favorites')?.checked,
      document.getElementById('filter-inview')?.checked
    ].filter(Boolean).length;
    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function updateFilterChips() {
    const container = document.getElementById('filter-chips');
    if (!container) return;
    const chips = [];
    const q = document.getElementById('search-input')?.value.trim();
    if (q) chips.push({ label: `Search: ${q}`, clear: () => { document.getElementById('search-input').value = ''; applyFilters(); } });
    const cat = document.getElementById('filter-category')?.value;
    if (cat) chips.push({ label: `Category: ${cat}`, clear: () => { document.getElementById('filter-category').value = ''; applyFilters(); } });
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) chips.push({ label: `Visibility: ${vis}`, clear: () => { document.getElementById('filter-visibility').value = ''; applyFilters(); } });
    const units = document.getElementById('filter-units')?.value;
    if (units) chips.push({ label: `Units: ${units}`, clear: () => { document.getElementById('filter-units').value = ''; applyFilters(); } });
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) chips.push({ label: `Seller: ${getSellerName(seller)}`, clear: () => { document.getElementById('filter-seller').value = ''; applyFilters(); } });
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) chips.push({ label: `Min $${minP}`, clear: () => { document.getElementById('filter-minprice').value = ''; applyFilters(); } });
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) chips.push({ label: `Max $${maxP}`, clear: () => { document.getElementById('filter-maxprice').value = ''; applyFilters(); } });
    const radius = document.getElementById('filter-radius')?.value;
    if (radius) chips.push({ label: `Radius ${radius}km`, clear: () => { document.getElementById('filter-radius').value = ''; applyFilters(); } });
    const sort = document.getElementById('filter-sort')?.value;
    if (sort) chips.push({ label: `Sort: ${sort}`, clear: () => { document.getElementById('filter-sort').value = ''; applyFilters(); } });
    if (document.getElementById('filter-favorites')?.checked) chips.push({ label: 'Favorites', clear: () => { document.getElementById('filter-favorites').checked = false; applyFilters(); } });
    if (document.getElementById('filter-inview')?.checked) chips.push({ label: 'In view', clear: () => { document.getElementById('filter-inview').checked = false; applyFilters(); } });

    container.innerHTML = chips.map((c, i) => `<span class="filter-chip">${escapeHtml(c.label)} <button type="button" class="chip-x" data-i="${i}" aria-label="Clear">×</button></span>`).join('');
    container.querySelectorAll('.chip-x').forEach(btn => {
      btn.addEventListener('click', () => chips[btn.dataset.i].clear());
    });
  }

  function clearAllFilters() {
    document.getElementById('search-input') && (document.getElementById('search-input').value = '');
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = false;
    const inv = document.getElementById('filter-inview');
    if (inv) inv.checked = false;
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
  }

  function setCategoryFilter(cat) {
    const el = document.getElementById('filter-category');
    if (el) { el.value = cat || ''; applyFilters(); }
  }
  function setVisibilityFilter(vis) {
    const el = document.getElementById('filter-visibility');
    if (el) { el.value = vis || ''; applyFilters(); }
  }
  function setUnitsFilter(u) {
    const el = document.getElementById('filter-units');
    if (el) { el.value = u || ''; applyFilters(); }
  }
  function setSellerFilter(sid) {
    const el = document.getElementById('filter-seller');
    if (el) { el.value = sid || ''; applyFilters(); }
  }

  function populateSelects() {
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))];
    const catSel = document.getElementById('filter-category');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (cats.includes(cur)) catSel.value = cur;
    }
    const unitSel = document.getElementById('filter-units');
    if (unitSel) {
      const cur = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      if (units.includes(cur)) unitSel.value = cur;
    }
    const sellerSel = document.getElementById('filter-seller');
    if (sellerSel) {
      const cur = sellerSel.value;
      sellerSel.innerHTML = '<option value="">Any</option>' + sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getSellerName(s))}</option>`).join('');
      if (sellers.includes(cur)) sellerSel.value = cur;
    }
  }

  function restoreFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.q && document.getElementById('search-input')) document.getElementById('search-input').value = state.q;
      if (state.cat && document.getElementById('filter-category')) document.getElementById('filter-category').value = state.cat;
      if (state.vis && document.getElementById('filter-visibility')) document.getElementById('filter-visibility').value = state.vis;
      if (state.units && document.getElementById('filter-units')) document.getElementById('filter-units').value = state.units;
      if (state.seller && document.getElementById('filter-seller')) document.getElementById('filter-seller').value = state.seller;
      if (state.minP && document.getElementById('filter-minprice')) document.getElementById('filter-minprice').value = state.minP;
      if (state.maxP && document.getElementById('filter-maxprice')) document.getElementById('filter-maxprice').value = state.maxP;
      if (state.radius && document.getElementById('filter-radius')) document.getElementById('filter-radius').value = state.radius;
      if (state.sort && document.getElementById('filter-sort')) document.getElementById('filter-sort').value = state.sort;
      if (state.favOnly && document.getElementById('filter-favorites')) document.getElementById('filter-favorites').checked = true;
      if (state.inview && document.getElementById('filter-inview')) document.getElementById('filter-inview').checked = true;
    } catch (_) {}
  }

  function setListings(list) {
    allListings = Array.isArray(list) ? list : [];
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
    document.addEventListener('click', (e) => {
      if (filterCard && !filterCard.hasAttribute('hidden') && !filterCard.contains(e.target) && e.target.id !== 'filter-btn') {
        filterCard.setAttribute('hidden', '');
        filterBtn?.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort','filter-favorites','filter-inview'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
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

  function getFilteredViewLink() {
    const params = new URLSearchParams();
    const q = document.getElementById('search-input')?.value.trim();
    if (q) params.set('q', q);
    const cat = document.getElementById('filter-category')?.value;
    if (cat) params.set('cat', cat);
    const base = location.origin + location.pathname;
    return params.toString() ? `${base}?${params.toString()}` : base;
  }

  function navigate(delta) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => l.id === highlightedId);
    if (idx < 0) idx = 0;
    idx = (idx + delta + filtered.length) % filtered.length;
    highlight(filtered[idx].id);
    if (global.FD_MAP && global.FD_MAP.highlight) global.FD_MAP.highlight(filtered[idx].id);
  }

  function selectHighlighted() {
    if (highlightedId) select(highlightedId);
  }

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
    setUserLocation: (loc) => { userLocation = loc; applyFilters(); },
    isFavorite,
    toggleFavorite,
    getFavorites,
    getListings: () => allListings,
    getFiltered: () => filtered,
    clearAllFilters,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSellerFilter,
    getFilteredViewLink
  };
})(window);
