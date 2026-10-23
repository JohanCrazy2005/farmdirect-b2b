/**
 * FarmDirect B2B – fullscreen map toggle
 * Expands the map to the full browser window (Fullscreen API) for better exploration
 * of the map-first view. Falls back to a CSS class if the API is unavailable.
 * Fully client-side; works in pure seed/demo mode.
 */
(function (global) {
  'use strict';

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  function toggleFullscreen() {
    const mapEl = document.getElementById('map');
    const container = document.getElementById('app') || document.body;
    if (!mapEl) return;

    if (isFullscreen()) {
      exitFullscreen();
    } else {
      enterFullscreen(container);
    }
  }

  function enterFullscreen(el) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) {
      req.call(el).catch(() => {
        // Fallback: CSS class
        document.body.classList.add('map-fullscreen');
        showToast('Fullscreen mode (CSS fallback)', 'info');
      });
    } else {
      document.body.classList.add('map-fullscreen');
      showToast('Fullscreen mode', 'info');
    }
    updateButton();
  }

  function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit && isFullscreen()) {
      exit.call(document).catch(() => {
        document.body.classList.remove('map-fullscreen');
      });
    } else {
      document.body.classList.remove('map-fullscreen');
    }
    updateButton();
  }

  function updateButton() {
    const btn = document.getElementById('fullscreen-btn');
    if (!btn) return;
    const active = isFullscreen() || document.body.classList.contains('map-fullscreen');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.title = active ? 'Exit fullscreen' : 'Fullscreen map';
    btn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Fullscreen map');

    // Let Leaflet redraw after size change
    setTimeout(() => {
      if (global.FD_MAP && typeof global.FD_MAP.getMap === 'function') {
        const m = global.FD_MAP.getMap();
        if (m && typeof m.invalidateSize === 'function') m.invalidateSize();
      }
    }, 150);
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    }
  }

  function bind() {
    const btn = document.getElementById('fullscreen-btn');
    if (btn) {
      btn.addEventListener('click', toggleFullscreen);
    }

    // Listen for native fullscreen changes (Esc, etc.)
    document.addEventListener('fullscreenchange', updateButton);
    document.addEventListener('webkitfullscreenchange', updateButton);
    document.addEventListener('msfullscreenchange', updateButton);

    // Esc also clears CSS fallback
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('map-fullscreen')) {
        document.body.classList.remove('map-fullscreen');
        updateButton();
      }
    });

    updateButton();
  }

  global.FD_FULLSCREEN = { bind, toggle: toggleFullscreen };
})(window);
