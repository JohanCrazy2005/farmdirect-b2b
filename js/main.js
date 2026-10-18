/**
 * FarmDirect B2B – app bootstrap
 * Theme (system + persisted), options menu, mobile sidebar toggle, a11y hooks
 * Polished loading / empty state coordination
 * Wires add-listing form and seller dashboard
 * Shows dismissible seed-mode banner when Worker is undeployed
 */
(function () {
  'use strict';

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('fd-theme', theme);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = isDark ? '☾' : '☀';
    btn?.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }

  function initTheme() {
    const stored = localStorage.getItem('fd-theme');
    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
    // Listen for system changes only if no explicit preference
    if (!stored && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        applyTheme(e.matches ? 'dark' : 'light');
      });
    }
  }

  function hideMapOverlay() {
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    // Init map
    if (window.FD_MAP) FD_MAP.initMap();

    // Bind filters / list
    if (window.FD_LIST) FD_LIST.bindUI();

    // Bind form
    if (window.FD_FORM) FD_FORM.bindForm();

    // Bind dashboard
    if (window.FD_DASHBOARD) FD_DASHBOARD.bindDashboard();

    // Load data (API or seed)
    const statusEl = document.getElementById('data-status');
    if (statusEl) statusEl.textContent = 'Loading…';

    const result = await (window.FD_API ? FD_API.fetchListings() : Promise.resolve({ listings: [], source: 'none' }));

    if (window.FD_LIST) FD_LIST.setListings(result.listings);

    // Hide map loading overlay once data is ready (list.js will re-show if empty)
    hideMapOverlay();

    if (statusEl) {
      const badge = result.source === 'seed'
        ? '<span class="source-badge seed">seed fallback</span>'
        : result.source === 'api'
          ? '<span class="source-badge">live API</span>'
          : '<span class="source-badge">no data</span>';
      statusEl.innerHTML = `${result.count} listings ${badge}`;
    }

    // Seed-mode banner
    const seedBanner = document.getElementById('seed-banner');
    if (seedBanner && result.source === 'seed') {
      seedBanner.classList.remove('hidden');
      document.getElementById('close-seed-banner')?.addEventListener('click', () => {
        seedBanner.classList.add('hidden');
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    // Options menu
    const optionsBtn = document.getElementById('options-btn');
    const optionsMenu = document.getElementById('options-menu');
    if (optionsBtn && optionsMenu) {
      optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsMenu.classList.toggle('open');
        optionsBtn.setAttribute('aria-expanded', optionsMenu.classList.contains('open'));
      });
      document.addEventListener('click', () => optionsMenu.classList.remove('open'));
      optionsMenu.addEventListener('click', (e) => e.stopPropagation());
    }

    // Profile → seller dashboard
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (window.FD_DASHBOARD) FD_DASHBOARD.openDashboard();
    });

    // Add listing button
    document.getElementById('add-listing-btn')?.addEventListener('click', () => {
      if (window.FD_FORM) FD_FORM.openForm();
    });

    // Mobile sidebar collapse toggle
    const sidebar = document.querySelector('.sidebar');
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebar && sidebarHeader && window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
      sidebarHeader.setAttribute('role', 'button');
      sidebarHeader.setAttribute('aria-expanded', 'false');
      sidebarHeader.setAttribute('tabindex', '0');
      const toggle = () => {
        sidebar.classList.toggle('collapsed');
        const expanded = !sidebar.classList.contains('collapsed');
        sidebarHeader.setAttribute('aria-expanded', expanded);
      };
      sidebarHeader.addEventListener('click', toggle);
      sidebarHeader.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    }

    // Escape closes overlays
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.getElementById('filter-card')?.classList.remove('open');
        document.getElementById('product-card')?.classList.remove('open');
        document.getElementById('seller-card')?.classList.remove('open');
        document.getElementById('options-menu')?.classList.remove('open');
        document.getElementById('listing-form-modal')?.classList.remove('open');
        document.getElementById('dashboard-modal')?.classList.remove('open');
        document.getElementById('filter-btn')?.classList.remove('active');
        document.getElementById('seed-banner')?.classList.add('hidden');
      }
    });
  });
})();
