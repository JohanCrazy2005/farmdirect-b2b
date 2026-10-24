/**
 * FarmDirect B2B – listings list, filters, favorites, sidebar rendering
 * Substantial module. Works with seed/demo or API data.
 * Exposes: setListings, bindUI, getFiltered, getListings, exportFiltered, clearFavorites, select,
 *          highlight, sortByDistance, clearDistance, setUserLocation, applyFilters
 * Filter chips are now styled (.filter-chip) and individually removable.
 * List-map sync: hover highlight + Locate me distance sort now fully wired.
 * Filter card now closes on × button or outside click.
 * Units filter select is populated dynamically from unique listing units.
 * applyFilters is exposed so the map can re-apply the “Only in view” filter on pan/zoom.
 * Empty state includes Clear filters when active; filter icon shows active count badge.
 * Filter state (search, category, prices, sort, radius, favorites, in-view, etc.) is persisted
 * in localStorage and restored on load so demo exploration survives reloads.
 */
(function (global) {
  'use strict';

  const FAVORITES_KEY = 'fd-favorites';
  const FILTER_STATE_KEY = 'fd-filter-state';
  let allListings = [];
  let filtered = [];
  let userLocation = null; // {lat, lng} from map.locateMe
  let highlightedId = null;
  let filtersRestored = false;

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
  }
  function setFavorites(ids) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  }
  function isFavorite(id) {
    return getFavorites().includes(id);
  }
  function toggleFavorite(id) {
    const favs = getFavorites();
    const i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1);
    else favs.push(id);
    setFavorites(favs);
    renderList();
    if (global.FD_CARDS && global.FD_CARDS.refresh) global.FD_CARDS.refresh();
  }

  function saveFilterState() {
    try {
      const f = getFilterState();
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
        category: f.category,
        visibility: f.visibility,
        units: f.units,
        seller: f.seller,
        minPrice: f.minPrice,
        maxPrice: f.maxPrice,
        sort: f.sort,
        radius: f.radius,
        favoritesOnly: f.favoritesOnly,
        inView: f.inView,
        search: f.search
      }));
    } catch (_) {}
  }

  function restoreFilterState() {
    try {
      const raw = localStorage.getItem(FILTER_STATE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (!el || val == null || val === '') return;
        if (el.type === 'checkbox') el.checked = !!val;
        else el.value = String(val);
      };
      setVal('filter-category', s.category);
      setVal('filter-visibility', s.visibility);
      setVal('filter-units', s.units);
      setVal('filter-seller', s.seller);
      if (s.minPrice != null) setVal('filter-minprice', s.minPrice);
      if (s.maxPrice != null) setVal('filter-maxprice', s.maxPrice);
      setVal('filter-sort', s.sort);
      if (s.radius != null) setVal('filter-radius', s.radius);
      setVal('filter-favorites', s.favoritesOnly);
      setVal('filter-inview', s.inView);
      setVal('search-input', s.search);
    } catch (_) {}
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings.slice() : [];
    populateFilterSelects();
    if (!filtersRestored) {
      restoreFilterState();
      filtersRestored = true;
    }
    applyFilters();
  }

  function getListings() {
    return allListings.slice();
  }

  function populateFilterSelects() {
    const catSel = document.getElementById('filter-category');
    const sellerSel = document.getElementById('filter-seller');
    const unitsSel = document.getElementById('filter-units');
    if (catSel) {
      const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
      catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
    if (sellerSel) {
      const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
      sellerSel.innerHTML = '<option value="">Any</option>' + sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }
    if (unitsSel) {
      const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
      unitsSel.innerHTML = '<option value="">Any</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
    }
  }

  function getFilterState() {
    return {
      category: (document.getElementById('filter-category')?.value || '').trim(),
      visibility: (document.getElementById('filter-visibility')?.value || '').trim(),
      units: (document.getElementById('filter-units')?.value || '').trim(),
      seller: (document.getElementById('filter-seller')?.value || '').trim(),
      minPrice: parseFloat(document.getElementById('filter-minprice')?.value) || null,
      maxPrice: parseFloat(document.getElementById('filter-maxprice')?.value) || null,
      sort: (document.getElementById('filter-sort')?.value || '').trim(),
      radius: parseFloat(document.getElementById('filter-radius')?.value) || null,
      favoritesOnly: !!document.getElementById('filter-favorites')?.checked,
      inView: !!document.getElementById('filter-inview')?.checked,
      search: (document.getElementById('search-input')?.value || '').trim().toLowerCase()
    };
  }

  function hasActiveFilters(f) {
    return !!(f.category || f.visibility || f.units || f.seller ||
              f.minPrice != null || f.maxPrice != null ||
              f.favoritesOnly || f.inView || f.radius || f.search);
  }

  function countActiveFilters(f) {
    let n = 0;
    if (f.category) n++;
    if (f.visibility) n++;
    if (f.units) n++;
    if (f.seller) n++;
    if (f.minPrice != null || f.maxPrice != null) n++;
    if (f.favoritesOnly) n++;
    if (f.inView) n++;
    if (f.radius) n++;
    if (f.search) n++;
    return n;
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function applyFilters() {
    const f = getFilterState();
    const favs = getFavorites();
    const bounds = (f.inView && global.FD_MAP && typeof global.FD_MAP.getBounds === 'function')
      ? global.FD_MAP.getBounds()
      : null;

    filtered = allListings.filter(l => {
      if (f.category && l.category !== f.category) return false;
      if (f.visibility && l.visibility !== f.visibility) return false;
      if (f.units && l.units !== f.units) return false;
      if (f.seller && l.sellerid !== f.seller) return false;
      if (f.minPrice != null && (l.price == null || l.price < f.minPrice)) return false;
      if (f.maxPrice != null && (l.price == null || l.price > f.maxPrice)) return false;
      if (f.favoritesOnly && !favs.includes(l.id)) return false;
      if (f.search) {
        const hay = `${l.headerdescription || ''} ${l.category || ''} ${l.sellerid || ''} ${l.address || ''} ${l.description || ''}`.toLowerCase();
        if (!hay.includes(f.search)) return false;
      }
      if (f.radius != null && userLocation && l.location) {
        const d = distanceKm(userLocation.lat, userLocation.lng, l.location.lat, l.location.long);
        if (d > f.radius) return false;
      }
      if (bounds && l.location) {
        const { lat, long } = l.location;
        if (lat < bounds.south || lat > bounds.north || long < bounds.west || long > bounds.east) return false;
      }
      return true;
    });

    // sort
    if (f.sort === 'price-asc') filtered.sort((a,b) => (a.price||0) - (b.price||0));
    else if (f.sort === 'price-desc') filtered.sort((a,b) => (b.price||0) - (a.price||0));
    else if (f.sort === 'name') filtered.sort((a,b) => (a.headerdescription||'').localeCompare(b.headerdescription||''));
    else if (f.sort === 'distance' && userLocation) {
      filtered.sort((a,b) => {
        const da = a.location ? distanceKm(userLocation.lat, userLocation.lng, a.location.lat, a.location.long) : Infinity;
        const db = b.location ? distanceKm(userLocation.lat, userLocation.lng, b.location.lat, b.location.long) : Infinity;
        return da - db;
      });
    }

    renderList();
    if (global.FD_MAP && typeof global.FD_MAP.renderMarkers === 'function') {
      global.FD_MAP.renderMarkers(filtered);
    }
    updateChips();
    updateFilterBadge(f);
    saveFilterState();
  }

  function updateFilterBadge(f) {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const n = countActiveFilters(f);
    if (n > 0) {
      badge.textContent = String(n);
      badge.removeAttribute('hidden');
    } else {
      badge.setAttribute('hidden', '');
    }
  }

  function clearAllFilters() {
    const ids = ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-sort','filter-radius','filter-favorites','filter-inview','search-input'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    applyFilters();
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (!container) return;
    if (countEl) countEl.textContent = String(filtered.length);

    if (!filtered.length) {
      const f = getFilterState();
      const showClear = hasActiveFilters(f);
      container.innerHTML = `<div class=\"empty-list\">No listings match the current filters.${showClear ? '<br><button type=\"button\" id=\"empty-clear-filters\" class=\"small-btn\" style=\"margin-top:0.75rem\">Clear filters</button>' : ''}</div>`;
      if (showClear) {
        document.getElementById('empty-clear-filters')?.addEventListener('click', clearAllFilters);
      }
      return;
    }

    container.innerHTML = filtered.map(l => {
      const fav = isFavorite(l.id);
      const img = l.image ? `<img class=\"list-thumb\" src=\"${escapeHtml(l.image)}\" alt=\"\" loading=\"lazy\">` : '<div class=\"list-thumb placeholder\"></div>';
      let distHtml = '';
      if (userLocation && l.location && l.location.lat != null && l.location.long != null) {
        const d = distanceKm(userLocation.lat, userLocation.lng, l.location.lat, l.location.long);
        distHtml = `<div class=\"listing-item-dist\">${d < 1 ? (d * 1000).toFixed(0) + ' m' : d.toFixed(1) + ' km'} away</div>`;
      }
      const active = highlightedId === l.id ? ' active' : '';
      return `<div class=\"listing-item${active}\" data-id=\"${escapeHtml(l.id)}\" role=\"listitem\">
        ${img}
        <div class=\"listing-item-body\">
          <div class=\"listing-item-title\">${escapeHtml(l.headerdescription || 'Untitled')}</div>
          <div class=\"listing-item-meta\">${escapeHtml(l.category || '')} · ${escapeHtml(l.sellerid || '')} · $${Number(l.price||0).toFixed(2)} / ${escapeHtml(l.units || 'unit')}</div>
          <div class=\"listing-item-addr\">${escapeHtml(l.address || '')}</div>
          ${distHtml}
        </div>
        <button class=\"fav-btn\" data-fav=\"${escapeHtml(l.id)}\" title=\"Favorite\" aria-pressed=\"${fav}\">${fav ? '★' : '☆'}</button>
      </div>`;
    }).join('');

    container.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(el.dataset.id);
      });
      el.addEventListener('mouseenter', () => {
        const id = el.dataset.id;
        if (global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
          global.FD_MAP.highlightMarker(id);
        }
      });
      el.addEventListener('mouseleave', () => {
        if (global.FD_MAP && typeof global.FD_MAP.clearMarkerHighlight === 'function') {
          global.FD_MAP.clearMarkerHighlight();
        }
      });
    });
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.fav);
      });
    });
  }

  function highlight(id) {
    highlightedId = id || null;
    const container = document.getElementById('listing-list');
    if (!container) return;
    container.querySelectorAll('.listing-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
    // Scroll into view if present
    if (id) {
      const el = container.querySelector(`.listing-item[data-id=\"${CSS.escape(id)}\"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function sortByDistance(lat, lng) {
    if (typeof lat === 'number' && typeof lng === 'number') {
      setUserLocation({ lat, lng });
      // Optionally auto-select distance sort so the list reorders
      const sortSel = document.getElementById('filter-sort');
      if (sortSel && !sortSel.value) {
        sortSel.value = 'distance';
      }
      applyFilters();
    }
  }

  function clearDistance() {
    setUserLocation(null);
    const sortSel = document.getElementById('filter-sort');
    if (sortSel && sortSel.value === 'distance') sortSel.value = '';
    applyFilters();
  }

  function updateChips() {
    const chips = document.getElementById('filter-chips');
    if (!chips) return;
    const f = getFilterState();
    const items = [];
    if (f.category) items.push({ label: `Category: ${f.category}`, clear: () => { const el = document.getElementById('filter-category'); if (el) el.value = ''; } });
    if (f.visibility) items.push({ label: `Visibility: ${f.visibility}`, clear: () => { const el = document.getElementById('filter-visibility'); if (el) el.value = ''; } });
    if (f.units) items.push({ label: `Units: ${f.units}`, clear: () => { const el = document.getElementById('filter-units'); if (el) el.value = ''; } });
    if (f.seller) items.push({ label: `Seller: ${f.seller}`, clear: () => { const el = document.getElementById('filter-seller'); if (el) el.value = ''; } });
    if (f.minPrice != null || f.maxPrice != null) items.push({ label: `Price: ${f.minPrice||0}–${f.maxPrice||'∞'}`, clear: () => { const min = document.getElementById('filter-minprice'); const max = document.getElementById('filter-maxprice'); if (min) min.value = ''; if (max) max.value = ''; } });
    if (f.favoritesOnly) items.push({ label: 'Favorites', clear: () => { const el = document.getElementById('filter-favorites'); if (el) el.checked = false; } });
    if (f.inView) items.push({ label: 'In view', clear: () => { const el = document.getElementById('filter-inview'); if (el) el.checked = false; } });
    if (f.radius) items.push({ label: `≤${f.radius} km`, clear: () => { const el = document.getElementById('filter-radius'); if (el) el.value = ''; } });
    if (f.search) items.push({ label: `Search: ${f.search}`, clear: () => { const el = document.getElementById('search-input'); if (el) el.value = ''; } });
    chips.innerHTML = items.map((item, i) => `<span class=\"filter-chip\">${escapeHtml(item.label)} <button type=\"button\" data-chip=\"${i}\" aria-label=\"Remove filter\">×</button></span>`).join('');
    chips.querySelectorAll('button[data-chip]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.chip, 10);
        if (items[idx]) {
          items[idx].clear();
          applyFilters();
        }
      });
    });
  }

  function select(id) {
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    highlight(id);
    if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyTo === 'function' && listing.location) {
      global.FD_MAP.flyTo(listing);
    }
    if (global.FD_RECENT && typeof global.FD_RECENT.add === 'function') {
      global.FD_RECENT.add(id);
    }
    history.replaceState(null, '', `#listing=${encodeURIComponent(id)}`);
  }

  function getFiltered() {
    return filtered.slice();
  }

  function exportFiltered() {
    const data = getFiltered();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'farmdirect-filtered-listings.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (global.FD_TOAST) global.FD_TOAST.show(`Exported ${data.length} listings`, 'success');
  }

  function clearFavorites() {
    setFavorites([]);
    applyFilters();
    if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
  }

  function bindUI() {
    const ids = ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-sort','filter-radius','filter-favorites','filter-inview','search-input'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', applyFilters);
      if (el && el.tagName === 'SELECT') el.addEventListener('change', applyFilters);
    });
    document.getElementById('clear-filters')?.addEventListener('click', clearAllFilters);
    document.getElementById('clear-search')?.addEventListener('click', () => {
      const s = document.getElementById('search-input');
      if (s) s.value = '';
      applyFilters();
    });
    // filter card toggle + close on × or outside click
    const filterCard = document.getElementById('filter-card');
    document.getElementById('filter-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      filterCard?.classList.toggle('open');
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      filterCard?.classList.remove('open');
    });
    document.addEventListener('click', (e) => {
      if (filterCard && filterCard.classList.contains('open') && !filterCard.contains(e.target) && e.target.id !== 'filter-btn') {
        filterCard.classList.remove('open');
      }
    });
  }

  // called by map when user location changes
  function setUserLocation(loc) {
    userLocation = loc;
    applyFilters();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  global.FD_LIST = {
    setListings,
    bindUI,
    getFiltered,
    getListings,
    exportFiltered,
    clearFavorites,
    select,
    setUserLocation,
    toggleFavorite,
    isFavorite,
    highlight,
    sortByDistance,
    clearDistance,
    applyFilters
  };
})(window);
