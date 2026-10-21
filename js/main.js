/**
 * FarmDirect B2B – main bootstrap
 * Wires map, list, cards, form, dashboard, RFQ, options menu, seed banner,
 * theme, deep links, and data loading (API or seed/demo fallback).
 * + refreshes RFQ badge after data load.
 * + wires buyer My quote requests view.
 * + wires recently viewed modal.
 * + wires copy map view link (#map=lat,lng,zoom).
 */
(function (global) {
  'use strict';

  function showToast(msg, type) {
    if (global.FD_TOAST) global.FD_TOAST.show(msg, type || 'info');
  }

  function initTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('fd-theme');
    const dark = stored === 'dark' || (!stored && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('fd-theme', isDark ? 'dark' : 'light');
    showToast(isDark ? 'Dark theme' : 'Light theme', 'info');
  }

  function bindOptions() {
    const btn = document.getElementById('options-btn');
    const menu = document.getElementById('options-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    document.addEventListener('click', () => menu.classList.remove('open'));

    document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);

    document.getElementById('set-api-btn')?.addEventListener('click', () => {
      const current = localStorage.getItem('fd-api-base') || (global.FD_CONFIG && global.FD_CONFIG.API_BASE) || '';
      const val = prompt('API base URL (empty to clear)', current);
      if (val === null) return;
      if (val.trim()) {
        localStorage.setItem('fd-api-base', val.trim());
        showToast('API base saved – reload to apply', 'success');
      } else {
        localStorage.removeItem('fd-api-base');
        showToast('API base cleared – reload to apply', 'info');
      }
    });

    document.getElementById('clear-api-btn')?.addEventListener('click', () => {
      localStorage.removeItem('fd-api-base');
      showToast('API base cleared – reload to apply', 'info');
    });

    document.getElementById('export-demo-btn')?.addEventListener('click', async () => {
      if (global.FD_API && global.FD_API.exportDemoData) {
        const res = await global.FD_API.exportDemoData();
        if (res.ok) showToast(`Exported ${res.count} listings`, 'success');
        else showToast(res.error || 'Export failed', 'error');
      }
    });

    document.getElementById('import-demo-btn')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (global.FD_API && global.FD_API.importDemoData) {
            const res = global.FD_API.importDemoData(data);
            if (res.ok) {
              showToast(`Imported ${res.count} listings – reloading…`, 'success');
              setTimeout(() => location.reload(), 800);
            } else showToast(res.error || 'Import failed', 'error');
          }
        } catch (err) {
          showToast('Invalid JSON: ' + err.message, 'error');
        }
      };
      input.click();
    });

    document.getElementById('export-filtered-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.exportFiltered) global.FD_LIST.exportFiltered();
    });

    document.getElementById('copy-view-link-btn')?.addEventListener('click', () => {
      const url = location.href;
      navigator.clipboard.writeText(url).then(() => showToast('View link copied', 'success'))
        .catch(() => showToast('Could not copy link', 'error'));
    });

    document.getElementById('copy-map-link-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && typeof global.FD_MAP.getMapViewLink === 'function') {
        const url = global.FD_MAP.getMapViewLink();
        navigator.clipboard.writeText(url).then(() => showToast('Map view link copied', 'success'))
          .catch(() => showToast('Could not copy map link', 'error'));
      } else {
        showToast('Map not ready', 'error');
      }
    });

    document.getElementById('clear-favorites-btn')?.addEventListener('click', () => {
      if (confirm('Clear all favorites?')) {
        if (global.FD_LIST && global.FD_LIST.clearFavorites) global.FD_LIST.clearFavorites();
      }
    });

    document.getElementById('my-rfqs-btn')?.addEventListener('click', () => {
      if (global.FD_RFQ && typeof global.FD_RFQ.openMyRfqs === 'function') {
        global.FD_RFQ.openMyRfqs();
      }
    });

    document.getElementById('recent-btn')?.addEventListener('click', () => {
      if (global.FD_RECENT && typeof global.FD_RECENT.open === 'function') {
        global.FD_RECENT.open();
      }
    });

    document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
      if (confirm('Reset demo data to seed? Local changes will be lost.')) {
        if (global.FD_API && global.FD_API.resetDemoListings) {
          global.FD_API.resetDemoListings();
          showToast('Demo data reset – reloading…', 'info');
          setTimeout(() => location.reload(), 600);
        }
      }
    });

    document.getElementById('deploy-modal-btn')?.addEventListener('click', openDeployModal);
  }

  function openDeployModal() {
    document.getElementById('deploy-modal')?.classList.add('open');
  }
  function closeDeployModal() {
    document.getElementById('deploy-modal')?.classList.remove('open');
  }

  function bindDeployModal() {
    document.getElementById('close-deploy-btn')?.addEventListener('click', closeDeployModal);
    document.getElementById('deploy-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deploy-modal') closeDeployModal();
    });
    document.getElementById('copy-deploy-btn')?.addEventListener('click', () => {
      const text = document.getElementById('deploy-commands')?.textContent || '';
      navigator.clipboard.writeText(text).then(() => showToast('Commands copied', 'success'))
        .catch(() => showToast('Could not copy', 'error'));
    });
  }

  function bindSeedBanner() {
    const banner = document.getElementById('seed-banner');
    if (!banner) return;
    // Show if no API base
    const apiBase = (global.FD_CONFIG && global.FD_CONFIG.API_BASE) || localStorage.getItem('fd-api-base');
    if (!apiBase) banner.classList.remove('hidden');
    document.getElementById('close-banner')?.addEventListener('click', () => banner.classList.add('hidden'));
    document.getElementById('deploy-guide-btn')?.addEventListener('click', openDeployModal);
  }

  function bindTopBar() {
    document.getElementById('locate-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.locateMe) global.FD_MAP.locateMe();
      document.getElementById('clear-location-btn')?.removeAttribute('hidden');
    });
    document.getElementById('clear-location-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.clearLocation) global.FD_MAP.clearLocation();
      document.getElementById('clear-location-btn')?.setAttribute('hidden', '');
    });
    document.getElementById('fit-btn')?.addEventListener('click', () => {
      if (global.FD_MAP && global.FD_MAP.fitAll) global.FD_MAP.fitAll();
    });
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (global.FD_DASHBOARD && global.FD_DASHBOARD.openDashboard) global.FD_DASHBOARD.openDashboard();
    });
  }

  function bindLightbox() {
    const lb = document.getElementById('image-lightbox');
    if (!lb) return;
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.id === 'lightbox-img') {
        if (global.FD_CARDS && global.FD_CARDS.closeLightbox) global.FD_CARDS.closeLightbox();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (global.FD_CARDS) global.FD_CARDS.closeLightbox();
        document.getElementById('filter-card')?.classList.remove('open');
        document.getElementById('options-menu')?.classList.remove('open');
      }
    });
  }

  async function loadData() {
    const overlay = document.getElementById('map-overlay');
    try {
      const result = await (global.FD_API && global.FD_API.fetchListings ? global.FD_API.fetchListings() : Promise.resolve({ listings: [] }));
      if (global.FD_LIST && global.FD_LIST.setListings) {
        global.FD_LIST.setListings(result.listings || []);
      }
      // Deep link
      const hash = location.hash;
      if (hash.startsWith('#listing=')) {
        const id = decodeURIComponent(hash.slice(9));
        if (global.FD_LIST && global.FD_LIST.select) global.FD_LIST.select(id);
      }
      if (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.updateRfqBadge === 'function') {
        global.FD_DASHBOARD.updateRfqBadge();
      }
    } catch (err) {
      showToast('Failed to load listings: ' + err.message, 'error');
    } finally {
      if (overlay) overlay.classList.add('hidden');
    }
  }

  function init() {
    initTheme();
    if (global.FD_MAP && global.FD_MAP.initMap) global.FD_MAP.initMap();
    if (global.FD_LIST && global.FD_LIST.bindUI) global.FD_LIST.bindUI();
    if (global.FD_FORM && global.FD_FORM.bindForm) global.FD_FORM.bindForm();
    if (global.FD_DASHBOARD && global.FD_DASHBOARD.bindDashboard) global.FD_DASHBOARD.bindDashboard();
    if (global.FD_RFQ && global.FD_RFQ.bind) global.FD_RFQ.bind();
    if (global.FD_RECENT && global.FD_RECENT.bind) global.FD_RECENT.bind();
    bindOptions();
    bindDeployModal();
    bindSeedBanner();
    bindTopBar();
    bindLightbox();
    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
