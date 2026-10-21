/**
 * FarmDirect B2B – seller directory module
 * Options-menu modal listing unique sellers from current data with counts,
 * categories, and average price. Clicking a seller applies the seller filter
 * and closes the modal. Fully client-side; works in pure seed/demo mode.
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

  function computeSellers(listings) {
    const list = Array.isArray(listings) ? listings : [];
    const map = new Map();

    list.forEach(l => {
      const id = l.sellerid;
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, {
          sellerid: id,
          count: 0,
          categories: new Set(),
          prices: [],
          sampleAddress: l.address || ''
        });
      }
      const entry = map.get(id);
      entry.count += 1;
      if (l.category) entry.categories.add(l.category);
      const price = Number(l.price);
      if (!isNaN(price) && isFinite(price)) entry.prices.push(price);
      if (!entry.sampleAddress && l.address) entry.sampleAddress = l.address;
    });

    return Array.from(map.values())
      .map(s => ({
        ...s,
        categories: Array.from(s.categories).sort(),
        avgPrice: s.prices.length ? s.prices.reduce((a, b) => a + b, 0) / s.prices.length : null
      }))
      .sort((a, b) => b.count - a.count || a.sellerid.localeCompare(b.sellerid));
  }

  function applySellerFilter(sellerid) {
    const sel = document.getElementById('filter-seller');
    if (sel) {
      sel.value = sellerid;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close();
    if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${sellerid}`, 'info');
  }

  function render(sellers) {
    const el = document.getElementById('sellers-content');
    if (!el) return;

    if (!sellers.length) {
      el.innerHTML = '<p class="muted">No sellers in current listings.</p>';
      return;
    }

    const fmt = (n) => n == null ? '–' : '$' + Number(n).toFixed(2);

    el.innerHTML = sellers.map(s => `
      <div class="seller-dir-item">
        <div class="seller-dir-header">
          <strong>${escapeHtml(s.sellerid)}</strong>
          <span class="seller-count">${s.count} listing${s.count === 1 ? '' : 's'}</span>
        </div>
        <div class="seller-meta">
          Categories: ${escapeHtml(s.categories.join(', ') || '–')}
          ${s.avgPrice != null ? ` · Avg ${fmt(s.avgPrice)}` : ''}
        </div>
        ${s.sampleAddress ? `<div class="seller-address muted small">${escapeHtml(s.sampleAddress)}</div>` : ''}
        <button type="button" class="small-btn view-seller-btn" data-seller="${escapeHtml(s.sellerid)}">View listings</button>
      </div>
    `).join('');

    el.querySelectorAll('.view-seller-btn').forEach(btn => {
      btn.addEventListener('click', () => applySellerFilter(btn.dataset.seller));
    });
  }

  function open() {
    const modal = document.getElementById('sellers-modal');
    if (!modal) return;
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    const sellers = computeSellers(listings);
    render(sellers);
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('sellers-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('close-sellers-btn')?.addEventListener('click', close);
    document.getElementById('sellers-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'sellers-modal') close();
    });
  }

  global.FD_SELLERS = { open, bind };
})(window);
