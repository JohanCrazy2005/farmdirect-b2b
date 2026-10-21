/**
 * FarmDirect B2B – listings statistics module
 * Options-menu modal showing summary stats (counts, price range, category breakdown)
 * from current data. Fully client-side; works in pure seed/demo mode.
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function computeStats(listings) {
    const list = Array.isArray(listings) ? listings : [];
    const total = list.length;
    if (!total) return { total: 0 };

    const prices = list.map(l => Number(l.price)).filter(n => !isNaN(n) && isFinite(n));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

    const byCategory = {};
    const byVisibility = {};
    const byUnits = {};
    list.forEach(l => {
      const cat = l.category || 'unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      const vis = l.visibility || 'unknown';
      byVisibility[vis] = (byVisibility[vis] || 0) + 1;
      const units = l.units || 'unknown';
      byUnits[units] = (byUnits[units] || 0) + 1;
    });

    const uniqueSellers = new Set(list.map(l => l.sellerid).filter(Boolean)).size;

    return {
      total,
      uniqueSellers,
      minPrice,
      maxPrice,
      avgPrice,
      byCategory,
      byVisibility,
      byUnits
    };
  }

  function renderStats(stats) {
    const el = document.getElementById('stats-content');
    if (!el) return;

    if (!stats.total) {
      el.innerHTML = '<p class="muted">No listings loaded yet.</p>';
      return;
    }

    const fmt = (n) => n == null ? '–' : '$' + Number(n).toFixed(2);

    const catHtml = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `<li>${escapeHtml(k)}: ${v}</li>`).join('');
    const visHtml = Object.entries(stats.byVisibility)
      .map(([k, v]) => `<li>${escapeHtml(k)}: ${v}</li>`).join('');
    const unitsHtml = Object.entries(stats.byUnits)
      .map(([k, v]) => `<li>${escapeHtml(k)}: ${v}</li>`).join('');

    el.innerHTML = `
      <div class="stats-summary">
        <div class="stat-row"><strong>Total listings</strong> <span>${stats.total}</span></div>
        <div class="stat-row"><strong>Unique sellers</strong> <span>${stats.uniqueSellers}</span></div>
        <div class="stat-row"><strong>Price range</strong> <span>${fmt(stats.minPrice)} – ${fmt(stats.maxPrice)}</span></div>
        <div class="stat-row"><strong>Average price</strong> <span>${fmt(stats.avgPrice)}</span></div>
      </div>
      <h4>By category</h4>
      <ul class="stats-list">${catHtml}</ul>
      <h4>By visibility</h4>
      <ul class="stats-list">${visHtml}</ul>
      <h4>By units</h4>
      <ul class="stats-list">${unitsHtml}</ul>
      <p class="muted small">Computed from current in-memory listings (seed or live). Fully client-side.</p>
    `;
  }

  function open() {
    const modal = document.getElementById('stats-modal');
    if (!modal) return;
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    const stats = computeStats(listings);
    renderStats(stats);
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('stats-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('close-stats-btn')?.addEventListener('click', close);
    document.getElementById('stats-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'stats-modal') close();
    });
  }

  global.FD_STATS = { open, bind };
})(window);
