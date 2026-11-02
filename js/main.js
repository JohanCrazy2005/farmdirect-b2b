/**
 * FarmDirect B2B – bootstrap
 * Initializes map, list, loads listings via FD_API (seed/demo fallback),
 * wires top-bar UI, options, banners, and calls bind() on other modules.
 * Fully client-side; works offline with seed data.
 * Supports deep links: #listing=ID opens the matching product card after load.
 * Also supports shareable filtered views via hash params (cat, seller, vis, etc.).
 * Supports shareable map views via #map=lat,lng,zoom.
 */
(function (global) {
  'use strict';

  function showBanner(source, health) {
    const banner = document.getElementById('offline-banner');
    const badge = document.getElementById('data-source-badge');
    const text = document.getElementById('banner-text');
    if (!banner || !badge) return;

    const isLive = source === 'api';
    const demoInfo = (global.FD_API && typeof global.FD_API.getDemoInfo === 'function')
      ? global.FD_API.getDemoInfo() : { hasDemo: false, count: 0, source: null };
    const checkedAt = new Date().toISOString();

    badge.hidden = false;
    badge.dataset.source = isLive ? 'live' : (source || 'seed');
    badge.textContent = isLive ? 'LIVE' : (source || 'SEED').toUpperCase();
    badge.title = `Source: ${source || 'unknown'} · checked ${checkedAt.slice(11,19)} UTC`
      + (demoInfo.hasDemo ? ` · ${demoInfo.count} local demo overrides` : '');

    if (isLive) {
      banner.hidden = true;
      return;
    }

    let msg = 'Showing seed/demo data — live Worker not reachable or empty.';
    if (source === 'api-empty') msg = 'Worker is reachable but has no published listings yet. Showing seed data.';
    else if (source === 'demo') msg = 'Showing local demo data (edits persist in this browser).';
    else if (source === 'seed') msg = 'Showing seed data (offline / undeployed Worker).';
    if (demoInfo.hasDemo && source !== 'demo') {
      msg += ` (${demoInfo.count} local overrides present — use Force pure seed to clear).`;
    }
    if (text) text.textContent = msg;
    banner.hidden = false;

    // Store for details modal
    global._fdLastSource = { source, health, message: msg, checkedAt, demoInfo };

    // First-run onboarding for seed/demo/api-empty
    if (global.FD_ONBOARDING && typeof global.FD_ONBOARDING.maybeShow === 'function') {
      global.FD_ONBOARDING.maybeShow(source);
    }
  }

  function openSourceModal() {
    const modal = document.getElementById('data-source-modal');
    const content = document.getElementById('source-content');
    if (!modal || !content) return;
    const info = global._fdLastSource || {};
    const demo = info.demoInfo || {};
    const checked = info.checkedAt ? info.checkedAt.replace('T', ' ').slice(0, 19) + ' UTC' : 'just now';
    content.innerHTML = `
      <p><strong>Source:</strong> ${info.source || 'unknown'}</p>
      <p>${info.message || ''}</p>
      <p class="small">Health: ${info.health ? (info.health.ok ? 'reachable' : (info.health.error || 'offline')) : 'n/a'}</p>
      <p class="small">Last checked: ${checked}</p>
      <p class="small">Local demo overrides: ${demo.hasDemo ? demo.count + ' listing(s) in localStorage' : 'none'}</p>
      <p class="small">Use the <strong>Retry live</strong> button on the banner to re-check the Worker without reloading.</p>
      <p class="small">Use <strong>Load pure seed data</strong> in Options to clear local overrides.</p>
      <p class="small">Open <strong>Seed/demo tips</strong>, <strong>Welcome tour</strong>, <strong>Demo status</strong>, or <strong>Filter presets</strong> in Options for guided offline help.</p>
      <p class="small">Next steps (optional, user action):</p>
      <ul class="small">
        <li>Apply RFQ migration: <code>npx wrangler d1 execute b2bistening --remote --file=./schema/rfq-migration.sql</code></li>
        <li>Add GitHub Actions secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) for auto-deploy</li>
        <li>Or continue with seed/demo — fully client-side</li>
      </ul>
      <p class="small">See README.md and the Deploy steps button for exact commands.</p>
    `;
    modal.classList.add('open');
  }

  /**
   * If the URL hash contains #listing=ID, select that listing once the list is loaded.
   * Also applies any filter params (cat, seller, vis, units, min, max, fav, nearby, inview, sort, q)
   * for shareable filtered views. Makes Share links and filtered-view links work in seed/demo mode.
   * Fully client-side. Also applies #map=lat,lng,zoom if present.
   */
  function maybeOpenHashListing() {
    const hash = (location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(hash);
    // Apply any filter params first (seed/demo shareable filtered views)
    if (global.FD_LIST && typeof global.FD_LIST.applyFiltersFromParams === 'function') {
      global.FD_LIST.applyFiltersFromParams(params);
    }
    if (global.FD_MAP && typeof global.FD_MAP.applyMapViewFromHash === 'function') {
      global.FD_MAP.applyMapViewFromHash();
    }
    const id = params.get('listing');
    if (!id) return;
    if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
      // Small delay so list render finishes
      setTimeout(() => {
        global.FD_LIST.select(id);
      }, 180);
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
    document.getElementById('open-onboarding')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_ONBOARDING && typeof global.FD_ONBOARDING.open === 'function') global.FD_ONBOARDING.open();
    });
    document.getElementById('open-notes')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_NOTES && typeof global.FD_NOTES.open === 'function') global.FD_NOTES.open();
    });
    document.getElementById('open-tags')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_TAGS && typeof global.FD_TAGS.open === 'function') global.FD_TAGS.open();
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
    document.getElementById('import-demo')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const res = await (global.FD_API && global.FD_API.importDemoData ? global.FD_API.importDemoData(text) : Promise.resolve({ ok: false, error: 'Import unavailable' }));
          if (global.FD_TOAST) global.FD_TOAST.show(res.ok ? `Imported ${res.count || 0} listings` : (res.error || 'Import failed'), res.ok ? 'success' : 'error');
          if (res.ok) loadAndRender();
        } catch (err) {
          if (global.FD_TOAST) global.FD_TOAST.show(err.message || 'Import failed', 'error');
        }
      };
      input.click();
    });
    document.getElementById('reload-listings')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_TOAST) global.FD_TOAST.show('Reloading listings…', 'info');
      loadAndRender();
    });
    document.getElementById('force-seed')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (confirm('Clear local demo overrides and load pure seed data?')) {
        if (global.FD_API && global.FD_API.resetDemoListings) global.FD_API.resetDemoListings();
        if (global.FD_TOAST) global.FD_TOAST.show('Loading pure seed data…', 'info');
        loadAndRender();
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
    document.getElementById('copy-filtered-link')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_LIST && typeof global.FD_LIST.copyFilteredLink === 'function') {
        global.FD_LIST.copyFilteredLink();
      }
    });
    document.getElementById('copy-map-view')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_MAP && typeof global.FD_MAP.getMapViewLink === 'function') {
        const link = global.FD_MAP.getMapViewLink();
        navigator.clipboard.writeText(link).then(() => {
          if (global.FD_TOAST) global.FD_TOAST.show('Map view link copied', 'success');
        }).catch(() => {
          if (global.FD_TOAST) global.FD_TOAST.show('Copy failed — select and copy manually', 'error');
        });
      }
    });
    document.getElementById('reset-map-view')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_MAP && typeof global.FD_MAP.resetToDefault === 'function') {
        global.FD_MAP.resetToDefault();
      }
    });
    document.getElementById('export-filtered-json')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_LIST && typeof global.FD_LIST.exportFilteredJson === 'function') {
        global.FD_LIST.exportFilteredJson();
      }
    });
    document.getElementById('copy-filter-summary')?.addEventListener('click', () => {
      menu?.setAttribute('hidden', '');
      if (global.FD_LIST && typeof global.FD_LIST.copyFilterSummary === 'function') {
        global.FD_LIST.copyFilterSummary();
      }
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
    ['auth-modal', 'dashboard-modal', 'listing-form-modal', 'sellers-modal', 'deploy-modal', 'shortcuts-modal', 'data-source-modal', 'seedtips-modal', 'onboarding-modal', 'demostatus-modal', 'localmanager-modal', 'quality-modal', 'presets-modal', 'notes-modal', 'tags-modal', 'compare-modal', 'recent-modal', 'stats-modal'].forEach(id => {
      const modal = document.getElementById(id);
      modal?.addEventListener('click', (e) => {
        if (e.target.id === id) modal.classList.remove('open');
      });
    });
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => document.getElementById('deploy-modal')?.classList.remove('open'));
    document.getElementById('close-shortcuts-btn')?.addEventListener('click', () => document.getElementById('shortcuts-modal')?.classList.remove('open'));
    document.getElementById('close-source-btn')?.addEventListener('click', () => document.getElementById('data-source-modal')?.classList.remove('open'));
    document.getElementById('close-seedtips-btn')?.addEventListener('click', () => document.getElementById('seedtips-modal')?.classList.remove('open'));
    document.getElementById('close-onboarding-btn')?.addEventListener('click', () => document.getElementById('onboarding-modal')?.classList.remove('open'));
    document.getElementById('close-demostatus-btn')?.addEventListener('click', () => document.getElementById('demostatus-modal')?.classList.remove('open'));
    document.getElementById('close-localmanager-btn')?.addEventListener('click', () => document.getElementById('localmanager-modal')?.classList.remove('open'));
    document.getElementById('close-quality-btn')?.addEventListener('click', () => document.getElementById('quality-modal')?.classList.remove('open'));
    document.getElementById('close-presets-btn')?.addEventListener('click', () => document.getElementById('presets-modal')?.classList.remove('open'));
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
    document.getElementById('banner-retry')?.addEventListener('click', () => {
      if (global.FD_TOAST) global.FD_TOAST.show('Retrying live API…', 'info');
      loadAndRender();
    });
    document.getElementById('banner-deploy')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
    });
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
    if (global.FD_SEEDTIPS && typeof global.FD_SEEDTIPS.bind === 'function') global.FD_SEEDTIPS.bind();
    if (global.FD_ONBOARDING && typeof global.FD_ONBOARDING.bind === 'function') global.FD_ONBOARDING.bind();
    if (global.FD_DEMOSTATUS && typeof global.FD_DEMOSTATUS.bind === 'function') global.FD_DEMOSTATUS.bind();
    if (global.FD_LOCALMANAGER && typeof global.FD_LOCALMANAGER.bind === 'function') global.FD_LOCALMANAGER.bind();
    if (global.FD_QUALITY && typeof global.FD_QUALITY.bind === 'function') global.FD_QUALITY.bind();
    if (global.FD_PRESETS && typeof global.FD_PRESETS.bind === 'function') global.FD_PRESETS.bind();
    if (global.FD_NOTES && typeof global.FD_NOTES.bind === 'function') global.FD_NOTES.bind();
    if (global.FD_TAGS && typeof global.FD_TAGS.bind === 'function') global.FD_TAGS.bind();

    setupOptions();
    setupFilterCard();
    setupSidebar();
    setupModalsClose();
    setupBanner();
    setupProfile();
    setupAddButtons();
    setupKeyboard();

    // Deep-link + filtered-view + map-view support (seed/demo UX)
    window.addEventListener('hashchange', maybeOpenHashListing);

    loadAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
