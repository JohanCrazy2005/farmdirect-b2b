/**
 * FarmDirect B2B – app bootstrap
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    // Init map
    if (window.FD_MAP) FD_MAP.initMap();

    // Bind filters / list
    if (window.FD_LIST) FD_LIST.bindUI();

    // Load data (API or seed)
    const statusEl = document.getElementById('data-status');
    if (statusEl) statusEl.textContent = 'Loading listings…';

    const result = await (window.FD_API ? FD_API.fetchListings() : Promise.resolve({ listings: [], source: 'none' }));

    if (window.FD_LIST) FD_LIST.setListings(result.listings);

    if (statusEl) {
      const badge = result.source === 'seed'
        ? '<span class="source-badge seed">seed fallback</span>'
        : result.source === 'api'
          ? '<span class="source-badge">live API</span>'
          : '<span class="source-badge">no data</span>';
      statusEl.innerHTML = `${result.count} listings ${badge}`;
    }

    // Theme toggle (simple)
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('fd-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      });
      if (localStorage.getItem('fd-theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }

    // Profile / options menu placeholders
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      alert('Profile / seller dashboard coming in P3/P4.');
    });
    document.getElementById('options-btn')?.addEventListener('click', () => {
      alert('Options menu: theme, about, deploy status.');
    });
  });
})();
