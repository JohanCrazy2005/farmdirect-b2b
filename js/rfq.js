/**
 * FarmDirect B2B – RFQ / Request for Quote modal
 * Simple form (name, email, quantity, message).
 * Prefers live Worker POST /api/v1/rfqs when API_BASE is set; falls back to localStorage (fd-rfqs).
 * Fully works in pure seed/demo mode.
 * + getAll() for seller dashboard inbox (local or via FD_API.fetchMyRfqs).
 * + notifies dashboard badge on submit.
 * + buyer "My quote requests" view (options menu; lists local RFQs with listing titles).
 * + each buyer RFQ can open the matching product card (closes modal; works in seed/demo).
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

  async function handleSubmit(e) {
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

    const inquiry = { listingId, name, email, quantity, message };

    let result = { ok: false };
    if (global.FD_API && typeof global.FD_API.createRfq === 'function') {
      result = await global.FD_API.createRfq(inquiry);
    }

    if (!result.ok) {
      // hard local fallback if API helper missing
      try {
        const list = getAll();
        list.push({ ...inquiry, id: 'rfq-' + Date.now().toString(36), created: new Date().toISOString() });
        localStorage.setItem(KEY, JSON.stringify(list));
        result = { ok: true, source: 'local', message: 'Request saved (demo)' };
      } catch (_) {}
    }

    if (status) {
      status.textContent = result.message || (result.source === 'api' ? 'Request sent' : 'Request saved (demo)');
      status.className = 'form-status success';
    }
    showToast(result.message || 'Quote request saved', 'success');
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

  function openListingFromRfq(listingId) {
    if (!listingId) {
      showToast('No listing associated with this request', 'error');
      return;
    }
    const listings = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      showToast('Listing no longer available in current data', 'error');
      return;
    }
    closeMyRfqs();
    if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
      global.FD_LIST.select(listingId);
    } else if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
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
      const viewBtn = r.listingId
        ? '<button type="button" class="icon-btn" style="width:auto;padding:0 0.75rem;margin-top:0.4rem" data-listing="' + escapeHtml(r.listingId) + '">View listing</button>'
        : '';
      return `
        <div class="listing-card" style="margin-bottom:0.5rem">
          <div class="listing-info" style="padding:0.4rem">
            <h3 style="font-size:0.95rem">${escapeHtml(title)}</h3>
            <div class="meta">To seller · Qty: ${escapeHtml(r.quantity)}</div>
            ${r.message ? '<p style="margin:0.25rem 0;font-size:0.85rem">' + escapeHtml(r.message) + '</p>' : ''}
            <div class="meta" style="font-size:0.75rem">${escapeHtml(when)}</div>
            ${viewBtn}
          </div>
        </div>`;
    }).join('');

    // Wire view buttons
    container.querySelectorAll('button[data-listing]').forEach(btn => {
      btn.addEventListener('click', () => openListingFromRfq(btn.dataset.listing));
    });
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
