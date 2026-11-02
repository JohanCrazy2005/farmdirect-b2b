/**
 * FarmDirect B2B – search history
 * Tracks recent search queries from the top-bar input in localStorage (fd-search-history).
 * Users can reopen past queries from a modal (Options → Search history) to re-apply them.
 * Fully client-side; improves seed/demo exploration while the Worker may be empty or offline.
 * Deduplicates, keeps last 20, shows relative time, supports apply / delete / clear.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-search-history';
  const MAX = 20;
  const MIN_LEN = 2;

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

  function add(query) {
    const q = (query || '').trim();
    if (q.length < MIN_LEN) return;
    let items = load().filter(item => item.q.toLowerCase() !== q.toLowerCase());
    items.unshift({ q, t: Date.now() });
    save(items);
  }

  function remove(query) {
    const q = (query || '').trim().toLowerCase();
    const items = load().filter(item => item.q.toLowerCase() !== q);
    save(items);
  }

  function clear() {
    if (!confirm('Clear all search history?')) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Search history cleared', 'info');
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

  function apply(query) {
    const input = document.getElementById('search-input');
    if (!input) return;
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    close();
    if (global.FD_TOAST) global.FD_TOAST.show('Applied search: ' + query, 'success');
  }

  function render() {
    const modal = document.getElementById('searchhistory-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (!content) return;
    const items = load();
    const listHtml = items.length
      ? items.map(item => `
          <div class="history-item">
            <div class="history-head">
              <strong>${escapeHtml(item.q)}</strong>
              <span class="muted small">${relativeTime(item.t)}</span>
            </div>
            <div class="history-actions">
              <button type="button" class="small-btn apply-history" data-q="${escapeHtml(item.q)}">Apply</button>
              <button type="button" class="small-btn delete-history" data-q="${escapeHtml(item.q)}">Delete</button>
            </div>
          </div>`).join('')
      : '<p class="muted">No search history yet. Type a query in the top search bar (2+ characters) to start tracking.</p>';

    content.innerHTML = `
      <button type="button" id="close-searchhistory-btn" class="close-modal">×</button>
      <h3>Search history</h3>
      <p class="small muted">Recent queries from the top-bar search. Click Apply to re-run. Stored only in this browser.</p>
      <div class="history-list">${listHtml}</div>
      ${items.length ? '<button type="button" id="clear-searchhistory-btn" class="small-btn" style="margin-top:0.75rem">Clear all</button>' : ''}
    `;

    content.querySelector('#close-searchhistory-btn')?.addEventListener('click', close);
    content.querySelector('#clear-searchhistory-btn')?.addEventListener('click', clear);
    content.querySelectorAll('.apply-history').forEach(btn => {
      btn.addEventListener('click', () => apply(btn.dataset.q));
    });
    content.querySelectorAll('.delete-history').forEach(btn => {
      btn.addEventListener('click', () => {
        remove(btn.dataset.q);
        render();
        if (global.FD_TOAST) global.FD_TOAST.show('Removed from history', 'info');
      });
    });
  }

  function open() {
    render();
    document.getElementById('searchhistory-modal')?.classList.add('open');
  }

  function close() {
    document.getElementById('searchhistory-modal')?.classList.remove('open');
  }

  function bind() {
    // Track on input with debounce so we capture meaningful queries without spamming
    const input = document.getElementById('search-input');
    if (input) {
      let timer = null;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const q = (input.value || '').trim();
          if (q.length >= MIN_LEN) add(q);
        }, 900);
      });
      // Also track on Enter for immediate intent
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = (input.value || '').trim();
          if (q.length >= MIN_LEN) add(q);
        }
      });
    }

    document.getElementById('searchhistory-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'searchhistory-modal') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  global.FD_SEARCHHISTORY = { open, close, bind, add };
})(window);
