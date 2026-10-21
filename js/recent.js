/**
 * FarmDirect B2B – recently viewed listings
 * Tracks product card opens in localStorage (last 8), shows modal from options menu.
 * Click a recent item to reopen the product card + fly to marker. Fully client-side for seed/demo.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-recent';
  const MAX = 8;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function save(ids) {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
    } catch (_) {}
  }

  function track(id) {
    if (!id) return;
    let ids = load().filter(x => x !== id);
    ids.unshift(id);
    save(ids);
  }

  function getRecentListings() {
    const ids = load();
    const all = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    return ids.map(id => all.find(l => l.id === id)).filter(Boolean);
  }

  function render() {
    const container = document.getElementById('recent-list');
    if (!container) return;
    const items = getRecentListings();
    if (!items.length) {
      container.innerHTML = '<p class="muted">No recently viewed listings yet. Open a product card to start tracking.</p>';
      return;
    }
    container.innerHTML = items.map(l => `
      <div class="recent-item" data-id="${escapeHtml(l.id)}" style="display:flex;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid var(--border);cursor:pointer;align-items:center">
        <img src="${escapeHtml(l.image)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:0.3rem;background:var(--hover-bg)" onerror="this.style.display='none'">
        <div>
          <strong style="font-size:0.9rem">${escapeHtml(l.headerdescription)}</strong>
          <div style="font-size:0.75rem;color:var(--muted,#64748b)">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)} · ${escapeHtml(l.category)}</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.recent-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const listing = items.find(l => l.id === id);
        if (listing) {
          close();
          if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
            global.FD_LIST.select(id);
          } else if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
            global.FD_CARDS.showProduct(listing);
          }
        }
      });
    });
  }

  function open() {
    const modal = document.getElementById('recent-modal');
    if (!modal) return;
    render();
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('recent-modal')?.classList.remove('open');
  }

  function clear() {
    if (!confirm('Clear recently viewed?')) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Recently viewed cleared', 'info');
  }

  function bind() {
    document.getElementById('close-recent-btn')?.addEventListener('click', close);
    document.getElementById('recent-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'recent-modal') close();
    });
    document.getElementById('clear-recent-btn')?.addEventListener('click', clear);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  global.FD_RECENT = { track, open, close, bind };
})(window);
