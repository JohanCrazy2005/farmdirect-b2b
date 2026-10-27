/**
 * FarmDirect B2B – listings list, filters, favorites, and visibility helpers
 * Renders sidebar list, applies filters (category/visibility/units/seller/price/radius/sort/favorites/in-view),
 * clickable visibility, category, and units badges, favorites (localStorage), filtered view links, JSON export.
 * Radius uses FD_MAP.getUserPosition(); in-view uses FD_MAP.getBounds().
 * Distance sort + distance display in list items; removable filter chips.
 * List items now show address and clickable units for better seed/demo context.
 * Fully client-side; works with seed/demo.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let allListings = [];
  let filtered = [];
  let favorites = loadFavorites();

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) { return new Set(); }
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); } catch (_) {}
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function visibilityLabel(v) {
    const map = { worldwide: 'Worldwide', country: 'Country', province: 'Province' };
    return map[v] || v || 'Unknown';
  }

  function getSellerName(id) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(id) : (id || '');
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getDistanceKm(listing, pos) {
    if (!pos || pos.lat == null || pos.lng == null) return null;
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return null;
    return haversine(pos.lat, pos.lng, lat, lng);
  }

  function getFilters() {
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
    const f = getFilters();
    let list = [...allListings];

    if (f.search) {
      list = list.filter(l => {
        const fields = [l.headerdescription, l.description, l.category, getSellerName(l.sellerid), l.address, l.units];
        return fields.some(x => x && String(x).toLowerCase().includes(f.search));
      });
    }
    if (f.category) list = list.filter(l => l.category === f.category);
    if (f.visibility) list = list.filter(l => l.visibility === f.visibility);
    if (f.units) list = list.filter(l => l.units === f.units);
    if (f.seller) list = list.filter(l => l.sellerid === f.seller);
    list = list.filter(l => {
      const p = Number(l.price);
      return isNaN(p) || (p >= f.minprice && p <= f.maxprice);
    });
    if (f.favorites) list = list.filter(l => favorites.has(l.id));

    // Radius filter (km) using current user position from map
    if (f.radius > 0 && global.FD_MAP && typeof global.FD_MAP.getUserPosition === 'function') {
      const pos = global.FD_MAP.getUserPosition();
      if (pos && pos.lat != null && pos.lng != null) {
        list = list.filter(l => {
          const d = getDistanceKm(l, pos);
          return d != null && d <= f.radius;
        });
      }
    }

    // In-view filter using current map bounds
    if (f.inview && global.FD_MAP && typeof global.FD_MAP.getBounds === 'function') {
      const bounds = global.FD_MAP.getBounds();
      if (bounds) {
        list = list.filter(l => {
          const loc = l.location || {};
          const lat = Number(loc.lat);
          const lng = Number(loc.long);
          if (isNaN(lat) || isNaN(lng)) return false;
          return bounds.contains([lat, lng]);
        });
      }
    }

    const pos = (global.FD_MAP && typeof global.FD_MAP.getUserPosition === 'function') ? global.FD_MAP.getUserPosition() : null;

    if (f.sort === 'price-asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (f.sort === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (f.sort === 'name') list.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));
    else if (f.sort === 'distance' && pos && pos.lat != null) {
      list.sort((a, b) => {
        const da = getDistanceKm(a, pos) ?? Infinity;
        const db = getDistanceKm(b, pos) ?? Infinity;
        return da - db;
      });
    }

    filtered = list;
    renderList();
    renderChips(f);
    updateCount();
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(filtered);
    }
  }

  function renderList() {
    const el = document.getElementById('listing-list');
    if (!el) return;
    if (!filtered.length) {
      el.innerHTML = '<p class="muted" style="padding:1rem">No listings match filters.</p>';
      return;
    }
    const pos = (global.FD_MAP && typeof global.FD_MAP.getUserPosition === 'function') ? global.FD_MAP.getUserPosition() : null;
    el.innerHTML = filtered.map(l => {
      const isFav = favorites.has(l.id);
      const seller = escapeHtml(getSellerName(l.sellerid));
      const vis = escapeHtml(l.visibility || '');
      const cat = escapeHtml(l.category || '');
      const units = escapeHtml(l.units || '');
      const dist = pos ? getDistanceKm(l, pos) : null;
      const distStr = dist != null ? ` · ${dist.toFixed(1)} km` : '';
      const addr = l.address ? `<div class="address-small muted">${escapeHtml(l.address)}</div>` : '';
      return `
        <div class="listing-item" data-id="${escapeHtml(l.id)}" role="listitem">
          <div><strong>${escapeHtml(l.headerdescription || 'Listing')}</strong> ${isFav ? '★' : ''}</div>
          <div class="meta">
            <button type="button" class="category-badge list-cat" data-cat="${cat}">${cat}</button>
            <button type="button" class="visibility-badge vis-${vis} list-vis" data-vis="${vis}">${escapeHtml(visibilityLabel(l.visibility))}</button>
            ${units ? `<button type="button" class="units-badge list-units" data-units="${units}">${units}</button>` : ''}
            · $${Number(l.price || 0).toFixed(2)}
            · ${seller}${distStr}
          </div>
          ${addr}
        </div>
      `;
    }).join('');

    el.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('list-vis') || e.target.classList.contains('list-cat') || e.target.classList.contains('list-units')) return;
        select(item.dataset.id);
      });
    });
    el.querySelectorAll('.list-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setVisibilityFilter(btn.dataset.vis);
      });
    });
    el.querySelectorAll('.list-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setCategoryFilter(btn.dataset.cat);
      });
    });
    el.querySelectorAll('.list-units').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setUnitsFilter(btn.dataset.units);
      });
    });
  }

  function renderChips(f) {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    if (f.category) chips.push({ label: `Category: ${f.category}`, clear: 'category' });
    if (f.visibility) chips.push({ label: `Visibility: ${visibilityLabel(f.visibility)}`, clear: 'visibility' });
    if (f.seller) chips.push({ label: `Seller: ${getSellerName(f.seller)}`, clear: 'seller' });
    if (f.units) chips.push({ label: `Units: ${f.units}`, clear: 'units' });
    if (f.minprice > 0) chips.push({ label: `Min: $${f.minprice}`, clear: 'minprice' });
    if (f.maxprice < Infinity) chips.push({ label: `Max: $${f.maxprice}`, clear: 'maxprice' });
    if (f.favorites) chips.push({ label: 'Favorites', clear: 'favorites' });
    if (f.search) chips.push({ label: `Search: ${f.search}`, clear: 'search' });
    if (f.radius > 0) chips.push({ label: `Radius: ${f.radius} km`, clear: 'radius' });
    if (f.inview) chips.push({ label: 'In view', clear: 'inview' });
    if (f.sort) chips.push({ label: `Sort: ${f.sort}`, clear: 'sort' });
    el.innerHTML = chips.map(c => `<span class="chip" data-clear="${escapeHtml(c.clear)}" title="Click to remove">${escapeHtml(c.label)} ×</span>`).join('');
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = filtered.length;
  }

  function populateFilterOptions() {
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))];

    const catSel = document.getElementById('filter-category');
    if (catSel) {
      const cur = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      catSel.value = cur;
    }
    const unitSel = document.getElementById('filter-units');
    if (unitSel) {
      const cur = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
      unitSel.value = cur;
    }
    const sellSel = document.getElementById('filter-seller');
    if (sellSel) {
      const cur = sellSel.value;
      sellSel.innerHTML = '<option value="">Any</option>' + sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getSellerName(s))}</option>`).join('');
      sellSel.value = cur;
    }
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    populateFilterOptions();
    applyFilters();
  }

  function select(id, fromMap) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    document.querySelectorAll('.listing-item').forEach(el => el.classList.toggle('highlighted', el.dataset.id === id));
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
    if (!fromMap && global.FD_MAP && typeof global.FD_MAP.highlight === 'function') {
      global.FD_MAP.highlight(id);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(id);
    }
    location.hash = 'listing=' + encodeURIComponent(id);
  }

  function setCategoryFilter(cat) {
    const sel = document.getElementById('filter-category');
    if (sel) {
      sel.value = cat || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) {
      sel.value = vis || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function setUnitsFilter(units) {
    const sel = document.getElementById('filter-units');
    if (sel) {
      sel.value = units || '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    applyFilters();
  }

  function clearFavorites() {
    favorites.clear();
    saveFavorites();
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function clearOneFilter(key) {
    const map = {
      category: () => { const el = document.getElementById('filter-category'); if (el) el.value = ''; },
      visibility: () => { const el = document.getElementById('filter-visibility'); if (el) el.value = ''; },
      units: () => { const el = document.getElementById('filter-units'); if (el) el.value = ''; },
      seller: () => { const el = document.getElementById('filter-seller'); if (el) el.value = ''; },
      minprice: () => { const el = document.getElementById('filter-minprice'); if (el) el.value = ''; },
      maxprice: () => { const el = document.getElementById('filter-maxprice'); if (el) el.value = ''; },
      radius: () => { const el = document.getElementById('filter-radius'); if (el) el.value = ''; },
      sort: () => { const el = document.getElementById('filter-sort'); if (el) el.value = ''; },
      favorites: () => { const el = document.getElementById('filter-favorites'); if (el) el.checked = false; },
      inview: () => { const el = document.getElementById('filter-inview'); if (el) el.checked = false; },
      search: () => { const el = document.getElementById('search-input'); if (el) el.value = ''; }
    };
    if (map[key]) {
      map[key]();
      applyFilters();
    }
  }

  function getFilteredViewLink() {
    const f = getFilters();
    const params = new URLSearchParams();
    if (f.category) params.set('category', f.category);
    if (f.visibility) params.set('visibility', f.visibility);
    if (f.seller) params.set('seller', f.seller);
    if (f.units) params.set('units', f.units);
    if (f.search) params.set('q', f.search);
    if (f.radius > 0) params.set('radius', f.radius);
    if (f.sort) params.set('sort', f.sort);
    return `${location.origin}${location.pathname}?${params.toString()}`;
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
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${filtered.length} listings`, 'success');
  }

  function bindUI() {
    const filterIds = ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller', 'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort', 'filter-favorites', 'filter-inview'];
    filterIds.forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
      document.getElementById('search-input').value = '';
      applyFilters();
    });
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      applyFilters();
    });
    document.getElementById('filter-btn')?.addEventListener('click', () => {
      const card = document.getElementById('filter-card');
      if (card) card.toggleAttribute('hidden');
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      document.getElementById('filter-card')?.setAttribute('hidden', '');
    });

    // Removable chips via event delegation
    document.getElementById('filter-chips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip[data-clear]');
      if (chip) {
        clearOneFilter(chip.dataset.clear);
      }
    });
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    select,
    setVisibilityFilter,
    setCategoryFilter,
    setUnitsFilter,
    toggleFavorite,
    clearFavorites,
    getListings: () => allListings,
    getFavorites: () => favorites,
    getFilteredViewLink,
    exportFiltered,
    applyFilters
  };
})(window);
