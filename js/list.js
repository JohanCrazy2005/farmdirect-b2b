/**
 * FarmDirect B2B – filters & list panel
 * Improved empty & loading states
 */
(function (global) {
  'use strict';

  let allListings = [];
  let filtered = [];
  let activeFilters = { q: '', category: '', visibility: '', maxPrice: '' };
  let hasLoaded = false;

  function setListings(listings) {
    allListings = listings || [];
    hasLoaded = true;
    applyFilters();
  }

  function getListings() {
    return allListings;
  }

  function applyFilters() {
    const q = (activeFilters.q || '').toLowerCase();
    filtered = allListings.filter(l => {
      if (q && !(
        (l.headerdescription || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q)
      )) return false;
      if (activeFilters.category && l.category !== activeFilters.category) return false;
      if (activeFilters.visibility && l.visibility !== activeFilters.visibility) return false;
      if (activeFilters.maxPrice && Number(l.price) > Number(activeFilters.maxPrice)) return false;
      return true;
    });
    renderList();
    if (global.FD_MAP && global.FD_MAP.renderMarkers) {
      global.FD_MAP.renderMarkers(filtered);
    }
    updateCount();
    updateMapOverlay();
  }

  function hasActiveFilters() {
    return !!(activeFilters.q || activeFilters.category || activeFilters.visibility || activeFilters.maxPrice);
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
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">🇳🇹</div>
            <h4>No listings yet</h4>
            <p>The map is empty. Deploy the Worker or check the seed file.</p>
          </div>`;
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">🔍</div>
            <h4>No matches</h4>
            <p>No listings match your current filters.</p>
            ${hasActiveFilters() ? '<button type="button" id="empty-clear">Clear filters</button>' : ''}
          </div>`;
        const btn = document.getElementById('empty-clear');
        if (btn) btn.addEventListener('click', clearFilters);
      }
      return;
    }

    container.innerHTML = filtered.map(l => `
      <div class="listing-card" data-id="${escapeAttr(l.id)}" onclick="FD_LIST.select('${escapeAttr(l.id)}')" role="listitem" tabindex="0">
        <img src="${escapeAttr(l.image)}" alt="" onerror="this.style.background='var(--hover-bg)'">
        <div class="listing-info">
          <h3>${escapeHtml(l.headerdescription)}</h3>
          <div class="meta">${escapeHtml(l.category)} · ${escapeHtml(l.visibility)}</div>
          <div class="price">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)}</div>
        </div>
      </div>
    `).join('');
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
    const el = document.querySelector(`.listing-card[data-id="${CSS.escape(id)}"]`);
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
      overlay.innerHTML = `<div class="overlay-content"><div class="empty-icon" style="font-size:1.6rem;margin-bottom:0.4rem">🇳🇹</div><div>${msg}</div></div>`;
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  function clearFilters() {
    activeFilters = { q: '', category: '', visibility: '', maxPrice: '' };
    const search = document.getElementById('search-input');
    const cat = document.getElementById('filter-category');
    const vis = document.getElementById('filter-visibility');
    const price = document.getElementById('filter-maxprice');
    if (search) search.value = '';
    if (cat) cat.value = '';
    if (vis) vis.value = '';
    if (price) price.value = '';
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
    const price = document.getElementById('filter-maxprice');
    if (price) {
      price.addEventListener('input', e => {
        activeFilters.maxPrice = e.target.value;
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  global.FD_LIST = { setListings, getListings, select, highlight, applyFilters, bindUI, clearFilters };
})(window);
