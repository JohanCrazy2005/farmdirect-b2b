/**
 * FarmDirect B2B – keyboard shortcuts module
 * Global key bindings and a help modal for faster seed/demo exploration.
 * Fully client-side; works without a live Worker.
 *
 * Shortcuts:
 *   / or s   Focus search box
 *   l        Locate me
 *   f        Fit all listings
 *   x        Clear location (if active)
 *   ? or h   Open this shortcuts modal
 *   Escape   Close open cards / menus / modals
 */
(function (global) {
  'use strict';

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    }
  }

  function open() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.add('open');
  }

  function close() {
    document.getElementById('shortcuts-modal')?.classList.remove('open');
  }

  function isTyping() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable;
  }

  function handleKey(e) {
    // Ignore when typing in fields, or with modifiers that look like browser shortcuts
    if (isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();

    if (key === '/' || key === 's') {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }

    if (key === 'l') {
      e.preventDefault();
      if (global.FD_MAP && typeof global.FD_MAP.locateMe === 'function') {
        global.FD_MAP.locateMe();
      }
      return;
    }

    if (key === 'f') {
      e.preventDefault();
      if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') {
        global.FD_MAP.fitAll();
        showToast('Fit all listings', 'info');
      }
      return;
    }

    if (key === 'x') {
      e.preventDefault();
      if (global.FD_MAP && typeof global.FD_MAP.clearLocation === 'function') {
        global.FD_MAP.clearLocation();
      }
      return;
    }

    if (key === '?' || key === 'h') {
      e.preventDefault();
      open();
      return;
    }

    if (e.key === 'Escape') {
      // Close common overlays if open
      close();
      document.getElementById('filter-card')?.classList.remove('open');
      document.getElementById('options-menu')?.classList.remove('open');
      document.getElementById('product-card')?.classList.remove('open');
      document.getElementById('seller-card')?.classList.remove('open');
      document.getElementById('listing-form-modal')?.classList.remove('open');
      document.getElementById('dashboard-modal')?.classList.remove('open');
      document.getElementById('rfq-modal')?.classList.remove('open');
      document.getElementById('deploy-modal')?.classList.remove('open');
      document.getElementById('my-rfqs-modal')?.classList.remove('open');
      document.getElementById('recent-modal')?.classList.remove('open');
      document.getElementById('image-lightbox')?.classList.remove('open');
      // Clear hash if a listing was open
      if (location.hash.startsWith('#listing=')) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
  }

  function bind() {
    document.getElementById('shortcuts-btn')?.addEventListener('click', open);
    document.getElementById('close-shortcuts-btn')?.addEventListener('click', close);
    document.getElementById('shortcuts-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shortcuts-modal') close();
    });
    document.addEventListener('keydown', handleKey);
  }

  global.FD_SHORTCUTS = { open, close, bind };
})(window);
