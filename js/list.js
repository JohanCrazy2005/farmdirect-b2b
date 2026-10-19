/**
 * FarmDirect B2B – filters & list panel
 * Improved empty & loading states
 * + distance sort after geolocation (seed/demo friendly)
 * + general Sort control (distance / price / name) in filter card
 * + distance radius filter after Locate me (client-side, demo friendly)
 * + units filter (schema field; seed/demo friendly)
 * + min price filter (complements max price; seed/demo friendly)
 * + clear-search button in top bar (seed/demo friendly)
 */
(function (global) {
  'use strict';

  let allListings = [];
  let filtered = [];
  let activeFilters = { q: '', category: '', visibility: '', minPrice: '', maxPrice: '', sort: '', radius: '', units: '' };
  let hasLoaded = false;
  let userLatLng = null; // {lat, lng} after Locate me

  function setListings(listings) {
    allListings = listings || [];
    hasLoaded = true;
    applyFilters();
  }

  function getListings() {
    return allListings;
  }

  // Haversine distance in km
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
    return !!(activeFilters.q || activeFilters.category || activeFilters.visibility || activeFilters.minPrice || activeFilters.maxPrice || activeFilters.sort || activeFilters.radius || activeFilters.units);
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
      // Still loading – skeletons already in HTML
      return;
    }

    if (!filtered.length) {
      if (!allListings.length) {
        container.innerHTML = `
          <div class=\"empty-state\">
            <div class=\"empty-icon\" aria-hidden=\"true\">🗺️</div>
            <h4>No listings yet</h4>
            <p>The map is empty. Deploy the Worker or check the seed file.</p>
          </div>`;
      } else {
        container.innerHTML = `
          <div class=\"empty-state\">
            <div class=\"empty-icon\" aria-hidden=\"true\">🔍</div>
            <h4>No matches</h4>
            <p>No listings match your current filters.</p>
            ${hasActiveFilters() ? '<button type=\"button\" id=\"empty-clear\">Clear filters</button>' : ''}
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
        distHtml = `<div class=\"distance\">${formatDistance(km)}</div>`;
      }
      return `
      <div class=\"listing-card\" data-id=\"${escapeAttr(l.id)}\" onclick=\"FD_LIST.select('${escapeAttr(l.id)}')\" role=\"listitem\" tabindex=\"0\">
        <img src=\"${escapeAttr(l.image)}\" alt=\"\" onerror=\"this.style.background='var(--hover-bg)'\">
        <div class=\"listing-info\">
          <h3>${escapeHtml(l.headerdescription)}</h3>
          <div class=\"meta\">${escapeHtml(l.category)} · ${escapeHtml(l.visibility)}</div>
          <div class=\"price\">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)}</div>
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
    const el = document.querySelector(`.listing-card[data-id=\"${CSS.escape(id)}\"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (el) el.textContent = hasLoaded ? `${filtered.length} of ${allListings.length}` : '';
  }

  function updateMapOverlay() {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    if (!hasLoaded) return; // main.js controls initial hide

    if (!filtered.length) {
      const msg = !allListings.length
        ? 'No listings available'
        : 'No listings in view';
      overlay.innerHTML = `<div class=\"overlay-content\"><div class=\"empty-icon\" style=\"font-size:1.6rem;margin-bottom:0.4rem\">🗺️</div><div>${msg}</div></div>`;
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

  function clearFilters() {
    activeFilters = { q: '', category: '', visibility: '', minPrice: '', maxPrice: '', sort: '', radius: '', units: '' };
    const search = document.getElementById('search-input');
    const cat = document.getElementById('filter-category');
    const vis = document.getElementById('filter-visibility');
    const minPrice = document.getElementById('filter-minprice');
    const maxPrice = document.getElementById('filter-maxprice');
    const sort = document.getElementById('filter-sort');
    const radius = document.getElementById('filter-radius');
    const units = document.getElementById('filter-units');
    if (search) search.value = '';
    if (cat) cat.value = '';
    if (vis) vis.value = '';
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    if (sort) sort.value = '';
    if (radius) radius.value = '';
    if (units) units.value = '';
    applyFilters();
    document.getElementById('filter-card')?.classList.remove('open');
  }

  function bindUI() {
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
    const sort = document.getElementById('filter-sort');
    if (sort) {
      sort.addEventListener('change', e => {
        activeFilters.sort = e.target.value;
        if (activeFilters.sort === 'distance' && !userLatLng) {
          alert('Use the Locate me button first to enable distance sorting.');
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
          alert('Use the Locate me button first to enable distance filtering.');
          e.target.value = '';
          activeFilters.radius = '';
        } else {
          activeFilters.radius = val;
        }
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

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/\"/g, '\"');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  global.FD_LIST = { setListings, getListings, select, highlight, applyFilters, bindUI, clearFilters, sortByDistance, clearDistanceSort, clearSearch };
})(window);
