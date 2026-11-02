/**
 * FarmDirect B2B – saved map views
 * Save the current map center/zoom plus the active filter set as a named view
 * in localStorage (fd-mapviews). Restore later from the Options menu.
 * Complements filter presets (filters only) and shareable map-view links.
 * Fully client-side; improves map-first exploration in seed/demo mode while
 * the Worker may be empty or offline. Keeps last 20 views.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-mapviews';
  const MAX = 20;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function captureCurrent() {
    const map = (global.FD_MAP && typeof global.FD_MAP.getMap === 'function')
      ? global.FD_MAP.getMap() : null;
    if (!map || typeof map.getCenter !== 'function') return null;
    const c = map.getCenter();
    const z = map.getZoom();
    let filters = '';
    if (global.FD_LIST && typeof global.FD_LIST.getFilteredViewLink === 'function') {
      const link = global.FD_LIST.getFilteredViewLink() || '';
      const hash = link.split('#')[1] || '';
      filters = hash;
    }
    return {
      lat: Number(c.lat.toFixed(5)),
      lng: Number(c.lng.toFixed(5)),
      zoom: z,
      filters
    };
  }

  function filterSummary(filters) {
    if (!filters) return 'no filters';
    const p = new URLSearchParams(filters);
    const parts = [];
    if (p.get('q')) parts.push('q=' + p.get('q'));
    if (p.get('cat') || p.get('category')) parts.push('cat=' + (p.get('cat') || p.get('category')));
    if (p.get('seller')) parts.push('seller');
    if (p.get('vis') || p.get('visibility')) parts.push('vis');
    if (p.get('units')) parts.push('units');
    if (p.get('min')) parts.push('min');
    if (p.get('max')) parts.push('max');
    if (p.get('fav') === '1') parts.push('favorites');
    if (p.get('nearby') === '1') parts.push('nearby');
    if (p.get('inview') === '1') parts.push('in-view');
    if (p.get('sort') && p.get('sort') !== 'default') parts.push('sort');
    return parts.length ? parts.join(', ') : 'no filters';
  }

  function applyView(view) {
    const map = (global.FD_MAP && typeof global.FD_MAP.getMap === 'function')
      ? global.FD_MAP.getMap() : null;
    if (map && view.lat != null && view.lng != null) {
      map.setView([view.lat, view.lng], view.zoom || map.getZoom());
    }
    if (view.filters && global.FD_LIST && typeof global.FD_LIST.applyFiltersFromParams === 'function') {
      const params = new URLSearchParams(view.filters);
      global.FD_LIST.applyFiltersFromParams(params);
    }
    close();
    if (global.FD_TOAST) global.FD_TOAST.show('Restored map view: ' + (view.name || ''), 'success');
  }

  function saveCurrent(name) {
    const n = (name || '').trim();
    if (!n) {
      if (global.FD_TOAST) global.FD_TOAST.show('Name required', 'error');
      return;
    }
    const captured = captureCurrent();
    if (!captured) {
      if (global.FD_TOAST) global.FD_TOAST.show('Map not ready', 'error');
      return;
    }
    let items = load().filter(item => item.name.toLowerCase() !== n.toLowerCase());
    items.unshift({
      name: n,
      t: Date.now(),
      lat: captured.lat,
      lng: captured.lng,
      zoom: captured.zoom,
      filters: captured.filters
    });
    save(items);
    if (global.FD_TOAST) global.FD_TOAST.show('Saved map view: ' + n, 'success');
    render();
  }

  function remove(name) {
    const n = (name || '').trim().toLowerCase();
    const items = load().filter(item => item.name.toLowerCase() !== n);
    save(items);
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Removed map view', 'info');
  }

  function clearAll() {
    if (!confirm('Clear all saved map views?')) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
    render();
    if (global.FD_TOAST) global.FD_TOAST.show('Map views cleared', 'info');
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

  function render() {
    const modal = document.getElementById('mapviews-modal');
    if (!modal) return;
    const content = modal.querySelector('.modal-content');
    if (!content) return;
    const items = load();
    const listHtml = items.length
      ? items.map(item => `
          <div class="mapview-item">
            <div class="mapview-head">
              <strong>${escapeHtml(item.name)}</strong>
              <span class="muted small">${relativeTime(item.t)}</span>
            </div>
            <div class="mapview-meta muted small">
              ${item.lat}, ${item.lng} · z${item.zoom} · ${escapeHtml(filterSummary(item.filters))}
            </div>
            <div class="mapview-actions">
              <button type="button" class="small-btn apply-mapview" data-name="${escapeHtml(item.name)}">Apply</button>
              <button type="button" class="small-btn delete-mapview" data-name="${escapeHtml(item.name)}">Delete</button>
            </div>
          </div>`).join('')
      : '<p class="muted">No saved map views yet. Pan/zoom the map (and optionally apply filters), then save the current view below.</p>';

    content.innerHTML = `
      <button type="button" id="close-mapviews-btn" class="close-modal">×</button>
      <h3>Map views</h3>
      <p class="small muted">Named snapshots of map position + current filters. Stored only in this browser. Complements Filter presets and shareable links.</p>
      <form id="mapview-save-form" class="mapview-create" style="display:flex;gap:0.5rem;margin:0.75rem 0 1rem">
        <input type="text" id="mapview-name" placeholder="Name this view…" maxlength="40" style="flex:1;height:36px;border:1px solid var(--border);border-radius:8px;padding:0 10px;background:var(--surface);color:var(--fg)">
        <button type="submit" class="small-btn primary">Save current</button>
      </form>
      <div class="mapviews-list">${listHtml}</div>
      ${items.length ? '<button type="button" id="clear-mapviews-btn" class="small-btn" style="margin-top:0.75rem">Clear all</button>' : ''}
    `;

    content.querySelector('#close-mapviews-btn')?.addEventListener('click', close);
    content.querySelector('#clear-mapviews-btn')?.addEventListener('click', clearAll);
    content.querySelector('#mapview-save-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = content.querySelector('#mapview-name')?.value;
      saveCurrent(name);
    });
    content.querySelectorAll('.apply-mapview').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = load().find(i => i.name === btn.dataset.name);
        if (item) applyView(item);
      });
    });
    content.querySelectorAll('.delete-mapview').forEach(btn => {
      btn.addEventListener('click', () => remove(btn.dataset.name));
    });
  }

  function open() {
    render();
    document.getElementById('mapviews-modal')?.classList.add('open');
  }

  function close() {
    document.getElementById('mapviews-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('mapviews-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'mapviews-modal') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  global.FD_MAPVIEWS = { open, close, bind, saveCurrent };
})(window);
