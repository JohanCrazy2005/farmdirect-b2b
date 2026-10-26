/**
 * FarmDirect B2B – keyboard shortcuts
 * Centralizes map-first keyboard controls and the help modal.
 * Fully client-side; works in seed/demo and live modes.
 * Ignores keypresses while typing in inputs/textareas/selects.
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
    // Close cards / menus / modals that are currently visible
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
    // Modals
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    // Product / seller cards
    const product = document.getElementById('product-card');
    if (product && product.style.display !== 'none' && product.innerHTML) {
      if (global.FD_CARDS && typeof global.FD_CARDS.closeProduct === 'function') {
        global.FD_CARDS.closeProduct();
      } else {
        product.innerHTML = '';
        product.style.display = 'none';
      }
    }
    const seller = document.getElementById('seller-card');
    if (seller && seller.style.display !== 'none' && seller.innerHTML) {
      seller.innerHTML = '';
      seller.style.display = 'none';
    }
    // Lightbox
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
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.add('open');
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
    const open = !card.hasAttribute('hidden');
    if (open) {
      card.setAttribute('hidden', '');
      btn?.setAttribute('aria-expanded', 'false');
    } else {
      card.removeAttribute('hidden');
      btn?.setAttribute('aria-expanded', 'true');
      // Close options if open
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    }
  }

  function toggleOptions() {
    const menu = document.getElementById('options-menu');
    const btn = document.getElementById('options-btn');
    if (!menu) return;
    const open = !menu.hasAttribute('hidden');
    if (open) {
      menu.setAttribute('hidden', '');
      btn?.setAttribute('aria-expanded', 'false');
    } else {
      menu.removeAttribute('hidden');
      btn?.setAttribute('aria-expanded', 'true');
      document.getElementById('filter-card')?.setAttribute('hidden', '');
    }
  }

  function locateMe() {
    if (global.FD_MAP && typeof global.FD_MAP.locateMe === 'function') {
      global.FD_MAP.locateMe();
    }
  }

  function fitAll() {
    if (global.FD_MAP && typeof global.FD_MAP.fitAll === 'function') {
      global.FD_MAP.fitAll();
    }
  }

  function clearLocation() {
    if (global.FD_MAP && typeof global.FD_MAP.clearLocation === 'function') {
      global.FD_MAP.clearLocation();
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
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = next === 'dark' ? 'Toggle light mode' : 'Toggle dark mode';
    if (global.FD_TOAST) global.FD_TOAST.show(next === 'dark' ? 'Dark mode on' : 'Light mode on', 'info');
  }

  function navigateList(delta) {
    if (global.FD_LIST && typeof global.FD_LIST.navigate === 'function') {
      global.FD_LIST.navigate(delta);
    } else {
      // Fallback: focus next/prev listing item
      const items = Array.from(document.querySelectorAll('#listing-list .listing-item'));
      if (!items.length) return;
      const current = document.querySelector('#listing-list .listing-item.highlighted, #listing-list .listing-item:focus');
      let idx = current ? items.indexOf(current) : -1;
      idx = Math.max(0, Math.min(items.length - 1, idx + delta));
      const next = items[idx];
      if (next) {
        items.forEach(el => el.classList.remove('highlighted'));
        next.classList.add('highlighted');
        next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const id = next.dataset.id;
        if (id && global.FD_MAP && typeof global.FD_MAP.highlightMarker === 'function') {
          global.FD_MAP.highlightMarker(id);
        }
      }
    }
  }

  function openHighlighted() {
    const highlighted = document.querySelector('#listing-list .listing-item.highlighted');
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
    const key = e.key;
    const lower = key.toLowerCase();

    // Ignore if modifier keys (except for some combos we don't use)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

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
        locateMe();
        break;
      case 'f':
        e.preventDefault();
        fitAll();
        break;
      case 'x':
        e.preventDefault();
        clearLocation();
        break;
      case 'd':
        e.preventDefault();
        toggleTheme();
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
      case ' ':
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
    // Button in Options menu
    document.getElementById('shortcuts-btn')?.addEventListener('click', () => {
      openShortcuts();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });

    // Modal close
    document.getElementById('close-shortcuts-btn')?.addEventListener('click', closeShortcuts);
    document.getElementById('shortcuts-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shortcuts-modal') closeShortcuts();
    });

    // Global key listener
    document.addEventListener('keydown', handleKey);
  }

  global.FD_SHORTCUTS = {
    bind,
    open: openShortcuts,
    close: closeShortcuts
  };
})(window);
