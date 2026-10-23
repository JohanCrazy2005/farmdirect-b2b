/**
 * FarmDirect B2B – main bootstrap
 * Wires Leaflet map, list, cards, search, dashboard, form, auth, options.
 * Loads listings from live Worker or falls back to seed/demo automatically.
 */
(function () {
  'use strict';

  function init() {
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

    // Profile → dashboard
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (window.FD_DASHBOARD) window.FD_DASHBOARD.openDashboard();
    });

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
    document.getElementById('show-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
      optionsMenu?.setAttribute('hidden', '');
    });
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.remove('open');
    });
    document.getElementById('deploy-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deploy-modal') e.target.classList.remove('open');
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

  function showOfflineBanner(source) {
    const banner = document.getElementById('offline-banner');
    const text = document.getElementById('offline-banner-text');
    if (!banner || !text) return;
    try {
      if (sessionStorage.getItem('fd-offline-banner-dismissed') === '1') return;
    } catch (_) {}
    if (source === 'seed') {
      text.textContent = 'Using seed listings (Worker offline or undeployed). Changes are not saved until the Worker is live.';
    } else if (source === 'demo') {
      text.textContent = 'Demo mode – local changes persist. Connect the live Worker via Options for real data.';
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
      if (window.FD_TOAST) {
        const msg = src === 'api' ? `Loaded ${result.count || result.listings.length} live listings` :
                    src === 'demo' ? 'Demo mode (local changes persist)' :
                    src === 'seed' ? 'Using seed listings (Worker offline)' :
                    'No listings loaded';
        window.FD_TOAST.show(msg, src === 'api' ? 'success' : 'info');
      }
      showOfflineBanner(src);
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
