/**
 * FarmDirect B2B – keyboard shortcuts
 * Centralizes map-first keyboard controls and the help modal.
 * Fully client-side; works in seed/demo and live modes.
 * Ignores keypresses while typing in inputs/textareas/selects.
 * Calls the real FD_MAP / FD_LIST methods (locateUser, fitAll, pickRandom).
 */
(function (global) {
  'use strict';

  function isTyping() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable;
  }

  function closeOpenPanels() {
    const options = document.getElementById('options-menu');
    if (options && !options.hasAttribute('hidden')) {
      options.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
    }
    const filter = document.getElementById('filter-card');
    if (filter && !filter.hasAttribute('hidden')) {
      filter.setAttribute('hidden', '');
      document.getElementById('filter-btn')?.setAttribute('aria-expanded', 'false');
    }
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    const product = document.getElementById('product-card');
    if (product && product.classList.contains('open')) {
      if (global.FD_CARDS && typeof global.FD_CARDS.closeProduct === 'function') {
        global.FD_CARDS.closeProduct();
      } else {
        product.classList.remove('open');
        product.innerHTML = '';
      }
    }
    const seller = document.getElementById('seller-card');
    if (seller && seller.classList.contains('open')) {
      seller.classList.remove('open');
      seller.innerHTML = '';
    }
    const lb = document.getElementById('image-lightbox');
    if (lb && lb.classList.contains('open')) {
      if (global.FD_CARDS && typeof global.FD_CARDS.closeLightbox === 'function') {
        global.FD_CARDS.closeLightbox();
      } else {
        lb.classList.remove('open');
      }
    }
  }

  function openShortcuts() {
    document.getElementById('shortcuts-modal')?.classList.add('open');
  }

  function closeShortcuts() {
    document.getElementById('shortcuts-modal')?.classList.remove('open');
  }

  function focusSearch() {
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  function toggleFilter() {
    const card = document.getElementById('filter-card');
    const btn = document.getElementById('filter-btn');
    if (!card) return;
    const open = card.hasAttribute('hidden');
    card.toggleAttribute('hidden', !open);
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) document.getElementById('options-menu')?.setAttribute('hidden', '');
  }

  function toggleOptions() {
    const menu = document.getElementById('options-menu');
    const btn = document.getElementById('options-btn');
    if (!menu) return;
    const open = menu.hasAttribute('hidden');
    menu.toggleAttribute('hidden', !open);
    btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) document.getElementById('filter-card')?.setAttribute('hidden', '');
  }

  function locateUser() {
    if (global.FD_MAP && typeof global.FD_MAP.locateUser === 'function') {
      global.FD_MAP.locateUser();
    }
  }

  function fitAll() {
    if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') {
      global.FD_MAP.fitAll();
    }
  }

  function pickRandom() {
    if (global.FD_LIST && typeof global.FD_LIST.pickRandom === 'function') {
      global.FD_LIST.pickRandom();
    }
  }

  function toggleFavorites() {
    if (global.FD_LIST && typeof global.FD_LIST.toggleFavoritesOnly === 'function') {
      global.FD_LIST.toggleFavoritesOnly();
      return;
    }
    // Fallback: flip the filter-card checkbox (requires Apply)
    const cb = document.getElementById('filter-favorites');
    if (cb) {
      cb.checked = !cb.checked;
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    try { localStorage.setItem('fd-theme', next); } catch (_) {}
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.checked = next === 'dark';
    if (global.FD_TOAST) global.FD_TOAST.show(next === 'dark' ? 'Dark mode on' : 'Light mode on', 'info');
  }

  function navigateList(delta) {
    if (global.FD_LIST && typeof global.FD_LIST.navigate === 'function') {
      global.FD_LIST.navigate(delta);
      return;
    }
    const items = Array.from(document.querySelectorAll('#listing-list .listing-item'));
    if (!items.length) return;
    const current = document.querySelector('#listing-list .listing-item.active, #listing-list .listing-item.highlighted');
    let idx = current ? items.indexOf(current) : -1;
    idx = Math.max(0, Math.min(items.length - 1, idx + delta));
    const next = items[idx];
    if (next) {
      items.forEach(el => el.classList.remove('highlighted'));
      next.classList.add('highlighted');
      next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function openHighlighted() {
    const highlighted = document.querySelector('#listing-list .listing-item.highlighted, #listing-list .listing-item.active');
    if (highlighted) {
      const id = highlighted.dataset.id;
      if (id && global.FD_LIST && typeof global.FD_LIST.select === 'function') {
        global.FD_LIST.select(id);
        return;
      }
      highlighted.click();
    }
  }

  function handleKey(e) {
    if (isTyping()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;
    const lower = key.toLowerCase();

    switch (lower) {
      case '/':
      case 's':
        e.preventDefault();
        focusSearch();
        break;
      case 'i':
        e.preventDefault();
        toggleFilter();
        break;
      case 'o':
        e.preventDefault();
        toggleOptions();
        break;
      case 'l':
        e.preventDefault();
        locateUser();
        break;
      case 'f':
        e.preventDefault();
        fitAll();
        break;
      case 'r':
        e.preventDefault();
        pickRandom();
        break;
      case 'd':
        e.preventDefault();
        toggleTheme();
        break;
      case 'v':
        e.preventDefault();
        toggleFavorites();
        break;
      case '?':
      case 'h':
        e.preventDefault();
        openShortcuts();
        break;
      case 'arrowup':
        e.preventDefault();
        navigateList(-1);
        break;
      case 'arrowdown':
        e.preventDefault();
        navigateList(1);
        break;
      case 'enter':
        e.preventDefault();
        openHighlighted();
        break;
      case 'escape':
        e.preventDefault();
        closeOpenPanels();
        closeShortcuts();
        break;
      default:
        break;
    }
  }

  function bind() {
    document.getElementById('open-shortcuts')?.addEventListener('click', () => {
      openShortcuts();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('close-shortcuts-btn')?.addEventListener('click', closeShortcuts);
    document.getElementById('shortcuts-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shortcuts-modal') closeShortcuts();
    });
    document.addEventListener('keydown', handleKey);
  }

  global.FD_SHORTCUTS = {
    bind,
    open: openShortcuts,
    close: closeShortcuts
  };
})(window);
