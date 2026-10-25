/**
 * FarmDirect B2B – sidebar list, filters, chips, favorites, distance, keyboard nav
 * Fully client-side; works in pure seed/demo mode. Drives map markers and product cards.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  const FILTER_KEY = 'fd-filters';

  let allListings = [];
  let filtered = [];
  let userLocation = null;
  let highlightedId = null;
  let highlightIndex = -1;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid)
      : (sellerid || '');
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch (_) {}
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(FILTER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveFilters(f) {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch (_) {}
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

  function getSearchQuery() {
    const el = document.getElementById('search-input');
    return (el?.value || '').trim().toLowerCase();
  }

  function populateSelects() {
    const cats = new Set();
    const units = new Set();
    const sellers = new Map();
    allListings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) sellers.set(l.sellerid, getDisplayName(l.sellerid));
    });

    const fill = (id, items, labelFn) => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const current = sel.value;
      const opts = Array.from(items).sort().map(v => `<option value="${escapeHtml(v)}">${escapeHtml(labelFn ? labelFn(v) : v)}</option>`).join('');
      sel.innerHTML = `<option value="">${id === 'filter-category' ? 'All' : 'Any'}</option>${opts}`;
      if ([...items].includes(current)) sel.value = current;
    };

    fill('filter-category', cats);
    fill('filter-units', units);
    const sellerSel = document.getElementById('filter-seller');
    if (sellerSel) {
      const current = sellerSel.value;
      const opts = Array.from(sellers.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`)
        .join('');
      sellerSel.innerHTML = `<option value="">Any</option>${opts}`;
      if (sellers.has(current)) sellerSel.value = current;
    }
  }

  function applyFilters() {
    const q = getSearchQuery();
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value);
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value);
    const radius = parseFloat(document.getElementById('filter-radius')?.value);
    const sort = document.getElementById('filter-sort')?.value || '';
    const favOnly = document.getElementById('filter-favorites')?.checked;
    const inView = document.getElementById('filter-inview')?.checked;
    const favs = loadFavorites();

    let bounds = null;
    if (inView && global.FD_MAP && typeof global.FD_MAP.getBounds === 'function') {
      bounds = global.FD_MAP.getBounds();
    }

    filtered = allListings.filter(l => {
      if (q) {
        const fields = [
          l.headerdescription, l.description, l.category,
          getDisplayName(l.sellerid), l.sellerid, l.address, l.units
        ];
        if (!fields.some(f => f && String(f).toLowerCase().includes(q))) return false;
      }
      if (cat && l.category !== cat) return false;
      if (vis && l.visibility !== vis) return false;
      if (units && l.units !== units) return false;
      if (seller && l.sellerid !== seller) return false;
      const price = Number(l.price);
      if (!isNaN(minP) && (isNaN(price) || price < minP)) return false;
      if (!isNaN(maxP) && (isNaN(price) || price > maxP)) return false;
      if (favOnly && !favs.has(l.id)) return false;

      if (userLocation && !isNaN(radius) && radius > 0 && l.location) {
        const d = haversine(userLocation.lat, userLocation.lng, l.location.lat, l.location.long);
        if (d > radius) return false;
      }

      if (bounds && l.location) {
        const lat = l.location.lat, lng = l.location.long;
        if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) return false;
      }
      return true;
    });

    // Sort
    if (sort === 'price-asc') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sort === 'price-desc') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (sort === 'name') filtered.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (sort === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const da = a.location ? haversine(userLocation.lat, userLocation.lng, a.location.lat, a.location.long) : 9999;
        const db = b.location ? haversine(userLocation.lat, userLocation.lng, b.location.lat, b.location.long) : 9999;
        return da - db;
      });
    }

    renderList();
    renderChips();
    updateCount();
    if (global.FD_MAP && typeof global.FD_MAP.renderMarkers === 'function') {
      global.FD_MAP.renderMarkers(filtered, { fit: false });
    }
    if (global.FD_MAP && typeof global.FD_MAP.setRadiusCircle === 'function') {
      global.FD_MAP.setRadiusCircle(isNaN(radius) ? 0 : radius);
    }

    // Persist
    saveFilters({
      category: cat, visibility: vis, units, seller,
      minprice: document.getElementById('filter-minprice')?.value || '',
      maxprice: document.getElementById('filter-maxprice')?.value || '',
      radius: document.getElementById('filter-radius')?.value || '',
      sort, favorites: favOnly, inview: inView,
      search: document.getElementById('search-input')?.value || ''
    });
  }

  function renderChips() {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    const add = (label, clearFn) => chips.push(`<button type="button" class="chip" data-clear="${clearFn}">${escapeHtml(label)} ×</button>`);

    const cat = document.getElementById('filter-category')?.value;
    if (cat) add(`Category: ${cat}`, 'category');
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) add(`Visibility: ${vis}`, 'visibility');
    const units = document.getElementById('filter-units')?.value;
    if (units) add(`Units: ${units}`, 'units');
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) add(`Seller: ${getDisplayName(seller)}`, 'seller');
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) add(`Min $${minP}`, 'minprice');
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) add(`Max $${maxP}`, 'maxprice');
    const radius = document.getElementById('filter-radius')?.value;
    if (radius) add(`Radius ${radius} km`, 'radius');
    if (document.getElementById('filter-favorites')?.checked) add('Favorites', 'favorites');
    if (document.getElementById('filter-inview')?.checked) add('In view', 'inview');
    const q = getSearchQuery();
    if (q) add(`Search: ${q}`, 'search');

    el.innerHTML = chips.join('');
    el.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => clearOne(btn.dataset.clear));
    });
  }

  function clearOne(key) {
    const map = {
      category: 'filter-category',
      visibility: 'filter-visibility',
      units: 'filter-units',
      seller: 'filter-seller',
      minprice: 'filter-minprice',
      maxprice: 'filter-maxprice',
      radius: 'filter-radius'
    };
    if (map[key]) {
      const el = document.getElementById(map[key]);
      if (el) el.value = '';
    } else if (key === 'favorites') {
      const el = document.getElementById('filter-favorites');
      if (el) el.checked = false;
    } else if (key === 'inview') {
      const el = document.getElementById('filter-inview');
      if (el) el.checked = false;
    } else if (key === 'search') {
      const el = document.getElementById('search-input');
      if (el) el.value = '';
    }
    applyFilters();
  }

  function renderList() {
    const list = document.getElementById('listing-list');
    if (!list) return;
    const favs = loadFavorites();

    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state muted">No listings match the current filters. <button type="button" class="small-btn" id="empty-clear">Clear filters</button></div>';
      document.getElementById('empty-clear')?.addEventListener('click', clearAllFilters);
      return;
    }

    list.innerHTML = filtered.map((l, i) => {
      const price = Number(l.price);
      const priceStr = isNaN(price) ? '' : `$${price.toFixed(2)} / ${escapeHtml(l.units || '')}`;
      const dist = (userLocation && l.location)
        ? haversine(userLocation.lat, userLocation.lng, l.location.lat, l.location.long).toFixed(1) + ' km'
        : '';
      const isFav = favs.has(l.id);
      const active = l.id === highlightedId ? ' active' : '';
      return `
        <div class="listing-item${active}" data-id="${escapeHtml(l.id)}" data-index="${i}" role="listitem" tabindex="0">
          <div class="listing-main">
            <strong>${escapeHtml(l.headerdescription || 'Listing')}</strong>
            <div class="listing-meta muted small">${escapeHtml(l.category || '')} · ${escapeHtml(getDisplayName(l.sellerid))}${dist ? ' · ' + dist : ''}</div>
            <div class="listing-price">${priceStr}</div>
          </div>
          <div class="listing-actions">
            <button type="button" class="icon-btn fav-btn${isFav ? ' active' : ''}" data-id="${escapeHtml(l.id)}" title="${isFav ? 'Unfavorite' : 'Favorite'}" aria-label="Favorite">${isFav ? '★' : '☆'}</button>
            <button type="button" class="icon-btn copy-link" data-id="${escapeHtml(l.id)}" title="Copy link" aria-label="Copy listing link">🔗</button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn') || e.target.closest('.copy-link')) return;
        select(item.dataset.id);
      });
      item.addEventListener('mouseenter', () => highlight(item.dataset.id));
      item.addEventListener('mouseleave', () => highlight(null));
    });

    list.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });

    list.querySelectorAll('.copy-link').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const url = location.origin + location.pathname + '#listing=' + encodeURIComponent(id);
        try {
          await navigator.clipboard.writeText(url);
          if (global.FD_TOAST) global.FD_TOAST.show('Listing link copied', 'success');
        } catch (_) {
          if (global.FD_TOAST) global.FD_TOAST.show('Link: ' + url, 'info');
        }
      });
    });
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = filtered.length;
    const badge = document.getElementById('filter-badge');
    if (badge) {
      const active = document.querySelectorAll('.chip').length;
      if (active) {
        badge.textContent = active;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    }
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    highlightedId = id;
    highlightIndex = filtered.findIndex(l => l.id === id);
    if (global.FD_CARDS && global.FD_CARDS.showProduct) global.FD_CARDS.showProduct(listing);
    if (global.FD_MAP && global.FD_MAP.flyTo) global.FD_MAP.flyTo(listing);
    if (global.FD_MAP && global.FD_MAP.selectListing) global.FD_MAP.selectListing(id);
    renderList();
    try { history.replaceState(null, '', '#listing=' + encodeURIComponent(id)); } catch (_) {}
  }

  function highlight(id) {
    highlightedId = id;
    document.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    if (global.FD_MAP && global.FD_MAP.highlightMarker) {
      if (id) global.FD_MAP.highlightMarker(id);
      else global.FD_MAP.clearMarkerHighlight?.();
    }
  }

  function navigate(delta) {
    if (!filtered.length) return;
    if (highlightIndex < 0) highlightIndex = 0;
    else highlightIndex = Math.max(0, Math.min(filtered.length - 1, highlightIndex + delta));
    const item = filtered[highlightIndex];
    if (item) {
      highlight(item.id);
      const el = document.querySelector(`.listing-item[data-id="${CSS.escape(item.id)}"]`);
      el?.scrollIntoView({ block: 'nearest' });
      if (global.FD_MAP && global.FD_MAP.flyTo) global.FD_MAP.flyTo(item);
    }
  }

  function selectHighlighted() {
    if (highlightIndex >= 0 && filtered[highlightIndex]) {
      select(filtered[highlightIndex].id);
    }
  }

  function toggleFavorite(id) {
    const favs = loadFavorites();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    saveFavorites(favs);
    renderList();
    if (document.getElementById('filter-favorites')?.checked) applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(favs.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
  }

  function clearFavorites() {
    saveFavorites(new Set());
    renderList();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function clearAllFilters() {
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort'].forEach(id => {
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

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    populateSelects();
    const saved = loadFilters();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    setVal('filter-category', saved.category);
    setVal('filter-visibility', saved.visibility);
    setVal('filter-units', saved.units);
    setVal('filter-seller', saved.seller);
    setVal('filter-minprice', saved.minprice);
    setVal('filter-maxprice', saved.maxprice);
    setVal('filter-radius', saved.radius);
    setVal('filter-sort', saved.sort);
    if (saved.favorites) document.getElementById('filter-favorites').checked = true;
    if (saved.inview) document.getElementById('filter-inview').checked = true;
    if (saved.search) {
      const s = document.getElementById('search-input');
      if (s) s.value = saved.search;
    }
    applyFilters();
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

  function exportFiltered() {
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
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
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

    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort', 'filter-favorites', 'filter-inview'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });

    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const s = document.getElementById('search-input');
      if (s) s.value = '';
      applyFilters();
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    select,
    highlight,
    applyFilters,
    exportFiltered,
    clearFavorites,
    setUserLocation,
    sortByDistance,
    clearDistance,
    getListings: () => allListings,
    navigate,
    selectHighlighted
  };
})(window);
