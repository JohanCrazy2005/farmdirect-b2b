/**
 * FarmDirect B2B – product & seller cards
 * + deep-link support: opening a card updates #listing=<id>; copy-link button
 * + richer seller profile: lists other listings by the same sellerid from current data (seed/demo friendly)
 * + image lightbox: click product photo to enlarge (fully client-side, demo friendly)
 * + directions button: opens external maps with listing coordinates (seed/demo friendly)
 * + copy address button: copies listing address to clipboard (seed/demo friendly)
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
    const lat = listing.location?.lat;
    const lng = listing.location?.long;
    const dirBtn = (lat != null && lng != null)
      ? `<button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.openDirections(${lat}, ${lng})\">Directions</button>`
      : '';
    const addrBtn = listing.address
      ? `<button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.copyAddress('${escapeHtml(listing.address).replace(/'/g, "\\'")}')\">Copy address</button>`
      : '';
    el.innerHTML = `
      <button class=\"close-btn\" aria-label=\"Close\" onclick=\"this.closest('.detail-card').classList.remove('open'); history.replaceState(null, '', location.pathname + location.search);\">×</button>
      <img src=\"${escapeHtml(listing.image)}\" alt=\"${escapeHtml(listing.headerdescription)}\" class=\"product-image\" onerror=\"this.style.display='none'\" onclick=\"FD_CARDS.openLightbox(this.src, this.alt)\">
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
        ${dirBtn}
        ${addrBtn}
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem\" onclick=\"FD_CARDS.editListing('${escapeHtml(listing.id)}')\">Edit</button>
        <button class=\"icon-btn\" style=\"width:auto;padding:0 0.75rem;color:#dc2626\" onclick=\"FD_CARDS.deleteListing('${escapeHtml(listing.id)}')\">Delete</button>
      </div>
    `;
    el.classList.add('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  function openLightbox(src, alt) {
    const lb = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img || !src) return;
    img.src = src;
    img.alt = alt || 'Listing image';
    lb.classList.add('open');
  }

  function closeLightbox() {
    document.getElementById('image-lightbox')?.classList.remove('open');
  }

  function copyListingLink(id) {
    const url = location.origin + location.pathname + location.search + '#listing=' + encodeURIComponent(id);
    navigator.clipboard.writeText(url).then(() => {
      alert('Listing link copied to clipboard!');
    }).catch(() => {
      alert('Could not copy automatically. URL: ' + url);
    });
  }

  function openDirections(lat, lng) {
    if (lat == null || lng == null) {
      alert('No location available for directions.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat + ',' + lng)}`;
    window.open(url, '_blank', 'noopener');
  }

  function copyAddress(address) {
    if (!address) {
      alert('No address available.');
      return;
    }
    navigator.clipboard.writeText(address).then(() => {
      alert('Address copied to clipboard!');
    }).catch(() => {
      alert('Could not copy automatically. Address: ' + address);
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
    const el = document.getElementById('seller-card');
    if (!el) return;
    const all = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const bySeller = all.filter(l => l.sellerid === sellerid);
    const count = bySeller.length;
    const listHtml = bySeller.length
      ? bySeller.map(l => `
          <div class=\"seller-listing-item\" data-id=\"${escapeHtml(l.id)}\">
            <img src=\"${escapeHtml(l.image)}\" alt=\"\" onerror=\"this.style.display='none'\">
            <div>
              <strong>${escapeHtml(l.headerdescription)}</strong>
              <div class=\"meta\">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)} · ${escapeHtml(l.category)}</div>
            </div>
          </div>
        `).join('')
      : '<p class=\"muted\">No other listings found for this seller in the current data.</p>';

    el.innerHTML = `
      <button class=\"close-btn\" aria-label=\"Close\" onclick=\"this.closest('.seller-card-overlay').classList.remove('open')\">×</button>
      <h3>Seller ${escapeHtml(sellerid)}</h3>
      <p class=\"muted\" style=\"margin-bottom:0.75rem\">${count} listing${count === 1 ? '' : 's'} in current view (seed/demo or live).</p>
      <div class=\"seller-listings\">${listHtml}</div>
    `;
    el.classList.add('open');

    // Wire clicks on seller listing items to open the product card
    el.querySelectorAll('.seller-listing-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const listing = bySeller.find(l => l.id === id);
        if (listing) {
          showProduct(listing);
          el.classList.remove('open');
        }
      });
    });
  }

  function hideAll() {
    document.getElementById('product-card')?.classList.remove('open');
    document.getElementById('seller-card')?.classList.remove('open');
    closeLightbox();
  }

  global.FD_CARDS = { showProduct, showSeller, hideAll, editListing, deleteListing, copyListingLink, openLightbox, closeLightbox, openDirections, copyAddress };
})(window);
