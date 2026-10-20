/**
 * FarmDirect B2B – RFQ (Request for Quote) module
 * Demo-friendly client-side inquiry form opened from product cards.
 * Collects name, email, quantity, message; validates; stores in localStorage;
 * shows non-blocking toast. Works fully in seed/demo mode (no Worker required).
 */
(function (global) {
  'use strict';

  const RFQ_KEY = 'fd-rfqs';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadRfqs() {
    try {
      const raw = localStorage.getItem(RFQ_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveRfqs(list) {
    try {
      localStorage.setItem(RFQ_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    } else {
      console.log(msg);
    }
  }

  function open(listingId) {
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings() : [];
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      showToast('Could not find listing for quote', 'error');
      return;
    }

    const modal = document.getElementById('rfq-modal');
    if (!modal) return;

    const titleEl = modal.querySelector('#rfq-title');
    const form = modal.querySelector('#rfq-form');
    const statusEl = modal.querySelector('#rfq-status');

    if (titleEl) {
      titleEl.textContent = 'Request quote: ' + (listing.headerdescription || 'Listing');
    }
    if (form) form.reset();
    if (statusEl) statusEl.textContent = '';

    // Prefill quantity hint if useful
    const qty = form && form.querySelector('[name="quantity"]');
    if (qty && !qty.value) qty.placeholder = 'e.g. 50 ' + (listing.units || 'units');

    modal.dataset.listingId = listingId;
    modal.classList.add('open');

    // Focus first field
    const first = form && form.querySelector('input, textarea');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function close() {
    const modal = document.getElementById('rfq-modal');
    if (modal) modal.classList.remove('open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const modal = document.getElementById('rfq-modal');
    const listingId = modal && modal.dataset.listingId;
    const statusEl = form.querySelector('#rfq-status');

    const name = (form.querySelector('[name="name"]')?.value || '').trim();
    const email = (form.querySelector('[name="email"]')?.value || '').trim();
    const quantity = (form.querySelector('[name="quantity"]')?.value || '').trim();
    const message = (form.querySelector('[name="message"]')?.value || '').trim();

    if (!name || !email || !quantity) {
      if (statusEl) statusEl.textContent = 'Name, email, and quantity are required.';
      showToast('Please fill name, email, and quantity', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (statusEl) statusEl.textContent = 'Please enter a valid email.';
      showToast('Invalid email address', 'error');
      return;
    }

    const rfq = {
      id: 'rfq-' + Date.now().toString(36),
      listingId: listingId || '',
      name,
      email,
      quantity,
      message,
      createdAt: new Date().toISOString()
    };

    const list = loadRfqs();
    list.push(rfq);
    saveRfqs(list);

    if (statusEl) statusEl.textContent = '';
    showToast('Quote request saved (demo mode). Seller would be notified after deploy.', 'success');
    close();
  }

  function bindUI() {
    const form = document.getElementById('rfq-form');
    if (form) form.addEventListener('submit', handleSubmit);

    const closeBtn = document.getElementById('close-rfq');
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Close on backdrop click
    const modal = document.getElementById('rfq-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        close();
      }
    });
  }

  // Auto-bind when DOM ready (or immediately if already)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindUI);
  } else {
    bindUI();
  }

  global.FD_RFQ = { open, close };
})(window);
