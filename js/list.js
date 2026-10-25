/**
 * FarmDirect B2B – sidebar list, filters, chips, favorites, distance, only-in-view.
 * Syncs with map markers. Fully client-side for seed/demo mode.
 */
(function (global) {
  'use strict';

  let allListings = [];
  let filtered = [];
  let userLocation = null;
  let highlightedId = null;
  const FAV_KEY = 'fd-favorites';

  function getFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch (_) { return new Set(); }
  }
  function saveFavorites(set) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch (_) {}
  }

  function getListings() { return allListings; }

  function setListings(list) {
    allListings = Array.isArray(list) ? list : [];
    applyFilters();
  }

  function setUserLocation(loc) {
    userLocation = loc;
    applyFilters();
  }

  function distanceKm(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371;
    const dLat = (b[0] - a[0]) * Math.PI / 180;
    const dLon = (b[1] - a[1]) * Math.PI / 180;
    const lat1 = a[0] * Math.PI / 180;
    const lat2 = b[0] * Math.PI / 180;
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function getFilterValues() {
    return {
      category: document.getElementById('filter-category')?.value || '',
      visibility: document.getElementById('filter-visibility')?.value || '',
      units: document.getElementById('filter-units')?.value || '',
      seller: document.getElementById('filter-seller')?.value || '',
      minprice: parseFloat(document.getElementById('filter-minprice')?.value) || 0,
      maxprice: parseFloat(document.getElementById('filter-maxprice')?.value) || Infinity,
      radius: parseFloat(document.getElementById('filter-radius')?.value) || 0,
      sort: document.getElementById('filter-sort')?.value || '',
      favorites: document.getElementById('filter-favorites')?.checked || false,
      inview: document.getElementById('filter-inview')?.checked || false,
      search: (document.getElementById('search-input')?.value || '').trim().toLowerCase()
    };
  }

  function applyFilters() {
    const f = getFilterValues();
    const favs = getFavorites();
    filtered = allListings.filter(l => {
      if (f.category && l.category !== f.category) return false;
      if (f.visibility && l.visibility !== f.visibility) return false;
      if (f.units && l.units !== f.units) return false;
      if (f.seller && l.sellerid !== f.seller) return false;
      const price = Number(l.price) || 0;
      if (price < f.minprice || price > f.maxprice) return false;
      if (f.favorites && !favs.has(l.id)) return false;
      if (f.search) {
        const hay = [l.headerdescription, l.description, l.category, l.sellerid, l.address, l.units].join(' ').toLowerCase();
        if (!hay.includes(f.search)) return false;
      }
      if (f.radius > 0 && userLocation && l.location) {
        const d = distanceKm(userLocation, [l.location.lat, l.location.long]);
        if (d > f.radius) return false;
      }
      if (f.inview && global.FD_MAP && global.FD_MAP.getMap) {
        const map = global.FD_MAP.getMap();
        if (map && l.location) {
          const bounds = map.getBounds();
          if (!bounds.contains([l.location.lat, l.location.long])) return false;
        }
      }
      return true;
    });

    // Sort
    if (f.sort === 'price-asc') filtered.sort((a, b) => (Number(a.price)||0) - (Number(b.price)||0));
    else if (f.sort === 'price-desc') filtered.sort((a, b) => (Number(b.price)||0) - (Number(a.price)||0));
    else if (f.sort === 'name') filtered.sort((a, b) => (a.headerdescription||'').localeCompare(b.headerdescription||''));
    else if (f.sort === 'distance' && userLocation) {
      filtered.sort((a, b) => {
        const da = a.location ? distanceKm(userLocation, [a.location.lat, a.location.long]) : Infinity;
        const db = b.location ? distanceKm(userLocation, [b.location.lat, b.location.long]) : Infinity;
        return da - db;
      });
    }

    renderList();
    renderChips();
    updateFilterOptions();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
    // Sync interactive legend active state
    if (global.FD_MAP && typeof global.FD_MAP.updateLegendActive === 'function') {
      global.FD_MAP.updateLegendActive(f.category || '');
    }
    const countEl = document.getElementById('list-count');
    if (countEl) countEl.textContent = filtered.length;
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;
    const favs = getFavorites();
    if (!filtered.length) {
      container.innerHTML = '<p class=\"muted empty-state\">No listings match the current filters.</p>';
      return;
    }
    container.innerHTML = filtered.map(l => {
      const color = global.FD_MAP?.getCategoryColor?.(l.category) || '#40916c';
      const price = l.price != null ? `$${Number(l.price).toFixed(2)}/${l.units||''}` : '';
      const fav = favs.has(l.id) ? '★' : '☆';
      const dist = (userLocation && l.location) ? ` · ${distanceKm(userLocation, [l.location.lat, l.location.long]).toFixed(1)} km` : '';
      return `
        <div class=\"listing-item\" data-id=\"${l.id}\" role=\"listitem\" tabindex=\"0\">
          <span class=\"cat-swatch\" style=\"background:${color}\" aria-hidden=\"true\"></span>
          <div class=\"listing-main\">
            <div class=\"listing-title\">${escapeHtml(l.headerdescription || 'Listing')}</div>
            <div class=\"listing-meta\">${escapeHtml(l.category || '')} · ${escapeHtml(l.sellerid || '')}${dist}</div>
            <div class=\"listing-price\">${price}</div>
          </div>
          <button type=\"button\" class=\"fav-btn\" data-id=\"${l.id}\" title=\"Favorite\">${fav}</button>
        </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', () => select(el.dataset.id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(el.dataset.id); }
      });
    });
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/\"/g,'\"');
  }

  function renderChips() {
    const box = document.getElementById('filter-chips');
    if (!box) return;
    const f = getFilterValues();
    const chips = [];
    if (f.category) chips.push({ label: f.category, key: 'category' });
    if (f.visibility) chips.push({ label: f.visibility, key: 'visibility' });
    if (f.units) chips.push({ label: f.units, key: 'units' });
    if (f.seller) chips.push({ label: f.seller, key: 'seller' });
    if (f.favorites) chips.push({ label: 'Favorites', key: 'favorites' });
    if (f.inview) chips.push({ label: 'In view', key: 'inview' });
    if (f.search) chips.push({ label: `\"${f.search}\"`, key: 'search' });
    box.innerHTML = chips.map(c => {
      const color = c.key === 'category' && global.FD_MAP?.getCategoryColor ? global.FD_MAP.getCategoryColor(c.label) : null;
      const swatch = color ? `<span class=\"chip-swatch\" style=\"background:${color}\"></span>` : '';
      return `<span class=\"chip\">${swatch}${escapeHtml(c.label)} <button type=\"button\" data-key=\"${c.key}\" aria-label=\"Remove\">×</button></span>`;
    }).join('');
    box.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => clearFilterKey(btn.dataset.key));
    });
    // Filter badge
    const badge = document.getElementById('filter-badge');
    if (badge) {
      const n = chips.length;
      badge.textContent = n || '';
      badge.hidden = n === 0;
    }
  }

  function clearFilterKey(key) {
    if (key === 'category') document.getElementById('filter-category').value = '';
    else if (key === 'visibility') document.getElementById('filter-visibility').value = '';
    else if (key === 'units') document.getElementById('filter-units').value = '';
    else if (key === 'seller') document.getElementById('filter-seller').value = '';
    else if (key === 'favorites') document.getElementById('filter-favorites').checked = false;
    else if (key === 'inview') document.getElementById('filter-inview').checked = false;
    else if (key === 'search') {
      const inp = document.getElementById('search-input');
      if (inp) inp.value = '';
    }
    applyFilters();
  }

  function updateFilterOptions() {
    // Populate selects once or on data change
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
    fillSelect('filter-category', cats);
    fillSelect('filter-units', units);
    fillSelect('filter-seller', sellers);
  }

  function fillSelect(id, options) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    const first = sel.querySelector('option')?.outerHTML || '<option value=\"\">Any</option>';
    sel.innerHTML = first + options.map(o => `<option value=\"${escapeHtml(o)}\">${escapeHtml(o)}</option>`).join('');
    if ([...sel.options].some(opt => opt.value === current)) sel.value = current;
  }

  function select(id) {
    highlightedId = id;
    const item = document.querySelector(`.listing-item[data-id=\"${id}\"]`);
    document.querySelectorAll('.listing-item').forEach(el => el.classList.remove('active'));
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    const listing = allListings.find(l => l.id === id);
    if (listing && global.FD_CARDS) global.FD_CARDS.showProduct(listing);
    if (global.FD_MAP) {
      global.FD_MAP.flyTo?.(id);
      global.FD_MAP.highlightMarker?.(id);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') global.FD_RECENT.add(id);
    // Update hash
    try { history.replaceState(null, '', `#listing=${encodeURIComponent(id)}`); } catch (_) {}
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavorites(favs);
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(favs.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
  }

  function clearFavorites() {
    saveFavorites(new Set());
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function exportFiltered() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered.json';
    a.click();
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function onMapMove() {
    if (document.getElementById('filter-inview')?.checked) applyFilters();
  }

  function bindUI() {
    const filterIds = ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort','filter-favorites','filter-inview'];
    filterIds.forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const inp = document.getElementById('search-input');
      if (inp) inp.value = '';
      applyFilters();
    });
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
      const search = document.getElementById('search-input');
      if (search) search.value = '';
      applyFilters();
    });
    // Filter card toggle
    const filterBtn = document.getElementById('filter-btn');
    const filterCard = document.getElementById('filter-card');
    filterBtn?.addEventListener('click', () => {
      const open = filterCard && !filterCard.hasAttribute('hidden');
      filterCard?.toggleAttribute('hidden', open);
      filterBtn.setAttribute('aria-expanded', String(!open));
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      filterCard?.setAttribute('hidden', '');
      filterBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    getListings,
    select,
    setUserLocation,
    onMapMove,
    clearFavorites,
    exportFiltered,
    applyFilters
  };
})(window);
