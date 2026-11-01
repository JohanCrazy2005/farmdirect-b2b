/**
 * FarmDirect B2B – seed/demo first-run onboarding
 * Shows a one-time welcome modal when the app is running on seed, demo, or api-empty data.
 * Explains the map-first shell, local demo edits, data-source indicators, and next optional deploy steps.
 * Fully client-side; no new product features. Improves seed/demo fallback clarity for new visitors.
 */
(function (global) {
  'use strict';

  const FLAG_KEY = 'fd-seed-onboarded';

  function hasSeen() {
    try { return localStorage.getItem(FLAG_KEY) === '1'; } catch (_) { return false; }
  }

  function markSeen() {
    try { localStorage.setItem(FLAG_KEY, '1'); } catch (_) {}
  }

  function welcomeHtml() {
    return `
      <h3>Welcome to FarmDirect B2B</h3>
      <p class="small muted">You are viewing local seed or demo data. The live Worker is optional and the full map-first marketplace works offline.</p>
      <h4>Quick start</h4>
      <ul class="small">
        <li>Explore markers on the map (colored by category). Click a marker or list item to open the product card.</li>
        <li>Use the filter icon (⚙) or sidebar tools (Nearby, Favorites, Sort, Group by seller).</li>
        <li>Try <strong>Add listing</strong> or <strong>Sample listing</strong> in Options — changes stay in this browser only.</li>
        <li>The top-bar badge and banner show SEED / DEMO / API-EMPTY. Click them or use <strong>Details</strong> / <strong>Retry live</strong>.</li>
      </ul>
      <h4>Local demo &amp; exports</h4>
      <ul class="small">
        <li>Publish/unpublish works locally. Use <strong>Export demo</strong>, <strong>Download backup</strong>, or <strong>Import demo backup</strong>.</li>
        <li><strong>Load pure seed data</strong> clears local overrides and restores the original seed file.</li>
        <li>Share the current filtered view or map position via the Options menu links.</li>
      </ul>
      <p class="small">Open <strong>Seed/demo tips</strong> in Options anytime for the full guided overview. When the Worker has published listings the banner hides and the badge becomes LIVE.</p>
      <div class="onboarding-actions">
        <button type="button" id="onboarding-gotit" class="small-btn primary">Got it — start exploring</button>
        <button type="button" id="onboarding-tips" class="small-btn">Open tips</button>
      </div>
    `;
  }

  function open() {
    const modal = document.getElementById('onboarding-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;
    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-onboarding-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = welcomeHtml();
    content.appendChild(wrap);

    wrap.querySelector('#onboarding-gotit')?.addEventListener('click', () => {
      markSeen();
      close();
    });
    wrap.querySelector('#onboarding-tips')?.addEventListener('click', () => {
      markSeen();
      close();
      if (global.FD_SEEDTIPS && typeof global.FD_SEEDTIPS.open === 'function') {
        global.FD_SEEDTIPS.open();
      }
    });

    modal.classList.add('open');
  }

  function close() {
    document.getElementById('onboarding-modal')?.classList.remove('open');
  }

  /**
   * Show once after listings load when the source is not live API.
   * Called from main.js after showBanner.
   */
  function maybeShow(source) {
    if (hasSeen()) return;
    if (source === 'api') return;
    // Small delay so the map and banner settle
    setTimeout(() => {
      if (hasSeen()) return;
      open();
    }, 600);
  }

  function bind() {
    document.getElementById('close-onboarding-btn')?.addEventListener('click', close);
    // Outside-click handled by main.js modal closer once id is registered
  }

  global.FD_ONBOARDING = { open, close, maybeShow, bind, markSeen };
})(window);
