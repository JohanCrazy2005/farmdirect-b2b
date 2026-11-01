/**
 * FarmDirect B2B – listings sidebar + filtering
 * Holds the current set of listings (from API / seed / demo), applies filters,
 * renders the list, handles selection (opens product card + flies map),
 * favorites (localStorage), and navigation. Fully client-side.
 * Includes random listing picker, Nearby quick filter (25 km toggle + distance sort),
 * sidebar sort (price ↑/↓ or distance when location is known), Fit map,
 * Only-in-map-view filter, Favorites quick toggle, shareable filtered-view links,
 * Clear & fit reset, Locate button, active-filter count badge on the filter icon,
 * clickable filtered/total count, Group-by-seller toggle, and removable filter chips.
 * Works with seed/demo and live modes. Matches current index.html IDs.
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
  let groupBySeller = false;

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

  function isFavorite(id) { return getFavorites().includes(id); }

  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(id);
    saveFavorites(favs);
    render();
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function getUserLocation() {
    return (global.FD_MAP && global.FD_MAP.getUserLocation) ? global.FD_MAP.getUserLocation() : null;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanceFor(listing, userPos) {
    if (!userPos || !listing?.location) return null;
    const lat = Number(listing.location.lat), lng = Number(listing.location.long);
    if (isNaN(lat) || isNaN(lng)) return null;
    return haversineKm(userPos.lat, userPos.lng || userPos.long, lat, lng);
  }

  function isInCurrentView(listing) {
    if (!filters.inView) return true;
    const map = global.FD_MAP?.getMap?.();
    if (!map?.getBounds) return true;
    const bounds = map.getBounds();
    const loc = listing.location || {};
    const lat = Number(loc.lat), lng = Number(loc.long);
    return !isNaN(lat) && !isNaN(lng) && bounds.contains([lat, lng]);
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
      if (filters.minPrice != null && (isNaN(price) || price < filters.minPrice)) return false;
      if (filters.maxPrice != null && (isNaN(price) || price > filters.maxPrice)) return false;
      if (favs && !favs.has(l.id)) return false;
      if (filters.nearby && userPos) {
        const d = distanceFor(l, userPos);
        if (d == null || d > NEARBY_KM) return false;
      }
      if (!isInCurrentView(l)) return false;
      if (q) {
        const hay = [l.headerdescription, l.description, l.category, getDisplayName(l.sellerid), l.sellerid, l.address, l.units]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sortKey = filters.sort || 'default';
    if (sortKey === 'price-asc') {
      filtered.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
    } else if (sortKey === 'price-desc') {
      filtered.sort((a, b) => (Number(b.price) || -Infinity) - (Number(a.price) || -Infinity));
    } else if (sortKey === 'distance' || filters.nearby) {
      const pos = userPos || getUserLocation();
      if (pos) filtered.sort((a, b) => (distanceFor(a, pos) ?? Infinity) - (distanceFor(b, pos) ?? Infinity));
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function updateFilterBadge() {
    const badge = document.getElementById('filter-badge');
    if (!badge) return;
    let count = 0;
    if (filters.category) count++;
    if (filters.seller) count++;
    if (filters.visibility) count++;
    if (filters.units) count++;
    if (filters.minPrice != null) count++;
    if (filters.maxPrice != null) count++;
    if (filters.favoritesOnly) count++;
    if (filters.nearby) count++;
    if (filters.inView) count++;
    if (filters.sort && filters.sort !== 'default') count++;
    if (filters.q) count++;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function updateCount() {
    const el = document.getElementById('list-count');
    if (!el) return;
    el.textContent = `${filtered.length} / ${allListings.length}`;
    el.title = 'Filtered / total — click to clear filters';
  }

  function renderChips() {
    const el = document.getElementById('filter-chips');
    if (!el) return;
    const chips = [];
    if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}` });
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
    el.innerHTML = chips.map(c => `<span class=\"filter-chip\">${escapeHtml(c.label)} <button type=\"button\" data-key=\"${c.key}\" aria-label=\"Remove filter\">×</button></span>`).join('');
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
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('filter-category', filters.category);
    setVal('filter-seller', filters.seller);
    setVal('filter-visibility', filters.visibility);
    setVal('filter-units', filters.units);
    setVal('filter-min-price', filters.minPrice != null ? filters.minPrice : '');
    setVal('filter-max-price', filters.maxPrice != null ? filters.maxPrice : '');
    const fav = document.getElementById('filter-favorites');
    if (fav) fav.checked = !!filters.favoritesOnly;
    const inv = document.getElementById('filter-in-view');
    if (inv) inv.checked = !!filters.inView;
    const sort = document.getElementById('sort-select');
    if (sort) sort.value = filters.sort || 'default';
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

    catSel.innerHTML = '<option value=\"\">All</option>' + cats.map(c => `<option value=\"${escapeHtml(c)}\">${escapeHtml(c)}</option>`).join('');
    sellerSel.innerHTML = '<option value=\"\">All</option>' + sellers.map(s => `<option value=\"${escapeHtml(s)}\">${escapeHtml(getDisplayName(s))}</option>`).join('');
    unitsSel.innerHTML = '<option value=\"\">All</option>' + units.map(u => `<option value=\"${escapeHtml(u)}\">${escapeHtml(u)}</option>`).join('');

    if (cats.includes(curCat)) catSel.value = curCat;
    if (sellers.includes(curSeller)) sellerSel.value = curSeller;
    if (units.includes(curUnits)) unitsSel.value = curUnits;
  }

  function renderListItems(listings) {
    const userPos = getUserLocation();
    return listings.map(l => {
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
  }


  function updateQuickButtons() {
    const favBtn = document.getElementById('favorites-btn');
    if (favBtn) {
      favBtn.classList.toggle('active', !!filters.favoritesOnly);
      favBtn.setAttribute('aria-pressed', String(!!filters.favoritesOnly));
    }
    const nearBtn = document.getElementById('nearby-btn');
    if (nearBtn) {
      nearBtn.classList.toggle('active', !!filters.nearby);
      nearBtn.setAttribute('aria-pressed', String(!!filters.nearby));
    }
  }

  function render() {
    applyFilters();
    const listEl = document.getElementById('listings-list');
    updateCount();
    updateFilterBadge();
    updateQuickButtons();
    if (!listEl) return;

    if (!filtered.length) {
      listEl.innerHTML = `<div class=\"empty-state\"><p>No listings match the current filters.</p><button type=\"button\" class=\"small-btn\" id=\"clear-from-empty\">Clear filters</button></div>`;
      document.getElementById('clear-from-empty')?.addEventListener('click', clearFilters);
      if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
        global.FD_MAP.setListings(filtered);
      }
      renderChips();
      return;
    }

    if (groupBySeller) {
      const groups = {};
      filtered.forEach(l => {
        const name = getDisplayName(l.sellerid) || 'Unknown';
        if (!groups[name]) groups[name] = [];
        groups[name].push(l);
      });
      const keys = Object.keys(groups).sort();
      listEl.innerHTML = keys.map(name => {
        const items = renderListItems(groups[name]);
        return `<div class=\"seller-group\"><div class=\"group-header\" data-seller=\"${escapeHtml(groups[name][0].sellerid)}\">${escapeHtml(name)} (${groups[name].length})</div>${items}</div>`;
      }).join('');
      listEl.querySelectorAll('.group-header').forEach(h => {
        h.addEventListener('click', () => {
          const sid = h.dataset.seller;
          if (sid) setSellerFilter(sid);
        });
      });
    } else {
      listEl.innerHTML = renderListItems(filtered);
    }

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

    if (global.FD_MAP && typeof global.FD_MAP.setListings === 'function') {
      global.FD_MAP.setListings(filtered);
    }
    populateFilterOptions();
    renderChips();
  }

  function select(id) {
    selectedId = id;
    const listing = allListings.find(l => l.id === id);
    if (!listing) return;
    render();
    if (global.FD_MAP && typeof global.FD_MAP.flyToListing === 'function') {
      global.FD_MAP.flyToListing(listing);
    }
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
  }

  function clearFilters() {
    filters = {
      q: '', category: '', seller: '', visibility: '', units: '',
      minPrice: null, maxPrice: null, favoritesOnly: false, nearby: false, inView: false, sort: 'default'
    };
    const search = document.getElementById('search-input');
    if (search) search.value = '';
    syncFilterUI();
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
  }

  function setSellerFilter(sellerid) {
    filters.seller = sellerid || '';
    syncFilterUI();
    render();
  }

  function setCategoryFilter(cat) {
    filters.category = cat || '';
    syncFilterUI();
    render();
  }

  function applyFiltersFromParams(params) {
    if (params.get('q')) filters.q = params.get('q');
    if (params.get('cat')) filters.category = params.get('cat');
    if (params.get('seller')) filters.seller = params.get('seller');
    if (params.get('vis')) filters.visibility = params.get('vis');
    if (params.get('units')) filters.units = params.get('units');
    if (params.get('min')) filters.minPrice = Number(params.get('min'));
    if (params.get('max')) filters.maxPrice = Number(params.get('max'));
    if (params.get('fav') === '1') filters.favoritesOnly = true;
    if (params.get('nearby') === '1') filters.nearby = true;
    if (params.get('inview') === '1') filters.inView = true;
    if (params.get('sort')) filters.sort = params.get('sort');
    syncFilterUI();
    render();
  }

  function copyFilteredLink() {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('cat', filters.category);
    if (filters.seller) params.set('seller', filters.seller);
    if (filters.visibility) params.set('vis', filters.visibility);
    if (filters.units) params.set('units', filters.units);
    if (filters.minPrice != null) params.set('min', filters.minPrice);
    if (filters.maxPrice != null) params.set('max', filters.maxPrice);
    if (filters.favoritesOnly) params.set('fav', '1');
    if (filters.nearby) params.set('nearby', '1');
    if (filters.inView) params.set('inview', '1');
    if (filters.sort && filters.sort !== 'default') params.set('sort', filters.sort);
    const link = location.origin + location.pathname + (params.toString() ? '#' + params.toString() : '');
    navigator.clipboard.writeText(link).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success');
    }).catch(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Copy failed', 'error');
    });
  }

  function pickRandom() {
    if (!filtered.length) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listings to pick', 'info');
      return;
    }
    const item = filtered[Math.floor(Math.random() * filtered.length)];
    select(item.id);
  }

  function bind() {
    document.getElementById('apply-filters')?.addEventListener('click', () => {
      filters.category = document.getElementById('filter-category')?.value || '';
      filters.seller = document.getElementById('filter-seller')?.value || '';
      filters.visibility = document.getElementById('filter-visibility')?.value || '';
      filters.units = document.getElementById('filter-units')?.value || '';
      const min = document.getElementById('filter-min-price')?.value;
      const max = document.getElementById('filter-max-price')?.value;
      filters.minPrice = min !== '' && !isNaN(Number(min)) ? Number(min) : null;
      filters.maxPrice = max !== '' && !isNaN(Number(max)) ? Number(max) : null;
      filters.favoritesOnly = !!document.getElementById('filter-favorites')?.checked;
      filters.inView = !!document.getElementById('filter-in-view')?.checked;
      render();
    });
    document.getElementById('reset-filters')?.addEventListener('click', clearFilters);
    document.getElementById('list-count')?.addEventListener('click', clearFilters);
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      filters.sort = e.target.value || 'default';
      render();
    });
    document.getElementById('group-by-seller')?.addEventListener('change', (e) => {
      groupBySeller = !!e.target.checked;
      render();
    });
    document.getElementById('nearby-btn')?.addEventListener('click', () => {
      filters.nearby = !filters.nearby;
      if (filters.nearby && global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
        global.FD_MAP.locateUser(() => render());
      } else {
        render();
      }
    });
    document.getElementById('favorites-btn')?.addEventListener('click', () => {
      filters.favoritesOnly = !filters.favoritesOnly;
      const favChk = document.getElementById('filter-favorites');
      if (favChk) favChk.checked = filters.favoritesOnly;
      render();
    });
    document.getElementById('random-btn')?.addEventListener('click', pickRandom);
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') global.FD_MAP.fitAll();
    });
    document.getElementById('clear-fit-btn')?.addEventListener('click', () => {
      clearFilters();
      setTimeout(() => {
        if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') global.FD_MAP.fitAll();
      }, 50);
    });
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') global.FD_MAP.locateUser();
    });
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      filters.q = e.target.value || '';
      render();
    });
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    render();
  }

  /**
   * Copy the currently filtered listings as pretty-printed JSON to the clipboard.
   * Useful for inspecting or saving the active seed/demo view. Fully client-side.
   */
  function exportFilteredJson() {
    const data = filtered.slice();
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show(`Copied ${data.length} filtered listing${data.length === 1 ? '' : 's'} as JSON`, 'success');
    }).catch(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Copy failed — check clipboard permissions', 'error');
    });
  }

  /**
   * Copy a human-readable summary of the current filters and result count.
   * Useful for notes or sharing the active seed/demo view without a URL. Fully client-side.
   */
  function copyFilterSummary() {
    const parts = [];
    if (filters.q) parts.push(`search: "${filters.q}"`);
    if (filters.category) parts.push(`category: ${filters.category}`);
    if (filters.seller) parts.push(`seller: ${getDisplayName(filters.seller)}`);
    if (filters.visibility) parts.push(`visibility: ${filters.visibility}`);
    if (filters.units) parts.push(`units: ${filters.units}`);
    if (filters.minPrice != null) parts.push(`min price: $${filters.minPrice}`);
    if (filters.maxPrice != null) parts.push(`max price: $${filters.maxPrice}`);
    if (filters.favoritesOnly) parts.push("favorites only");
    if (filters.nearby) parts.push(`nearby ≤${NEARBY_KM} km`);
    if (filters.inView) parts.push("in current map view");
    if (filters.sort && filters.sort !== "default") {
      const labels = { "price-asc": "price ↑", "price-desc": "price ↓", "distance": "distance" };
      parts.push(`sort: ${labels[filters.sort] || filters.sort}`);
    }
    if (groupBySeller) parts.push("grouped by seller");
    const filterText = parts.length ? parts.join(", ") : "no filters";
    const summary = `FarmDirect filtered view: ${filtered.length} / ${allListings.length} listings (${filterText})`;
    navigator.clipboard.writeText(summary).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show("Filter summary copied", "success");
    }).catch(() => {
      if (global.FD_TOAST) global.FD_TOAST.show("Copy failed", "error");
    });
  }

  /**
   * Cycle to the previous or next listing in the current filtered set.
   * Called by product-card Prev/Next buttons. Fully client-side; works with seed/demo.
   */
  function navigate(delta) {
    if (!filtered.length) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listings to navigate', 'info');
      return;
    }
    let idx = filtered.findIndex(l => l.id === selectedId);
    if (idx < 0) idx = 0;
    idx = (idx + (delta || 1) + filtered.length) % filtered.length;
    select(filtered[idx].id);
  }

  function setVisibilityFilter(vis) {
    filters.visibility = vis || '';
    syncFilterUI();
    render();
  }

  function setUnitsFilter(units) {
    filters.units = units || '';
    syncFilterUI();
    render();
  }

  global.FD_LIST = {
    setListings,
    select,
    isFavorite,
    toggleFavorite,
    getFavorites,
    clearFilters,
    setSellerFilter,
    setCategoryFilter,
    setVisibilityFilter,
    setUnitsFilter,
    applyFiltersFromParams,
    copyFilteredLink,
    exportFilteredJson,
    copyFilterSummary,
    pickRandom,
    navigate,
    bind,
    getFiltered: () => filtered
  };
})(window);
