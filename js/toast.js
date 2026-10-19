/**
 * FarmDirect B2B – lightweight toast notifications
 * Non-blocking feedback for copy, share, warnings (seed/demo friendly; no Worker required)
 */
(function (global) {
  'use strict';

  function show(message, type, duration) {
    const container = document.getElementById('toast-container');
    if (!container || !message) return;
    const toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.textContent = String(message);
    toast.setAttribute('role', 'status');
    container.appendChild(toast);
    const ms = duration || 3200;
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 320);
    }, ms);
  }

  global.FD_TOAST = { show };
})(window);
