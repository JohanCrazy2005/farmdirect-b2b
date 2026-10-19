/**
 * FarmDirect B2B – product & seller cards
 * + deep-link support: opening a card updates #listing=<id>; copy-link button
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  function showProduct(listing) {
    const el = document.getElementById('product-card');
    if (!el) return;
    // Update URL hash for shareable deep link (client-side, demo-friendly)
    if (listing && listing.id) {
      const newHash = '#listing=' + encodeURIComponent(listing.id);
      if (location.hash !== newHash) {
        history.replaceState(null, '', newHash);
      }
    }
    el.innerHTML = `
      <button class=\"close-btn\" aria-label=\"Close\" onclick=\"this.closest('.detail-card').classList.remove('open'); history.replaceState(null, '', location.pathname + location.search);">×</button>
      <img src=\"${escapeHtml(listing.image)}\" alt=\"${escapeHtml(listing.headerdescription)}\" onerror=\"this.style.display='none'\">
      <h3>${escapeHtml(listing.headerdescription)}</h3>
      <div class=\"price\">$${Number(listing.price).toFixed(2)} <span style=\"font-weight:400;color:var(--muted)\">/ ${escapeHtml(listing.units)}</span></div>
      <p style=\"margin:0.5rem 0;font-size:0.9rem\">${escapeHtml(listing.description)}</p>
      <div style=\"font-size:0.8rem;color:var(--muted)\">
        Category: ${escapeHtml(listing.category)} · Visibility: ${escapeHtml(listing.visibility)}<br>
        Address: ${escapeHtml(listing.address)}
      </div>
      <div style=\"margin-top:0.75rem;display:flex;gap:0.4rem;flex-wrap:wrap\">
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.showSeller('${escapeHtml(listing.sellerid)}')\">View seller</button>
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.copyListingLink('${escapeHtml(listing.id)}')\">Copy link</button>
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.editListing('${escapeHtml(listing.id)}')\">Edit</button>
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem;color:#dc2626\" onclick=\"FD_CARDS.deleteListing('${escapeHtml(listing.id)}')\">Delete</button>
      </div>
    `;
    el.classList.add('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  function copyListingLink(id) {
    const url = location.origin + location.pathname + location.search + '#listing=' + encodeURIComponent(id);
    navigator.clipboard.writeText(url).then(() => {
      alert('Listing link copied to clipboard!');
    }).catch(() => {
      alert('Could not copy automatically. URL: ' + url);
    });
  }

  function editListing(id) {
    // Find listing from current list data
    const listing = (global.FD_LIST && global.FD_LIST.getListings ? global.FD_LIST.getListings() : []).find(l => l.id === id);
    if (listing && global.FD_FORM) {
      global.FD_FORM.openForm(listing);
    } else {
      alert('Could not load listing for edit');
    }
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    if (!global.FD_API || !global.FD_API.deleteListing) {
      alert('API unavailable');
      return;
    }
    const result = await global.FD_API.deleteListing(id);
    if (result.ok) {
      document.getElementById('product-card')?.classList.remove('open');
      history.replaceState(null, '', location.pathname + location.search);
      // Refresh
      if (global.FD_API.fetchListings) {
        const fresh = await global.FD_API.fetchListings();
        if (global.FD_LIST && global.FD_LIST.setListings) {
          global.FD_LIST.setListings(fresh.listings);
        }
      }
    } else {
      alert(result.error || 'Failed to delete');
    }
  }

  function showSeller(sellerid) {
    // Minimal seller card from listing data (no separate sellers table yet)
    const el = document.getElementById('seller-card');
    if (!el) return;
    el.innerHTML = `
      <button class=\"close-btn\" aria-label=\"Close\" onclick=\"this.closest('.seller-card-overlay').classList.remove('open')\">×</button>
      <h3>Seller ${escapeHtml(sellerid)}</h3>
      <p style=\"font-size:0.9rem;color:var(--muted)\">Seller profile details will appear here once the sellers table is populated.</p>
    `;
    el.classList.add('open');
  }

  function hideAll() {
    document.getElementById('product-card')?.classList.remove('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  global.FD_CARDS = { showProduct, showSeller, hideAll, editListing, deleteListing, copyListingLink };
})(window);
