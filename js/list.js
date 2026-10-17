/**
 * FarmDirect B2B – filters & list panel
 */
(function (global) {
  'use strict';

  let allListings = [];
  let filtered = [];
  let activeFilters = { q: '', category: '', visibility: '', maxPrice: '' };

  function setListings(listings) {
    allListings = listings || [];
    applyFilters();
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
  }

  function renderList() {
    const container = document.getElementById('listing-list');
    if (!container) return;
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">No listings match your filters.</div>';
      return;
    }
    container.innerHTML = filtered.map(l => `
      <div class="listing-card" data-id="${escapeAttr(l.id)}" onclick="FD_LIST.select('${escapeAttr(l.id)}')">
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
    if (el) el.textContent = `${filtered.length} of ${allListings.length}`;
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
      clear.addEventListener('click', () => {
        activeFilters = { q: '', category: '', visibility: '', maxPrice: '' };
        if (search) search.value = '';
        if (cat) cat.value = '';
        if (vis) vis.value = '';
        if (price) price.value = '';
        applyFilters();
        document.getElementById('filter-card')?.classList.remove('open');
      });
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

  global.FD_LIST = { setListings, select, highlight, applyFilters, bindUI };
})(window);
