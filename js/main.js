/**
 * FarmDirect B2B – main bootstrap
 * Wires map, list, search, filters, offline banner, data-source badge,
 * options, dashboard, auth, theme, and modals. Loads listings via FD_API
 * (live or seed/demo fallback). Fully client-side; works when Worker is undeployed.
 * Seed/demo polish: badge opens details; banner dismiss persists per source.
 * Data-source modal now includes actionable next-step buttons for seed/demo UX.
 */
(function (global) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let currentSource = 'seed';

  function isBannerDismissed(source) {
    try {
      const raw = localStorage.getItem('fd-banner-dismissed');
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data && data.source === source;
    } catch (_) { return false; }
  }

  function setBannerDismissed(source) {
    try {
      localStorage.setItem('fd-banner-dismissed', JSON.stringify({ source, at: Date.now() }));
    } catch (_) {}
  }

  function clearBannerDismissed() {
    try { localStorage.removeItem('fd-banner-dismissed'); } catch (_) {}
  }

  function showBanner(source, health) {
    currentSource = source || 'seed';
    const banner = $('offline-banner');
    const text = $('offline-banner-text');
    if (!banner || !text) return;
    if (source === 'api') {
      banner.hidden = true;
      clearBannerDismissed();
      return;
    }
    if (isBannerDismissed(source)) {
      banner.hidden = true;
      return;
    }
    let msg = 'Using seed listings (Worker offline or undeployed). Demo changes persist locally.';
    if (source === 'demo') msg = 'Using local demo listings. Changes persist in this browser until reset or live publish.';
    else if (source === 'api-empty') msg = 'Worker is reachable but has no published listings yet. Showing seed data so the map stays usable.';
    else if (source === 'seed') msg = 'Using seed listings (Worker offline or undeployed). Demo changes persist locally.';
    text.textContent = msg;
    banner.hidden = false;
  }

  function updateBadge(source) {
    const badge = $('data-source-badge');
    if (!badge) return;
    badge.hidden = false;
    badge.className = 'data-source-badge source-' + (source || 'seed');
    const labels = { api: 'LIVE', 'api-empty': 'EMPTY', seed: 'SEED', demo: 'DEMO' };
    badge.textContent = labels[source] || 'SEED';
    badge.title = 'Data source: ' + (source || 'seed') + ' (click for details)';
  }

  function openDatasourceModal() {
    const modal = $('datasource-modal');
    const content = $('datasource-content');
    if (!content) return;
    const src = currentSource;
    let html = '<p>Data is loaded from the live Worker when reachable, otherwise from <code>data/seed-listings.json</code> or local demo storage (localStorage).</p>';
    if (src === 'api') {
      html += '<p><strong>Current:</strong> Live published listings from the Worker.</p>';
    } else if (src === 'api-empty') {
      html += '<p><strong>Current:</strong> Worker reachable but empty. Seed data is shown so the map stays usable.</p><p class="muted small">Next: register, create a draft, then publish from the dashboard so it appears on the live map.</p>';
    } else if (src === 'demo') {
      html += '<p><strong>Current:</strong> Local demo listings (your edits persist in this browser).</p><p class="muted small">Next: use Export/Download in Options to back up, or Reset to return to seed. Publish via dashboard once the Worker is fully live.</p>';
    } else {
      html += '<p><strong>Current:</strong> Seed listings (Worker offline or undeployed).</p><p class="muted small">Next: see Deploy steps for wrangler commands. Auth migration is already applied; optional RFQ migration remains user-owned. Changes you make can be saved as demo data.</p>';
    }
    html += '<div class="card-actions" style="margin-top:0.75rem;flex-wrap:wrap;gap:0.4rem">';
    if (src !== 'api') {
      html += '<button type="button" class="small-btn" id="ds-open-dashboard">Open dashboard</button>';
      html += '<button type="button" class="small-btn" id="ds-show-deploy">Deploy steps</button>';
    }
    if (src === 'demo' || src === 'seed' || src === 'api-empty') {
      html += '<button type="button" class="small-btn" id="ds-export-demo">Export demo</button>';
      html += '<button type="button" class="small-btn" id="ds-download-demo">Download backup</button>';
    }
    if (src === 'demo') {
      html += '<button type="button" class="small-btn" id="ds-reset-demo">Reset to seed</button>';
    }
    html += '</div>';
    html += '<p class="muted small" style="margin-top:0.75rem">See README for deploy and migration steps. Auth migration is already applied; optional RFQ migration + GitHub Actions secrets remain user-owned.</p>';
    content.innerHTML = html;

    // Wire action buttons
    content.querySelector('#ds-open-dashboard')?.addEventListener('click', () => {
      modal?.classList.remove('open');
      global.FD_DASHBOARD?.open?.() || global.FD_AUTH?.open?.();
    });
    content.querySelector('#ds-show-deploy')?.addEventListener('click', () => {
      modal?.classList.remove('open');
      $('deploy-modal')?.classList.add('open');
    });
    content.querySelector('#ds-export-demo')?.addEventListener('click', async () => {
      const r = await global.FD_API?.exportDemoData?.();
      if (global.FD_TOAST) global.FD_TOAST.show(r?.ok ? `Exported ${r.count} listings to demo` : (r?.error || 'Export failed'), r?.ok ? 'success' : 'error');
    });
    content.querySelector('#ds-download-demo')?.addEventListener('click', () => {
      const r = global.FD_API?.downloadDemoBackup?.();
      if (global.FD_TOAST) global.FD_TOAST.show(r?.ok ? 'Demo backup downloaded' : (r?.error || 'Download failed'), r?.ok ? 'success' : 'error');
    });
    content.querySelector('#ds-reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset local demo listings and reload seed?')) {
        global.FD_API?.resetDemoListings?.();
        clearBannerDismissed();
        modal?.classList.remove('open');
        loadAndRender();
      }
    });

    modal?.classList.add('open');
  }

  async function loadAndRender() {
    if (global.FD_TOAST) global.FD_TOAST.show('Loading listings…', 'info');
    const result = await (global.FD_API && global.FD_API.fetchListings ? global.FD_API.fetchListings() : Promise.resolve({ listings: [], source: 'seed' }));
    const listings = result.listings || [];
    const source = result.source || 'seed';

    if (global.FD_LIST && typeof global.FD_LIST.setListings === 'function') {
      global.FD_LIST.setListings(listings);
    }
    if (global.FD_MAP && typeof global.FD_MAP.updateMarkers === 'function') {
      global.FD_MAP.updateMarkers(listings);
    }

    showBanner(source, result.health);
    updateBadge(source);

    // Populate filter dropdowns from data
    populateFilterOptions(listings);

    if (global.FD_TOAST) {
      const msg = source === 'api' ? `Loaded ${listings.length} live listings` :
                  source === 'demo' ? `Loaded ${listings.length} demo listings` :
                  source === 'api-empty' ? `Worker empty — showing ${listings.length} seed listings` :
                  `Loaded ${listings.length} seed listings`;
      global.FD_TOAST.show(msg, 'success');
    }
  }

  function populateFilterOptions(listings) {
    const cats = new Set();
    const units = new Set();
    const sellers = new Set();
    (listings || []).forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.units) units.add(l.units);
      if (l.sellerid) sellers.add(l.sellerid);
    });

    const catSel = $('filter-category');
    if (catSel) {
      const current = catSel.value;
      catSel.innerHTML = '<option value="">All</option>' + Array.from(cats).sort().map(c => `<option value="${c}">${c}</option>`).join('');
      if (current) catSel.value = current;
    }
    const unitSel = $('filter-units');
    if (unitSel) {
      const current = unitSel.value;
      unitSel.innerHTML = '<option value="">Any</option>' + Array.from(units).sort().map(u => `<option value="${u}">${u}</option>`).join('');
      if (current) unitSel.value = current;
    }
    const sellerSel = $('filter-seller');
    if (sellerSel) {
      const current = sellerSel.value;
      const getName = (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName : (id => id);
      sellerSel.innerHTML = '<option value="">Any</option>' + Array.from(sellers).sort().map(s => `<option value="${s}">${getName(s)}</option>`).join('');
      if (current) sellerSel.value = current;
    }
  }

  function wireUI() {
    // Search
    if (global.FD_SEARCH && typeof global.FD_SEARCH.bind === 'function') global.FD_SEARCH.bind();

    // Filter card toggle
    $('filter-btn')?.addEventListener('click', () => {
      const card = $('filter-card');
      if (card) card.hidden = !card.hidden;
      $('filter-btn')?.setAttribute('aria-expanded', card && !card.hidden ? 'true' : 'false');
    });
    $('close-filter-btn')?.addEventListener('click', () => { $('filter-card').hidden = true; });

    // Options menu
    $('options-btn')?.addEventListener('click', () => {
      const menu = $('options-menu');
      if (menu) menu.hidden = !menu.hidden;
    });
    $('close-options-btn')?.addEventListener('click', () => { $('options-menu').hidden = true; });

    // API base save
    $('save-api-base')?.addEventListener('click', () => {
      const val = ($('api-base-input')?.value || '').trim();
      try { localStorage.setItem('fd-api-base', val); } catch (_) {}
      if (global.FD_CONFIG) global.FD_CONFIG.API_BASE = val;
      if (global.FD_TOAST) global.FD_TOAST.show('API base saved. Reloading…', 'info');
      setTimeout(() => location.reload(), 400);
    });

    // Reload
    $('reload-listings-btn')?.addEventListener('click', loadAndRender);

    // Copy links
    $('copy-map-link-btn')?.addEventListener('click', () => {
      const link = (global.FD_MAP && global.FD_MAP.getMapViewLink) ? global.FD_MAP.getMapViewLink() : location.href;
      navigator.clipboard?.writeText(link).then(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Map view link copied', 'success');
      }).catch(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Copy failed', 'error');
      });
    });
    $('copy-filtered-link-btn')?.addEventListener('click', () => {
      const link = (global.FD_LIST && global.FD_LIST.getFilteredViewLink) ? global.FD_LIST.getFilteredViewLink() : location.href;
      navigator.clipboard?.writeText(link).then(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered view link copied', 'success');
      }).catch(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Copy failed', 'error');
      });
    });

    // Other options buttons (delegated to modules if present)
    $('show-recent-btn')?.addEventListener('click', () => global.FD_RECENT?.open?.());
    $('compare-btn')?.addEventListener('click', () => global.FD_COMPARE?.open?.());
    $('sellers-btn')?.addEventListener('click', () => global.FD_SELLERS?.open?.());
    $('my-rfqs-btn')?.addEventListener('click', () => global.FD_RFQ?.openMine?.());
    $('stats-btn')?.addEventListener('click', () => global.FD_STATS?.open?.());
    $('shortcuts-btn')?.addEventListener('click', () => $('shortcuts-modal')?.classList.add('open'));
    $('theme-toggle-btn')?.addEventListener('click', toggleTheme);
    $('export-csv-btn')?.addEventListener('click', () => global.FD_CSV?.exportFiltered?.());
    $('export-geojson-btn')?.addEventListener('click', () => global.FD_GEOJSON?.exportFiltered?.());
    $('export-json-btn')?.addEventListener('click', () => global.FD_LIST?.exportFiltered?.());
    $('clear-favorites-btn')?.addEventListener('click', () => {
      global.FD_LIST?.clearFavorites?.();
      if (global.FD_TOAST) global.FD_TOAST.show('Favorites cleared', 'info');
    });
    $('show-deploy-btn')?.addEventListener('click', () => $('deploy-modal')?.classList.add('open'));
    $('export-demo-btn')?.addEventListener('click', async () => {
      const r = await global.FD_API?.exportDemoData?.();
      if (global.FD_TOAST) global.FD_TOAST.show(r?.ok ? `Exported ${r.count} listings to demo` : (r?.error || 'Export failed'), r?.ok ? 'success' : 'error');
    });
    $('import-demo-btn')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const r = await global.FD_API?.importDemoData?.(text);
        if (r?.ok) {
          if (global.FD_TOAST) global.FD_TOAST.show(`Imported ${r.count} listings`, 'success');
          loadAndRender();
        } else {
          if (global.FD_TOAST) global.FD_TOAST.show(r?.error || 'Import failed', 'error');
        }
      };
      input.click();
    });
    $('download-demo-btn')?.addEventListener('click', () => {
      const r = global.FD_API?.downloadDemoBackup?.();
      if (global.FD_TOAST) global.FD_TOAST.show(r?.ok ? 'Demo backup downloaded' : (r?.error || 'Download failed'), r?.ok ? 'success' : 'error');
    });
    $('reset-demo-btn')?.addEventListener('click', () => {
      if (confirm('Reset local demo listings and reload seed?')) {
        global.FD_API?.resetDemoListings?.();
        clearBannerDismissed();
        loadAndRender();
      }
    });

    // Banner actions
    $('banner-retry-btn')?.addEventListener('click', loadAndRender);
    $('banner-details-btn')?.addEventListener('click', openDatasourceModal);
    $('banner-deploy-btn')?.addEventListener('click', () => $('deploy-modal')?.classList.add('open'));
    $('dismiss-offline-banner')?.addEventListener('click', () => {
      $('offline-banner').hidden = true;
      setBannerDismissed(currentSource);
    });

    // Data-source badge opens details
    $('data-source-badge')?.addEventListener('click', openDatasourceModal);

    // Sidebar / locate / fit
    $('sidebar-toggle')?.addEventListener('click', () => {
      $('sidebar')?.classList.toggle('open');
    });
    $('locate-btn')?.addEventListener('click', () => global.FD_MAP?.locateMe?.());
    $('clear-location-btn')?.addEventListener('click', () => global.FD_MAP?.clearLocation?.());
    $('fit-all-btn')?.addEventListener('click', () => global.FD_MAP?.fitAll?.());

    // Filter inputs → apply
    ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort','filter-favorites','filter-inview'].forEach(id => {
      $(id)?.addEventListener('change', () => global.FD_LIST?.applyFilters?.());
      $(id)?.addEventListener('input', () => global.FD_LIST?.applyFilters?.());
    });
    $('clear-filters')?.addEventListener('click', () => {
      ['filter-category','filter-visibility','filter-units','filter-seller','filter-minprice','filter-maxprice','filter-radius','filter-sort'].forEach(id => { const el = $(id); if (el) el.value = ''; });
      const fav = $('filter-favorites'); if (fav) fav.checked = false;
      const inv = $('filter-inview'); if (inv) inv.checked = false;
      const search = $('search-input'); if (search) search.value = '';
      global.FD_LIST?.applyFilters?.();
    });

    // Profile / dashboard
    $('profile-btn')?.addEventListener('click', () => global.FD_DASHBOARD?.open?.() || global.FD_AUTH?.open?.());

    // Fullscreen
    if (global.FD_FULLSCREEN && typeof global.FD_FULLSCREEN.bind === 'function') global.FD_FULLSCREEN.bind();

    // Close modals on backdrop or close buttons
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    });
    document.querySelectorAll('.close-card').forEach(btn => {
      if (btn.closest('.modal')) {
        btn.addEventListener('click', () => btn.closest('.modal')?.classList.remove('open'));
      }
    });

    // Theme persistence
    try {
      const theme = localStorage.getItem('fd-theme');
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}

    // Bind other modules
    global.FD_SELLERS?.bind?.();
    global.FD_LAYERS?.init?.();
    global.FD_SHORTCUTS?.bind?.();
    global.FD_RECENT?.bind?.();
    global.FD_COMPARE?.bind?.();
    global.FD_RFQ?.bind?.();
    global.FD_STATS?.bind?.();
    global.FD_DASHBOARD?.bind?.();
    global.FD_FORM?.bind?.();
    global.FD_AUTH?.bind?.();
    global.FD_CARDS?.bind?.();
  }

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    try { localStorage.setItem('fd-theme', isDark ? 'light' : 'dark'); } catch (_) {}
    if (global.FD_TOAST) global.FD_TOAST.show(isDark ? 'Light mode' : 'Dark mode', 'info');
    // Re-sync map layers if present
    if (global.FD_LAYERS && typeof global.FD_LAYERS.syncTheme === 'function') {
      global.FD_LAYERS.syncTheme();
    }
  }

  function init() {
    if (global.FD_MAP && typeof global.FD_MAP.initMap === 'function') {
      global.FD_MAP.initMap();
    }
    wireUI();
    loadAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.FD_MAIN = { loadAndRender, toggleTheme, openDatasourceModal };
})(window);
