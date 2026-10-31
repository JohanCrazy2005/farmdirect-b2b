/**
 * FarmDirect B2B – listings sidebar + filtering
 * Holds the current set of listings (from API / seed / demo), applies filters,
 * renders the list, handles selection (opens product card + flies map),
 * favorites (localStorage), and navigation. Fully client-side.
 * Includes random listing picker, Nearby quick filter (25 km + distance sort),
 * sidebar sort (price ↑/↓ or distance when location is known), Fit map,
 * Only-in-map-view filter, Favorites quick toggle, shareable filtered-view links,
 * Clear & fit reset, Locate button, active-filter count badge on the filter icon,
 * and a clickable filtered/total count in the sidebar header (seed/demo UX).
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

  function isFavorite(id) {
    return getFavorites().includes(id);
  }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    saveFavorites(favs);
    render();
    if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
      global.FD_MAP.setListings(filtered);
    }
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid)
      : (sellerid || '');
  }

  function getUserLocation() {
    return (global.FD_MAP && typeof global.FD_MAP.getUserLocation === 'function')
      ? global.FD_MAP.getUserLocation()
      : null;
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

  function distanceFor(listing, userPos) {
    if (!userPos || !listing || !listing.location) return null;
    const lat = Number(listing.location.lat);
    const lng = Number(listing.location.long);
    if (isNaN(lat) || isNaN(lng)) return null;
    return haversineKm(userPos.lat, userPos.lng, lat, lng);
  }

  function isInCurrentView(listing) {
    if (!filters.inView) return true;
    const map = (global.FD_MAP && typeof global.FD_MAP.getMap === 'function') ? global.FD_MAP.getMap() : null;
    if (!map || typeof map.getBounds !== 'function') return true;
    const bounds = map.getBounds();
    if (!bounds) return true;
    const loc = listing.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    if (isNaN(lat) || isNaN(lng)) return false;
    return bounds.contains([lat, lng]);
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
      if (filters.minPrice != null && !isNaN(filters.minPrice) && (isNaN(price) || price < filters.minPrice)) return false;
      if (filters.maxPrice != null && !isNaN(filters.maxPrice) && (isNaN(price) || price > filters.maxPrice)) return false;
      if (favs && !favs.has(l.id)) return false;
      if (filters.nearby && userPos) {
        const d = distanceFor(l, userPos);
        if (d == null || d > NEARBY_KM) return false;
      }
      if (!isInCurrentView(l)) return false;
      if (q) {
        const hay = [
          l.headerdescription, l.description, l.category,
          getDisplayName(l.sellerid), l.sellerid, l.address, l.units
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Apply sort
    const sortKey = filters.sort || 'default';
    if (sortKey === 'price-asc') {
      filtered.sort((a, b) => {
        const pa = Number(a.price); const pb = Number(b.price);
        if (isNaN(pa) && isNaN(pb)) return 0;
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        return pa - pb;
      });
    } else if (sortKey === 'price-desc') {
      filtered.sort((a, b) => {
        const pa = Number(a.price); const pb = Number(b.price);
        if (isNaN(pa) && isNaN(pb)) return 0;
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        return pb - pa;
      });
    } else if (sortKey === 'distance' || filters.nearby) {
      const pos = userPos || getUserLocation();
      if (pos && filtered.length) {
        filtered.sort((a, b) => {
          const da = distanceFor(a, pos) ?? Infinity;
          const db = distanceFor(b, pos) ?? Infinity;
          return da - db;
        });
      }
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
  }

  function render() {
    applyFilters();
    const listEl = document.getElementById('listing-list');
    const countEl = document.getElementById('list-count');
    if (countEl) {
      const total = allListings.length;
      const shown = filtered.length;
      const hasActive = countActiveFilters() > 0 || (filters.q && String(filters.q).trim());
      if (hasActive && shown !== total) {
        countEl.textContent = `(${shown} of ${total})`;
        countEl.title = 'Click to clear filters';
        countEl.style.cursor = 'pointer';
        countEl.onclick = clearFilters;
      } else {
        countEl.textContent = `(${shown})`;
        countEl.title = '';
        countEl.style.cursor = '';
        countEl.onclick = null;
      }
    }
    if (!listEl) return;

    if (!filtered.length) {
      listEl.innerHTML = `<div class=\"empty-state\"><p>No listings match the current filters.</p><button type=\"button\" class=\"small-btn\" id=\"clear-from-empty\">Clear filters</button></div>`;
      document.getElementById('clear-from-empty')?.addEventListener('click', clearFilters);
      // Still update map
      if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
        global.FD_MAP.setListings(filtered);
      }
      renderChips();
      updateInViewButton();
      updateFavoritesButton();
      updateFilterBadge();
      return;
    }

    const userPos = getUserLocation();

    listEl.innerHTML = filtered.map(l => {
      const seller = escapeHtml(getDisplayName(l.sellerid));
      const price = l.price != null ? `$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units || '')}` : '';
      const fav = isFavorite(l.id);
      const thumb = l.image
        ? `<img class=\"list-thumb\" src=\"${escapeHtml(l.image)}\" alt=\"\">`
        : `<div class=\"list-thumb placeholder\">${escapeHtml((l.category || '?').slice(0, 3).toUpperCase())}</div>`;
      let distHtml = '';
      if (userPos) {
        const d = distanceFor(l, userPos);
        if (d != null) distHtml = `<span class=\"muted\">~${d.toFixed(1)} km</span>`;
      }
      return `
        <div class=\"listing-item${selectedId === l.id ? ' active' : ''}\" data-id=\"${escapeHtml(l.id)}\" role=\"listitem\" tabindex=\"0\">
          ${thumb}
          <div class=\"list-body\">
            <div class=\"list-title\">${escapeHtml(l.headerdescription || 'Listing')}</div>
            <div class=\"list-meta\">
              <span class=\"category-badge\">${escapeHtml(l.category || '')}</span>
              <span>${escapeHtml(price)}</span>
              ${distHtml}
            </div>
            <div class=\"list-seller muted small\">${seller}</div>
          </div>
          <button type=\"button\" class=\"icon-btn fav-btn\" data-id=\"${escapeHtml(l.id)}\" aria-label=\"${fav ? 'Unfavorite' : 'Favorite'}\">${fav ? '★' : '☆'}</button>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(el.dataset.id);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(el.dataset.id);
        }
      });
    });
    listEl.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
      });
    });

    // Update map with filtered set
    if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
      global.FD_MAP.setListings(filtered);
    }

    // Populate filter dropdowns once
    populateFilterOptions();
    renderChips();
    updateInViewButton();
    updateFavoritesButton();
    updateFilterBadge();
  }

  function updateInViewButton() {
    const btn = document.getElementById('in-view-btn');
    if (!btn) return;
    btn.classList.toggle('active', !!filters.inView);
    btn.setAttribute('aria-pressed', filters.inView ? 'true' : 'false');
  }

  function updateFavoritesButton() {
    const btn = document.getElementById('favorites-btn');
    if (!btn) return;
    btn.classList.toggle('active', !!filters.favoritesOnly);
    btn.setAttribute('aria-pressed', filters.favoritesOnly ? 'true' : 'false');
  }

  function countActiveFilters() {
    let n = 0;
    if (filters.category) n++;
    if (filters.seller) n++;
    if (filters.visibility) n++;
    if (filters.units) n++;
    if (filters.minPrice != null) n++;
    if (filters.maxPrice != null) n++;
    if (filters.favoritesOnly) n++;
    if (filters.nearby) n++;
    if (filters.inView) n++;
    if (filters.sort && filters.sort !== 'default') n++;
    return n;
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    const n = countActiveFilters();
    if (n > 0) {
      badge.hidden = false;
      badge.textContent = String(n);
      badge.title = n + ' active filter' + (n === 1 ? '' : 's');
    } else {
      badge.hidden = true;
      badge.textContent = '';
    }
  }

  function populateFilterOptions() {
    const catSel = document.getElementById('filter-category');
    const sellerSel = document.getElementById('filter-seller');
    const unitsSel = document.getElementById('filter-units');
    if (!catSel || !sellerSel || !unitsSel) return;

    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();

    const curCat = catSel.value;
    const curSeller = sellerSel.value;
    const curUnits = unitsSel.value;

    catSel.innerHTML = '<option value=\"\">All categories</option>' + cats.map(c => `<option value=\"${escapeHtml(c)}\">${escapeHtml(c)}</option>`).join('');
    sellerSel.innerHTML = '<option value=\"\">All sellers</option>' + sellers.map(s => `<option value=\"${escapeHtml(s)}\">${escapeHtml(getDisplayName(s))}</option>`).join('');
    unitsSel.innerHTML = '<option value=\"\">Any units</option>' + units.map(u => `<option value=\"${escapeHtml(u)}\">${escapeHtml(u)}</option>`).join('');

    if (cats.includes(curCat)) catSel.value = curCat;
    if (sellers.includes(curSeller)) sellerSel.value = curSeller;
    if (units.includes(curUnits)) unitsSel.value = curUnits;
  }

  function renderChips() {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    if (filters.category) chips.push({ key: 'category', label: filters.category });
    if (filters.seller) chips.push({ key: 'seller', label: getDisplayName(filters.seller) });
    if (filters.visibility) chips.push({ key: 'visibility', label: filters.visibility });
    if (filters.units) chips.push({ key: 'units', label: filters.units });
    if (filters.favoritesOnly) chips.push({ key: 'favoritesOnly', label: 'Favorites' });
    if (filters.nearby) chips.push({ key: 'nearby', label: `Nearby ≤${NEARBY_KM} km` });
    if (filters.inView) chips.push({ key: 'inView', label: 'In map view' });
    if (filters.minPrice != null) chips.push({ key: 'minPrice', label: `Min $${filters.minPrice}` });
    if (filters.maxPrice != null) chips.push({ key: 'maxPrice', label: `Max $${filters.maxPrice}` });
    if (filters.sort && filters.sort !== 'default') {
      const labels = { 'price-asc': 'Price ↑', 'price-desc': 'Price ↓', 'distance': 'Distance' };
      chips.push({ key: 'sort', label: labels[filters.sort] || filters.sort });
    }
    el.innerHTML = chips.map(c => `<span class=\"filter-chip\">${escapeHtml(c.label)} <button type=\"button\" data-key=\"${c.key}\" aria-label=\"Remove\">×</button></span>`).join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === 'favoritesOnly' || key === 'nearby' || key === 'inView') filters[key] = false;
        else if (key === 'minPrice' || key === 'maxPrice') filters[key] = null;
        else if (key === 'sort') filters.sort = 'default';
        else filters[key] = '';
        syncFilterUI();
        render();
      });
    });
  }

  function syncFilterUI() {
    const cat = document.getElementById('filter-category');
    const seller = document.getElementById('filter-seller');
    const vis = document.getElementById('filter-visibility');
    const units = document.getElementById('filter-units');
    const min = document.getElementById('filter-min-price');
    const max = document.getElementById('filter-max-price');
    const fav = document.getElementById('filter-favorites');
    const sortSel = document.getElementById('sort-select');
    if (cat) cat.value = filters.category || '';
    if (seller) seller.value = filters.seller || '';
    if (vis) vis.value = filters.visibility || '';
    if (units) units.value = filters.units || '';
    if (min) min.value = filters.minPrice != null ? filters.minPrice : '';
    if (max) max.value = filters.maxPrice != null ? filters.maxPrice : '';
    if (fav) fav.checked = !!filters.favoritesOnly;
    if (sortSel) sortSel.value = filters.sort || 'default';
    updateInViewButton();
    updateFavoritesButton();
  }

  function readFiltersFromUI() {
    filters.category = document.getElementById('filter-category')?.value || '';
    filters.seller = document.getElementById('filter-seller')?.value || '';
    filters.visibility = document.getElementById('filter-visibility')?.value || '';
    filters.units = document.getElementById('filter-units')?.value || '';
    const min = document.getElementById('filter-min-price')?.value;
    const max = document.getElementById('filter-max-price')?.value;
    filters.minPrice = min !== '' && min != null ? Number(min) : null;
    filters.maxPrice = max !== '' && max != null ? Number(max) : null;
    filters.favoritesOnly = !!document.getElementById('filter-favorites')?.checked;
    // nearby, inView and sort are toggled via their controls
  }

  function clearFilters() {
    filters = { q: filters.q, category: '', seller: '', visibility: '', units: '', minPrice: null, maxPrice: null, favoritesOnly: false, nearby: false, inView: false, sort: 'default' };
    syncFilterUI();
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
  }

  function setSearch(q) {
    filters.q = q || '';
    render();
  }

  function setCategoryFilter(cat) {
    filters.category = cat || '';
    syncFilterUI();
    render();
  }

  function setVisibilityFilter(vis) {
    filters.visibility = vis || '';
    syncFilterUI();
    render();
  }

  function setUnitsFilter(u) {
    filters.units = u || '';
    syncFilterUI();
    render();
  }

  function select(id) {
    const listing = allListings.find(l => String(l.id) === String(id)) || filtered.find(l => String(l.id) === String(id));
    if (!listing) return;
    selectedId = listing.id;
    // Track for recently viewed (seed/demo UX)
    if (global.FD_RECENT && typeof global.FD_RECENT.track === 'function') {
      global.FD_RECENT.track(listing.id);
    }
    render();
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
    if (global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') {
      global.FD_MAP.flyToListing(listing);
    }
    // On mobile, close sidebar after select
    if (window.innerWidth < 900) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  }

  function navigate(delta) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => String(l.id) === String(selectedId));
    if (idx < 0) idx = 0;
    else idx = (idx + delta + filtered.length) % filtered.length;
    select(filtered[idx].id);
  }

  /**
   * Pick a random listing from the current filtered set and select it
   * (opens product card + flies map). Useful for seed/demo exploration.
   */
  function pickRandom() {
    applyFilters();
    if (!filtered.length) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listings in the current filter set', 'info');
      return;
    }
    const idx = Math.floor(Math.random() * filtered.length);
    const listing = filtered[idx];
    select(listing.id);
    if (global.FD_TOAST) {
      const name = listing.headerdescription || listing.category || 'listing';
      global.FD_TOAST.show(`Random: ${name}`, 'info');
    }
  }

  /**
   * Enable Nearby filter: listings within 25 km of user location, sorted by distance.
   * Requests geolocation if needed. Fully client-side for seed/demo UX.
   */
  function enableNearby() {
    const existing = getUserLocation();
    if (existing) {
      filters.nearby = true;
      render();
      if (global.FD_TOAST) global.FD_TOAST.show(`Nearby: ≤${NEARBY_KM} km, sorted by distance`, 'info');
      return;
    }
    if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
      if (global.FD_TOAST) global.FD_TOAST.show('Getting your location…', 'info');
      global.FD_MAP.locateUser(() => {
        filters.nearby = true;
        render();
        if (global.FD_TOAST) global.FD_TOAST.show(`Nearby: ≤${NEARBY_KM} km, sorted by distance`, 'success');
      });
    } else {
      if (global.FD_TOAST) global.FD_TOAST.show('Location unavailable', 'error');
    }
  }

  /**
   * Toggle the “Only in current map view” filter.
   * When on, only listings whose coordinates lie inside the Leaflet bounds are shown.
   * The list re-filters automatically on pan/zoom. Fully client-side.
   */
  function toggleInView() {
    filters.inView = !filters.inView;
    render();
    if (global.FD_TOAST) {
      global.FD_TOAST.show(filters.inView ? 'Showing only listings in current map view' : 'Map-view filter off', 'info');
    }
  }

  /**
   * Toggle the favorites-only quick filter.
   * Shows only listings the user has starred. Fully client-side for seed/demo UX.
   */
  function toggleFavoritesOnly() {
    filters.favoritesOnly = !filters.favoritesOnly;
    syncFilterUI();
    render();
    if (global.FD_TOAST) {
      global.FD_TOAST.show(filters.favoritesOnly ? 'Showing favorites only' : 'Favorites filter off', 'info');
    }
  }

  function setSort(sort) {
    filters.sort = sort || 'default';
    syncFilterUI();
    render();
    if (filters.sort === 'distance' && !getUserLocation()) {
      if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
        global.FD_MAP.locateUser(() => render());
      } else if (global.FD_TOAST) global.FD_TOAST.show('Location needed for distance sort', 'info');
    }
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    // Preserve selection if still present
    if (selectedId && !allListings.some(l => String(l.id) === String(selectedId))) {
      selectedId = null;
    }
    render();
  }

  function getListings() { return allListings; }
  function getFiltered() { return filtered; }

  function bind() {
    // Filter card apply / clear
    document.getElementById('apply-filters')?.addEventListener('click', () => {
      readFiltersFromUI();
      render();
      document.getElementById('filter-card')?.setAttribute('hidden', '');
    });
    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
    // Live search
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    searchInput?.addEventListener('input', (e) => {
      setSearch(e.target.value);
      if (clearBtn) clearBtn.hidden = !e.target.value;
    });
    clearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      setSearch('');
      if (clearBtn) clearBtn.hidden = true;
    });
    // Seller select change from cards/sellers
    document.getElementById('filter-seller')?.addEventListener('change', () => {
      readFiltersFromUI();
      render();
    });
    // Random picker (seed/demo UX)
    document.getElementById('random-listing-btn')?.addEventListener('click', pickRandom);
    // Nearby quick filter (seed/demo UX)
    document.getElementById('nearby-btn')?.addEventListener('click', enableNearby);
    // Locate button (seed/demo UX)
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
        global.FD_MAP.locateUser();
      }
    });
    // In-view filter (seed/demo UX)
    document.getElementById('in-view-btn')?.addEventListener('click', toggleInView);
    // Favorites quick filter (seed/demo UX)
    document.getElementById('favorites-btn')?.addEventListener('click', toggleFavoritesOnly);
    // Fit map (seed/demo UX)
    document.getElementById('fit-map-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') {
        global.FD_MAP.fitAll();
      }
    });
    // Clear & fit (seed/demo UX)
    document.getElementById('clear-fit-btn')?.addEventListener('click', clearAndFit);
    // Sort select
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      setSort(e.target.value);
    });
    // Re-filter on map move when in-view is active
    const map = global.FD_MAP && typeof global.FD_MAP.getMap === 'function' ? global.FD_MAP.getMap() : null;
    if (map) {
      map.on('moveend', () => {
        if (filters.inView) render();
      });
    }
    // Apply any hash filters on load
    applyFiltersFromParams();
  }

  function serializeFilters() {
    const params = [];
    if (filters.category) params.push('category=' + encodeURIComponent(filters.category));
    if (filters.seller) params.push('seller=' + encodeURIComponent(filters.seller));
    if (filters.visibility) params.push('visibility=' + encodeURIComponent(filters.visibility));
    if (filters.units) params.push('units=' + encodeURIComponent(filters.units));
    if (filters.minPrice != null) params.push('minPrice=' + filters.minPrice);
    if (filters.maxPrice != null) params.push('maxPrice=' + filters.maxPrice);
    if (filters.favoritesOnly) params.push('favorites=1');
    if (filters.nearby) params.push('nearby=1');
    if (filters.inView) params.push('inView=1');
    if (filters.sort && filters.sort !== 'default') params.push('sort=' + encodeURIComponent(filters.sort));
    if (filters.q) params.push('q=' + encodeURIComponent(filters.q));
    return params.join('&');
  }

  function applyFiltersFromParams() {
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.has('category')) filters.category = params.get('category') || '';
    if (params.has('seller')) filters.seller = params.get('seller') || '';
    if (params.has('visibility')) filters.visibility = params.get('visibility') || '';
    if (params.has('units')) filters.units = params.get('units') || '';
    if (params.has('minPrice')) {
      const v = Number(params.get('minPrice'));
      filters.minPrice = isNaN(v) ? null : v;
    }
    if (params.has('maxPrice')) {
      const v = Number(params.get('maxPrice'));
      filters.maxPrice = isNaN(v) ? null : v;
    }
    if (params.has('favorites')) filters.favoritesOnly = params.get('favorites') === '1';
    if (params.has('nearby')) filters.nearby = params.get('nearby') === '1';
    if (params.has('inView')) filters.inView = params.get('inView') === '1';
    if (params.has('sort')) filters.sort = params.get('sort') || 'default';
    if (params.has('q')) filters.q = params.get('q') || '';
    syncFilterUI();
    // Nearby may need location; if requested and no location, try locate
    if (filters.nearby && !getUserLocation() && global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
      global.FD_MAP.locateUser(() => render());
    } else {
      render();
    }
  }

  /**
   * Copy a shareable link for the current filtered view (hash filters + optional listing).
   */
  function copyFilteredLink() {
    const base = location.origin + location.pathname;
    const filterHash = serializeFilters();
    let hash = filterHash ? filterHash : '';
    if (selectedId) {
      const sep = hash ? '&' : '';
      hash += sep + 'listing=' + encodeURIComponent(selectedId);
    }
    const url = base + (hash ? '#' + hash : '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success');
      }).catch(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Could not copy link', 'error');
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success'); }
      catch (_) { if (global.FD_TOAST) global.FD_TOAST.show('Could not copy link', 'error'); }
      document.body.removeChild(ta);
    }
    // Also update the address bar without reload
    if (hash) history.replaceState(null, '', '#' + hash);
  }

  /**
   * Clear all filters (keeping search) and fit the map to the full set.
   * Useful for resetting seed/demo exploration after Nearby / In view / category filters.
   */
  function clearAndFit() {
    clearFilters();
    // clearFilters already re-renders and pushes the full set to the map
    setTimeout(() => {
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') {
        global.FD_MAP.fitAll();
      }
    }, 30);
  }

  global.FD_LIST = {
    setListings,
    getListings,
    getFiltered,
    select,
    navigate,
    pickRandom,
    enableNearby,
    toggleInView,
    toggleFavoritesOnly,
    setSort,
    toggleFavorite,
    isFavorite,
    getFavorites,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    setSearch,
    clearFilters,
    clearAndFit,
    copyFilteredLink,
    serializeFilters,
    applyFiltersFromParams,
    bind
  };
})(window);
