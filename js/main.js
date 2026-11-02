/**
 * FarmDirect B2B – main bootstrap
 * Initializes map, loads listings (API → seed/demo fallback), wires UI chrome
 * (top bar, sidebar, filter card, options menu, banners, data-source badge),
 * and binds feature modules. Fully client-side; works offline with seed data.
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

  let lastCheckAt = null;
  let lastResult = null;

  function formatTime(ts) {
    if (!ts) return 'never';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_) {
      return 'unknown';
    }
  }

  function coverageSummary(listings) {
    if (!Array.isArray(listings) || !listings.length) return { categories: 0, sellers: 0, withImage: 0, withPrice: 0 };
    const cats = new Set();
    const sellers = new Set();
    let withImage = 0;
    let withPrice = 0;
    listings.forEach(l => {
      if (l.category) cats.add(l.category);
      if (l.sellerid) sellers.add(l.sellerid);
      if (l.image) withImage++;
      if (typeof l.price === 'number' && l.price > 0) withPrice++;
    });
    return { categories: cats.size, sellers: sellers.size, withImage, withPrice, total: listings.length };
  }

  function updateDataSourceUI(result) {
    const source = result?.source || 'seed';
    const badge = document.getElementById('data-source-badge');
    const banner = document.getElementById('offline-banner');
    const bannerText = document.getElementById('banner-text');
    lastResult = result;
    lastCheckAt = Date.now();

    if (badge) {
      const count = result?.count || (result?.listings?.length) || 0;
      const label = source === 'api' ? 'LIVE' : source.toUpperCase();
      badge.textContent = count ? `${label} (${count})` : label;
      badge.title = `Data source: ${source} · ${count} listings · checked ${formatTime(lastCheckAt)}`;
      badge.hidden = false;
    }

    if (banner && bannerText) {
      if (source === 'api') {
        banner.hidden = true;
      } else {
        let msg = 'Showing seed data.';
        if (source === 'demo') msg = 'Showing local demo overrides.';
        else if (source === 'api-empty') msg = 'Live API reachable but empty – showing seed data.';
        else if (source === 'seed') msg = 'Showing seed data (API offline or unavailable).';
        const count = result?.count || (result?.listings?.length) || 0;
        bannerText.textContent = count ? `${msg} (${count} listings)` : msg;
        banner.hidden = false;
      }
    }
  }

  function renderSourceContent(result) {
    const content = document.getElementById('source-content');
    if (!content) return;
    const source = result?.source || 'seed';
    const listings = result?.listings || [];
    const cov = coverageSummary(listings);
    const info = (global.FD_API && global.FD_API.getDemoInfo) ? global.FD_API.getDemoInfo() : {};
    const health = result?.health;
    const healthLine = health
      ? (health.ok ? `Health: ${health.status || 'ok'}${health.features?.length ? ' · features: ' + health.features.join(', ') : ''}` : `Health: unreachable (${health.error || 'error'})`)
      : 'Health: not checked (no API base)';

    content.innerHTML = `
      <p><strong>Source:</strong> ${escapeHtml(source.toUpperCase())}</p>
      <p class="small">Listings in view: <strong>${cov.total || 0}</strong></p>
      <p class="small">Coverage: ${cov.categories} categories · ${cov.sellers} sellers · ${cov.withImage} with image · ${cov.withPrice} with price</p>
      <p class="small">Local demo overrides: <strong>${info.count || 0}</strong> ${info.hasDemo ? '(in localStorage)' : '(none)'}</p>
      <p class="small">Last checked: <strong id="source-last-checked">${escapeHtml(formatTime(lastCheckAt))}</strong></p>
      <p class="small muted">${escapeHtml(healthLine)}</p>
      <div class="onboarding-actions" style="margin-top:10px;">
        <button type="button" id="source-copy-status" class="small-btn">Copy status</button>
        <button type="button" id="source-retry" class="small-btn">Retry live</button>
      </div>
      <p class="small muted" style="margin-top:8px;">Retry live re-probes the Worker without a full reload. Deploy steps are in Options or the banner.</p>
    `;

    content.querySelector('#source-copy-status')?.addEventListener('click', () => {
      const text = [
        `FarmDirect data source: ${source.toUpperCase()}`,
        `Listings: ${cov.total || 0}`,
        `Categories: ${cov.categories}, Sellers: ${cov.sellers}`,
        `With image: ${cov.withImage}, With price: ${cov.withPrice}`,
        `Local overrides: ${info.count || 0}`,
        `Last checked: ${formatTime(lastCheckAt)}`,
        healthLine,
      ].join('\n');
      navigator.clipboard.writeText(text).then(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Status copied', 'success');
      }).catch(() => {
        if (global.FD_TOAST) global.FD_TOAST.show('Copy failed', 'error');
      });
    });

    content.querySelector('#source-retry')?.addEventListener('click', async () => {
      if (global.FD_TOAST) global.FD_TOAST.show('Retrying live API…', 'info');
      await loadAndRender();
      if (document.getElementById('data-source-modal')?.classList.contains('open')) {
        renderSourceContent(lastResult);
      }
    });

    // Live ticker
    const ticker = content.querySelector('#source-last-checked');
    if (ticker) {
      const tick = () => {
        if (!document.getElementById('data-source-modal')?.classList.contains('open')) return;
        ticker.textContent = formatTime(lastCheckAt);
      };
      tick();
    }
  }

  async function loadAndRender() {
    if (!global.FD_API || typeof global.FD_API.fetchListings !== 'function') {
      console.warn('FD_API not ready');
      return;
    }
    try {
      const result = await global.FD_API.fetchListings();
      updateDataSourceUI(result);
      if (global.FD_LIST && typeof global.FD_LIST.setListings === 'function') {
        global.FD_LIST.setListings(result.listings || []);
      }
      // Apply URL hash filters if present
      if (global.FD_LIST && typeof global.FD_LIST.applyFiltersFromParams === 'function') {
        const hash = (location.hash || '').replace(/^#/, '');
        if (hash && !hash.startsWith('map=')) {
          const params = new URLSearchParams(hash);
          global.FD_LIST.applyFiltersFromParams(params);
        }
      }
    } catch (err) {
      console.error('Load failed', err);
      if (global.FD_TOAST) global.FD_TOAST.show('Could not load listings', 'error');
    }
  }

  function bindBanner() {
    document.getElementById('banner-dismiss')?.addEventListener('click', () => {
      document.getElementById('offline-banner')?.setAttribute('hidden', '');
    });
    document.getElementById('banner-details')?.addEventListener('click', () => {
      document.getElementById('data-source-modal')?.classList.add('open');
      renderSourceContent(lastResult);
    });
    document.getElementById('banner-retry')?.addEventListener('click', async () => {
      if (global.FD_TOAST) global.FD_TOAST.show('Retrying live API…', 'info');
      await loadAndRender();
    });
    document.getElementById('banner-deploy')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
    });
    document.getElementById('close-source-btn')?.addEventListener('click', () => {
      document.getElementById('data-source-modal')?.classList.remove('open');
    });
    // Also open from badge
    document.getElementById('data-source-badge')?.addEventListener('click', () => {
      document.getElementById('data-source-modal')?.classList.add('open');
      renderSourceContent(lastResult);
    });
  }

  function bindTopBar() {
    // Filter card
    const filterBtn = document.getElementById('filter-btn');
    const filterCard = document.getElementById('filter-card');
    filterBtn?.addEventListener('click', () => {
      const open = filterCard?.hidden === false;
      if (filterCard) filterCard.hidden = open;
      filterBtn?.setAttribute('aria-expanded', String(!open));
    });
    document.getElementById('close-filter')?.addEventListener('click', () => {
      if (filterCard) filterCard.hidden = true;
      filterBtn?.setAttribute('aria-expanded', 'false');
    });

    // Options menu
    const optionsBtn = document.getElementById('options-btn');
    const optionsMenu = document.getElementById('options-menu');
    optionsBtn?.addEventListener('click', () => {
      const open = optionsMenu?.hidden === false;
      if (optionsMenu) optionsMenu.hidden = open;
      optionsBtn?.setAttribute('aria-expanded', String(!open));
    });
    document.getElementById('close-options')?.addEventListener('click', () => {
      if (optionsMenu) optionsMenu.hidden = true;
      optionsBtn?.setAttribute('aria-expanded', 'false');
    });

    // Profile
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (global.FD_AUTH && global.FD_AUTH.getToken && global.FD_AUTH.getToken()) {
        if (global.FD_DASHBOARD && global.FD_DASHBOARD.openDashboard) {
          global.FD_DASHBOARD.openDashboard();
        }
      } else if (global.FD_AUTH && global.FD_AUTH.openAuthModal) {
        global.FD_AUTH.openAuthModal('login');
      }
    });

    // Theme
    const themeToggle = document.getElementById('theme-toggle');
    function applyTheme(dark) {
      document.body.classList.toggle('dark', !!dark);
      try { localStorage.setItem('fd-theme', dark ? 'dark' : 'light'); } catch (_) {}
    }
    try {
      const stored = localStorage.getItem('fd-theme');
      if (stored === 'dark') {
        applyTheme(true);
        if (themeToggle) themeToggle.checked = true;
      }
    } catch (_) {}
    themeToggle?.addEventListener('change', () => applyTheme(themeToggle.checked));

    // API base
    const apiInput = document.getElementById('api-base-input');
    if (apiInput && global.FD_CONFIG) apiInput.value = global.FD_CONFIG.API_BASE || '';
    document.getElementById('save-api-base')?.addEventListener('click', () => {
      const val = (apiInput?.value || '').trim();
      try { localStorage.setItem('fd-api-base', val); } catch (_) {}
      if (global.FD_CONFIG) global.FD_CONFIG.API_BASE = val;
      if (global.FD_TOAST) global.FD_TOAST.show('API base saved – reload to apply', 'success');
    });
  }

  function bindSidebar() {
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.locateUser) global.FD_MAP.locateUser();
    });
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.fitAll) global.FD_MAP.fitAll();
    });
    document.getElementById('clear-fit-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.resetFilters) global.FD_LIST.resetFilters();
      if (global.FD_MAP && global.FD_MAP.fitAll) global.FD_MAP.fitAll();
    });
    document.getElementById('nearby-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.toggleNearby) global.FD_LIST.toggleNearby();
    });
    document.getElementById('favorites-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.toggleFavoritesOnly) global.FD_LIST.toggleFavoritesOnly();
    });
    document.getElementById('random-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.pickRandom) global.FD_LIST.pickRandom();
    });
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      if (global.FD_LIST && global.FD_LIST.setSort) global.FD_LIST.setSort(e.target.value);
    });
    document.getElementById('group-by-seller')?.addEventListener('change', (e) => {
      if (global.FD_LIST && global.FD_LIST.setGroupBySeller) global.FD_LIST.setGroupBySeller(e.target.checked);
    });
  }

  function bindFilterCard() {
    document.getElementById('apply-filters')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.applyFromUI) global.FD_LIST.applyFromUI();
    });
    document.getElementById('reset-filters')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.resetFilters) global.FD_LIST.resetFilters();
    });
  }

  function bindOptionsActions() {
    // Many modules self-bind via their bind() methods. Direct actions here.
    document.getElementById('open-deploy')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.remove('open');
    });

    document.getElementById('copy-filtered-link')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.copyFilteredLink) global.FD_LIST.copyFilteredLink();
    });
    document.getElementById('copy-map-view')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.getMapViewLink) {
        const link = global.FD_MAP.getMapViewLink();
        navigator.clipboard.writeText(link).then(() => {
          if (global.FD_TOAST) global.FD_TOAST.show('Map view link copied', 'success');
        }).catch(() => {});
      }
    });
    document.getElementById('reset-map-view')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.resetToDefault) global.FD_MAP.resetToDefault();
    });

    document.getElementById('export-demo')?.addEventListener('click', async () => {
      if (global.FD_API && global.FD_API.exportDemoData) {
        const res = await global.FD_API.exportDemoData();
        if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? `Exported ${res.count}` : (res.error || 'Failed'), res.ok ? 'success' : 'error');
      }
    });
    document.getElementById('download-demo')?.addEventListener('click', () => {
      if (global.FD_API && global.FD_API.downloadDemoBackup) global.FD_API.downloadDemoBackup();
    });
    document.getElementById('import-demo')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        if (global.FD_API && global.FD_API.importDemoData) {
          const res = await global.FD_API.importDemoData(text);
          if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? `Imported ${res.count}` : (res.error || 'Failed'), res.ok ? 'success' : 'error');
          if (res.ok) await loadAndRender();
        }
      };
      input.click();
    });
    document.getElementById('reload-listings')?.addEventListener('click', () => loadAndRender());
    document.getElementById('force-seed')?.addEventListener('click', () => {
      if (confirm('Clear local demo overrides and load pure seed data?')) {
        if (global.FD_API && global.FD_API.resetDemoListings) global.FD_API.resetDemoListings();
        loadAndRender();
      }
    });
    document.getElementById('reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset all local demo data?')) {
        if (global.FD_API && global.FD_API.resetDemoListings) global.FD_API.resetDemoListings();
        loadAndRender();
      }
    });
    document.getElementById('add-listing-btn')?.addEventListener('click', () => {
      if (global.FD_FORM && global.FD_FORM.open) global.FD_FORM.open();
    });
    document.getElementById('sample-listing-btn')?.addEventListener('click', () => {
      if (global.FD_FORM && global.FD_FORM.openSample) global.FD_FORM.openSample();
    });
  }

  function bindModules() {
    const modules = [
      'FD_SEARCH', 'FD_CARDS', 'FD_SEEDTIPS', 'FD_ONBOARDING', 'FD_DEMOSTATUS',
      'FD_LOCALMANAGER', 'FD_QUALITY', 'FD_PRESETS', 'FD_NOTES', 'FD_TAGS',
      'FD_COLLECTIONS', 'FD_SEARCHHISTORY', 'FD_MAPVIEWS', 'FD_PRICEWATCH',
      'FD_RECENT', 'FD_STATS', 'FD_SHORTCUTS', 'FD_COMPARE', 'FD_RFQ',
      'FD_AUTH'
    ];
    modules.forEach(name => {
      const mod = global[name];
      if (mod) {
        if (typeof mod.bind === 'function') mod.bind();
        else if (typeof mod.bindAuth === 'function') mod.bindAuth();
      }
    });
  }

  function init() {
    if (global.FD_MAP && typeof global.FD_MAP.initMap === 'function') {
      global.FD_MAP.initMap();
    }
    bindBanner();
    bindTopBar();
    bindSidebar();
    bindFilterCard();
    bindOptionsActions();
    bindModules();
    loadAndRender();

    // Close modals on outside click / Esc handled by modules or here
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
        document.getElementById('filter-card')?.setAttribute('hidden', '');
        document.getElementById('options-menu')?.setAttribute('hidden', '');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for other modules (demo status, etc.)
  global.loadAndRender = loadAndRender;
})(window);
