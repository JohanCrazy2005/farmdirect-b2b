/**
 * FarmDirect B2B – local price watch
 * Track selected listings with a baseline price stored in localStorage (fd-pricewatch).
 * From the product card users can watch the current price; the Options modal shows
 * current vs baseline, delta, percent change, View, Update baseline, and Remove.
 * Fully client-side; useful in seed/demo mode where local edits can change prices
 * and while the Worker may be empty or offline. Keeps last 50 watches.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-pricewatch';
  const MAX = 50;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
    } catch (_) {}
  }

  function getListing(id) {
    if (global.FD_LIST && typeof global.FD_LIST.getListings === 'function') {
      const all = global.FD_LIST.getListings() || [];
      return all.find(l => String(l.id) === String(id)) || null;
    }
    return null;
  }

  function fmtPrice(price, units) {
    if (price == null || isNaN(Number(price))) return 'n/a';
    return '$' + Number(price).toFixed(2) + (units ? ' / ' + units : '');
  }

  function deltaHtml(current, baseline) {
    const c = Number(current);
    const b = Number(baseline);
    if (isNaN(c) || isNaN(b) || b === 0) return '<span class="muted">—</span>';
    const d = c - b;
    const pct = (d / b) * 100;
    const cls = d > 0 ? 'price-up' : d < 0 ? 'price-down' : 'muted';
    const sign = d > 0 ? '+' : '';
    return `<span class="${cls}">${sign}${d.toFixed(2)} (${sign}${pct.toFixed(1)}%)</span>`;
  }

  function add(listing) {
    if (!listing || !listing.id) return;
    const price = Number(listing.price);
    if (isNaN(price)) {
      if (global.FD_TOAST) global.FD_TOAST.show('No numeric price to watch', 'error');
      return;
    }
    let items = load().filter(item => String(item.id) !== String(listing.id));
    items.unshift({
      id: listing.id,
      baselinePrice: price,
      units: listing.units || '',
      header: listing.headerdescription || 'Listing',
      addedAt: Date.now()
    });
    save(items);
    if (global.FD_TOAST) global.FD_TOAST.show('Added to price watch', 'success');
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      global.FD_CARDS.openProduct(listing);
    }
  }

  function isWatching(id) {
    return load().some(item => String(item.id) === String(id));
  }

  function remove(id) {
    const items = load().filter(item => String(item.id) !== String(id));
    save(items);
    if (global.FD_TOAST) global.FD_TOAST.show('Removed from price watch', 'info');
    render();
  }

  function updateBaseline(id) {
    const listing = getListing(id);
    if (!listing) {
      if (global.FD_TOAST) global.FD_TOAST.show('Listing not found', 'error');
      return;
    }
    const price = Number(listing.price);
    if (isNaN(price)) {
      if (global.FD_TOAST) global.FD_TOAST.show('No numeric price', 'error');
      return;
    }
    const items = load().map(item => {
      if (String(item.id) === String(id)) {
        return { ...item, baselinePrice: price, units: listing.units || item.units, header: listing.headerdescription || item.header };
      }
      return item;
    });
    save(items);
    if (global.FD_TOAST) global.FD_TOAST.show('Baseline updated to current price', 'success');
    render();
  }

  function clearAll() {
    if (!confirm('Clear all price watches?')) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
    if (global.FD_TOAST) global.FD_TOAST.show('Price watch cleared', 'info');
    render();
  }

  function relativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr / 24);
    return day + 'd ago';
  }

  function render() {
    const modal = document.getElementById('pricewatch-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (!content) return;
    const items = load();
    const listHtml = items.length
      ? items.map(item => {
          const listing = getListing(item.id);
          const current = listing ? Number(listing.price) : null;
          const header = listing ? (listing.headerdescription || item.header) : item.header;
          const units = listing ? (listing.units || item.units) : item.units;
          const missing = !listing ? ' <span class="muted small">(not in current set)</span>' : '';
          return `
            <div class="pricewatch-item">
              <div class="pricewatch-head">
                <strong>${escapeHtml(header)}</strong>${missing}
                <span class="muted small">${relativeTime(item.addedAt)}</span>
              </div>
              <div class="pricewatch-meta small">
                Baseline: ${fmtPrice(item.baselinePrice, item.units)}
                · Current: ${current != null ? fmtPrice(current, units) : 'n/a'}
                · Δ ${deltaHtml(current, item.baselinePrice)}
              </div>
              <div class="pricewatch-actions">
                <button type="button" class="small-btn view-pricewatch" data-id="${escapeHtml(item.id)}">View</button>
                <button type="button" class="small-btn update-pricewatch" data-id="${escapeHtml(item.id)}">Update baseline</button>
                <button type="button" class="small-btn delete-pricewatch" data-id="${escapeHtml(item.id)}">Remove</button>
              </div>
            </div>`;
        }).join('')
      : '<p class="muted">No prices being watched yet. Open a listing and use “Watch price” on the product card.</p>';

    content.innerHTML = `
      <button type="button" id="close-pricewatch-btn" class="close-modal">×</button>
      <h3>Price watch</h3>
      <p class="small muted">Local baseline prices for selected listings. Current prices come from the loaded set (seed/demo or live). Useful while exploring or editing demo data.</p>
      <div class="pricewatch-list">${listHtml}</div>
      ${items.length ? '<button type="button" id="clear-pricewatch-btn" class="small-btn" style="margin-top:0.75rem">Clear all</button>' : ''}
    `;

    content.querySelector('#close-pricewatch-btn')?.addEventListener('click', close);
    content.querySelector('#clear-pricewatch-btn')?.addEventListener('click', clearAll);
    content.querySelectorAll('.view-pricewatch').forEach(btn => {
      btn.addEventListener('click', () => {
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(btn.dataset.id);
          close();
        }
      });
    });
    content.querySelectorAll('.update-pricewatch').forEach(btn => {
      btn.addEventListener('click', () => updateBaseline(btn.dataset.id));
    });
    content.querySelectorAll('.delete-pricewatch').forEach(btn => {
      btn.addEventListener('click', () => remove(btn.dataset.id));
    });
  }

  function open() {
    render();
    document.getElementById('pricewatch-modal')?.classList.add('open');
  }

  function close() {
    document.getElementById('pricewatch-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('pricewatch-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'pricewatch-modal') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  global.FD_PRICEWATCH = { open, close, bind, add, isWatching, remove };
})(window);
