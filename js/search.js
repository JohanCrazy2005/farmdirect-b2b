/**
 * FarmDirect B2B – search suggestions / typeahead
 * Shows matching listings under the top-bar search as you type.
 * Debounced, keyboard-navigable (arrows/Enter/Esc), click to open product + fly to marker.
 * Fully client-side; works in pure seed/demo mode. Complements existing filters/search.
 * + Prefers friendly seller display names (from seed meta) in matches and results.
 * + Category color swatches for visual consistency with the map legend.
 */
(function (global) {
  'use strict';

  let debounceTimer = null;
  let activeIndex = -1;
  let currentMatches = [];

  const CATEGORY_COLORS = {
    produce: '#2d6a4f',
    dairy: '#1d4ed8',
    eggs: '#d97706',
    grains: '#92400e',
    herbs: '#059669',
    honey: '#f59e0b',
    meat: '#dc2626',
    flowers: '#ec4899',
    nuts: '#78350f',
    seafood: '#0ea5e9',
    bakery: '#f97316',
    default: '#40916c'
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function getListings() {
    if (global.FD_LIST && typeof global.FD_LIST.getListings === 'function') {
      return global.FD_LIST.getListings() || [];
    }
    return [];
  }

  function matchesQuery(listing, q) {
    if (!q) return false;
    const lower = q.toLowerCase();
    const fields = [
      listing.headerdescription,
      listing.description,
      listing.category,
      getDisplayName(listing.sellerid),
      listing.sellerid,
      listing.address,
      listing.units
    ];
    return fields.some(f => f && String(f).toLowerCase().includes(lower));
  }

  function renderSuggestions(matches) {
    const box = document.getElementById('search-suggestions');
    if (!box) return;
    currentMatches = matches.slice(0, 8);
    activeIndex = -1;

    if (!currentMatches.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }

    box.innerHTML = currentMatches.map((l, i) => {
      const price = Number(l.price);
      const priceStr = isNaN(price) ? '' : ` · $${price.toFixed(2)}/${escapeHtml(l.units || '')}`;
      const seller = escapeHtml(getDisplayName(l.sellerid));
      const color = CATEGORY_COLORS[l.category] || CATEGORY_COLORS.default;
      const swatch = `<span class="suggestion-swatch" style="background:${color}" aria-hidden="true"></span>`;
      return `
        <div class="suggestion-item" data-index="${i}" data-id="${escapeHtml(l.id)}" role="option" tabindex="-1">
          <div class="suggestion-title">${swatch}${escapeHtml(l.headerdescription || 'Listing')}</div>
          <div class="suggestion-meta">${escapeHtml(l.category || '')} · ${seller}${priceStr}</div>
        </div>`;
    }).join('');

    box.hidden = false;

    box.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        selectSuggestion(id);
      });
      item.addEventListener('mouseenter', () => {
        setActive(parseInt(item.dataset.index, 10));
      });
    });
  }

  function setActive(idx) {
    const items = document.querySelectorAll('.suggestion-item');
    items.forEach((el, i) => el.classList.toggle('active', i === idx));
    activeIndex = idx;
  }

  function selectSuggestion(id) {
    if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
      global.FD_LIST.select(id);
    }
    hideSuggestions();
    const input = document.getElementById('search-input');
    if (input) input.blur();
  }

  function hideSuggestions() {
    const box = document.getElementById('search-suggestions');
    if (box) {
      box.hidden = true;
      box.innerHTML = '';
    }
    activeIndex = -1;
    currentMatches = [];
  }

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const input = document.getElementById('search-input');
      const q = (input?.value || '').trim();
      if (q.length < 2) {
        hideSuggestions();
        return;
      }
      const listings = getListings();
      const matches = listings.filter(l => matchesQuery(l, q));
      renderSuggestions(matches);
    }, 180);
  }

  function onKeydown(e) {
    const box = document.getElementById('search-suggestions');
    if (!box || box.hidden || !currentMatches.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, currentMatches.length - 1);
      setActive(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      setActive(prev);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const id = currentMatches[activeIndex]?.id;
      if (id) selectSuggestion(id);
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  }

  function bind() {
    const input = document.getElementById('search-input');
    if (!input) return;

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeydown);
    input.addEventListener('focus', onInput);

    document.addEventListener('click', (e) => {
      const box = document.getElementById('search-suggestions');
      const searchBox = document.querySelector('.search-box');
      if (box && searchBox && !searchBox.contains(e.target)) {
        hideSuggestions();
      }
    });

    // Also hide when clear-search is clicked
    document.getElementById('clear-search')?.addEventListener('click', hideSuggestions);
  }

  global.FD_SEARCH = { bind };
})(window);
