/**
 * FarmDirect B2B – product & seller cards
 * + deep-link support: opening a card updates #listing=<id>; copy-link button
 * + richer seller profile: lists other listings by the same sellerid from current data (seed/demo friendly)
 * + image lightbox: click product photo to enlarge (fully client-side, demo friendly)
 * + directions button: opens external maps with listing coordinates (seed/demo friendly)
 * + copy address button: copies listing address to clipboard (seed/demo friendly)
 * + distance label in product card when Locate me has been used (seed/demo friendly)
 * + coordinates display + copy button (shows lat/long; copies to clipboard; seed/demo friendly)
 * + share button: uses Web Share API when available, falls back to copy link (seed/demo friendly)
 * + favorites: heart toggle button in product card (localStorage; seed/demo friendly)
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

  // Haversine distance in km (matches list.js for consistency)
  function distanceKm(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatDistance(km) {
    if (!isFinite(km)) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
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
      ? `<button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.openDirections(${lat}, ${lng})">Directions</button>`
      : '';
    const addrBtn = listing.address
      ? `<button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.copyAddress('${escapeHtml(listing.address).replace(/'/g, "\\'")}')">Copy address</button>`
      : '';
    const coordsBtn = (lat != null && lng != null)
      ? `<button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.copyCoordinates(${lat}, ${lng})">Copy coordinates</button>`
      : '';
    const shareBtn = listing.id
      ? `<button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.shareListing('${escapeHtml(listing.id)}')">Share</button>`
      : '';
    const isFav = (global.FD_LIST && typeof global.FD_LIST.isFavorite === 'function') ? global.FD_LIST.isFavorite(listing.id) : false;
    const favBtn = listing.id
      ? `<button class="icon-btn favorite-product-btn${isFav ? ' active' : ''}" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.toggleFavorite('${escapeHtml(listing.id)}')">${isFav ? '♥ Favorited' : '♡ Favorite'}</button>`
      : '';

    // Distance if Locate me has been used
    let distHtml = '';
    const user = (global.FD_MAP && typeof global.FD_MAP.getUserLatLng === 'function') ? global.FD_MAP.getUserLatLng() : null;
    if (user && lat != null && lng != null) {
      const km = distanceKm(user.lat, user.lng, lat, lng);
      const formatted = formatDistance(km);
      if (formatted) {
        distHtml = `<div class="distance" style="font-size:0.85rem;color:var(--accent);margin:0.35rem 0">📍 ${formatted} away</div>`;
      }
    }

    const coordsHtml = (lat != null && lng != null)
      ? `<div style="font-size:0.8rem;color:var(--muted);margin-top:0.25rem">Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`
      : '';

    el.innerHTML = `
      <button class="close-btn" aria-label="Close" onclick="this.closest('.detail-card').classList.remove('open'); history.replaceState(null, '', location.pathname + location.search);">×</button>
      <img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.headerdescription)}" class="product-image" onerror="this.style.display='none'" onclick="FD_CARDS.openLightbox(this.src, this.alt)">
      <h3>${escapeHtml(listing.headerdescription)}</h3>
      <div class="price">$${Number(listing.price).toFixed(2)} <span style="font-weight:400;color:var(--muted)">/ ${escapeHtml(listing.units)}</span></div>
      ${distHtml}
      <p style="margin:0.5rem 0;font-size:0.9rem">${escapeHtml(listing.description)}</p>
      <div style="font-size:0.8rem;color:var(--muted)">
        Category: ${escapeHtml(listing.category)} · Visibility: ${escapeHtml(listing.visibility)}<br>
        Address: ${escapeHtml(listing.address)}
        ${coordsHtml}
      </div>
      <div style="margin-top:0.75rem;display:flex;gap:0.4rem;flex-wrap:wrap">
        <button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.showSeller('${escapeHtml(listing.sellerid)}')">View seller</button>
        <button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.copyListingLink('${escapeHtml(listing.id)}')">Copy link</button>
        ${shareBtn}
        ${favBtn}
        ${dirBtn}
        ${addrBtn}
        ${coordsBtn}
        <button class="icon-btn" style="width:auto;padding:0 0.75rem" onclick="FD_CARDS.editListing('${escapeHtml(listing.id)}')">Edit</button>
        <button class="icon-btn" style="width:auto;padding:0 0.75rem;color:#dc2626" onclick="FD_CARDS.deleteListing('${escapeHtml(listing.id)}')">Delete</button>
      </div>
    `;
    el.classList.add('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  function toggleFavorite(id) {
    if (!global.FD_LIST || typeof global.FD_LIST.toggleFavorite !== 'function') return;
    const nowFav = global.FD_LIST.toggleFavorite(id);
    updateFavoriteButton(id, nowFav);
  }

  function updateFavoriteButton(id, isFav) {
    const card = document.getElementById('product-card');
    if (!card || !card.classList.contains('open')) return;
    const btn = card.querySelector('.favorite-product-btn');
    if (!btn) return;
    const isNow = isFav != null ? isFav : (global.FD_LIST && global.FD_LIST.isFavorite ? global.FD_LIST.isFavorite(id) : false);
    btn.classList.toggle('active', isNow);
    btn.innerHTML = isNow ? '♥ Favorited' : '♡ Favorite';
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

  function shareListing(id) {
    const url = location.origin + location.pathname + location.search + '#listing=' + encodeURIComponent(id);
    const title = 'FarmDirect listing';
    const text = 'Check out this listing on FarmDirect B2B';
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {
        // User cancelled or share failed – silent fallback is fine
      });
    } else {
      // Fallback to copy link (works everywhere, including pure seed/demo)
      copyListingLink(id);
    }
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

  function copyCoordinates(lat, lng) {
    if (lat == null || lng == null) {
      alert('No coordinates available.');
      return;
    }
    const text = `${lat}, ${lng}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Coordinates copied to clipboard!');
    }).catch(() => {
      alert('Could not copy automatically. Coordinates: ' + text);
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
          <div class="seller-listing-item" data-id="${escapeHtml(l.id)}">
            <img src="${escapeHtml(l.image)}" alt="" onerror="this.style.display='none'">
            <div>
              <strong>${escapeHtml(l.headerdescription)}</strong>
              <div class="meta">$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units)} · ${escapeHtml(l.category)}</div>
            </div>
          </div>
        `).join('')
      : '<p class="muted">No other listings found for this seller in the current data.</p>';

    el.innerHTML = `
      <button class="close-btn" aria-label="Close" onclick="this.closest('.seller-card-overlay').classList.remove('open')">×</button>
      <h3>Seller ${escapeHtml(sellerid)}</h3>
      <p class="muted" style="margin-bottom:0.75rem">${count} listing${count === 1 ? '' : 's'} in current view (seed/demo or live).</p>
      <div class="seller-listings">${listHtml}</div>
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

  global.FD_CARDS = { showProduct, showSeller, hideAll, editListing, deleteListing, copyListingLink, openLightbox, closeLightbox, openDirections, copyAddress, copyCoordinates, shareListing, toggleFavorite, updateFavoriteButton };
})(window);
