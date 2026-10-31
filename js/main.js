/**
 * FarmDirect B2B – bootstrap
 * Initializes map, list, loads listings via FD_API (seed/demo fallback),
 * wires top-bar UI, options, banners, and calls bind() on other modules.
 * Fully client-side; works offline with seed data.
 * Supports deep links: #listing=ID opens the matching product card after load.
 */
(function (global) {
  'use strict';

  function showBanner(source, health) {
    const banner = document.getElementById('offline-banner');
    const badge = document.getElementById('data-source-badge');
    const text = document.getElementById('banner-text');
    if (!banner || !badge) return;

    const isLive = source === 'api';
    badge.hidden = false;
    badge.dataset.source = isLive ? 'live' : (source || 'seed');
    badge.textContent = isLive ? 'LIVE' : (source || 'SEED').toUpperCase();

    if (isLive) {
      banner.hidden = true;
      return;
    }

    let msg = 'Showing seed/demo data — live Worker not reachable or empty.';
    if (source === 'api-empty') msg = 'Worker is reachable but has no published listings yet. Showing seed data.';
    else if (source === 'demo') msg = 'Showing local demo data (edits persist in this browser).';
    else if (source === 'seed') msg = 'Showing seed data (offline / undeployed Worker).';
    if (text) text.textContent = msg;
    banner.hidden = false;

    // Store for details modal
    global._fdLastSource = { source, health, message: msg };
  }

  function openSourceModal() {
    const modal = document.getElementById('data-source-modal');
    const content = document.getElementById('source-content');
    if (!modal || !content) return;
    const info = global._fdLastSource || {};
    content.innerHTML = `
      <p><strong>Source:</strong> ${info.source || 'unknown'}</p>
      <p>${info.message || ''}</p>
      <p class="small">Health: ${info.health ? (info.health.ok ? 'reachable' : (info.health.error || 'offline')) : 'n/a'}</p>
      <p class="small">Next: apply optional RFQ migration if needed, add GitHub Actions secrets for auto-deploy, or keep using seed/demo.</p>
    `;
    modal.classList.add('open');
  }

  /**
   * If the URL hash contains #listing=ID, select that listing once the list is loaded.
   * Makes Share links work in seed/demo mode. Fully client-side.
   */
  function maybeOpenHashListing() {
    const hash = (location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const id = params.get('listing');
    if (!id) return;
    if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
      // Small delay so list render finishes
      setTimeout(() => {
        global.FD_LIST.select(id);
      }, 120);
    }
  }

  async function loadAndRender() {
    if (!global.FD_API || typeof global.FD_API.fetchListings !== 'function') {
      console.warn('FD_API unavailable');
      return;
    }
    const result = await global.FD_API.fetchListings();
    if (global.FD_LIST && typeof global.FD_LIST.setListings === 'function') {
      global.FD_LIST.setListings(result.listings || []);
    }
    showBanner(result.source, result.health);
    if (global.FD_TOAST && result.source !== 'api') {
      global.FD_TOAST.show(`Loaded ${result.count || 0} listings (${result.source})`, 'info');
    }
    maybeOpenHashListing();
  }

  function setupTheme() {
    const stored = localStorage.getItem('fd-theme');
    if (stored === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.checked = stored === 'dark';
      toggle.addEventListener('change', () => {
        const dark = toggle.checked;
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
        localStorage.setItem('fd-theme', dark ? 'dark' : 'light');
      });
    }
  }

  function setupOptions() {
    const menu = document.getElementById('options-menu');
    const btn = document.getElementById('options-btn');
    btn?.addEventListener('click', () => {
      if (!menu) return;
      const open = menu.hasAttribute('hidden');
      menu.toggleAttribute('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('close-options')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      btn?.setAttribute('aria-expanded', 'false');
    });

    const apiInput = document.getElementById('api-base-input');
    if (apiInput && global.FD_CONFIG) apiInput.value = global.FD_CONFIG.API_BASE || '';
    document.getElementById('save-api-base')?.addEventListener('click', () => {
      const val = apiInput?.value.trim();
      if (val) {
        try { localStorage.setItem('fd-api-base', val); } catch (_) {}
        if (global.FD_CONFIG) global.FD_CONFIG.API_BASE = val;
        if (global.FD_TOAST) global.FD_TOAST.show('API base saved — reload to apply', 'success');
      }
    });

    document.getElementById('open-sellers')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_SELLERS && global.FD_SELLERS.open) global.FD_SELLERS.open();
    });
    document.getElementById('open-deploy')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      document.getElementById('deploy-modal')?.classList.add('open');
    });
    document.getElementById('open-recent')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_RECENT && typeof global.FD_RECENT.open === 'function') global.FD_RECENT.open();
    });
    document.getElementById('open-stats')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_STATS && typeof global.FD_STATS.open === 'function') global.FD_STATS.open();
    });
    document.getElementById('export-demo')?.addEventListener('click', async () => {
      if (global.FD_API && global.FD_API.exportDemoData) {
        const res = await global.FD_API.exportDemoData();
        if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? `Exported ${res.count} listings` : (res.error || 'Export failed'), res.ok ? 'success' : 'error');
      }
    });
    document.getElementById('download-demo')?.addEventListener('click', () => {
      if (global.FD_API && global.FD_API.downloadDemoBackup) {
        const res = global.FD_API.downloadDemoBackup();
        if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? 'Backup downloaded' : (res.error || 'Download failed'), res.ok ? 'success' : 'error');
      }
    });
    document.getElementById('reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset local demo listings and reload seed data?')) {
        if (global.FD_API && global.FD_API.resetDemoListings) global.FD_API.resetDemoListings();
        loadAndRender();
        if (global.FD_TOAST) global.FD_TOAST.show('Demo data reset', 'info');
      }
    });
    document.getElementById('open-shortcuts')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      document.getElementById('shortcuts-modal')?.classList.add('open');
    });
  }

  function setupFilterCard() {
    const card = document.getElementById('filter-card');
    const btn = document.getElementById('filter-btn');
    btn?.addEventListener('click', () => {
      if (!card) return;
      const open = card.hasAttribute('hidden');
      card.toggleAttribute('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('close-filter')?.addEventListener('click', () => {
      card?.setAttribute('hidden', '');
      btn?.setAttribute('aria-expanded', 'false');
    });
  }

  function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });
  }

  function setupModalsClose() {
    ['auth-modal', 'dashboard-modal', 'listing-form-modal', 'sellers-modal', 'deploy-modal', 'shortcuts-modal', 'data-source-modal', 'compare-modal', 'recent-modal', 'stats-modal'].forEach(id => {
      const modal = document.getElementById(id);
      modal?.addEventListener('click', (e) => {
        if (e.target.id === id) modal.classList.remove('open');
      });
    });
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => document.getElementById('deploy-modal')?.classList.remove('open'));
    document.getElementById('close-shortcuts-btn')?.addEventListener('click', () => document.getElementById('shortcuts-modal')?.classList.remove('open'));
    document.getElementById('close-source-btn')?.addEventListener('click', () => document.getElementById('data-source-modal')?.classList.remove('open'));
    document.getElementById('image-lightbox')?.addEventListener('click', () => {
      if (global.FD_CARDS && global.FD_CARDS.closeLightbox) global.FD_CARDS.closeLightbox();
      else document.getElementById('image-lightbox')?.classList.remove('open');
    });
  }

  function setupBanner() {
    document.getElementById('banner-dismiss')?.addEventListener('click', () => {
      document.getElementById('offline-banner')?.setAttribute('hidden', '');
    });
    document.getElementById('banner-details')?.addEventListener('click', openSourceModal);
    document.getElementById('data-source-badge')?.addEventListener('click', openSourceModal);
  }

  function setupProfile() {
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (global.FD_DASHBOARD && global.FD_DASHBOARD.openDashboard) global.FD_DASHBOARD.openDashboard();
    });
  }

  function setupAddButtons() {
    document.getElementById('add-listing-btn')?.addEventListener('click', () => {
      if (global.FD_FORM && global.FD_FORM.openForm) global.FD_FORM.openForm();
    });
    document.getElementById('sample-listing-btn')?.addEventListener('click', () => {
      if (global.FD_FORM && global.FD_FORM.openSampleForm) global.FD_FORM.openSampleForm();
    });
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
        document.getElementById('product-card')?.classList.remove('open');
        document.getElementById('seller-card')?.classList.remove('open');
        document.getElementById('search-suggestions')?.setAttribute('hidden', '');
      }
    });
  }

  function init() {
    setupTheme();
    if (global.FD_MAP && global.FD_MAP.initMap) global.FD_MAP.initMap();
    if (global.FD_LIST && global.FD_LIST.bind) global.FD_LIST.bind();
    if (global.FD_SEARCH && global.FD_SEARCH.bind) global.FD_SEARCH.bind();
    if (global.FD_AUTH && global.FD_AUTH.bindAuth) global.FD_AUTH.bindAuth();
    if (global.FD_DASHBOARD && global.FD_DASHBOARD.bindDashboard) global.FD_DASHBOARD.bindDashboard();
    if (global.FD_FORM && global.FD_FORM.bindForm) global.FD_FORM.bindForm();
    if (global.FD_SELLERS && global.FD_SELLERS.bind) global.FD_SELLERS.bind();
    if (global.FD_LAYERS && global.FD_LAYERS.bind) global.FD_LAYERS.bind();
    if (global.FD_FULLSCREEN && global.FD_FULLSCREEN.bind) global.FD_FULLSCREEN.bind();
    if (global.FD_RFQ && typeof global.FD_RFQ.bind === 'function') global.FD_RFQ.bind();
    if (global.FD_SHORTCUTS && typeof global.FD_SHORTCUTS.bind === 'function') global.FD_SHORTCUTS.bind();
    if (global.FD_COMPARE && typeof global.FD_COMPARE.bind === 'function') global.FD_COMPARE.bind();
    if (global.FD_CSV && typeof global.FD_CSV.bind === 'function') global.FD_CSV.bind();
    if (global.FD_GEOJSON && typeof global.FD_GEOJSON.bind === 'function') global.FD_GEOJSON.bind();
    if (global.FD_RECENT && typeof global.FD_RECENT.bind === 'function') global.FD_RECENT.bind();
    if (global.FD_STATS && typeof global.FD_STATS.bind === 'function') global.FD_STATS.bind();

    setupOptions();
    setupFilterCard();
    setupSidebar();
    setupModalsClose();
    setupBanner();
    setupProfile();
    setupAddButtons();
    setupKeyboard();

    // Deep-link support (seed/demo UX)
    window.addEventListener('hashchange', maybeOpenHashListing);

    loadAndRender();

    // On narrow screens start with sidebar closed
    if (window.innerWidth < 900) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
