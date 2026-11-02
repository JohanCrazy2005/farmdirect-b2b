/**
 * FarmDirect B2B – main bootstrap
 * Initializes the map, loads listings via FD_API (seed/demo fallback),
 * wires the transparent top bar, sidebar, filter card, options menu,
 * data-source badge, and offline banner. Binds feature modules.
 * Exposes loadAndRender so demo-status / force-seed can refresh without reload.
 * Fully client-side; works when the Worker is offline or empty.
 */
(function (global) {
  'use strict';

  const BANNER_DISMISS_KEY = 'fd-banner-dismissed';

  function $(id) { return document.getElementById(id); }

  function showBanner(source, health) {
    const banner = $('offline-banner');
    const text = $('banner-text');
    if (!banner || !text) return;

    const dismissed = (() => {
      try { return localStorage.getItem(BANNER_DISMISS_KEY) === '1'; } catch (_) { return false; }
    })();

    if (source === 'api' || dismissed) {
      banner.hidden = true;
      return;
    }

    let msg = 'Showing seed/demo data.';
    if (source === 'demo') msg = 'Showing local demo overrides.';
    else if (source === 'api-empty') msg = 'Worker reachable but empty — showing seed data.';
    else if (source === 'seed') msg = 'Showing seed data (Worker offline or unreachable).';

    text.textContent = msg;
    banner.hidden = false;
  }

  function updateBadge(source) {
    const badge = $('data-source-badge');
    if (!badge) return;
    const label = (source || 'seed').toUpperCase();
    badge.textContent = label;
    badge.className = 'data-source-badge source-' + (source || 'seed');
    badge.hidden = false;
    badge.title = 'Data source: ' + label + ' (click for details)';
  }

  function openDataSourceModal(result) {
    const modal = $('data-source-modal');
    const content = $('source-content');
    if (!modal || !content) return;

    const source = result?.source || 'seed';
    const count = result?.count || 0;
    const health = result?.health;
    const demo = (global.FD_API && global.FD_API.getDemoInfo) ? global.FD_API.getDemoInfo() : {};

    let html = `<p>Current source: <strong>${source}</strong> (${count} listings)</p>`;
    if (health) {
      html += `<p class="small">Health: ${health.ok ? 'reachable' : 'unreachable'} ${health.status || ''} ${health.error || ''}</p>`;
    }
    if (demo.hasDemo) {
      html += `<p class="small">Local demo overrides: ${demo.count}</p>`;
    }
    html += `<p class="small muted">Click Retry live to re-probe the Worker. Deploy steps are in Options or the banner.</p>`;
    content.innerHTML = html;
    modal.classList.add('open');
  }

  async function loadAndRender() {
    if (!global.FD_API || !global.FD_LIST) return;
    try {
      const result = await global.FD_API.fetchListings();
      global.FD_LIST.setListings(result.listings || []);
      updateBadge(result.source);
      showBanner(result.source, result.health);
      // Apply hash filters if present
      const hash = (location.hash || '').replace(/^#/, '');
      if (hash && !hash.startsWith('map=')) {
        const params = new URLSearchParams(hash);
        if (typeof global.FD_LIST.applyFiltersFromParams === 'function') {
          global.FD_LIST.applyFiltersFromParams(params);
        }
      }
      if (global.FD_MAP && global.FD_MAP.applyMapViewFromHash) {
        global.FD_MAP.applyMapViewFromHash();
      }
    } catch (err) {
      console.error('loadAndRender failed', err);
      if (global.FD_TOAST) global.FD_TOAST.show('Failed to load listings', 'error');
    }
  }

  function wireUI() {
    // Sidebar toggle
    $('sidebar-toggle')?.addEventListener('click', () => {
      $('sidebar')?.classList.toggle('open');
    });

    // Filter card
    $('filter-btn')?.addEventListener('click', () => {
      const card = $('filter-card');
      if (!card) return;
      const open = card.hidden;
      card.hidden = !open;
      $('filter-btn')?.setAttribute('aria-expanded', String(open));
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
      $('options-btn')?.setAttribute('aria-expanded', String(open));
    });
    $('close-options')?.addEventListener('click', () => {
      $('options-menu').hidden = true;
      $('options-btn')?.setAttribute('aria-expanded', 'false');
    });

    // Banner actions
    $('banner-dismiss')?.addEventListener('click', () => {
      try { localStorage.setItem(BANNER_DISMISS_KEY, '1'); } catch (_) {}
      $('offline-banner').hidden = true;
    });
    $('banner-details')?.addEventListener('click', async () => {
      const result = global.FD_API ? await global.FD_API.fetchListings() : null;
      openDataSourceModal(result);
    });
    $('banner-retry')?.addEventListener('click', () => {
      if (global.FD_TOAST) global.FD_TOAST.show('Retrying live API…', 'info');
      loadAndRender();
    });
    $('banner-deploy')?.addEventListener('click', () => {
      $('deploy-modal')?.classList.add('open');
    });

    // Data-source badge opens modal
    $('data-source-badge')?.addEventListener('click', async () => {
      const result = global.FD_API ? await global.FD_API.fetchListings() : null;
      openDataSourceModal(result);
    });

    // Theme toggle (simple)
    const themeToggle = $('theme-toggle');
    if (themeToggle) {
      const dark = document.documentElement.dataset.theme === 'dark' || localStorage.getItem('fd-theme') === 'dark';
      themeToggle.checked = dark;
      if (dark) document.documentElement.dataset.theme = 'dark';
      themeToggle.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.dataset.theme = isDark ? 'dark' : '';
        try { localStorage.setItem('fd-theme', isDark ? 'dark' : 'light'); } catch (_) {}
      });
    }

    // API base save
    $('save-api-base')?.addEventListener('click', () => {
      const val = $('api-base-input')?.value?.trim();
      if (val) {
        try { localStorage.setItem('fd-api-base', val); } catch (_) {}
        if (global.FD_CONFIG) global.FD_CONFIG.API_BASE = val;
        if (global.FD_TOAST) global.FD_TOAST.show('API base saved — reloading', 'success');
        setTimeout(() => location.reload(), 400);
      }
    });
    if ($('api-base-input') && global.FD_CONFIG) {
      $('api-base-input').value = global.FD_CONFIG.API_BASE || '';
    }

    // Profile / auth
    $('profile-btn')?.addEventListener('click', () => {
      if (global.FD_AUTH && typeof global.FD_AUTH.open === 'function') {
        global.FD_AUTH.open();
      } else if (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.open === 'function') {
        global.FD_DASHBOARD.open();
      }
    });

    // Generic modal close on backdrop or Esc handled lightly
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.remove('open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
        $('filter-card')?.setAttribute('hidden', '');
        $('options-menu')?.setAttribute('hidden', '');
      }
    });
  }

  function bindModules() {
    const modules = [
      'FD_SEEDTIPS', 'FD_ONBOARDING', 'FD_DEMOSTATUS', 'FD_LOCALMANAGER',
      'FD_QUALITY', 'FD_PRESETS', 'FD_NOTES', 'FD_TAGS', 'FD_COLLECTIONS',
      'FD_SEARCHHISTORY', 'FD_MAPVIEWS', 'FD_PRICEWATCH', 'FD_SHORTCUTS',
      'FD_RECENT', 'FD_STATS', 'FD_COMPARE', 'FD_LAYERS', 'FD_FULLSCREEN',
      'FD_RFQ', 'FD_CARDS', 'FD_SEARCH', 'FD_AUTH', 'FD_DASHBOARD', 'FD_FORM'
    ];
    modules.forEach(name => {
      const mod = global[name];
      if (mod && typeof mod.bind === 'function') {
        try { mod.bind(); } catch (err) { console.warn(name + ' bind failed', err); }
      }
    });
  }

  function init() {
    if (global.FD_MAP && typeof global.FD_MAP.initMap === 'function') {
      global.FD_MAP.initMap();
    }
    wireUI();
    bindModules();
    loadAndRender();
  }

  // Expose for other modules (demo status force-seed, etc.)
  global.loadAndRender = loadAndRender;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
