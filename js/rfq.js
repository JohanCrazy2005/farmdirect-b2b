/**
 * FarmDirect B2B – RFQ / Request for Quote modal
 * Simple form (name, email, quantity, message). Stores in localStorage (fd-rfqs) + toast.
 * Fully client-side; works in pure seed/demo mode.
 * + getAll() for seller dashboard inbox.
 * + notifies dashboard badge on submit.
 * + buyer "My quote requests" view (options menu; lists all local RFQs with listing titles).
 */
(function (global) {
  'use strict';

  const KEY = 'fd-rfqs';

  function showToast(msg, type) {
    if (global.FD_TOAST) global.FD_TOAST.show(msg, type || 'info');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function open(listingId) {
    const modal = document.getElementById('rfq-modal');
    if (!modal) return;
    document.getElementById('rfq-listing-id').value = listingId || '';
    document.getElementById('rfq-form')?.reset();
    document.getElementById('rfq-status').textContent = '';
    modal.classList.add('open');
    document.getElementById('rfq-name')?.focus();
  }

  function close() {
    document.getElementById('rfq-modal')?.classList.remove('open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const status = document.getElementById('rfq-status');
    const listingId = document.getElementById('rfq-listing-id')?.value || '';
    const name = document.getElementById('rfq-name')?.value.trim();
    const email = document.getElementById('rfq-email')?.value.trim();
    const quantity = document.getElementById('rfq-quantity')?.value.trim();
    const message = document.getElementById('rfq-message')?.value.trim();

    if (!name || !email || !quantity) {
      if (status) { status.textContent = 'Name, email, and quantity are required'; status.className = 'form-status error'; }
      return;
    }

    const inquiry = {
      id: 'rfq-' + Date.now().toString(36),
      listingId,
      name,
      email,
      quantity,
      message,
      created: new Date().toISOString()
    };

    try {
      const list = getAll();
      list.push(inquiry);
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (_) {}

    if (status) { status.textContent = 'Request saved (demo)'; status.className = 'form-status success'; }
    showToast('Quote request saved locally', 'success');
    if (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.updateRfqBadge === 'function') {
      global.FD_DASHBOARD.updateRfqBadge();
    }
    setTimeout(close, 900);
  }

  function clearAll() {
    localStorage.removeItem(KEY);
  }

  function openMyRfqs() {
    const modal = document.getElementById('my-rfqs-modal');
    if (!modal) return;
    renderMyRfqs();
    modal.classList.add('open');
  }

  function closeMyRfqs() {
    document.getElementById('my-rfqs-modal')?.classList.remove('open');
  }

  function renderMyRfqs() {
    const container = document.getElementById('my-rfqs-list');
    if (!container) return;
    const rfqs = getAll().slice().reverse();
    const listings = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];

    if (!rfqs.length) {
      container.innerHTML = '<div class="empty-state"><p>No quote requests yet. Open a product card and click Request quote.</p></div>';
      return;
    }

    container.innerHTML = rfqs.map(r => {
      const listing = listings.find(l => l.id === r.listingId);
      const title = listing ? listing.headerdescription : (r.listingId || 'Unknown listing');
      const when = r.created ? new Date(r.created).toLocaleString() : '';
      return `
        <div class="listing-card" style="margin-bottom:0.5rem">
          <div class="listing-info" style="padding:0.4rem">
            <h3 style="font-size:0.95rem">${escapeHtml(title)}</h3>
            <div class="meta">To seller · Qty: ${escapeHtml(r.quantity)}</div>
            ${r.message ? `<p style="margin:0.25rem 0;font-size:0.85rem">${escapeHtml(r.message)}</p>` : ''}
            <div class="meta" style="font-size:0.75rem">${escapeHtml(when)}</div>
          </div>
        </div>`;
    }).join('');
  }

  function bind() {
    document.getElementById('rfq-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('close-rfq-btn')?.addEventListener('click', close);
    document.getElementById('rfq-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'rfq-modal') close();
    });

    document.getElementById('close-my-rfqs-btn')?.addEventListener('click', closeMyRfqs);
    document.getElementById('my-rfqs-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'my-rfqs-modal') closeMyRfqs();
    });
    document.getElementById('clear-my-rfqs-btn')?.addEventListener('click', () => {
      if (!confirm('Clear all quote requests?')) return;
      clearAll();
      renderMyRfqs();
      if (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.updateRfqBadge === 'function') {
        global.FD_DASHBOARD.updateRfqBadge();
      }
      showToast('Quote requests cleared', 'info');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
        closeMyRfqs();
      }
    });
  }

  global.FD_RFQ = { open, close, bind, getAll, clearAll, openMyRfqs };
})(window);
