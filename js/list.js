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
 * Includes Group-by-seller toggle that sections the sidebar by seller display name
 * (click a header to filter to that seller). Fully client-side.
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
      return Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
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
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function render() {
    applyFilters();
    const listEl = document.getElementById('listings-list');
    const countEl = document.getElementById('list-count');
    if (countEl) countEl.textContent = `${filtered.length} / ${allListings.length}`;
    updateFilterBadge();
    if (!listEl) return;

    if (!filtered.length) {
      listEl.innerHTML = `<div class="empty-state"><p>No listings match the current filters.</p><button type="button" class="small-btn" id="clear-from-empty">Clear filters</button></div>`;
      document.getElementById('clear-from-empty')?.addEventListener('click', clearFilters);
      global.FD_MAP?.setListings?.(filtered);
      return;
    }

    const userPos = getUserLocation();
    let html = '';

    if (groupBySeller) {
      const groups = {};
      filtered.forEach(l => {
        const key = getDisplayName(l.sellerid) || l.sellerid || 'Unknown';
        (groups[key] = groups[key] || []).push(l);
      });
      Object.keys(groups).sort().forEach(name => {
        html += `<div class="seller-group"><h4 class="group-header" data-seller="${escapeHtml(groups[name][0].sellerid)}">${escapeHtml(name)} (${groups[name].length})</h4>`;
        html += groups[name].map(l => renderItem(l, userPos)).join('');
        html += '</div>';
      });
    } else {
      html = filtered.map(l => renderItem(l, userPos)).join('');
    }

    listEl.innerHTML = html;

    listEl.querySelectorAll('.listing-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn')) return;
        select(el.dataset.id);
      });
    });
    listEl.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.id); });
    });
    listEl.querySelectorAll('.group-header').forEach(h => {
      h.addEventListener('click', () => {
        filters.seller = h.dataset.seller;
        syncFilterUI();
        render();
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to seller', 'info');
      });
    });

    global.FD_MAP?.setListings?.(filtered);
    populateFilterOptions();
  }

  function renderItem(l, userPos) {
    const seller = escapeHtml(getDisplayName(l.sellerid));
    const price = l.price != null ? `$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units || '')}` : '';
    const fav = isFavorite(l.id);
    const thumb = l.image
      ? `<img class="list-thumb" src="${escapeHtml(l.image)}" alt="">`
      : `<div class="list-thumb placeholder">${escapeHtml((l.category || '?').slice(0, 3).toUpperCase())}</div>`;
    let distHtml = '';
    if (userPos) {
      const d = distanceFor(l, userPos);
      if (d != null) distHtml = `<span class="muted">~${d.toFixed(1)} km</span>`;
    }
    return `
      <div class="listing-item${selectedId === l.id ? ' selected' : ''}" data-id="${escapeHtml(l.id)}" tabindex="0">
        ${thumb}
        <div class="list-body">
          <div class="list-title">${escapeHtml(l.headerdescription || 'Listing')}</div>
          <div class="list-meta">
            <span class="category-badge">${escapeHtml(l.category || '')}</span>
            <span>${escapeHtml(price)}</span>
            ${distHtml}
          </div>
          <div class="list-seller muted small">${seller}</div>
        </div>
        <button type="button" class="icon-btn fav-btn" data-id="${escapeHtml(l.id)}">${fav ? '★' : '☆'}</button>
      </div>`;
  }

  function populateFilterOptions() {
    const catSel = document.getElementById('filter-category');
    const sellerSel = document.getElementById('filter-seller');
    const unitsSel = document.getElementById('filter-units');
    if (!catSel || !sellerSel || !unitsSel) return;
    const cats = [...new Set(allListings.map(l => l.category).filter(Boolean))].sort();
    const sellers = [...new Set(allListings.map(l => l.sellerid).filter(Boolean))].sort();
    const units = [...new Set(allListings.map(l => l.units).filter(Boolean))].sort();
    const curCat = catSel.value, curSeller = sellerSel.value, curUnits = unitsSel.value;
    catSel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    sellerSel.innerHTML = '<option value="">All</option>' + sellers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(getDisplayName(s))}</option>`).join('');
    unitsSel.innerHTML = '<option value="">All</option>' + units.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
    if (cats.includes(curCat)) catSel.value = curCat;
    if (sellers.includes(curSeller)) sellerSel.value = curSeller;
    if (units.includes(curUnits)) unitsSel.value = curUnits;
  }

  function syncFilterUI() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('filter-category', filters.category);
    setVal('filter-seller', filters.seller);
    setVal('filter-visibility', filters.visibility);
    setVal('filter-units', filters.units);
    const min = document.getElementById('filter-min-price');
    const max = document.getElementById('filter-max-price');
    const fav = document.getElementById('filter-favorites');
    const sortSel = document.getElementById('sort-select');
    if (min) min.value = filters.minPrice != null ? filters.minPrice : '';
    if (max) max.value = filters.maxPrice != null ? filters.maxPrice : '';
    if (fav) fav.checked = !!filters.favoritesOnly;
    if (sortSel) sortSel.value = filters.sort || 'default';
    const groupChk = document.getElementById('group-by-seller');
    if (groupChk) groupChk.checked = groupBySeller;
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
  }

  function clearFilters() {
    filters = { q: filters.q, category: '', seller: '', visibility: '', units: '', minPrice: null, maxPrice: null, favoritesOnly: false, nearby: false, inView: false, sort: 'default' };
    groupBySeller = false;
    syncFilterUI();
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Filters cleared', 'info');
  }

  function setSearch(q) { filters.q = q || ''; render(); }

  function select(id) {
    const listing = allListings.find(l => String(l.id) === String(id)) || filtered.find(l => String(l.id) === String(id));
    if (!listing) return;
    selectedId = listing.id;
    global.FD_RECENT?.track?.(listing.id);
    render();
    global.FD_CARDS?.openProduct?.(listing);
    global.FD_MAP?.flyToListing?.(listing);
    if (window.innerWidth < 900) document.getElementById('sidebar')?.classList.remove('open');
  }

  function navigate(delta) {
    if (!filtered.length) return;
    let idx = filtered.findIndex(l => String(l.id) === String(selectedId));
    if (idx < 0) idx = 0; else idx = (idx + delta + filtered.length) % filtered.length;
    select(filtered[idx].id);
  }

  function pickRandom() {
    applyFilters();
    if (!filtered.length) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listings in the current filter set', 'info');
      return;
    }
    const listing = filtered[Math.floor(Math.random() * filtered.length)];
    select(listing.id);
    if (global.FD_TOAST) global.FD_TOAST.show(`Random: ${listing.headerdescription || 'listing'}`, 'info');
  }

  function enableNearby() {
    const existing = getUserLocation();
    if (existing) {
      filters.nearby = true;
      render();
      if (global.FD_TOAST) global.FD_TOAST.show(`Nearby: ≤${NEARBY_KM} km`, 'info');
      return;
    }
    if (global.FD_MAP?.locateUser) {
      if (global.FD_TOAST) global.FD_TOAST.show('Getting your location…', 'info');
      global.FD_MAP.locateUser(() => { filters.nearby = true; render(); });
    }
  }

  function setSort(sort) {
    filters.sort = sort || 'default';
    render();
  }

  function setListings(listings) {
    allListings = Array.isArray(listings) ? listings : [];
    render();
  }

  function getListings() { return allListings; }
  function getFiltered() { return filtered; }

  function bind() {
    document.getElementById('apply-filters')?.addEventListener('click', () => {
      readFiltersFromUI();
      render();
      document.getElementById('filter-card')?.setAttribute('hidden', '');
    });
    document.getElementById('reset-filters')?.addEventListener('click', clearFilters);
    document.getElementById('list-count')?.addEventListener('click', clearFilters);

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

    document.getElementById('random-btn')?.addEventListener('click', pickRandom);
    document.getElementById('nearby-btn')?.addEventListener('click', enableNearby);
    document.getElementById('fit-btn')?.addEventListener('click', () => global.FD_MAP?.fitAll?.());
    document.getElementById('clear-fit-btn')?.addEventListener('click', clearAndFit);
    document.getElementById('locate-btn')?.addEventListener('click', () => global.FD_MAP?.locateUser?.());
    document.getElementById('sort-select')?.addEventListener('change', (e) => setSort(e.target.value));
    document.getElementById('group-by-seller')?.addEventListener('change', (e) => {
      groupBySeller = e.target.checked;
      render();
    });

    const tryAttachMapListener = () => {
      const map = global.FD_MAP?.getMap?.();
      if (map?.on) {
        map.on('moveend', () => { if (filters.inView) render(); });
      } else setTimeout(tryAttachMapListener, 100);
    };
    tryAttachMapListener();
  }

  function serializeFilters() {
    const p = new URLSearchParams();
    if (filters.category) p.set('cat', filters.category);
    if (filters.seller) p.set('seller', filters.seller);
    if (filters.visibility) p.set('vis', filters.visibility);
    if (filters.units) p.set('units', filters.units);
    if (filters.minPrice != null) p.set('min', String(filters.minPrice));
    if (filters.maxPrice != null) p.set('max', String(filters.maxPrice));
    if (filters.favoritesOnly) p.set('fav', '1');
    if (filters.nearby) p.set('nearby', '1');
    if (filters.inView) p.set('inview', '1');
    if (filters.sort && filters.sort !== 'default') p.set('sort', filters.sort);
    if (filters.q) p.set('q', filters.q);
    return p.toString();
  }

  function applyFiltersFromParams(params) {
    if (!params) return;
    filters.category = params.get('cat') || '';
    filters.seller = params.get('seller') || '';
    filters.visibility = params.get('vis') || '';
    filters.units = params.get('units') || '';
    const min = params.get('min'), max = params.get('max');
    filters.minPrice = min != null && min !== '' ? Number(min) : null;
    filters.maxPrice = max != null && max !== '' ? Number(max) : null;
    filters.favoritesOnly = params.get('fav') === '1';
    filters.nearby = params.get('nearby') === '1';
    filters.inView = params.get('inview') === '1';
    filters.sort = params.get('sort') || 'default';
    filters.q = params.get('q') || '';
    syncFilterUI();
    render();
  }

  function copyFilteredLink() {
    const base = location.origin + location.pathname;
    const filterHash = serializeFilters();
    let hash = filterHash || '';
    if (selectedId) hash += (hash ? '&' : '') + 'listing=' + encodeURIComponent(selectedId);
    const url = base + (hash ? '#' + hash : '');
    navigator.clipboard?.writeText(url).then(() => {
      if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success');
    }).catch(() => {
      if (global.FD_TOAST) global.FD_TOAST.show(url, 'info');
    });
    if (hash) history.replaceState(null, '', '#' + hash);
  }

  function clearAndFit() {
    clearFilters();
    setTimeout(() => global.FD_MAP?.fitAll?.(), 30);
  }

  function setCategoryFilter(cat) { filters.category = cat || ''; syncFilterUI(); render(); }
  function setVisibilityFilter(vis) { filters.visibility = vis || ''; syncFilterUI(); render(); }
  function setUnitsFilter(u) { filters.units = u || ''; syncFilterUI(); render(); }

  global.FD_LIST = {
    setListings, getListings, getFiltered, select, navigate, pickRandom, enableNearby,
    setSort, toggleFavorite, isFavorite, getFavorites, setCategoryFilter, setVisibilityFilter,
    setUnitsFilter, setSearch, clearFilters, clearAndFit, copyFilteredLink, serializeFilters,
    applyFiltersFromParams, bind
  };
})(window);
