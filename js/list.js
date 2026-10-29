/**
 * FarmDirect B2B – sidebar listing list + filters
 * Renders #listing-list, applies filter-card + top search + radius/in-view,
 * favorites (localStorage), sort, selection (product card + map fly),
 * filter chips, keyboard navigation, filtered JSON export, and deep-link hash.
 * Uses seller display names from FD_SELLERS. Fully client-side; works with seed/demo.
 */
(function (global) {
  'use strict';

  const FAV_KEY = 'fd-favorites';
  let listings = [];
  let filtered = [];
  let highlightedId = null;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
    } catch (_) {}
  }

  function toggleFavorite(id) {
    if (!id) return;
    const favs = getFavorites();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    saveFavorites(favs);
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show(favs.has(id) ? 'Added to favorites' : 'Removed from favorites', 'info');
  }

  function clearFavorites() {
    saveFavorites(new Set());
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getUserPos() {
    return (global.FD_MAP && global.FD_MAP.getUserLocation) ? global.FD_MAP.getUserLocation() : null;
  }

  function populateFilterOptions() {
    const catSel = document.getElementById('filter-category');
    const unitsSel = document.getElementById('filter-units');
    const sellerSel = document.getElementById('filter-seller');
    if (!catSel || !unitsSel || !sellerSel) return;

    const cats = new Set();
    const units = new Set();
    const sellers = new Map();

    listings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) {
        const name = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
          ? global.FD_SELLERS.getDisplayName(l.sellerid) : l.sellerid;
        sellers.set(l.sellerid, name);
      }
    });

    const curCat = catSel.value;
    const curUnits = unitsSel.value;
    const curSeller = sellerSel.value;

    catSel.innerHTML = '<option value="">All</option>' +
      [...cats].sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    unitsSel.innerHTML = '<option value="">Any</option>' +
      [...units].sort().map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
    sellerSel.innerHTML = '<option value="">Any</option>' +
      [...sellers.entries()].sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');

    if ([...cats].includes(curCat)) catSel.value = curCat;
    if ([...units].includes(curUnits)) unitsSel.value = curUnits;
    if (sellers.has(curSeller)) sellerSel.value = curSeller;
  }

  function getFilterState() {
    return {
      q: (document.getElementById('search-input')?.value || '').trim().toLowerCase(),
      category: document.getElementById('filter-category')?.value || '',
      visibility: document.getElementById('filter-visibility')?.value || '',
      units: document.getElementById('filter-units')?.value || '',
      seller: document.getElementById('filter-seller')?.value || '',
      minPrice: parseFloat(document.getElementById('filter-minprice')?.value),
      maxPrice: parseFloat(document.getElementById('filter-maxprice')?.value),
      radius: parseFloat(document.getElementById('filter-radius')?.value),
      sort: document.getElementById('filter-sort')?.value || '',
      favoritesOnly: !!document.getElementById('filter-favorites')?.checked,
      inView: !!document.getElementById('filter-inview')?.checked
    };
  }

  function matches(listing, f) {
    if (f.q) {
      const sellerName = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
        ? global.FD_SELLERS.getDisplayName(listing.sellerid) : '';
      const hay = [
        listing.headerdescription, listing.description, listing.category,
        listing.address, listing.units, listing.sellerid, sellerName
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    if (f.category && listing.category !== f.category) return false;
    if (f.visibility && listing.visibility !== f.visibility) return false;
    if (f.units && listing.units !== f.units) return false;
    if (f.seller && listing.sellerid !== f.seller) return false;
    const price = Number(listing.price);
    if (!isNaN(f.minPrice) && (isNaN(price) || price < f.minPrice)) return false;
    if (!isNaN(f.maxPrice) && (isNaN(price) || price > f.maxPrice)) return false;
    if (f.favoritesOnly && !getFavorites().has(listing.id)) return false;

    if (f.inView && global.FD_MAP && global.FD_MAP.isInView && !global.FD_MAP.isInView(listing)) return false;

    if (!isNaN(f.radius) && f.radius > 0) {
      const user = getUserPos();
      if (user) {
        const loc = listing.location || {};
        const lat = Number(loc.lat);
        const lng = Number(loc.long);
        if (isNaN(lat) || isNaN(lng)) return false;
        const d = haversineKm(user.lat, user.lng, lat, lng);
        if (d > f.radius) return false;
      }
    }
    return true;
  }

  function sortListings(arr, sort) {
    const user = getUserPos();
    return arr.slice().sort((a, b) => {
      if (sort === 'price-asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sort === 'price-desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sort === 'name') return (a.headerdescription || '').localeCompare(b.headerdescription || '');
      if (sort === 'distance' && user) {
        const da = distanceOf(a, user);
        const db = distanceOf(b, user);
        return da - db;
      }
      return 0;
    });
  }

  function distanceOf(listing, user) {
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return Infinity;
    return haversineKm(user.lat, user.lng, lat, lng);
  }

  function renderChips(f) {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    if (f.q) chips.push({ label: `Search: ${f.q}`, clear: 'q' });
    if (f.category) chips.push({ label: f.category, clear: 'category' });
    if (f.visibility) chips.push({ label: f.visibility, clear: 'visibility' });
    if (f.units) chips.push({ label: f.units, clear: 'units' });
    if (f.seller) {
      const name = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
        ? global.FD_SELLERS.getDisplayName(f.seller) : f.seller;
      chips.push({ label: name, clear: 'seller' });
    }
    if (!isNaN(f.minPrice)) chips.push({ label: `Min $${f.minPrice}`, clear: 'minprice' });
    if (!isNaN(f.maxPrice)) chips.push({ label: `Max $${f.maxPrice}`, clear: 'maxprice' });
    if (!isNaN(f.radius) && f.radius > 0) chips.push({ label: `${f.radius} km`, clear: 'radius' });
    if (f.favoritesOnly) chips.push({ label: 'Favorites', clear: 'favorites' });
    if (f.inView) chips.push({ label: 'In view', clear: 'inview' });

    el.innerHTML = chips.map(c =>
      `<button type="button" class="chip" data-clear="${c.clear}">${escapeHtml(c.label)} ×</button>`
    ).join('');

    el.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => clearOneFilter(btn.dataset.clear));
    });
  }

  function clearOneFilter(key) {
    if (key === 'q') {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
    } else if (key === 'category') document.getElementById('filter-category').value = '';
    else if (key === 'visibility') document.getElementById('filter-visibility').value = '';
    else if (key === 'units') document.getElementById('filter-units').value = '';
    else if (key === 'seller') document.getElementById('filter-seller').value = '';
    else if (key === 'minprice') document.getElementById('filter-minprice').value = '';
    else if (key === 'maxprice') document.getElementById('filter-maxprice').value = '';
    else if (key === 'radius') document.getElementById('filter-radius').value = '';
    else if (key === 'favorites') document.getElementById('filter-favorites').checked = false;
    else if (key === 'inview') document.getElementById('filter-inview').checked = false;
    applyFilters();
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;

    const favs = getFavorites();
    const user = getUserPos();

    if (!filtered.length) {
      container.innerHTML = '<p class="muted" style="padding:1rem">No listings match the current filters.</p>';
    } else {
      container.innerHTML = filtered.map(l => {
        const seller = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
          ? global.FD_SELLERS.getDisplayName(l.sellerid) : (l.sellerid || '');
        const price = l.price != null ? `$${Number(l.price).toFixed(2)}` : '';
        const isFav = favs.has(l.id);
        let dist = '';
        if (user) {
          const d = distanceOf(l, user);
          if (isFinite(d)) dist = ` · ~${d.toFixed(1)} km`;
        }
        const active = l.id === highlightedId ? ' active' : '';
        return `
          <div class="list-item${active}" data-id="${escapeHtml(l.id)}" role="listitem" tabindex="0">
            <div class="list-item-main">
              <strong>${escapeHtml(l.headerdescription || 'Listing')}</strong>
              <span class="list-meta muted">${escapeHtml(l.category || '')} · ${escapeHtml(seller)}${dist}</span>
            </div>
            <div class="list-item-side">
              <span class="list-price">${price}${l.units ? ' / ' + escapeHtml(l.units) : ''}</span>
              <button type="button" class="fav-toggle" data-id="${escapeHtml(l.id)}" aria-label="Favorite">${isFav ? '★' : '☆'}</button>
            </div>
          </div>`;
      }).join('');
    }

    if (countEl) countEl.textContent = filtered.length;

    container.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-toggle')) return;
        select(item.dataset.id);
      });
    });
    container.querySelectorAll('.fav-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });
  }

  function applyFilters() {
    const f = getFilterState();
    filtered = listings.filter(l => matches(l, f));
    filtered = sortListings(filtered, f.sort);
    renderChips(f);
    renderList();
    if (global.FD_MAP && global.FD_MAP.updateMarkers) {
      global.FD_MAP.updateMarkers(filtered);
    }
    if (global.FD_MAP && global.FD_MAP.updateFilterRadius) {
      global.FD_MAP.updateFilterRadius();
    }
    // Update filter badge count
    const badge = document.getElementById('filter-badge');
    if (badge) {
      const active = Object.values(f).filter(v => v && v !== false && v !== '').length - (f.q ? 1 : 0);
      if (active > 0) {
        badge.textContent = active;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    }
  }

  function setListings(arr) {
    listings = Array.isArray(arr) ? arr : [];
    populateFilterOptions();
    applyFilters();
  }

  function getListings() {
    return listings;
  }

  function select(id, fromMap) {
    if (!id) return;
    highlightedId = id;
    const listing = listings.find(l => String(l.id) === String(id));
    if (!listing) return;
    renderList();
    if (global.FD_CARDS && global.FD_CARDS.openProduct) {
      global.FD_CARDS.openProduct(listing);
    }
    if (!fromMap && global.FD_MAP && global.FD_MAP.flyToListing) {
      global.FD_MAP.flyToListing(listing);
    }
    // Scroll into view in list
    const el = document.querySelector(`.list-item[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    // Update hash
    try {
      const url = new URL(location.href);
      url.hash = 'listing=' + encodeURIComponent(id);
      history.replaceState(null, '', url);
    } catch (_) {}
  }

  function setCategoryFilter(cat) {
    const sel = document.getElementById('filter-category');
    if (sel) { sel.value = cat || ''; applyFilters(); }
  }
  function setVisibilityFilter(vis) {
    const sel = document.getElementById('filter-visibility');
    if (sel) { sel.value = vis || ''; applyFilters(); }
  }
  function setUnitsFilter(u) {
    const sel = document.getElementById('filter-units');
    if (sel) { sel.value = u || ''; applyFilters(); }
  }
  function setSellerFilter(sid) {
    const sel = document.getElementById('filter-seller');
    if (sel) { sel.value = sid || ''; applyFilters(); }
  }

  function exportFiltered() {
    const data = filtered;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered-listings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${data.length} listings`, 'success');
  }

  function getFilteredViewLink() {
    const f = getFilterState();
    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q);
    if (f.category) params.set('cat', f.category);
    if (f.visibility) params.set('vis', f.visibility);
    if (f.seller) params.set('seller', f.seller);
    const base = location.origin + location.pathname;
    return params.toString() ? `${base}?${params}` : base;
  }

  function clearAllFilters() {
    document.getElementById('search-input').value = '';
    ['filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
     'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('filter-favorites').checked = false;
    document.getElementById('filter-inview').checked = false;
    applyFilters();
  }

  function onKeyNav(e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!filtered.length) return;
      let idx = filtered.findIndex(l => l.id === highlightedId);
      if (e.key === 'ArrowDown') idx = Math.min(idx + 1, filtered.length - 1);
      else idx = Math.max(idx - 1, 0);
      if (idx >= 0) select(filtered[idx].id);
    } else if ((e.key === 'Enter' || e.key === ' ') && highlightedId) {
      e.preventDefault();
      select(highlightedId);
    }
  }

  function bindUI() {
    const controls = [
      'filter-category', 'filter-visibility', 'filter-units', 'filter-seller',
      'filter-minprice', 'filter-maxprice', 'filter-radius', 'filter-sort',
      'filter-favorites', 'filter-inview', 'search-input'
    ];
    controls.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const ev = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
      el.addEventListener(ev, () => applyFilters());
    });

    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.locateMe) global.FD_MAP.locateMe();
    });
    document.getElementById('clear-location-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.clearLocation) global.FD_MAP.clearLocation();
    });
    document.getElementById('fit-all-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.fitAll) global.FD_MAP.fitAll();
    });

    document.addEventListener('keydown', onKeyNav);
  }

  global.FD_LIST = {
    setListings,
    getListings,
    applyFilters,
    select,
    bindUI,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSellerFilter,
    getFavorites,
    toggleFavorite,
    clearFavorites,
    exportFiltered,
    getFilteredViewLink
  };
})(window);
