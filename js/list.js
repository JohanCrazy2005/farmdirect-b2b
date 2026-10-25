/**
 * FarmDirect B2B – sidebar list + filter module
 * Substantial implementation: thumbnails, chips, favorites, distance, only-in-view, keyboard, seller display names.
 * Fully client-side; works in seed/demo mode.
 */
(function (global) {
  'use strict';

  const FAVORITES_KEY = 'fd-favorites';
  let allListings = [];
  let filtered = [];
  let favorites = new Set();
  let selectedId = null;
  let highlightedIndex = -1;

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) favorites = new Set(JSON.parse(raw));
    } catch (_) {}
  }

  function saveFavorites() {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch (_) {}
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getUserLoc() {
    return global.FD_MAP && global.FD_MAP.getUserLocation ? global.FD_MAP.getUserLocation() : null;
  }

  function getMapBounds() {
    return global.FD_MAP && global.FD_MAP.getBounds ? global.FD_MAP.getBounds() : null;
  }

  function matchesFilters(l) {
    const cat = document.getElementById('filter-category')?.value || '';
    const vis = document.getElementById('filter-visibility')?.value || '';
    const units = document.getElementById('filter-units')?.value || '';
    const seller = document.getElementById('filter-seller')?.value || '';
    const minP = parseFloat(document.getElementById('filter-minprice')?.value) || 0;
    const maxP = parseFloat(document.getElementById('filter-maxprice')?.value) || Infinity;
    const radius = parseFloat(document.getElementById('filter-radius')?.value) || 0;
    const favOnly = document.getElementById('filter-favorites')?.checked;
    const inView = document.getElementById('filter-inview')?.checked;
    const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

    if (cat && l.category !== cat) return false;
    if (vis && l.visibility !== vis) return false;
    if (units && l.units !== units) return false;
    if (seller && l.sellerid !== seller) return false;
    const price = Number(l.price);
    if (!isNaN(price) && (price < minP || price > maxP)) return false;
    if (favOnly && !favorites.has(l.id)) return false;

    if (q) {
      const hay = [l.headerdescription, l.description, l.category, l.address, getDisplayName(l.sellerid)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (radius > 0) {
      const ul = getUserLoc();
      if (!ul || !l.location) return false;
      const d = haversine(ul.lat, ul.lng || ul.long, l.location.lat, l.location.long);
      if (d > radius) return false;
    }

    if (inView) {
      const b = getMapBounds();
      if (!b || !l.location) return false;
      if (l.location.lat < b.getSouth() || l.location.lat > b.getNorth() ||
          l.location.long < b.getWest() || l.location.long > b.getEast()) return false;
    }

    return true;
  }

  function sortListings(list) {
    const sort = document.getElementById('filter-sort')?.value || '';
    const ul = getUserLoc();
    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return (Number(a.price)||0) - (Number(b.price)||0);
      if (sort === 'price-desc') return (Number(b.price)||0) - (Number(a.price)||0);
      if (sort === 'name') return (a.headerdescription||'').localeCompare(b.headerdescription||'');
      if (sort === 'distance' && ul && a.location && b.location) {
        const da = haversine(ul.lat, ul.lng||ul.long, a.location.lat, a.location.long);
        const db = haversine(ul.lat, ul.lng||ul.long, b.location.lat, b.location.long);
        return da - db;
      }
      return 0;
    });
  }

  function populateFilterOptions() {
    const cats = new Set(), units = new Set(), sellers = new Set();
    allListings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) sellers.add(l.sellerid);
    });
    const catSel = document.getElementById('filter-category');
    const unitSel = document.getElementById('filter-units');
    const sellSel = document.getElementById('filter-seller');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' + [...cats].sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      catSel.value = cur;
    }
    if (unitSel) {
      const cur = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' + [...units].sort().map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      unitSel.value = cur;
    }
    if (sellSel) {
      const cur = sellSel.value;
      sellSel.innerHTML = '<option value="">Any</option>' + [...sellers].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getDisplayName(s))}</option>`).join('');
      sellSel.value = cur;
    }
  }

  function renderChips() {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    const cat = document.getElementById('filter-category')?.value;
    if (cat) chips.push({ key: 'category', label: cat });
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) chips.push({ key: 'visibility', label: vis });
    const units = document.getElementById('filter-units')?.value;
    if (units) chips.push({ key: 'units', label: units });
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) chips.push({ key: 'seller', label: getDisplayName(seller) });
    const minP = document.getElementById('filter-minprice')?.value;
    if (minP) chips.push({ key: 'minprice', label: `≥$${minP}` });
    const maxP = document.getElementById('filter-maxprice')?.value;
    if (maxP) chips.push({ key: 'maxprice', label: `≤$${maxP}` });
    const rad = document.getElementById('filter-radius')?.value;
    if (rad) chips.push({ key: 'radius', label: `${rad} km` });
    if (document.getElementById('filter-favorites')?.checked) chips.push({ key: 'favorites', label: 'Favorites' });
    if (document.getElementById('filter-inview')?.checked) chips.push({ key: 'inview', label: 'In view' });
    const q = document.getElementById('search-input')?.value;
    if (q) chips.push({ key: 'search', label: `"${q}"` });

    el.innerHTML = chips.map(c => `<span class="chip">${escapeHtml(c.label)} <button type="button" data-key="${c.key}" aria-label="Remove">×</button></span>`).join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => clearFilter(btn.dataset.key));
    });

    const badge = document.getElementById('filter-badge');
    if (badge) {
      badge.textContent = chips.length || '';
      badge.hidden = !chips.length;
    }
  }

  function clearFilter(key) {
    const map = {
      category: 'filter-category',
      visibility: 'filter-visibility',
      units: 'filter-units',
      seller: 'filter-seller',
      minprice: 'filter-minprice',
      maxprice: 'filter-maxprice',
      radius: 'filter-radius',
      favorites: 'filter-favorites',
      inview: 'filter-inview',
      search: 'search-input'
    };
    const id = map[key];
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
    applyFilters();
  }

  function renderList() {
    const el = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!el) return;
    if (countEl) countEl.textContent = filtered.length;

    if (!filtered.length) {
      const hasFilters = document.getElementById('filter-badge') && !document.getElementById('filter-badge').hidden;
      el.innerHTML = `<div class="empty-state muted">No listings match.${hasFilters ? ' <button type="button" id="clear-filters-empty" class="small-btn">Clear filters</button>' : ''}</div>`;
      document.getElementById('clear-filters-empty')?.addEventListener('click', clearAllFilters);
      return;
    }

    el.innerHTML = filtered.map((l, i) => {
      const fav = favorites.has(l.id) ? '★' : '☆';
      const name = getDisplayName(l.sellerid);
      const dist = (() => {
        const ul = getUserLoc();
        if (!ul || !l.location) return '';
        const d = haversine(ul.lat, ul.lng || ul.long, l.location.lat, l.location.long);
        return d < 1 ? `${Math.round(d*1000)} m` : `${d.toFixed(1)} km`;
      })();
      const price = l.price != null ? `$${Number(l.price).toFixed(2)}/${l.units||''}` : '';
      const img = l.image ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="" loading="lazy">` : '<div class="list-thumb placeholder"></div>';
      const hi = i === highlightedIndex ? ' highlighted' : '';
      const sel = l.id === selectedId ? ' selected' : '';
      return `
        <div class="list-item${hi}${sel}" role="listitem" data-id="${escapeHtml(l.id)}" tabindex="0">
          ${img}
          <div class="list-body">
            <div class="list-header">
              <strong>${escapeHtml(l.headerdescription || 'Untitled')}</strong>
              <button type="button" class="fav-btn" data-id="${escapeHtml(l.id)}" aria-label="Favorite">${fav}</button>
            </div>
            <div class="list-meta muted small">${escapeHtml(name)} · ${escapeHtml(l.category||'')} ${price ? '· ' + price : ''} ${dist ? '· ' + dist : ''}</div>
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-btn')) return;
        select(item.dataset.id);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(item.dataset.id);
        }
      });
    });
    el.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function applyFilters() {
    filtered = sortListings(allListings.filter(matchesFilters));
    renderChips();
    renderList();
    if (global.FD_MAP && global.FD_MAP.setListings) global.FD_MAP.setListings(filtered);
    highlightedIndex = -1;
  }

  function setListings(list) {
    allListings = Array.isArray(list) ? list : [];
    loadFavorites();
    populateFilterOptions();
    applyFilters();
  }

  function select(id) {
    selectedId = id;
    const l = allListings.find(x => x.id === id);
    if (l && global.FD_CARDS) global.FD_CARDS.showProduct(l);
    if (l && global.FD_MAP && global.FD_MAP.focusListing) global.FD_MAP.focusListing(l);
    if (global.FD_RECENT) global.FD_RECENT.add(id);
    renderList();
    history.replaceState(null, '', `#listing=${encodeURIComponent(id)}`);
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(favorites.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
  }

  function clearFavorites() {
    favorites.clear();
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function clearAllFilters() {
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['filter-favorites','filter-inview'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    applyFilters();
  }

  function bindUI() {
    const ids = ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort','filter-favorites','filter-inview'];
    ids.forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('filter-btn')?.addEventListener('click', () => {
      const card = document.getElementById('filter-card');
      if (card) card.hidden = !card.hidden;
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      document.getElementById('filter-card').hidden = true;
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!filtered.length) return;
        highlightedIndex = e.key === 'ArrowDown'
          ? Math.min(filtered.length - 1, highlightedIndex + 1)
          : Math.max(0, highlightedIndex - 1);
        renderList();
        const item = document.querySelector('.list-item.highlighted');
        item?.scrollIntoView({ block: 'nearest' });
      } else if ((e.key === 'Enter' || e.key === ' ') && highlightedIndex >= 0) {
        e.preventDefault();
        select(filtered[highlightedIndex].id);
      }
    });
  }

  function getListings() { return allListings; }
  function getFiltered() { return filtered; }

  function exportFiltered() {
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-listings.json';
    a.click();
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    applyFilters,
    getListings,
    getFiltered,
    select,
    clearFavorites,
    exportFiltered,
    toggleFavorite
  };
})(window);
