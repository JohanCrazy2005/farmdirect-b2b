/**
 * FarmDirect B2B – demo status inspector
 * Surfaces local demo overrides vs pure seed data so users can see what has changed
 * in this browser and selectively revert individual listings.
 * Fully client-side; improves seed/demo fallback clarity while the Worker may be empty or offline.
 * Does not invent product features.
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function buildDiff() {
    const demoInfo = (global.FD_API && typeof global.FD_API.getDemoInfo === 'function')
      ? global.FD_API.getDemoInfo() : { hasDemo: false, count: 0 };
    const current = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? (global.FD_LIST.getListings() || []) : [];
    let seed = [];
    if (global.FD_API && typeof global.FD_API.loadSeedListings === 'function') {
      seed = await global.FD_API.loadSeedListings();
    }
    const seedById = new Map(seed.map(l => [l.id, l]));
    const currentById = new Map(current.map(l => [l.id, l]));

    const added = [];
    const modified = [];
    const removed = [];

    current.forEach(l => {
      if (!seedById.has(l.id)) {
        added.push(l);
      } else {
        const orig = seedById.get(l.id);
        const changed = JSON.stringify(orig) !== JSON.stringify(l);
        if (changed) modified.push({ current: l, original: orig });
      }
    });

    seed.forEach(l => {
      if (!currentById.has(l.id)) removed.push(l);
    });

    return { demoInfo, added, modified, removed, seedCount: seed.length, currentCount: current.length };
  }

  function renderItem(label, listing, extra) {
    return `
      <div class="demo-diff-item" data-id="${escapeHtml(listing.id)}">
        <div class="demo-diff-head">
          <strong>${escapeHtml(listing.headerdescription || listing.id)}</strong>
          <span class="small muted">${escapeHtml(listing.category || '')} · ${escapeHtml(listing.sellerid || '')}</span>
        </div>
        <div class="demo-diff-meta small">${escapeHtml(label)}${extra || ''}</div>
        <div class="demo-diff-actions">
          <button type="button" class="small-btn demo-revert-btn" data-id="${escapeHtml(listing.id)}">Revert to seed</button>
          <button type="button" class="small-btn demo-view-btn" data-id="${escapeHtml(listing.id)}">View</button>
        </div>
      </div>
    `;
  }

  async function open() {
    const modal = document.getElementById('demostatus-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;

    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-demostatus-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }

    const wrap = document.createElement('div');
    wrap.innerHTML = '<p class="small muted">Loading demo status…</p>';
    content.appendChild(wrap);
    modal.classList.add('open');

    const diff = await buildDiff();
    const { demoInfo, added, modified, removed, seedCount, currentCount } = diff;

    let html = `
      <h3>Demo status</h3>
      <p class="small muted">Local overrides in this browser. Pure seed has ${seedCount} listings; current view has ${currentCount}.</p>
      <p class="small">Local demo overrides: <strong>${demoInfo.count || 0}</strong> ${demoInfo.hasDemo ? '(stored in localStorage)' : '(none)'}</p>
    `;

    if (!demoInfo.hasDemo && !added.length && !modified.length && !removed.length) {
      html += '<p>No local changes detected. You are viewing pure seed data (or live API).</p>';
    } else {
      if (added.length) {
        html += `<h4>Added locally (${added.length})</h4>`;
        added.forEach(l => { html += renderItem('Demo-only listing', l); });
      }
      if (modified.length) {
        html += `<h4>Modified from seed (${modified.length})</h4>`;
        modified.forEach(({ current: l }) => { html += renderItem('Changed from original seed', l); });
      }
      if (removed.length) {
        html += `<h4>Missing from current view (${removed.length})</h4>`;
        removed.forEach(l => { html += renderItem('Present in seed but not in current view', l, ' — may have been deleted locally'); });
      }
    }

    html += `
      <div class="onboarding-actions" style="margin-top:12px;">
        <button type="button" id="demostatus-force-seed" class="small-btn primary">Load pure seed data</button>
        <button type="button" id="demostatus-export" class="small-btn">Export current as demo</button>
      </div>
      <p class="small muted" style="margin-top:8px;">Reverting a listing restores the original seed version (or removes a demo-only item). Changes stay in this browser until you reset.</p>
    `;

    wrap.innerHTML = html;

    // Wire actions
    wrap.querySelectorAll('.demo-revert-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!id) return;
        if (!confirm('Revert this listing to the pure seed version (or remove if demo-only)?')) return;
        await revertOne(id);
        if (global.FD_TOAST) global.FD_TOAST.show('Listing reverted', 'success');
        // Refresh list and re-open
        if (global.FD_LIST && typeof global.FD_LIST.setListings === 'function' && global.FD_API) {
          const result = await global.FD_API.fetchListings();
          global.FD_LIST.setListings(result.listings || []);
        }
        open();
      });
    });

    wrap.querySelectorAll('.demo-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
          close();
        }
      });
    });

    wrap.querySelector('#demostatus-force-seed')?.addEventListener('click', () => {
      if (confirm('Clear all local demo overrides and load pure seed data?')) {
        if (global.FD_API && global.FD_API.resetDemoListings) global.FD_API.resetDemoListings();
        if (global.FD_TOAST) global.FD_TOAST.show('Loading pure seed data…', 'info');
        close();
        // Trigger reload via main if available
        if (typeof global.loadAndRender === 'function') global.loadAndRender();
        else location.reload();
      }
    });

    wrap.querySelector('#demostatus-export')?.addEventListener('click', async () => {
      if (global.FD_API && global.FD_API.exportDemoData) {
        const res = await global.FD_API.exportDemoData();
        if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? `Exported ${res.count} listings` : (res.error || 'Export failed'), res.ok ? 'success' : 'error');
      }
    });
  }

  async function revertOne(id) {
    if (!global.FD_API) return;
    const seed = await global.FD_API.loadSeedListings();
    const orig = seed.find(l => l.id === id);
    const current = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    let next = current.slice();
    if (orig) {
      // Restore original
      const idx = next.findIndex(l => l.id === id);
      if (idx >= 0) next[idx] = JSON.parse(JSON.stringify(orig));
      else next.push(JSON.parse(JSON.stringify(orig)));
    } else {
      // Demo-only: remove
      next = next.filter(l => l.id !== id);
    }
    global.FD_API.saveDemoListings(next);
  }

  function close() {
    document.getElementById('demostatus-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('open-demostatus')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      menu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      open();
    });
    document.getElementById('close-demostatus-btn')?.addEventListener('click', close);
  }

  global.FD_DEMOSTATUS = { open, close, bind };
})(window);
