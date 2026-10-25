/**
 * FarmDirect B2B – seller directory module
 * Options-menu modal listing unique sellers from current data with counts,
 * categories, and average price. Prefers display names from data/seed-sellers.json
 * when available. Clicking a seller applies the seller filter and closes the modal.
 * Fully client-side; works in pure seed/demo mode.
 * Now exposes getDisplayName for use in list/cards.
 */
(function (global) {
  'use strict';

  let sellersMeta = null; // cache of seed-sellers.json map

  async function loadSellersMeta() {
    if (sellersMeta) return sellersMeta;
    const cfg = global.FD_CONFIG || {};
    try {
      const res = await fetch(cfg.SEED_SELLERS_URL || 'data/seed-sellers.json');
      if (res.ok) {
        const arr = await res.json();
        sellersMeta = {};
        if (Array.isArray(arr)) {
          arr.forEach(s => {
            if (s && s.sellerid) sellersMeta[s.sellerid] = s;
          });
        }
      }
    } catch (_) {
      sellersMeta = {};
    }
    return sellersMeta || {};
  }

  function getDisplayName(sellerid) {
    if (!sellerid) return '';
    const info = (sellersMeta && sellersMeta[sellerid]) || {};
    return info.name || sellerid;
  }

  function getBio(sellerid) {
    if (!sellerid) return '';
    const info = (sellersMeta && sellersMeta[sellerid]) || {};
    return info.bio || '';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
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
    if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${getDisplayName(sellerid)}`, 'info');
  }

  async function render(sellers) {
    const el = document.getElementById('sellers-content');
    if (!el) return;

    if (!sellers.length) {
      el.innerHTML = '<p class="muted">No sellers in current listings.</p>';
      return;
    }

    const meta = await loadSellersMeta();
    const fmt = (n) => n == null ? '–' : '$' + Number(n).toFixed(2);

    el.innerHTML = sellers.map(s => {
      const info = meta[s.sellerid] || {};
      const display = info.name || s.sellerid;
      const bio = info.bio || '';
      return `
      <div class="seller-dir-item">
        <div class="seller-dir-header">
          <strong>${escapeHtml(display)}</strong>
          <span class="seller-count">${s.count} listing${s.count === 1 ? '' : 's'}</span>
        </div>
        ${bio ? `<div class="seller-bio small muted">${escapeHtml(bio)}</div>` : ''}
        <div class="seller-meta">
          Categories: ${escapeHtml(s.categories.join(', ') || '–')}
          ${s.avgPrice != null ? ` · Avg ${fmt(s.avgPrice)}` : ''}
        </div>
        ${s.sampleAddress ? `<div class="seller-address muted small">${escapeHtml(s.sampleAddress)}</div>` : ''}
        <button type="button" class="small-btn view-seller-btn" data-seller="${escapeHtml(s.sellerid)}">View listings</button>
      </div>
    `;
    }).join('');

    el.querySelectorAll('.view-seller-btn').forEach(btn => {
      btn.addEventListener('click', () => applySellerFilter(btn.dataset.seller));
    });
  }

  async function open() {
    const modal = document.getElementById('sellers-modal');
    if (!modal) return;
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    const sellers = computeSellers(listings);
    await render(sellers);
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
    // Eager load meta for other modules
    loadSellersMeta();
  }

  global.FD_SELLERS = { open, bind, loadSellersMeta, getDisplayName, getBio };
})(window);
