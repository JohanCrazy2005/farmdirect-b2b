/**
 * FarmDirect B2B – seller dashboard
 * Prefers real auth session (Bearer token). Shows drafts / published / archived
 * with Publish / Unpublish / Archive actions (live API or demo localStorage).
 * RFQ inbox and badge prefer live GET /api/v1/rfqs/mine when available.
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

  /** Normalize local or API RFQ shape for display */
  function normalizeRfq(r) {
    if (!r) return null;
    return {
      id: r.id,
      listingId: r.listingId || r.listing_id || '',
      name: r.name || r.buyer_name || '',
      email: r.email || r.buyer_email || '',
      quantity: r.quantity || '',
      message: r.message || '',
      created: r.created || r.created_at || '',
      status: r.status || 'open',
    };
  }

  async function loadMyRfqs(seller, mineListings) {
    if (global.FD_API && typeof global.FD_API.fetchMyRfqs === 'function') {
      try {
        const result = await global.FD_API.fetchMyRfqs();
        if (result && Array.isArray(result.rfqs)) {
          return {
            rfqs: result.rfqs.map(normalizeRfq).filter(Boolean),
            source: result.source || 'api',
          };
        }
      } catch (_) {}
    }
    // Local fallback: filter by current seller's listing ids
    const allRfqs = (global.FD_RFQ && global.FD_RFQ.getAll) ? global.FD_RFQ.getAll() : [];
    const myIds = new Set((mineListings || []).map(l => l.id));
    const filtered = allRfqs
      .filter(r => myIds.has(r.listingId || r.listing_id))
      .map(normalizeRfq)
      .filter(Boolean);
    return { rfqs: filtered, source: 'local' };
  }

  async function updateRfqBadge() {
    const badge = document.getElementById('rfq-badge');
    if (!badge) return;
    const seller = getCurrentSeller();
    if (!seller) {
      badge.hidden = true;
      badge.textContent = '';
      return;
    }
    try {
      const { rfqs } = await loadMyRfqs(seller, []);
      const count = rfqs.length;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = false;
      } else {
        badge.hidden = true;
        badge.textContent = '';
      }
    } catch (_) {
      badge.hidden = true;
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

  function statusBadge(status) {
    const s = status || 'published';
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    const cls = s === 'published' ? 'badge-published' : s === 'draft' ? 'badge-draft' : 'badge-archived';
    return `<span class="status-badge ${cls}">${escapeHtml(label)}</span>`;
  }

  async function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    const seller = getCurrentSeller();

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
        <p class="muted small">Real auth requires applying schema/auth-migration.sql on D1 b2bistening (ignore duplicate-column errors). See Options → Show deploy commands.</p>
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

    content.innerHTML = '<p class="muted">Loading your listings…</p>';

    let mine = [];
    if (global.FD_API && typeof global.FD_API.fetchMyListings === 'function') {
      try {
        const result = await global.FD_API.fetchMyListings();
        mine = result.listings || [];
      } catch (_) {
        mine = [];
      }
    }

    const { rfqs: myRfqs, source: rfqSource } = await loadMyRfqs(seller, mine);

    const drafts = mine.filter(l => (l.status || 'published') === 'draft');
    const published = mine.filter(l => (l.status || 'published') === 'published');
    const archived = mine.filter(l => (l.status || 'published') === 'archived');

    content.innerHTML = `
      <h3>Dashboard · ${escapeHtml(seller)}</h3>
      <p class="muted">${mine.length} listing${mine.length === 1 ? '' : 's'} · ${drafts.length} draft${drafts.length === 1 ? '' : 's'} · ${published.length} published · ${archived.length} archived · ${myRfqs.length} quote request${myRfqs.length === 1 ? '' : 's'} · <button type="button" id="logout-btn" class="link-btn">Sign out</button></p>
      <div id="my-listings" class="dashboard-list"></div>
      <h4 style="margin:1.2rem 0 0.4rem">Incoming quote requests${rfqSource === 'api' ? ' <span class="muted small">(live)</span>' : ' <span class="muted small">(demo)</span>'}</h4>
      <div id="my-rfqs" class="dashboard-list"></div>
      <p class="muted small">Publish controls work against the live Worker (after auth migration) or in local demo mode. Quote requests prefer the live API when the RFQ migration has been applied.</p>
    `;

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
      function renderGroup(title, items) {
        if (!items.length) return '';
        return `<h4 style="margin:1rem 0 0.4rem">${title} (${items.length})</h4>` + items.map(l => {
          const st = l.status || 'published';
          let actions = `
            <button type="button" class="small-btn edit-btn" data-id="${escapeAttr(l.id)}">Edit</button>
            <button type="button" class="small-btn del-btn" data-id="${escapeAttr(l.id)}">Delete</button>`;
          if (st === 'draft') {
            actions = `<button type="button" class="small-btn primary-btn publish-btn" data-id="${escapeAttr(l.id)}">Publish</button>` + actions;
          } else if (st === 'published') {
            actions = `<button type="button" class="small-btn unpublish-btn" data-id="${escapeAttr(l.id)}">Unpublish</button>` +
                      `<button type="button" class="small-btn archive-btn" data-id="${escapeAttr(l.id)}">Archive</button>` + actions;
          } else if (st === 'archived') {
            actions = `<button type="button" class="small-btn publish-btn" data-id="${escapeAttr(l.id)}">Republish</button>` + actions;
          }
          return `
            <div class="listing-card" data-id="${escapeAttr(l.id)}">
              <img src="${escapeAttr(l.image)}" alt="" onerror="this.style.background='var(--hover-bg)'">
              <div class="listing-info">
                <h3>${escapeHtml(l.headerdescription)} ${statusBadge(st)}</h3>
                <div class="meta">${escapeHtml(l.category)} · $${Number(l.price).toFixed(2)}/${escapeHtml(l.units)}</div>
                <div class="actions">${actions}</div>
              </div>
            </div>`;
        }).join('');
      }

      listEl.innerHTML = renderGroup('Drafts', drafts) + renderGroup('Published', published) + renderGroup('Archived', archived);

      function wireAction(selector, fn) {
        listEl.querySelectorAll(selector).forEach(btn => {
          btn.addEventListener('click', () => fn(btn.dataset.id));
        });
      }

      wireAction('.edit-btn', (id) => {
        const listing = mine.find(x => x.id === id);
        closeDashboard();
        if (global.FD_FORM && listing) global.FD_FORM.openForm(listing);
      });

      wireAction('.del-btn', async (id) => {
        if (!confirm('Delete this listing?')) return;
        if (global.FD_API && global.FD_API.deleteListing) {
          const res = await global.FD_API.deleteListing(id);
          if (res.ok) {
            if (global.FD_TOAST) global.FD_TOAST.show('Listing deleted', 'info');
            await refreshAfterChange();
          } else {
            alert(res.error || 'Delete failed');
          }
        }
      });

      wireAction('.publish-btn', async (id) => {
        const res = await global.FD_API.publishListing(id);
        if (res.ok) {
          if (global.FD_TOAST) global.FD_TOAST.show('Listing published', 'success');
          await refreshAfterChange();
        } else {
          alert(res.error || 'Publish failed');
        }
      });

      wireAction('.unpublish-btn', async (id) => {
        const res = await global.FD_API.unpublishListing(id);
        if (res.ok) {
          if (global.FD_TOAST) global.FD_TOAST.show('Listing unpublished (draft)', 'info');
          await refreshAfterChange();
        } else {
          alert(res.error || 'Unpublish failed');
        }
      });

      wireAction('.archive-btn', async (id) => {
        if (!confirm('Archive this listing? It will no longer appear publicly.')) return;
        const res = await global.FD_API.archiveListing(id);
        if (res.ok) {
          if (global.FD_TOAST) global.FD_TOAST.show('Listing archived', 'info');
          await refreshAfterChange();
        } else {
          alert(res.error || 'Archive failed');
        }
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
              <div class="meta">From ${escapeHtml(r.name)} (${escapeHtml(r.email)}) · Qty: ${escapeHtml(r.quantity)}</div>
              ${r.message ? `<p style="margin:0.3rem 0;font-size:0.85rem">${escapeHtml(r.message)}</p>` : ''}
              <div class="meta" style="font-size:0.75rem">${escapeHtml(when)}</div>
              ${viewBtn}
            </div>
          </div>
        `;
      }).join('') +
      (rfqSource === 'local'
        ? `<p style="margin-top:0.5rem"><button type="button" id="clear-rfqs-btn" class="small-btn">Clear my RFQs (demo)</button></p>`
        : '');

      rfqEl.querySelectorAll('button[data-listing]').forEach(btn => {
        btn.addEventListener('click', () => openListingFromRfq(btn.dataset.listing));
      });

      document.getElementById('clear-rfqs-btn')?.addEventListener('click', () => {
        if (!confirm('Clear all local quote requests for your listings?')) return;
        const allRfqs = (global.FD_RFQ && global.FD_RFQ.getAll) ? global.FD_RFQ.getAll() : [];
        const myIds = new Set(mine.map(l => l.id));
        const remaining = allRfqs.filter(r => !myIds.has(r.listingId || r.listing_id));
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

  async function refreshAfterChange() {
    if (global.FD_API && global.FD_API.fetchListings && global.FD_LIST) {
      const result = await global.FD_API.fetchListings();
      global.FD_LIST.setListings(result.listings);
    }
    renderDashboard();
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
