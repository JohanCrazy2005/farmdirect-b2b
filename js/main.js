/**
 * FarmDirect B2B – app bootstrap
 * Theme (system + persisted), options menu, mobile sidebar toggle, a11y hooks
 * Polished loading / empty state coordination
 * Wires add-listing form and seller dashboard
 * Shows dismissible seed/demo-mode banner when Worker is undeployed
 * Runtime API_BASE override (localStorage) for post-deploy testing
 * Demo mode reset
 * Locate me geolocation control
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

  function getCurrentApiBase() {
    return (window.FD_CONFIG && window.FD_CONFIG.API_BASE) || '';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    if (window.FD_MAP) FD_MAP.initMap();
    if (window.FD_LIST) FD_LIST.bindUI();
    if (window.FD_FORM) FD_FORM.bindForm();
    if (window.FD_DASHBOARD) FD_DASHBOARD.bindDashboard();

    const statusEl = document.getElementById('data-status');
    if (statusEl) statusEl.textContent = 'Loading…';

    const result = await (window.FD_API ? FD_API.fetchListings() : Promise.resolve({ listings: [], source: 'none' }));

    if (window.FD_LIST) FD_LIST.setListings(result.listings);
    hideMapOverlay();

    if (statusEl) {
      let badge = '<span class="source-badge">no data</span>';
      if (result.source === 'api') badge = '<span class="source-badge">live API</span>';
      else if (result.source === 'demo') badge = '<span class="source-badge seed">demo (local)</span>';
      else if (result.source === 'seed') badge = '<span class="source-badge seed">seed fallback</span>';
      statusEl.innerHTML = `${result.count} listings ${badge}`;
    }

    // Seed/demo-mode banner
    const seedBanner = document.getElementById('seed-banner');
    if (seedBanner && (result.source === 'seed' || result.source === 'demo')) {
      const span = seedBanner.querySelector('span');
      if (span) {
        span.textContent = result.source === 'demo'
          ? 'Demo mode: listings saved locally in this browser. Deploy the Worker (see README – P1) for shared live D1 data.'
          : 'Demo mode: showing seed data. Create/edit/delete will be saved locally. Deploy the Worker (see README – P1) for live D1.';
      }
      seedBanner.classList.remove('hidden');
      document.getElementById('close-seed-banner')?.addEventListener('click', () => {
        seedBanner.classList.add('hidden');
      });
    }

    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    const locateBtn = document.getElementById('locate-btn');
    if (locateBtn && window.FD_MAP && typeof window.FD_MAP.locateMe === 'function') {
      locateBtn.addEventListener('click', () => window.FD_MAP.locateMe());
    }

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

    document.getElementById('opt-theme')?.addEventListener('click', () => {
      document.getElementById('theme-btn')?.click();
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('opt-set-api')?.addEventListener('click', () => {
      const current = getCurrentApiBase();
      const next = prompt('Enter Worker API base URL (e.g. https://farmdirect-b2b.<subdomain>.workers.dev)\nLeave blank to cancel.', current);
      if (next === null) return;
      const trimmed = next.trim();
      if (!trimmed) {
        alert('Empty URL ignored. Use "Clear API base" to force seed/demo mode.');
        return;
      }
      if (!/^https?:\/\//i.test(trimmed)) {
        alert('URL must start with http:// or https://');
        return;
      }
      try {
        localStorage.setItem('fd-api-base', trimmed);
        window.FD_CONFIG.API_BASE = trimmed;
        alert('API base saved. Reloading to use live Worker…');
        location.reload();
      } catch (err) {
        alert('Could not save to localStorage: ' + err.message);
      }
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('opt-clear-api')?.addEventListener('click', () => {
      try {
        localStorage.removeItem('fd-api-base');
        window.FD_CONFIG.API_BASE = '';
        alert('API base cleared. Reloading to use seed/demo fallback…');
        location.reload();
      } catch (err) {
        alert('Could not clear localStorage: ' + err.message);
      }
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('opt-reset-demo')?.addEventListener('click', () => {
      if (!confirm('Reset demo listings to the original seed data? Local changes will be lost.')) return;
      if (window.FD_API && typeof window.FD_API.resetDemoListings === 'function') {
        window.FD_API.resetDemoListings();
        alert('Demo data reset. Reloading…');
        location.reload();
      }
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('opt-deploy-status')?.addEventListener('click', () => {
      const base = getCurrentApiBase();
      const source = result.source || 'unknown';
      const msg = source === 'api'
        ? `Live API active.\nBase: ${base || '(none)'}`
        : source === 'demo'
          ? `Interactive demo mode (localStorage).\nAPI base: ${base || '(not set)'}\nCreate/edit/delete saved in this browser. Deploy the Worker (README P1) then use "Set API base".`
          : source === 'seed'
            ? `Seed fallback active (no local changes yet).\nAPI base: ${base || '(not set)'}\nDeploy the Worker (README P1) then use "Set API base".`
            : `No data source.\nAPI base: ${base || '(not set)'}`;
      alert(msg);
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('opt-about')?.addEventListener('click', () => {
      alert('FarmDirect B2B – map-first agricultural marketplace.\nLeaflet + Cloudflare Workers + D1.\nSee README.md for deploy steps.');
      optionsMenu?.classList.remove('open');
    });

    document.getElementById('profile-btn')?.addEventListener('click', () => {
      if (window.FD_DASHBOARD) FD_DASHBOARD.openDashboard();
    });

    document.getElementById('add-listing-btn')?.addEventListener('click', () => {
      if (window.FD_FORM) FD_FORM.openForm();
    });

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
