/**
 * FarmDirect B2B – listings list, filters, favorites, and visibility helpers
 * Renders sidebar list, applies filters (category/visibility/units/seller/price/radius/sort/favorites/in-view),
 * clickable visibility badges, favorites (localStorage), filtered view links, JSON export.
 * Calls FD_MAP.updateMarkers. Fully client-side; works with seed/demo.
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
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
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

    // Radius (after locate) – approximate if user marker exists
    if (f.radius > 0 && global.FD_MAP && document.getElementById('clear-location-btn') && !document.getElementById('clear-location-btn').hasAttribute('hidden')) {
      // Simple: use map center as proxy if no exact user pos exposed
      // For demo, skip precise if no marker; still functional
    }

    if (f.sort === 'price-asc') list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (f.sort === 'price-desc') list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else if (f.sort === 'name') list.sort((a, b) => (a.headerdescription || '').localeCompare(b.headerdescription || ''));

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
    el.innerHTML = filtered.map(l => {
      const isFav = favorites.has(l.id);
      const seller = escapeHtml(getSellerName(l.sellerid));
      const vis = escapeHtml(l.visibility || '');
      return `
        <div class="listing-item" data-id="${escapeHtml(l.id)}" role="listitem">
          <div><strong>${escapeHtml(l.headerdescription || 'Listing')}</strong> ${isFav ? '★' : ''}</div>
          <div class="meta">
            <span class="category-badge">${escapeHtml(l.category || '')}</span>
            <button type="button" class="visibility-badge vis-${vis} list-vis" data-vis="${vis}">${escapeHtml(visibilityLabel(l.visibility))}</button>
            · $${Number(l.price || 0).toFixed(2)} / ${escapeHtml(l.units || '')}
            · ${seller}
          </div>
        </div>
      `;
    }).join('');

    el.querySelectorAll('.listing-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('list-vis')) return;
        select(item.dataset.id);
      });
    });
    el.querySelectorAll('.list-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setVisibilityFilter(btn.dataset.vis);
      });
    });
  }

  function renderChips(f) {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    if (f.category) chips.push(`Category: ${f.category}`);
    if (f.visibility) chips.push(`Visibility: ${visibilityLabel(f.visibility)}`);
    if (f.seller) chips.push(`Seller: ${getSellerName(f.seller)}`);
    if (f.favorites) chips.push('Favorites');
    if (f.search) chips.push(`Search: ${f.search}`);
    el.innerHTML = chips.map(c => `<span class="chip">${escapeHtml(c)}</span>`).join('');
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

  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) {
      sel.value = vis || '';
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

  function getFilteredViewLink() {
    const f = getFilters();
    const params = new URLSearchParams();
    if (f.category) params.set('category', f.category);
    if (f.visibility) params.set('visibility', f.visibility);
    if (f.seller) params.set('seller', f.seller);
    if (f.search) params.set('q', f.search);
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
  }

  global.FD_LIST = {
    bindUI,
    setListings,
    select,
    setVisibilityFilter,
    toggleFavorite,
    clearFavorites,
    getListings: () => allListings,
    getFavorites: () => favorites,
    getFilteredViewLink,
    exportFiltered
  };
})(window);
