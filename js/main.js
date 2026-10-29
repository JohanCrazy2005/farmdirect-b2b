/**
 * FarmDirect B2B – main bootstrap
 * Wires Leaflet map, list, cards, search, dashboard, form, auth, options, and all modules.
 * Loads listings from live Worker or falls back to seed/demo automatically.
 * Health-aware data-source badge + modal. Persistent theme. URL map view + deep links.
 * Fully client-side; works with seed/demo fallback. Completes the frontend shell.
 * Includes import demo data for local backup/restore of seed/demo listings.
 */
(function () {
  'use strict';

  const THEME_KEY = 'fd-theme';
  let lastLoadResult = null;
  let lastLoadedAt = null;
  let badgeTimer = null;

  function applyTheme() {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) btn.textContent = 'Toggle light mode';
      }
    } catch (_) {}
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = next === 'dark' ? 'Toggle light mode' : 'Toggle dark mode';
    if (window.FD_TOAST) window.FD_TOAST.show(next === 'dark' ? 'Dark mode on' : 'Light mode on', 'info');
  }

  function setBadgeLoading(isLoading) {
    const badge = document.getElementById('data-source-badge');
    if (!badge) return;
    if (isLoading) {
      badge.textContent = 'LOADING…';
      badge.title = 'Fetching listings…';
      badge.className = 'data-source-badge loading';
      badge.hidden = false;
    } else {
      badge.classList.remove('loading');
    }
  }

  function relativeTime(ts) {
    if (!ts) return '';
    const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 10) return 'just now';
    if (sec < 60) return sec + 's ago';
    const min = Math.round(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.round(min / 60);
    return hr + 'h ago';
  }

  function refreshBadgeTitle() {
    const badge = document.getElementById('data-source-badge');
    if (!badge || !lastLoadResult || !lastLoadedAt) return;
    const source = lastLoadResult.source || 'seed';
    const count = lastLoadResult.count || (lastLoadResult.listings ? lastLoadResult.listings.length : 0);
    let title = 'Using seed listings';
    if (source === 'api') title = 'Live listings from Worker';
    else if (source === 'api-empty') title = 'Worker reachable but empty – showing seed';
    else if (source === 'demo') title = 'Demo listings (localStorage)';
    else title = 'Using seed listings (Worker offline or unreachable)';
    badge.title = title + ' · ' + count + ' listings · loaded ' + relativeTime(lastLoadedAt);
  }

  function updateDataSourceBadge(result) {
    const badge = document.getElementById('data-source-badge');
    const banner = document.getElementById('offline-banner');
    const bannerText = document.getElementById('offline-banner-text');
    if (!badge) return;

    setBadgeLoading(false);
    lastLoadedAt = Date.now();

    const source = result?.source || 'seed';
    const count = result?.count || (result?.listings ? result.listings.length : 0);
    let label = 'SEED';
    let title = 'Using seed listings';
    let showBanner = true;
    let sourceClass = 'source-seed';

    if (source === 'api') {
      label = 'LIVE';
      title = 'Live listings from Worker';
      showBanner = false;
      sourceClass = 'source-api';
    } else if (source === 'api-empty') {
      label = 'API+SEED';
      title = 'Worker reachable but empty – showing seed';
      showBanner = true;
      sourceClass = 'source-api-empty';
      if (bannerText) bannerText.textContent = 'Worker is live but has no published listings. Showing seed data so the map stays usable. Optional RFQ migration still available.';
    } else if (source === 'demo') {
      label = 'DEMO';
      title = 'Demo listings (localStorage)';
      showBanner = true;
      sourceClass = 'source-demo';
      if (bannerText) bannerText.textContent = 'Using demo listings (your local edits). Changes persist until reset or you publish to the live Worker. Import/export JSON for backup.';
    } else {
      label = 'SEED';
      title = 'Using seed listings (Worker offline or unreachable)';
      sourceClass = 'source-seed';
      if (bannerText) bannerText.textContent = 'Using seed listings (Worker offline or undeployed). Demo changes persist locally. See Details for status and next steps.';
    }

    badge.className = 'data-source-badge ' + sourceClass;
    badge.textContent = label + (count ? ' · ' + count : '');
    badge.title = title + ' · ' + count + ' listings · loaded ' + relativeTime(lastLoadedAt);
    badge.hidden = false;
    badge.dataset.source = source;

    if (banner) {
      if (showBanner) banner.removeAttribute('hidden');
      else banner.setAttribute('hidden', '');
    }

    // Keep relative time fresh without reloading
    if (badgeTimer) clearInterval(badgeTimer);
    badgeTimer = setInterval(refreshBadgeTitle, 15000);
  }

  function openDataSourceModal() {
    const modal = document.getElementById('datasource-modal');
    const content = document.getElementById('datasource-content');
    if (!modal || !content) return;

    const badge = document.getElementById('data-source-badge');
    const source = badge?.dataset.source || 'seed';
    const count = (window.FD_LIST && window.FD_LIST.getListings) ? window.FD_LIST.getListings().length : (lastLoadResult?.count || 0);
    const health = lastLoadResult?.health;
    const loaded = lastLoadedAt ? relativeTime(lastLoadedAt) + ' (' + new Date(lastLoadedAt).toLocaleTimeString() + ')' : 'unknown';

    let html = `<p><strong>Current source:</strong> ${source.toUpperCase()}</p>`;
    html += `<p>Listings loaded: ${count}</p>`;
    html += `<p>Last loaded: ${loaded}</p>`;
    if (health) {
      html += `<p>Health: ${health.ok ? 'ok' : 'error'} ${health.status || ''} ${health.error || ''}</p>`;
    }
    html += `<p class="muted small">Seed fallback is automatic. Auth migration has been applied. Optional RFQ migration and GitHub Actions secrets (see Deploy steps / README) remain user actions if you want persistence and auto-deploy. Import/export demo JSON for local backup.</p>`;
    html += `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.75rem">`;
    html += `<button type="button" class="small-btn" id="ds-reload">Reload listings</button>`;
    html += `<button type="button" class="small-btn" id="ds-deploy">Deploy steps</button>`;
    html += `<button type="button" class="small-btn" id="ds-export">Export demo</button>`;
    html += `<button type="button" class="small-btn" id="ds-import">Import demo JSON</button>`;
    html += `</div>`;
    content.innerHTML = html;

    document.getElementById('ds-reload')?.addEventListener('click', () => { reloadListings(); modal.classList.remove('open'); });
    document.getElementById('ds-deploy')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
      modal.classList.remove('open');
    });
    document.getElementById('ds-export')?.addEventListener('click', async () => {
      if (window.FD_API && window.FD_API.exportDemoData) {
        const r = await window.FD_API.exportDemoData();
        if (window.FD_TOAST) window.FD_TOAST.show(r.ok ? `Demo data saved (${r.count})` : r.error, r.ok ? 'success' : 'error');
      }
    });
    document.getElementById('ds-import')?.addEventListener('click', () => {
      triggerImportDemo();
      modal.classList.remove('open');
    });

    modal.classList.add('open');
  }

  function triggerImportDemo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) { input.remove(); return; }
      try {
        const text = await file.text();
        if (window.FD_API && window.FD_API.importDemoData) {
          const r = await window.FD_API.importDemoData(text);
          if (r.ok) {
            await reloadListings();
            if (window.FD_TOAST) window.FD_TOAST.show(`Imported ${r.count} listings into demo`, 'success');
          } else {
            if (window.FD_TOAST) window.FD_TOAST.show(r.error || 'Import failed', 'error');
          }
        }
      } catch (err) {
        if (window.FD_TOAST) window.FD_TOAST.show('Could not read file', 'error');
      }
      input.remove();
    };
    input.click();
  }

  async function loadAndDisplay() {
    if (!window.FD_API || !window.FD_API.fetchListings) return;
    setBadgeLoading(true);
    try {
      const result = await window.FD_API.fetchListings();
      lastLoadResult = result;
      if (window.FD_LIST && window.FD_LIST.setListings) {
        window.FD_LIST.setListings(result.listings || []);
      }
      updateDataSourceBadge(result);
    } catch (err) {
      console.error('Load failed', err);
      setBadgeLoading(false);
      if (window.FD_TOAST) window.FD_TOAST.show('Failed to load listings', 'error');
    }
  }

  async function reloadListings() {
    if (window.FD_TOAST) window.FD_TOAST.show('Reloading…', 'info');
    await loadAndDisplay();
    if (window.FD_TOAST) window.FD_TOAST.show('Listings reloaded', 'success');
  }

  function bindUI() {
    applyTheme();
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const btn = document.getElementById('sidebar-toggle');
      if (!sidebar) return;
      const open = sidebar.classList.toggle('open');
      btn?.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.getElementById('filter-btn')?.addEventListener('click', () => {
      const card = document.getElementById('filter-card');
      const btn = document.getElementById('filter-btn');
      if (!card) return;
      const open = card.hasAttribute('hidden');
      if (open) {
        card.removeAttribute('hidden');
        btn?.setAttribute('aria-expanded', 'true');
        document.getElementById('options-menu')?.setAttribute('hidden', '');
      } else {
        card.setAttribute('hidden', '');
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('close-filter-btn')?.addEventListener('click', () => {
      document.getElementById('filter-card')?.setAttribute('hidden', '');
      document.getElementById('filter-btn')?.setAttribute('aria-expanded', 'false');
    });

    document.getElementById('options-btn')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      const btn = document.getElementById('options-btn');
      if (!menu) return;
      const open = menu.hasAttribute('hidden');
      if (open) {
        menu.removeAttribute('hidden');
        btn?.setAttribute('aria-expanded', 'true');
        document.getElementById('filter-card')?.setAttribute('hidden', '');
        const input = document.getElementById('api-base-input');
        if (input && window.FD_CONFIG) input.value = window.FD_CONFIG.API_BASE || '';
      } else {
        menu.setAttribute('hidden', '');
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('close-options-btn')?.addEventListener('click', () => {
      document.getElementById('options-menu')?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
    });

    document.getElementById('profile-btn')?.addEventListener('click', () => {
      const seller = (window.FD_AUTH && window.FD_AUTH.getStoredSeller) ? window.FD_AUTH.getStoredSeller() : null;
      const token = (window.FD_AUTH && window.FD_AUTH.getToken) ? window.FD_AUTH.getToken() : '';
      if (token || seller) {
        if (window.FD_DASHBOARD && window.FD_DASHBOARD.openDashboard) window.FD_DASHBOARD.openDashboard();
      } else {
        if (window.FD_AUTH && window.FD_AUTH.openAuthModal) window.FD_AUTH.openAuthModal('login');
      }
    });

    document.getElementById('data-source-badge')?.addEventListener('click', openDataSourceModal);
    document.getElementById('close-datasource-btn')?.addEventListener('click', () => {
      document.getElementById('datasource-modal')?.classList.remove('open');
    });
    document.getElementById('datasource-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'datasource-modal') document.getElementById('datasource-modal')?.classList.remove('open');
    });

    document.getElementById('banner-retry-btn')?.addEventListener('click', reloadListings);
    document.getElementById('banner-details-btn')?.addEventListener('click', openDataSourceModal);
    document.getElementById('banner-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
    });
    document.getElementById('dismiss-offline-banner')?.addEventListener('click', () => {
      document.getElementById('offline-banner')?.setAttribute('hidden', '');
    });
    document.getElementById('close-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.remove('open');
    });
    document.getElementById('deploy-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'deploy-modal') document.getElementById('deploy-modal')?.classList.remove('open');
    });

    document.getElementById('reload-listings-btn')?.addEventListener('click', reloadListings);
    document.getElementById('copy-map-link-btn')?.addEventListener('click', () => {
      const link = (window.FD_MAP && window.FD_MAP.getMapViewLink) ? window.FD_MAP.getMapViewLink() : location.href;
      navigator.clipboard?.writeText(link).then(() => {
        if (window.FD_TOAST) window.FD_TOAST.show('Map view link copied', 'success');
      }).catch(() => {
        if (window.FD_TOAST) window.FD_TOAST.show('Copy failed', 'error');
      });
    });
    document.getElementById('copy-filtered-link-btn')?.addEventListener('click', () => {
      const link = (window.FD_LIST && window.FD_LIST.getFilteredViewLink) ? window.FD_LIST.getFilteredViewLink() : location.href;
      navigator.clipboard?.writeText(link).then(() => {
        if (window.FD_TOAST) window.FD_TOAST.show('Filtered view link copied', 'success');
      }).catch(() => {
        if (window.FD_TOAST) window.FD_TOAST.show('Copy failed', 'error');
      });
    });
    document.getElementById('show-recent-btn')?.addEventListener('click', () => {
      if (window.FD_RECENT && window.FD_RECENT.open) window.FD_RECENT.open();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('sellers-btn')?.addEventListener('click', () => {
      if (window.FD_SELLERS && window.FD_SELLERS.open) window.FD_SELLERS.open();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('my-rfqs-btn')?.addEventListener('click', () => {
      if (window.FD_RFQ && window.FD_RFQ.openMyRfqs) window.FD_RFQ.openMyRfqs();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('stats-btn')?.addEventListener('click', () => {
      if (window.FD_STATS && window.FD_STATS.open) window.FD_STATS.open();
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('export-json-btn')?.addEventListener('click', () => {
      if (window.FD_LIST && window.FD_LIST.exportFiltered) window.FD_LIST.exportFiltered();
    });
    document.getElementById('clear-favorites-btn')?.addEventListener('click', () => {
      if (window.FD_LIST && window.FD_LIST.clearFavorites) window.FD_LIST.clearFavorites();
    });
    document.getElementById('show-deploy-btn')?.addEventListener('click', () => {
      document.getElementById('deploy-modal')?.classList.add('open');
      document.getElementById('options-menu')?.setAttribute('hidden', '');
    });
    document.getElementById('export-demo-btn')?.addEventListener('click', async () => {
      if (window.FD_API && window.FD_API.exportDemoData) {
        const r = await window.FD_API.exportDemoData();
        if (window.FD_TOAST) window.FD_TOAST.show(r.ok ? `Demo exported (${r.count} listings)` : (r.error || 'Failed'), r.ok ? 'success' : 'error');
      }
    });
    document.getElementById('import-demo-btn')?.addEventListener('click', triggerImportDemo);
    document.getElementById('reset-demo-btn')?.addEventListener('click', async () => {
      if (!confirm('Reset demo listings? Local edits will be lost.')) return;
      if (window.FD_API && window.FD_API.resetDemoListings) window.FD_API.resetDemoListings();
      await reloadListings();
      if (window.FD_TOAST) window.FD_TOAST.show('Demo reset', 'info');
    });
    document.getElementById('save-api-base')?.addEventListener('click', () => {
      const input = document.getElementById('api-base-input');
      const val = (input?.value || '').trim();
      try {
        if (val) localStorage.setItem('fd-api-base', val);
        else localStorage.removeItem('fd-api-base');
        if (window.FD_CONFIG) window.FD_CONFIG.API_BASE = val;
        if (window.FD_TOAST) window.FD_TOAST.show('API base saved – reload to apply', 'success');
      } catch (_) {
        if (window.FD_TOAST) window.FD_TOAST.show('Could not save API base', 'error');
      }
    });

    if (window.FD_LIST && window.FD_LIST.bindUI) window.FD_LIST.bindUI();
    if (window.FD_AUTH && window.FD_AUTH.bindAuth) window.FD_AUTH.bindAuth();
    if (window.FD_DASHBOARD && window.FD_DASHBOARD.bindDashboard) window.FD_DASHBOARD.bindDashboard();
    if (window.FD_FORM && window.FD_FORM.bindForm) window.FD_FORM.bindForm();
    if (window.FD_RFQ && window.FD_RFQ.bind) window.FD_RFQ.bind();
    if (window.FD_SEARCH && window.FD_SEARCH.bind) window.FD_SEARCH.bind();
    if (window.FD_SELLERS && window.FD_SELLERS.bind) window.FD_SELLERS.bind();
    if (window.FD_COMPARE && window.FD_COMPARE.bind) window.FD_COMPARE.bind();
    if (window.FD_RECENT && window.FD_RECENT.bind) window.FD_RECENT.bind();
    if (window.FD_SHORTCUTS && window.FD_SHORTCUTS.bind) window.FD_SHORTCUTS.bind();
    if (window.FD_STATS && window.FD_STATS.bind) window.FD_STATS.bind();
    if (window.FD_LAYERS && window.FD_LAYERS.bind) window.FD_LAYERS.bind();
    if (window.FD_CSV && window.FD_CSV.bind) window.FD_CSV.bind();
    if (window.FD_GEOJSON && window.FD_GEOJSON.bind) window.FD_GEOJSON.bind();
    if (window.FD_FULLSCREEN && window.FD_FULLSCREEN.bind) window.FD_FULLSCREEN.bind();

    document.addEventListener('click', (e) => {
      const options = document.getElementById('options-menu');
      const filter = document.getElementById('filter-card');
      const optionsBtn = document.getElementById('options-btn');
      const filterBtn = document.getElementById('filter-btn');
      if (options && !options.hasAttribute('hidden') && !options.contains(e.target) && e.target !== optionsBtn) {
        options.setAttribute('hidden', '');
        optionsBtn?.setAttribute('aria-expanded', 'false');
      }
      if (filter && !filter.hasAttribute('hidden') && !filter.contains(e.target) && e.target !== filterBtn) {
        filter.setAttribute('hidden', '');
        filterBtn?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function applyUrlMapView() {
    if (!window.FD_MAP || !window.FD_MAP.getMap) return;
    const map = window.FD_MAP.getMap();
    if (!map) return;
    const params = new URLSearchParams(location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const z = parseInt(params.get('z'), 10);
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], !isNaN(z) ? z : map.getZoom());
    }
  }

  async function init() {
    applyTheme();
    if (window.FD_MAP && window.FD_MAP.initMap) window.FD_MAP.initMap();
    applyUrlMapView();
    bindUI();
    await loadAndDisplay();
    const hash = location.hash || '';
    const m = hash.match(/listing=([^&]+)/);
    if (m && window.FD_LIST && window.FD_LIST.select) {
      setTimeout(() => window.FD_LIST.select(decodeURIComponent(m[1]), true), 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
