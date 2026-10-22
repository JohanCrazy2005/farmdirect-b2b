/**
 * FarmDirect B2B – seller dashboard (P4 starter)
 * Temporary client-side "session" via localStorage sellerid.
 * Full Cloudflare Access / JWT / RLS pending Worker deploy + user setup.
 * + RFQ inbox: shows incoming quote requests for the seller's listings (localStorage demo).
 * + correct HTML escaping for listings and RFQ content (seed/demo safety).
 * + RFQ count badge on profile icon (updates live in demo mode).
 * + Clickable RFQs: View listing button opens product card (closes dashboard; works in seed/demo).
 * + Prefers real auth session (Bearer token) when available.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'fd-current-seller';

  function getCurrentSeller() {
    const authSeller = (global.FD_AUTH && typeof global.FD_AUTH.getStoredSeller === 'function')
      ? global.FD_AUTH.getStoredSeller()
      : null;
    if (authSeller && authSeller.sellerid) return authSeller.sellerid;
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setCurrentSeller(id) {
    if (id && id.trim()) {
      localStorage.setItem(STORAGE_KEY, id.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function updateRfqBadge() {
    const badge = document.getElementById('rfq-badge');
    if (!badge) return;
    const seller = getCurrentSeller();
    if (!seller) {
      badge.hidden = true;
      badge.textContent = '';
      return;
    }
    const all = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const mine = all.filter(l => l.sellerid === seller);
    const myIds = new Set(mine.map(l => l.id));
    const allRfqs = (global.FD_RFQ && global.FD_RFQ.getAll) ? global.FD_RFQ.getAll() : [];
    const count = allRfqs.filter(r => myIds.has(r.listingId)).length;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
      badge.textContent = '';
    }
  }

  function openDashboard() {
    const modal = document.getElementById('dashboard-modal');
    if (!modal) return;
    renderDashboard();
    modal.classList.add('open');
  }

  function closeDashboard() {
    document.getElementById('dashboard-modal')?.classList.remove('open');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  function openListingFromRfq(listingId) {
    if (!listingId) {
      if (global.FD_TOAST) global.FD_TOAST.show('No listing associated with this request', 'error');
      return;
    }
    const listings = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      if (global.FD_TOAST) global.FD_TOAST.show('Listing no longer available in current data', 'error');
      return;
    }
    closeDashboard();
    if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
      global.FD_LIST.select(listingId);
    } else if (global.FD_CARDS && typeof global.FD_CARDS.showProduct === 'function') {
      global.FD_CARDS.showProduct(listing);
    }
  }

  function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    const seller = getCurrentSeller();
    const all = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const mine = seller ? all.filter(l => l.sellerid === seller) : [];
    const myIds = new Set(mine.map(l => l.id));

    const allRfqs = (global.FD_RFQ && global.FD_RFQ.getAll) ? global.FD_RFQ.getAll() : [];
    const myRfqs = allRfqs.filter(r => myIds.has(r.listingId));

    if (!seller) {
      content.innerHTML = `
        <h3>Seller dashboard</h3>
        <p class="muted">Sign in with your seller account, or use a temporary seller ID for demo.</p>
        <div style="display:flex;gap:0.5rem;margin:0.75rem 0">
          <button type="button" id="auth-login-btn" class="primary-btn">Sign in</button>
          <button type="button" id="auth-register-btn" class="small-btn">Register</button>
        </div>
        <hr style="border:0;border-top:1px solid var(--border);margin:1rem 0">
        <label>Temporary seller ID (demo)
          <input id="seller-id-input" type="text" placeholder="e.g. seller-greenfield" autocomplete="username" />
        </label>
        <button type="button" id="login-btn" class="small-btn">Continue with ID</button>
        <p class="muted small">Real auth requires the Worker redeploy with schema/auth-migration.sql applied.</p>
      `;
      document.getElementById('auth-login-btn')?.addEventListener('click', () => {
        closeDashboard();
        if (global.FD_AUTH) global.FD_AUTH.openAuthModal('login');
      });
      document.getElementById('auth-register-btn')?.addEventListener('click', () => {
        closeDashboard();
        if (global.FD_AUTH) global.FD_AUTH.openAuthModal('register');
      });
      document.getElementById('login-btn')?.addEventListener('click', () => {
        const val = document.getElementById('seller-id-input')?.value.trim();
        if (val) {
          setCurrentSeller(val);
          renderDashboard();
          updateRfqBadge();
        }
      });
      const input = document.getElementById('seller-id-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('login-btn')?.click();
        });
      }
      updateRfqBadge();
      return;
    }

    content.innerHTML = `
      <h3>Dashboard · ${escapeHtml(seller)}</h3>
      <p class="muted">${mine.length} listing${mine.length === 1 ? '' : 's'} · ${myRfqs.length} quote request${myRfqs.length === 1 ? '' : 's'} · <button type="button" id="logout-btn" class="link-btn">Sign out</button></p>
      <h4 style="margin:1rem 0 0.4rem">My listings</h4>
      <div id="my-listings" class="dashboard-list"></div>
      <h4 style="margin:1.2rem 0 0.4rem">Incoming quote requests</h4>
      <div id="my-rfqs" class="dashboard-list"></div>
      <p class="muted small">Real authentication (Cloudflare Access + JWT) and row-level security will be added after the Worker is deployed. This is a client-side preview that works with seed data and localStorage RFQs.</p>
    `;

    // Listings
    const listEl = document.getElementById('my-listings');
    if (!mine.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>No listings for this seller yet.</p>
          <button type="button" id="add-from-dash">Add listing</button>
        </div>`;
      document.getElementById('add-from-dash')?.addEventListener('click', () => {
        closeDashboard();
        if (global.FD_FORM) {
          global.FD_FORM.openForm();
          const sellerInput = document.getElementById('form-sellerid');
          if (sellerInput) sellerInput.value = seller;
        }
      });
    } else {
      listEl.innerHTML = mine.map(l => `
        <div class="listing-card" data-id="${escapeAttr(l.id)}">
          <img src="${escapeAttr(l.image)}" alt="" onerror="this.style.background='var(--hover-bg)'">
          <div class="listing-info">
            <h3>${escapeHtml(l.headerdescription)}</h3>
            <div class="meta">${escapeHtml(l.category)} · $${Number(l.price).toFixed(2)}/${escapeHtml(l.units)}</div>
            <div class="actions">
              <button type="button" class="small-btn edit-btn" data-id="${escapeAttr(l.id)}">Edit</button>
              <button type="button" class="small-btn del-btn" data-id="${escapeAttr(l.id)}">Delete</button>
            </div>
          </div>
        </div>
      `).join('');

      listEl.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const listing = mine.find(x => x.id === id);
          closeDashboard();
          if (global.FD_FORM && listing) global.FD_FORM.openForm(listing);
        });
      });

      listEl.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this listing?')) return;
          const id = btn.dataset.id;
          if (global.FD_API && global.FD_API.deleteListing) {
            const res = await global.FD_API.deleteListing(id);
            if (res.ok) {
              const result = await global.FD_API.fetchListings();
              if (global.FD_LIST) global.FD_LIST.setListings(result.listings);
              renderDashboard();
              updateRfqBadge();
            } else {
              alert(res.error || 'Delete failed (seed mode is read-only)');
            }
          }
        });
      });
    }

    // RFQs
    const rfqEl = document.getElementById('my-rfqs');
    if (!myRfqs.length) {
      rfqEl.innerHTML = '<div class="empty-state"><p>No quote requests yet. Buyers can request quotes from product cards.</p></div>';
    } else {
      rfqEl.innerHTML = myRfqs.slice().reverse().map(r => {
        const listing = mine.find(l => l.id === r.listingId);
        const title = listing ? listing.headerdescription : (r.listingId || 'Unknown');
        const when = r.created ? new Date(r.created).toLocaleString() : '';
        const viewBtn = r.listingId
          ? '<button type="button" class="icon-btn" style="width:auto;padding:0 0.75rem;margin-top:0.4rem" data-listing="' + escapeAttr(r.listingId) + '">View listing</button>'
          : '';
        return `
          <div class="listing-card">
            <div class="listing-info" style="padding:0.5rem">
              <h3 style="font-size:0.95rem">${escapeHtml(title)}</h3>
              <div class="meta">From ${escapeHtml(r.name)} <${escapeHtml(r.email)}> · Qty: ${escapeHtml(r.quantity)}</div>
              ${r.message ? `<p style="margin:0.3rem 0;font-size:0.85rem">${escapeHtml(r.message)}</p>` : ''}
              <div class="meta" style="font-size:0.75rem">${escapeHtml(when)}</div>
              ${viewBtn}
            </div>
          </div>
        `;
      }).join('') +
      `<p style="margin-top:0.5rem"><button type="button" id="clear-rfqs-btn" class="small-btn">Clear my RFQs</button></p>`;

      // Wire view buttons
      rfqEl.querySelectorAll('button[data-listing]').forEach(btn => {
        btn.addEventListener('click', () => openListingFromRfq(btn.dataset.listing));
      });

      document.getElementById('clear-rfqs-btn')?.addEventListener('click', () => {
        if (!confirm('Clear all quote requests for your listings?')) return;
        // Remove only this seller's RFQs
        const remaining = allRfqs.filter(r => !myIds.has(r.listingId));
        try {
          localStorage.setItem('fd-rfqs', JSON.stringify(remaining));
        } catch (_) {}
        renderDashboard();
        updateRfqBadge();
        if (global.FD_TOAST) global.FD_TOAST.show('RFQs cleared', 'info');
      });
    }

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      if (global.FD_AUTH && typeof global.FD_AUTH.logout === 'function') {
        await global.FD_AUTH.logout();
      }
      setCurrentSeller('');
      renderDashboard();
      updateRfqBadge();
    });

    updateRfqBadge();
  }

  function bindDashboard() {
    document.getElementById('close-dashboard-btn')?.addEventListener('click', closeDashboard);
    document.getElementById('dashboard-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'dashboard-modal') closeDashboard();
    });
    updateRfqBadge();
  }

  global.FD_DASHBOARD = { openDashboard, closeDashboard, bindDashboard, getCurrentSeller, updateRfqBadge };
})(window);
