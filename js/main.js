/**
 * FarmDirect B2B – bootstrap
 * Initializes map, loads listings (API → seed/demo fallback), binds list/search/cards and other modules,
 * wires top-bar, options menu, offline banner, data-source badge, theme, API base override, and deploy modal.
 * One entry point so the shell runs fully with seed data even when the Worker is empty or offline.
 * Does not invent features; only connects existing modules.
 */
(function (global) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  let lastChecked = 0;

  function relativeTime(ts) {
    if (!ts) return '';
    const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 5) return 'just now';
    if (sec < 60) return sec + 's ago';
    const min = Math.round(sec / 60);
    if (min < 60) return min + 'm ago';
    return Math.round(min / 60) + 'h ago';
  }

  function showBanner(source, health) {
    const banner = $('offline-banner');
    const text = $('banner-text');
    const badge = $('data-source-badge');
    if (!banner || !text) return;

    let msg = 'Showing seed/demo data.';
    let badgeText = 'SEED';
    if (source === 'api') {
      banner.hidden = true;
      if (badge) badge.hidden = true;
      return;
    } else if (source === 'api-empty') {
      msg = 'Live API reachable but no published listings yet. Showing seed data.';
      badgeText = 'API-EMPTY';
    } else if (source === 'demo') {
      msg = 'Showing local demo data (edits persist in this browser).';
      badgeText = 'DEMO';
    } else {
      msg = 'Live API offline or unavailable. Showing seed data.';
      badgeText = 'SEED';
    }
    if (health && !health.ok) {
      msg += ' ' + (health.error || '');
    }
    const checked = relativeTime(lastChecked);
    if (checked) msg += ' Last checked ' + checked + '.';
    text.textContent = msg;
    banner.hidden = false;
    if (badge) {
      badge.textContent = badgeText;
      badge.hidden = false;
      badge.title = 'Data source: ' + source + ' — click for details & next steps' + (checked ? ' (checked ' + checked + ')' : '');
      badge.style.cursor = 'pointer';
      badge.dataset.source = source || 'seed';
    }
  }

  function updateSourceModal(source, count, health) {
    const content = $('source-content');
    if (!content) return;
    const demo = global.FD_API && global.FD_API.getDemoInfo ? global.FD_API.getDemoInfo() : {};
    const hasToken = !!(global.FD_AUTH && global.FD_AUTH.getToken && global.FD_AUTH.getToken());
    const checked = relativeTime(lastChecked) || 'unknown';
    content.innerHTML = `
      <p><strong>Current source:</strong> ${source || 'unknown'}</p>
      <p>Listings shown: ${count || 0}</p>
      <p>Last checked: ${checked}</p>
      ${health ? `<p>Health: ${health.ok ? 'ok' : (health.error || 'failed')}</p>` : ''}
      ${demo.hasDemo ? `<p>Local demo override: ${demo.count} listings</p>` : '<p>No local demo override.</p>'}
      <hr>
      <p class="small"><strong>Next steps for live data:</strong></p>
      <ol class="small">
        <li>Auth migration already applied. Register/login via Profile (👤).</li>
        <li>Create a draft listing from Options → Add listing (or Dashboard).</li>
        <li>Publish it from the Dashboard. It will appear on the map once published.</li>
        <li>Optional: apply RFQ migration (see Deploy notes) for persistent quote requests.</li>
      </ol>
      <p class="small">You are ${hasToken ? 'signed in' : 'not signed in'}. Seed/demo works fully offline.</p>
      <div style="margin-top:10px;">
        <button type="button" id="source-retry" class="small-btn">Retry live</button>
        <button type="button" id="source-deploy" class="small-btn">Deploy notes</button>
        ${hasToken ? '<button type="button" id="source-dashboard" class="small-btn primary">Open Dashboard</button>' : '<button type="button" id="source-auth" class="small-btn primary">Sign in / Register</button>'}
      </div>
    `;
    // Wire the new buttons
    content.querySelector('#source-retry')?.addEventListener('click', loadAndRender);
    content.querySelector('#source-deploy')?.addEventListener('click', () => {
      const m = $('deploy-modal');
      if (m) m.classList.add('open');
    });
    content.querySelector('#source-auth')?.addEventListener('click', () => {
      if (global.FD_AUTH && global.FD_AUTH.open) global.FD_AUTH.open();
    });
    content.querySelector('#source-dashboard')?.addEventListener('click', () => {
      if (global.FD_DASHBOARD && global.FD_DASHBOARD.open) global.FD_DASHBOARD.open();
    });
  }

  async function loadAndRender() {
    if (!global.FD_API || !global.FD_API.fetchListings) {
      console.error('FD_API missing');
      return;
    }
    lastChecked = Date.now();
    const result = await global.FD_API.fetchListings();
    const listings = result.listings || [];
    if (global.FD_LIST && global.FD_LIST.setListings) {
      global.FD_LIST.setListings(listings);
    }
    showBanner(result.source, result.health);
    updateSourceModal(result.source, result.count, result.health);
    if (global.FD_TOAST) {
      global.FD_TOAST.show(`Loaded ${result.count} listings (${result.source})`, 'info');
    }
    // Apply hash filters if present
    if (location.hash && global.FD_LIST && global.FD_LIST.applyFiltersFromParams) {
      const params = new URLSearchParams(location.hash.slice(1));
      if (params.toString()) global.FD_LIST.applyFiltersFromParams(params);
    }
  }

  function wireTopBar() {
    // Filter card toggle
    $('filter-btn')?.addEventListener('click', () => {
      const card = $('filter-card');
      if (!card) return;
      const open = card.hidden;
      card.hidden = !open;
      $('filter-btn').setAttribute('aria-expanded', String(open));
    });
    $('close-filter')?.addEventListener('click', () => {
      $('filter-card').hidden = true;
      $('filter-btn')?.setAttribute('aria-expanded', 'false');
    });

    // Options menu
    $('options-btn')?.addEventListener('click', () => {
      const menu = $('options-menu');
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      $('options-btn').setAttribute('aria-expanded', String(open));
    });
    $('close-options')?.addEventListener('click', () => {
      $('options-menu').hidden = true;
      $('options-btn')?.setAttribute('aria-expanded', 'false');
    });

    // Profile → auth or dashboard
    $('profile-btn')?.addEventListener('click', () => {
      if (global.FD_AUTH && global.FD_AUTH.getToken && global.FD_AUTH.getToken()) {
        if (global.FD_DASHBOARD && global.FD_DASHBOARD.open) global.FD_DASHBOARD.open();
      } else if (global.FD_AUTH && global.FD_AUTH.open) {
        global.FD_AUTH.open();
      } else if (global.FD_TOAST) {
        global.FD_TOAST.show('Auth module not ready', 'info');
      }
    });

    // Sidebar toggle
    $('sidebar-toggle')?.addEventListener('click', () => {
      $('sidebar')?.classList.toggle('open');
    });

    // Data-source badge opens details modal
    $('data-source-badge')?.addEventListener('click', () => {
      const m = $('data-source-modal');
      if (m) m.classList.add('open');
    });
  }

  function wireOptionsMenu() {
    $('theme-toggle')?.addEventListener('change', (e) => {
      document.body.classList.toggle('dark', e.target.checked);
      try { localStorage.setItem('fd-theme', e.target.checked ? 'dark' : 'light'); } catch (_) {}
    });
    // Restore theme
    try {
      if (localStorage.getItem('fd-theme') === 'dark') {
        document.body.classList.add('dark');
        if ($('theme-toggle')) $('theme-toggle').checked = true;
      }
    } catch (_) {}

    $('save-api-base')?.addEventListener('click', () => {
      const val = ($('api-base-input')?.value || '').trim();
      try {
        if (val) localStorage.setItem('fd-api-base', val);
        else localStorage.removeItem('fd-api-base');
        if (global.FD_CONFIG) global.FD_CONFIG.API_BASE = val || global.FD_CONFIG.API_BASE;
        if (global.FD_TOAST) global.FD_TOAST.show('API base saved – reload to apply', 'success');
      } catch (_) {}
    });
    // Pre-fill current
    if ($('api-base-input') && global.FD_CONFIG) {
      $('api-base-input').value = global.FD_CONFIG.API_BASE || '';
    }

    // Menu buttons that open modals or call modules
    const openers = {
      'open-sellers': () => global.FD_SELLERS?.open?.(),
      'open-deploy': () => { const m = $('deploy-modal'); if (m) m.classList.add('open'); },
      'open-seedtips': () => global.FD_SEEDTIPS?.open?.(),
      'open-onboarding': () => global.FD_ONBOARDING?.open?.(),
      'open-demostatus': () => global.FD_DEMOSTATUS?.open?.(),
      'open-localmanager': () => global.FD_LOCALMANAGER?.open?.(),
      'open-quality': () => global.FD_QUALITY?.open?.(),
      'open-presets': () => global.FD_PRESETS?.open?.(),
      'open-notes': () => global.FD_NOTES?.open?.(),
      'open-tags': () => global.FD_TAGS?.open?.(),
      'open-collections': () => global.FD_COLLECTIONS?.open?.(),
      'open-searchhistory': () => global.FD_SEARCHHISTORY?.open?.(),
      'open-mapviews': () => global.FD_MAPVIEWS?.open?.(),
      'open-pricewatch': () => global.FD_PRICEWATCH?.open?.(),
      'open-recent': () => global.FD_RECENT?.open?.(),
      'open-stats': () => global.FD_STATS?.open?.(),
      'open-shortcuts': () => { const m = $('shortcuts-modal'); if (m) m.classList.add('open'); },
      'copy-filtered-link': () => global.FD_LIST?.copyFilteredLink?.(),
      'copy-map-view': () => {
        const link = global.FD_MAP?.getMapViewLink?.() || location.href;
        navigator.clipboard.writeText(link).then(() => global.FD_TOAST?.show('Map view link copied', 'success'));
      },
      'reset-map-view': () => global.FD_MAP?.resetToDefault?.(),
      'export-csv-btn': () => global.FD_CSV?.export?.(),
      'export-geojson-btn': () => global.FD_GEOJSON?.exportGeoJSON?.(),
      'export-filtered-json': () => global.FD_LIST?.exportFilteredJson?.(),
      'copy-filter-summary': () => global.FD_LIST?.copyFilterSummary?.(),
      'export-demo': () => global.FD_API?.exportDemoData?.().then(r => global.FD_TOAST?.show(r.ok ? `Demo saved (${r.count})` : r.error, r.ok ? 'success' : 'error')),
      'download-demo': () => global.FD_API?.downloadDemoBackup?.(),
      'import-demo': () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const text = await file.text();
          const r = await global.FD_API?.importDemoData?.(text);
          if (r?.ok) {
            global.FD_TOAST?.show(`Imported ${r.count} listings`, 'success');
            loadAndRender();
          } else {
            global.FD_TOAST?.show(r?.error || 'Import failed', 'error');
          }
        };
        input.click();
      },
      'reload-listings': () => loadAndRender(),
      'force-seed': async () => {
        global.FD_API?.resetDemoListings?.();
        const seed = await global.FD_API?.loadSeedListings?.();
        global.FD_LIST?.setListings?.(seed || []);
        showBanner('seed');
        global.FD_TOAST?.show('Loaded pure seed data', 'info');
      },
      'reset-demo': () => {
        global.FD_API?.resetDemoListings?.();
        global.FD_TOAST?.show('Demo data cleared', 'info');
        loadAndRender();
      },
      'add-listing-btn': () => global.FD_FORM?.open?.(),
      'sample-listing-btn': () => global.FD_FORM?.openSample?.()
    };
    Object.keys(openers).forEach(id => {
      $(id)?.addEventListener('click', openers[id]);
    });
  }

  function wireBanner() {
    $('banner-dismiss')?.addEventListener('click', () => { $('offline-banner').hidden = true; });
    $('banner-details')?.addEventListener('click', () => {
      const m = $('data-source-modal');
      if (m) m.classList.add('open');
    });
    $('banner-retry')?.addEventListener('click', loadAndRender);
    $('banner-deploy')?.addEventListener('click', () => {
      const m = $('deploy-modal');
      if (m) m.classList.add('open');
    });
    // Close buttons for simple modals
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.modal')?.classList.remove('open'));
    });
  }

  function bindModules() {
    const modules = [
      'FD_SEARCH', 'FD_LIST', 'FD_CARDS', 'FD_AUTH', 'FD_DASHBOARD', 'FD_FORM',
      'FD_LAYERS', 'FD_FULLSCREEN', 'FD_RFQ', 'FD_SHORTCUTS', 'FD_COMPARE',
      'FD_CSV', 'FD_GEOJSON', 'FD_RECENT', 'FD_STATS', 'FD_SEEDTIPS',
      'FD_ONBOARDING', 'FD_DEMOSTATUS', 'FD_LOCALMANAGER', 'FD_QUALITY',
      'FD_PRESETS', 'FD_NOTES', 'FD_TAGS', 'FD_COLLECTIONS', 'FD_SEARCHHISTORY',
      'FD_MAPVIEWS', 'FD_PRICEWATCH', 'FD_SELLERS'
    ];
    modules.forEach(name => {
      const mod = global[name];
      if (mod && typeof mod.bind === 'function') {
        try { mod.bind(); } catch (e) { console.warn(name + '.bind failed', e); }
      }
    });
  }

  async function boot() {
    // Map first
    if (global.FD_MAP && global.FD_MAP.initMap) {
      global.FD_MAP.initMap();
    }
    wireTopBar();
    wireOptionsMenu();
    wireBanner();
    bindModules();
    await loadAndRender();
    // Optional welcome
    if (global.FD_ONBOARDING && typeof global.FD_ONBOARDING.maybeShow === 'function') {
      global.FD_ONBOARDING.maybeShow();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
