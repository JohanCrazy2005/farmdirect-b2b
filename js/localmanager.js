/**
 * FarmDirect B2B – local data manager
 * Surfaces and lets users clear specific localStorage keys used by the app
 * (demo listings, favorites, map view, theme, RFQs, etc.).
 * Improves seed/demo fallback UX by making local state inspectable and resettable
 * without inventing new product features.
 * Fully client-side.
 */
(function (global) {
  'use strict';

  const KNOWN_KEYS = [
    { key: 'fd-demo-listings', label: 'Demo listings overrides', desc: 'Local edits that override seed data' },
    { key: 'fd-data-source', label: 'Data source flag', desc: 'Last known source (demo/seed/api)' },
    { key: 'fd-favorites', label: 'Favorites', desc: 'Starred listing IDs' },
    { key: 'fd-map-view', label: 'Map view', desc: 'Saved center + zoom' },
    { key: 'fd-user-location', label: 'User location', desc: 'Last Locate me position' },
    { key: 'fd-theme', label: 'Theme', desc: 'Light / dark preference' },
    { key: 'fd-api-base', label: 'API base override', desc: 'Custom Worker URL' },
    { key: 'fd-rfqs', label: 'Local RFQs', desc: 'Demo quote requests' },
    { key: 'fd-onboarding-seen', label: 'Onboarding seen', desc: 'Welcome tour dismissed flag' },
    { key: 'fd-banner-dismissed', label: 'Offline banner dismissed', desc: 'Seed/demo banner hidden until cleared' },
  ];

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function getSize(val) {
    if (val == null) return '0 B';
    const bytes = new Blob([val]).size;
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function collectKeys() {
    const items = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('fd-')) {
          const known = KNOWN_KEYS.find(x => x.key === k);
          const raw = localStorage.getItem(k);
          items.push({
            key: k,
            label: known ? known.label : k,
            desc: known ? known.desc : 'Unknown app key',
            size: getSize(raw),
            preview: raw ? raw.slice(0, 80) + (raw.length > 80 ? '…' : '') : '',
          });
        }
      }
    } catch (_) {}
    // Ensure known keys appear even if empty
    KNOWN_KEYS.forEach(known => {
      if (!items.some(it => it.key === known.key)) {
        items.push({
          key: known.key,
          label: known.label,
          desc: known.desc,
          size: '0 B',
          preview: '(not set)',
          empty: true,
        });
      }
    });
    return items.sort((a, b) => a.key.localeCompare(b.key));
  }

  function render() {
    const items = collectKeys();
    let html = `
      <h3>Local data</h3>
      <p class="small muted">Keys stored in this browser for seed/demo UX. Clearing a key removes only that data; the app falls back to defaults or pure seed.</p>
    `;
    items.forEach(it => {
      html += `
        <div class="local-item" data-key="${escapeHtml(it.key)}">
          <div class="local-head">
            <strong>${escapeHtml(it.label)}</strong>
            <span class="small muted">${escapeHtml(it.key)} · ${escapeHtml(it.size)}</span>
          </div>
          <div class="small muted">${escapeHtml(it.desc)}</div>
          ${it.preview && !it.empty ? `<div class="local-preview small">${escapeHtml(it.preview)}</div>` : ''}
          <div class="local-actions">
            <button type="button" class="small-btn local-clear-btn" data-key="${escapeHtml(it.key)}" ${it.empty ? 'disabled' : ''}>Clear</button>
          </div>
        </div>
      `;
    });
    html += `
      <div class="onboarding-actions" style="margin-top:14px;">
        <button type="button" id="local-clear-all" class="small-btn primary">Clear all local data</button>
        <button type="button" id="local-reload" class="small-btn">Reload page</button>
      </div>
      <p class="small muted" style="margin-top:8px;">Clearing demo listings restores pure seed on next load. Favorites, map view, and theme reset to defaults.</p>
    `;
    return html;
  }

  function clearKey(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function open() {
    const modal = document.getElementById('localmanager-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;

    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-localmanager-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }

    const wrap = document.createElement('div');
    wrap.innerHTML = render();
    content.appendChild(wrap);
    modal.classList.add('open');

    wrap.querySelectorAll('.local-clear-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (!key || !confirm(`Clear "${key}" from this browser?`)) return;
        if (clearKey(key)) {
          if (global.FD_TOAST) global.FD_TOAST.show(`Cleared ${key}`, 'success');
          open(); // refresh
        }
      });
    });

    wrap.querySelector('#local-clear-all')?.addEventListener('click', () => {
      if (!confirm('Clear ALL FarmDirect local data (demo listings, favorites, map view, theme, RFQs, etc.)? This cannot be undone.')) return;
      const keys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('fd-')) keys.push(k);
        }
      } catch (_) {}
      keys.forEach(clearKey);
      if (global.FD_TOAST) global.FD_TOAST.show('All local data cleared', 'success');
      close();
      setTimeout(() => location.reload(), 400);
    });

    wrap.querySelector('#local-reload')?.addEventListener('click', () => {
      close();
      location.reload();
    });
  }

  function close() {
    document.getElementById('localmanager-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('open-localmanager')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      menu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      open();
    });
    document.getElementById('close-localmanager-btn')?.addEventListener('click', close);
  }

  global.FD_LOCALMANAGER = { open, close, bind };
})(window);
