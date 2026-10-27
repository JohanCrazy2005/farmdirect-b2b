/**
 * FarmDirect B2B – main bootstrap
 * Wires Leaflet map, list, cards, search, dashboard, form, auth, options.
 * Loads listings from live Worker or falls back to seed/demo automatically.
 * Health-aware data-source badge distinguishes API-live-empty from offline.
 * When Worker is live but empty, seed listings are still shown for usable map UX.
 * Persistent dark mode toggle for better map-first readability.
 */
(function () {
  'use strict';

  const THEME_KEY = 'fd-theme';

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = theme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode';
  }

  function loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      applyTheme(theme);
    } catch (_) {
      applyTheme('light');
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    if (window.FD_TOAST) window.FD_TOAST.show(next === 'dark' ? 'Dark mode on' : 'Light mode on', 'info');
  }

  function init() {
    loadTheme();

    // Map first
    if (window.FD_MAP && typeof window.FD_MAP.initMap === 'function') {
      window.FD_MAP.initMap();
    }

    // Bind modules
    if (window.FD_LIST) window.FD_LIST.bindUI();
    if (window.FD_SEARCH) window.FD_SEARCH.bind();
    if (window.FD_DASHBOARD) window.FD_DASHBOARD.bindDashboard();
    if (window.FD_FORM) window.FD_FORM.bindForm();
    if (window.FD_AUTH) window.FD_AUTH.bindAuth();
    if (window.FD_RECENT) window.FD_RECENT.bind();
    if (window.FD_COMPARE) window.FD_COMPARE.bind();
    if (window.FD_SHORTCUTS) window.FD_SHORTCUTS.bind();
    if (window.FD_SELLERS) window.FD_SELLERS.bind();
    if (window.FD_RFQ) window.FD_RFQ.bind();
    if (window.FD_STATS) window.FD_STATS.bind();
    if (window.FD_LAYERS) window.FD_LAYERS.bind();
    if (window.FD_CSV) window.FD_CSV.bind();
    if (window.FD_GEOJSON) window.FD_GEOJSON.bind();
    if (window.FD_FULLSCREEN) window.FD_FULLSCREEN.bind();

    // Profile → dashboard
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (window.FD_DASHBOARD) window.FD_DASHBOARD.openDashboard();
    });

    // Mobile sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebar && sidebarToggle) {
      sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.toggle('open');
        sidebarToggle.setAttribute('aria-expanded', String(isOpen));
        sidebarToggle.textContent = isOpen ? '×' : '☰';
      });
      document.getElementById('listing-list')?.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && e.target.closest('.listing-item')) {
          sidebar.classList.remove('open');
          sidebarToggle.setAttribute('aria-expanded', 'false');
          sidebarToggle.textContent = '☰';
        }
      });
    }

    // Options menu
    const optionsMenu = document.getElementById('options-menu');
    document.getElementById('options-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = optionsMenu && !optionsMenu.hasAttribute('hidden');
      if (optionsMenu) optionsMenu.toggleAttribute('hidden', open);
      document.getElementById('options-btn')?.setAttribute('aria-expanded', String(!open));
    });
    document.getElementById('close-options-btn')?.addEventListener('click', () => {
      optionsMenu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (e) => {
      if (optionsMenu && !optionsMenu.hasAttribute('hidden') && !optionsMenu.contains(e.target) && e.target.id !== 'options-btn') {
        optionsMenu.setAttribute('hidden', '');
        document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      }
    });

    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      toggleTheme();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
        e.preventDefault();
        toggleTheme();
      }
    });

    // API base override
    const apiInput = document.getElementById('api-base-input');
    if (apiInput && window.FD_CONFIG) apiInput.value = window.FD_CONFIG.API_BASE || '';
    document.getElementById('save-api-base')?.addEventListener('click', () => {
      const val = (apiInput?.value || '').trim();
      try {
        if (val) localStorage.setItem('fd-api-base', val);
        else localStorage.removeItem('fd-api-base');
        if (window.FD_CONFIG) window.FD_CONFIG.API_BASE = val;
        if (window.FD_TOAST) window.FD_TOAST.show(val ? 'API base saved – reloading' : 'API base cleared – using seed', 'info');
        setTimeout(() => location.reload(), 600);
      } catch (_) {}
    });

    // Deploy modal
    function openDeployModal() {
      document.getElementById('deploy-modal')?.classList.add('open');
      optionsMenu?.setAttribute('hidden', '');
    }
    document.getElementById('show-deploy-btn')?.addEventListener('click', openDeployModal);
    document.getElementById('banner-deploy-btn')?.addEventListener('click', openDeployModal);
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.remove('open');
    });
    document.getElementById('deploy-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deploy-modal') e.target.classList.remove('open');
    });

    // Data-source badge click → deploy modal
    document.getElementById('data-source-badge')?.addEventListener('click', () => {
      openDeployModal();
      if (window.FD_TOAST) window.FD_TOAST.show('Deploy steps for live data', 'info');
    });

    // Reload listings
    document.getElementById('reload-listings-btn')?.addEventListener('click', () => {
      loadListings();
      optionsMenu?.setAttribute('hidden', '');
      if (window.FD_TOAST) window.FD_TOAST.show('Reloading listings…', 'info');
    });

    // Copy map view link
    document.getElementById('copy-map-link-btn')?.addEventListener('click', async () => {
      if (window.FD_MAP && typeof window.FD_MAP.getMapViewLink === 'function') {
        const link = window.FD_MAP.getMapViewLink();
        try {
          await navigator.clipboard.writeText(link);
          if (window.FD_TOAST) window.FD_TOAST.show('Map view link copied', 'success');
        } catch (_) {
          if (window.FD_TOAST) window.FD_TOAST.show('Could not copy – link: ' + link, 'info');
        }
      }
      optionsMenu?.setAttribute('hidden', '');
    });

    // Copy filtered view link
    document.getElementById('copy-filtered-link-btn')?.addEventListener('click', async () => {
      if (window.FD_LIST && typeof window.FD_LIST.getFilteredViewLink === 'function') {
        const link = window.FD_LIST.getFilteredViewLink();
        try {
          await navigator.clipboard.writeText(link);
          if (window.FD_TOAST) window.FD_TOAST.show('Filtered view link copied', 'success');
        } catch (_) {
          if (window.FD_TOAST) window.FD_TOAST.show('Could not copy – link: ' + link, 'info');
        }
      }
      optionsMenu?.setAttribute('hidden', '');
    });

    // Recently viewed
    document.getElementById('show-recent-btn')?.addEventListener('click', () => {
      if (window.FD_RECENT) window.FD_RECENT.open();
      optionsMenu?.setAttribute('hidden', '');
    });

    // Compare listings
    document.getElementById('compare-btn')?.addEventListener('click', () => {
      if (window.FD_COMPARE) window.FD_COMPARE.open();
      optionsMenu?.setAttribute('hidden', '');
    });

    // Seller directory
    document.getElementById('sellers-btn')?.addEventListener('click', () => {
      if (window.FD_SELLERS) window.FD_SELLERS.open();
      optionsMenu?.setAttribute('hidden', '');
    });

    // My quote requests
    document.getElementById('my-rfqs-btn')?.addEventListener('click', () => {
      if (window.FD_RFQ) window.FD_RFQ.openMyRfqs();
      optionsMenu?.setAttribute('hidden', '');
    });

    // Listings statistics
    document.getElementById('stats-btn')?.addEventListener('click', () => {
      if (window.FD_STATS) window.FD_STATS.open();
      optionsMenu?.setAttribute('hidden', '');
    });

    // CSV export
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
      optionsMenu?.setAttribute('hidden', '');
    });

    // GeoJSON export
    document.getElementById('export-geojson-btn')?.addEventListener('click', () => {
      optionsMenu?.setAttribute('hidden', '');
    });

    // JSON export
    document.getElementById('export-json-btn')?.addEventListener('click', () => {
      if (window.FD_LIST && typeof window.FD_LIST.exportFiltered === 'function') {
        window.FD_LIST.exportFiltered();
      }
      optionsMenu?.setAttribute('hidden', '');
    });

    // Clear favorites
    document.getElementById('clear-favorites-btn')?.addEventListener('click', () => {
      if (window.FD_LIST && typeof window.FD_LIST.clearFavorites === 'function') {
        window.FD_LIST.clearFavorites();
      }
      optionsMenu?.setAttribute('hidden', '');
    });

    // Demo helpers
    document.getElementById('export-demo-btn')?.addEventListener('click', async () => {
      if (window.FD_API && window.FD_API.exportDemoData) {
        const res = await window.FD_API.exportDemoData();
        if (window.FD_TOAST) window.FD_TOAST.show(res.ok ? `Exported ${res.count} listings` : (res.error || 'Export failed'), res.ok ? 'success' : 'error');
      }
    });
    document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
      if (confirm('Reset local demo listings to seed data?')) {
        if (window.FD_API && window.FD_API.resetDemoListings) window.FD_API.resetDemoListings();
        if (window.FD_TOAST) window.FD_TOAST.show('Demo reset – reloading', 'info');
        setTimeout(() => location.reload(), 500);
      }
    });

    // Locate / Fit buttons
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (window.FD_MAP) window.FD_MAP.locateMe();
    });
    document.getElementById('clear-location-btn')?.addEventListener('click', () => {
      if (window.FD_MAP) window.FD_MAP.clearLocation();
    });
    document.getElementById('fit-all-btn')?.addEventListener('click', () => {
      if (window.FD_MAP) window.FD_MAP.fitAll();
    });

    // Lightbox close
    document.querySelector('#image-lightbox .close-card')?.addEventListener('click', () => {
      if (window.FD_CARDS) window.FD_CARDS.closeLightbox();
    });
    document.getElementById('image-lightbox')?.addEventListener('click', (e) => {
      if (e.target.id === 'image-lightbox' && window.FD_CARDS) window.FD_CARDS.closeLightbox();
    });

    // Offline banner dismiss
    document.getElementById('dismiss-offline-banner')?.addEventListener('click', () => {
      const banner = document.getElementById('offline-banner');
      if (banner) banner.setAttribute('hidden', '');
      try { sessionStorage.setItem('fd-offline-banner-dismissed', '1'); } catch (_) {}
    });

    // Load data
    loadListings();
  }

  function updateDataSourceBadge(source, health) {
    const badge = document.getElementById('data-source-badge');
    if (!badge) return;
    badge.hidden = false;
    if (source === 'api') {
      badge.textContent = 'LIVE';
      badge.title = 'Live Worker data';
      badge.className = 'data-source-badge source-api';
    } else if (source === 'api-empty') {
      badge.textContent = 'API+SEED';
      badge.title = 'Worker reachable but no published listings – showing seed. Click for migration steps.';
      badge.className = 'data-source-badge source-api-empty';
    } else if (source === 'seed') {
      badge.textContent = health && health.ok ? 'SEED (API up)' : 'SEED';
      badge.title = health && health.ok
        ? 'Using seed (Worker reachable but listings empty or failed) – click for steps'
        : 'Using seed listings (Worker offline or undeployed) – click for deploy steps';
      badge.className = 'data-source-badge source-seed';
    } else if (source === 'demo') {
      badge.textContent = 'DEMO';
      badge.title = 'Demo mode – local changes persist until Worker is live – click for deploy steps';
      badge.className = 'data-source-badge source-demo';
    } else {
      badge.hidden = true;
      badge.textContent = '';
    }
  }

  function showOfflineBanner(source, health) {
    const banner = document.getElementById('offline-banner');
    const text = document.getElementById('offline-banner-text');
    if (!banner || !text) return;
    try {
      if (sessionStorage.getItem('fd-offline-banner-dismissed') === '1') return;
    } catch (_) {}
    if (source === 'seed') {
      text.textContent = health && health.ok
        ? 'Worker is reachable but returned no published listings. Showing seed data. Apply auth migration and publish listings for live data.'
        : 'Using seed listings (Worker offline or undeployed). Changes are not saved until the Worker is live.';
    } else if (source === 'demo') {
      text.textContent = 'Demo mode – local changes persist. Connect the live Worker via Options for real data.';
    } else if (source === 'api-empty') {
      text.textContent = 'Worker is live but has no published listings yet. Showing seed data so the map stays usable. Apply the auth migration and publish from the dashboard for live listings.';
    } else {
      return;
    }
    banner.removeAttribute('hidden');
  }

  async function loadListings() {
    if (!window.FD_API || !window.FD_LIST) return;
    try {
      const result = await window.FD_API.fetchListings();
      window.FD_LIST.setListings(result.listings || []);
      const src = result.source || 'unknown';
      const health = result.health;
      updateDataSourceBadge(src, health);
      if (window.FD_TOAST) {
        const msg = src === 'api' ? `Loaded ${result.count || result.listings.length} live listings` :
                    src === 'api-empty' ? `Worker live but empty – showing ${result.count || 0} seed listings` :
                    src === 'demo' ? 'Demo mode (local changes persist)' :
                    src === 'seed' ? (health && health.ok ? 'Using seed (Worker reachable)' : 'Using seed listings (Worker offline)') :
                    'No listings loaded';
        window.FD_TOAST.show(msg, src === 'api' ? 'success' : 'info');
      }
      showOfflineBanner(src, health);
      // Deep link support
      const hash = location.hash || '';
      const m = hash.match(/#listing=([^&]+)/);
      if (m && window.FD_LIST.select) {
        window.FD_LIST.select(decodeURIComponent(m[1]));
      }
    } catch (err) {
      console.error(err);
      if (window.FD_TOAST) window.FD_TOAST.show('Failed to load listings', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
