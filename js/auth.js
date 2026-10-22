/**
 * FarmDirect B2B – seller authentication (P3.3 frontend)
 * Login / register modal. Stores opaque Bearer token in localStorage.
 * Works against live Worker once migration + redeploy are done.
 * Falls back gracefully when API is unavailable (demo mode).
 */
(function (global) {
  'use strict';

  const TOKEN_KEY = 'fd-auth-token';
  const SELLER_KEY = 'fd-auth-seller';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
  }

  function getStoredSeller() {
    try {
      const raw = localStorage.getItem(SELLER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function setSession(token, seller) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
      if (seller) localStorage.setItem(SELLER_KEY, JSON.stringify(seller));
      else localStorage.removeItem(SELLER_KEY);
    } catch (_) {}
  }

  function clearSession() {
    setSession('', null);
  }

  function openAuthModal(mode) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    modal.dataset.mode = mode || 'login';
    renderAuthForm();
  }

  function closeAuthModal() {
    document.getElementById('auth-modal')?.classList.remove('open');
  }

  function renderAuthForm() {
    const modal = document.getElementById('auth-modal');
    const content = document.getElementById('auth-content');
    if (!content) return;
    const mode = modal?.dataset.mode || 'login';
    const isRegister = mode === 'register';

    content.innerHTML = `
      <h3>${isRegister ? 'Create seller account' : 'Sign in'}</h3>
      <form id="auth-form">
        <label>Seller ID
          <input id="auth-sellerid" type="text" required autocomplete="username" placeholder="e.g. greenfield-farms">
        </label>
        <label>Password
          <input id="auth-password" type="password" required autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="6">
        </label>
        ${isRegister ? `
          <label>Name (optional)
            <input id="auth-name" type="text" autocomplete="name">
          </label>
          <label>Email (optional)
            <input id="auth-email" type="email" autocomplete="email">
          </label>
        ` : ''}
        <div id="auth-status" class="form-status"></div>
        <button type="submit" class="primary-btn">${isRegister ? 'Register' : 'Sign in'}</button>
      </form>
      <p class="muted small" style="margin-top:0.75rem">
        ${isRegister
          ? 'Already have an account? <button type="button" class="link-btn" id="switch-to-login">Sign in</button>'
          : 'Need an account? <button type="button" class="link-btn" id="switch-to-register">Register</button>'}
      </p>
      <p class="muted small">Requires the Worker with auth endpoints to be redeployed. Demo mode still uses the temporary seller ID in the dashboard.</p>
    `;

    document.getElementById('switch-to-login')?.addEventListener('click', () => {
      modal.dataset.mode = 'login';
      renderAuthForm();
    });
    document.getElementById('switch-to-register')?.addEventListener('click', () => {
      modal.dataset.mode = 'register';
      renderAuthForm();
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('auth-status');
      const sellerid = document.getElementById('auth-sellerid')?.value.trim();
      const password = document.getElementById('auth-password')?.value || '';
      if (!sellerid || !password) {
        if (status) status.textContent = 'Seller ID and password required';
        return;
      }
      if (status) status.textContent = 'Working…';

      const apiBase = (global.FD_CONFIG && global.FD_CONFIG.API_BASE || '').replace(/\/$/, '');
      if (!apiBase) {
        if (status) status.textContent = 'No API base set – use demo seller ID in dashboard for now';
        return;
      }

      const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const body = { sellerid, password };
      if (isRegister) {
        body.name = document.getElementById('auth-name')?.value.trim() || sellerid;
        body.email = document.getElementById('auth-email')?.value.trim() || null;
      }

      try {
        const res = await fetch(`${apiBase}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (status) status.textContent = data.error || `HTTP ${res.status}`;
          return;
        }
        setSession(data.token, data.seller);
        if (global.FD_TOAST) global.FD_TOAST.show(isRegister ? 'Account created' : 'Signed in', 'success');
        closeAuthModal();
        if (global.FD_DASHBOARD && global.FD_DASHBOARD.openDashboard) {
          global.FD_DASHBOARD.openDashboard();
        }
        // Refresh data so mine endpoint can be used later
        if (global.FD_API && global.FD_API.fetchListings) {
          const result = await global.FD_API.fetchListings();
          if (global.FD_LIST && global.FD_LIST.setListings) global.FD_LIST.setListings(result.listings || []);
        }
      } catch (err) {
        if (status) status.textContent = err.message || 'Network error';
      }
    });
  }

  async function logout() {
    const token = getToken();
    const apiBase = (global.FD_CONFIG && global.FD_CONFIG.API_BASE || '').replace(/\/$/, '');
    if (token && apiBase) {
      try {
        await fetch(`${apiBase}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {}
    }
    clearSession();
    if (global.FD_TOAST) global.FD_TOAST.show('Signed out', 'info');
  }

  function bindAuth() {
    document.getElementById('close-auth-btn')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'auth-modal') closeAuthModal();
    });
  }

  global.FD_AUTH = {
    getToken,
    getStoredSeller,
    setSession,
    clearSession,
    openAuthModal,
    closeAuthModal,
    logout,
    bindAuth,
  };
})(window);
