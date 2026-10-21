/**
 * FarmDirect B2B – seller dashboard (P4 starter)
 * Temporary client-side "session" via localStorage sellerid.
 * Full Cloudflare Access / JWT / RLS pending Worker deploy + user setup.
 * + RFQ inbox: shows incoming quote requests for the seller's listings (localStorage demo).
 * + correct HTML escaping for listings and RFQ content (seed/demo safety).
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'fd-current-seller';

  function getCurrentSeller() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setCurrentSeller(id) {
    if (id && id.trim()) {
      localStorage.setItem(STORAGE_KEY, id.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

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
        <p class="muted">Enter a seller ID to view and manage your listings and quote requests.<br>Temporary client session – Cloudflare Access / JWT coming after deploy.</p>
        <label>Seller ID
          <input id="seller-id-input" type="text" placeholder="e.g. seller-greenfield" autocomplete="username" />
        </label>
        <button type="button" id="login-btn" class="primary-btn">Continue</button>
        <p class="muted small">Try seed sellers: seller-greenfield, seller-riverside, seller-oakwood, …</p>
      `;
      document.getElementById('login-btn')?.addEventListener('click', () => {
        const val = document.getElementById('seller-id-input')?.value.trim();
        if (val) {
          setCurrentSeller(val);
          renderDashboard();
        }
      });
      const input = document.getElementById('seller-id-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') document.getElementById('login-btn')?.click();
        });
      }
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
        return `
          <div class="listing-card">
            <div class="listing-info" style="padding:0.5rem">
              <h3 style="font-size:0.95rem">${escapeHtml(title)}</h3>
              <div class="meta">From ${escapeHtml(r.name)} &lt;${escapeHtml(r.email)}&gt; · Qty: ${escapeHtml(r.quantity)}</div>
              ${r.message ? `<p style="margin:0.3rem 0;font-size:0.85rem">${escapeHtml(r.message)}</p>` : ''}
              <div class="meta" style="font-size:0.75rem">${escapeHtml(when)}</div>
            </div>
          </div>
        `;
      }).join('') +
      `<p style="margin-top:0.5rem"><button type="button" id="clear-rfqs-btn" class="small-btn">Clear my RFQs</button></p>`;

      document.getElementById('clear-rfqs-btn')?.addEventListener('click', () => {
        if (!confirm('Clear all quote requests for your listings?')) return;
        // Remove only this seller's RFQs
        const remaining = allRfqs.filter(r => !myIds.has(r.listingId));
        try {
          localStorage.setItem('fd-rfqs', JSON.stringify(remaining));
        } catch (_) {}
        renderDashboard();
        if (global.FD_TOAST) global.FD_TOAST.show('RFQs cleared', 'info');
      });
    }

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      setCurrentSeller('');
      renderDashboard();
    });
  }

  function bindDashboard() {
    document.getElementById('close-dashboard-btn')?.addEventListener('click', closeDashboard);
    document.getElementById('dashboard-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'dashboard-modal') closeDashboard();
    });
  }

  global.FD_DASHBOARD = { openDashboard, closeDashboard, bindDashboard, getCurrentSeller };
})(window);
