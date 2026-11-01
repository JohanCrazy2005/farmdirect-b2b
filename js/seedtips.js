/**
 * FarmDirect B2B – seed/demo tips module
 * In-app guidance for exploring the map-first marketplace while the Worker is undeployed,
 * empty, or offline. Covers seed data, local demo overrides, filters, share links, and exports.
 * Fully client-side; no new features beyond UX polish for the existing seed fallback.
 */
(function (global) {
  'use strict';

  function tipsHtml() {
    return `
      <h3>Seed &amp; demo tips</h3>
      <p class="small muted">You are viewing local seed or demo data. The live Worker is optional.</p>
      <h4>Explore the map</h4>
      <ul class="small">
        <li>Markers are colored by category. Click a legend item to filter.</li>
        <li>Use <strong>Locate</strong>, <strong>Nearby</strong>, or <strong>Fit map</strong> in the sidebar.</li>
        <li>Hover or click a marker to open the product card and fly the map.</li>
        <li>Share the current view with the map link or filtered-view link in Options.</li>
      </ul>
      <h4>Filter &amp; sort</h4>
      <ul class="small">
        <li>Open the filter card (gear icon) for category, seller, visibility, price, favorites, and “only in view”.</li>
        <li>Removable chips appear under the sidebar tools.</li>
        <li>Sort by price or distance (after Locate).</li>
        <li>Group by seller for a directory-style list.</li>
      </ul>
      <h4>Local demo edits</h4>
      <ul class="small">
        <li>Use <strong>Add listing</strong> or <strong>Sample listing</strong> (Options) to create drafts stored only in this browser.</li>
        <li>Publish/unpublish works locally. Changes persist until you reset or force pure seed.</li>
        <li><strong>Export demo</strong> / <strong>Download backup</strong> / <strong>Import demo backup</strong> for portable JSON.</li>
        <li><strong>Load pure seed data</strong> clears local overrides and reloads the original seed file.</li>
      </ul>
      <h4>Data source</h4>
      <ul class="small">
        <li>The top-bar badge and banner show SEED / DEMO / API-EMPTY.</li>
        <li>Click the badge or <strong>Details</strong> for health, last check, and override count.</li>
        <li><strong>Retry live</strong> re-probes the Worker without a full page reload.</li>
        <li>Deploy steps (banner or Options) list the optional RFQ migration and GitHub Actions secrets.</li>
      </ul>
      <p class="small">All of the above works fully offline. When the Worker has published listings the banner hides and the badge becomes LIVE.</p>
    `;
  }

  function open() {
    const modal = document.getElementById('seedtips-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;
    // Preserve close button; replace rest
    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-seedtips-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = tipsHtml();
    content.appendChild(wrap);
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('seedtips-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('open-seedtips')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      menu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      open();
    });
    document.getElementById('close-seedtips-btn')?.addEventListener('click', close);
    // Click outside handled by main.js modal closer once id is registered
  }

  global.FD_SEEDTIPS = { open, close, bind };
})(window);
