/**
 * FarmDirect B2B – RFQ / Request for Quote modal
 * Simple form (name, email, quantity, message). Stores in localStorage (fd-rfqs) + toast.
 * Fully client-side; works in pure seed/demo mode.
 * + getAll() for seller dashboard inbox.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-rfqs';

  function showToast(msg, type) {
    if (global.FD_TOAST) global.FD_TOAST.show(msg, type || 'info');
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
    setTimeout(close, 900);
  }

  function clearAll() {
    localStorage.removeItem(KEY);
  }

  function bind() {
    document.getElementById('rfq-form')?.addEventListener('submit', handleSubmit);
    document.getElementById('close-rfq-btn')?.addEventListener('click', close);
    document.getElementById('rfq-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'rfq-modal') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  global.FD_RFQ = { open, close, bind, getAll, clearAll };
})(window);
