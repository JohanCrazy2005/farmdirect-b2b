/**
 * FarmDirect B2B – filter presets
 * Save and reload named filter combinations (category, seller, price range, nearby, etc.)
 * in localStorage. Improves seed/demo exploration UX while the Worker may be empty or offline.
 * Fully client-side; no new product features.
 */
(function (global) {
  'use strict';

  const KEY = 'fd-presets';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadPresets() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function savePresets(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function getCurrentParams() {
    const p = {};
    const q = document.getElementById('search-input')?.value.trim();
    if (q) p.q = q;
    const cat = document.getElementById('filter-category')?.value;
    if (cat) p.cat = cat;
    const seller = document.getElementById('filter-seller')?.value;
    if (seller) p.seller = seller;
    const vis = document.getElementById('filter-visibility')?.value;
    if (vis) p.vis = vis;
    const units = document.getElementById('filter-units')?.value;
    if (units) p.units = units;
    const min = document.getElementById('filter-min-price')?.value;
    if (min !== '' && min != null) p.min = min;
    const max = document.getElementById('filter-max-price')?.value;
    if (max !== '' && max != null) p.max = max;
    if (document.getElementById('filter-favorites')?.checked) p.fav = '1';
    if (document.getElementById('nearby-btn')?.classList.contains('active')) p.nearby = '1';
    if (document.getElementById('filter-in-view')?.checked) p.inview = '1';
    const sort = document.getElementById('sort-select')?.value;
    if (sort && sort !== 'default') p.sort = sort;
    return p;
  }

  function paramsToSearch(params) {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v != null && v !== '') usp.set(k, String(v));
    });
    return usp;
  }

  function applyParams(params) {
    if (global.FD_LIST && typeof global.FD_LIST.applyFiltersFromParams === 'function') {
      global.FD_LIST.applyFiltersFromParams(paramsToSearch(params));
      if (global.FD_TOAST) global.FD_TOAST.show('Preset applied', 'success');
    } else {
      if (global.FD_TOAST) global.FD_TOAST.show('List module not ready', 'error');
    }
  }

  function render(presets) {
    if (!presets.length) {
      return `
        <h3>Filter presets</h3>
        <p>No saved presets yet. Apply some filters, then save the current combination for quick reuse while exploring seed/demo data.</p>
        <p class="small muted">Presets are stored only in this browser (localStorage).</p>
      `;
    }
    let html = `
      <h3>Filter presets</h3>
      <p>${presets.length} saved preset(s). Click Apply to restore the filters, or Delete to remove.</p>
    `;
    presets.forEach(pr => {
      const summary = Object.entries(pr.params || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') || '(empty)';
      html += `
        <div class="preset-item">
          <div class="preset-head">
            <strong>${escapeHtml(pr.name)}</strong>
            <span class="small muted">${escapeHtml(pr.created || '')}</span>
          </div>
          <div class="preset-summary small muted">${escapeHtml(summary)}</div>
          <div class="preset-actions">
            <button type="button" class="small-btn primary preset-apply" data-id="${escapeHtml(pr.id)}">Apply</button>
            <button type="button" class="small-btn preset-delete" data-id="${escapeHtml(pr.id)}">Delete</button>
          </div>
        </div>
      `;
    });
    return html;
  }

  function open() {
    const modal = document.getElementById('presets-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;

    const presets = loadPresets();
    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-presets-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }

    const wrap = document.createElement('div');
    wrap.innerHTML = render(presets) + `
      <div class="preset-save" style="margin-top:14px; border-top:1px solid var(--border); padding-top:10px;">
        <label class="small">Save current filters as
          <input type="text" id="preset-name-input" placeholder="e.g. Nearby vegetables" style="width:100%; margin-top:4px; height:36px; border:1px solid var(--border); border-radius:8px; padding:0 10px; background:var(--surface); color:var(--fg);">
        </label>
        <button type="button" id="save-preset-btn" class="small-btn primary" style="margin-top:8px;">Save current</button>
      </div>
    `;
    content.appendChild(wrap);
    modal.classList.add('open');

    wrap.querySelectorAll('.preset-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const pr = loadPresets().find(p => p.id === id);
        if (pr) {
          applyParams(pr.params);
          close();
        }
      });
    });
    wrap.querySelectorAll('.preset-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Delete this preset?')) {
          const next = loadPresets().filter(p => p.id !== id);
          savePresets(next);
          open();
          if (global.FD_TOAST) global.FD_TOAST.show('Preset deleted', 'info');
        }
      });
    });

    const saveBtn = wrap.querySelector('#save-preset-btn');
    const nameInput = wrap.querySelector('#preset-name-input');
    saveBtn?.addEventListener('click', () => {
      const name = (nameInput?.value || '').trim();
      if (!name) {
        if (global.FD_TOAST) global.FD_TOAST.show('Please enter a name', 'error');
        return;
      }
      const params = getCurrentParams();
      if (!Object.keys(params).length) {
        if (global.FD_TOAST) global.FD_TOAST.show('No active filters to save', 'info');
        return;
      }
      const presets = loadPresets();
      const id = 'p' + Date.now();
      presets.unshift({
        id,
        name,
        params,
        created: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });
      savePresets(presets);
      if (global.FD_TOAST) global.FD_TOAST.show(`Saved preset “${name}”`, 'success');
      open();
    });
  }

  function close() {
    document.getElementById('presets-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('open-presets')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      menu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      open();
    });
    document.getElementById('close-presets-btn')?.addEventListener('click', close);
    document.getElementById('presets-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'presets-modal') close();
    });
  }

  global.FD_PRESETS = { open, close, bind };
})(window);
