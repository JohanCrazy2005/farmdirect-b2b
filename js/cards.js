/**
 * FarmDirect B2B – product detail card + seller card + image lightbox
 * Substantial module. Pure client-side.
 * Seller card now lists actual products for the seller via FD_LIST.getListings().
 * Product card shows distance when user has used Locate me.
 */
(function (global) {
  'use strict';

  let currentListing = null;

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getDistanceHtml(listing) {
    let userLoc = null;
    if (global.FD_MAP && typeof global.FD_MAP.getUserLatLng === 'function') {
      userLoc = global.FD_MAP.getUserLatLng();
    }
    if (!userLoc || !listing.location || listing.location.lat == null || listing.location.long == null) return '';
    const d = distanceKm(userLoc.lat, userLoc.lng, listing.location.lat, listing.location.long);
    const label = d < 1 ? (d * 1000).toFixed(0) + ' m' : d.toFixed(1) + ' km';
    return `<p class="product-dist">📍 ${label} away</p>`;
  }

  function showProduct(listing) {
    currentListing = listing;
    const el = document.getElementById('product-card');
    if (!el || !listing) return;
    const fav = global.FD_LIST && global.FD_LIST.isFavorite ? global.FD_LIST.isFavorite(listing.id) : false;
    const img = listing.image
      ? `<img class="product-img" src="${escapeHtml(listing.image)}" alt="" data-lightbox="1">`
      : '<div class="product-img placeholder"></div>';
    const distHtml = getDistanceHtml(listing);
    el.innerHTML = `
      <button class="close-card" aria-label="Close">×</button>
      ${img}
      <div class="product-body">
        <h3>${escapeHtml(listing.headerdescription || 'Untitled')}</h3>
        <div class="product-price">$${Number(listing.price || 0).toFixed(2)} <span class="units">/ ${escapeHtml(listing.units || 'unit')}</span></div>
        <div class="product-meta">
          <span class="badge">${escapeHtml(listing.category || '')}</span>
          <span class="badge">${escapeHtml(listing.visibility || '')}</span>
          <span class="badge">${escapeHtml(listing.sellerid || '')}</span>
        </div>
        ${distHtml}
        <p class="product-desc">${escapeHtml(listing.description || '')}</p>
        <p class="product-addr">📍 ${escapeHtml(listing.address || '')}</p>
        <div class="product-actions">
          <button class="fav-btn-large" data-id="${escapeHtml(listing.id)}">${fav ? '★ Favorited' : '☆ Favorite'}</button>
          <button class="primary-btn rfq-btn" data-id="${escapeHtml(listing.id)}">Request quote</button>
          <button class="link-btn seller-btn" data-seller="${escapeHtml(listing.sellerid || '')}">View seller</button>
        </div>
      </div>
    `;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', closeProduct);
    el.querySelector('.fav-btn-large')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.toggleFavorite) global.FD_LIST.toggleFavorite(listing.id);
      showProduct(listing); // refresh
    });
    el.querySelector('.rfq-btn')?.addEventListener('click', () => {
      if (global.FD_RFQ && typeof global.FD_RFQ.openForm === 'function') {
        global.FD_RFQ.openForm(listing);
      } else if (global.FD_TOAST) {
        global.FD_TOAST.show('RFQ module not available', 'info');
      }
    });
    el.querySelector('.seller-btn')?.addEventListener('click', () => showSeller(listing.sellerid));
    el.querySelector('[data-lightbox]')?.addEventListener('click', () => openLightbox(listing.image));
  }

  function closeProduct() {
    document.getElementById('product-card')?.classList.remove('open');
    currentListing = null;
    history.replaceState(null, '', location.pathname + location.search);
  }

  function showSeller(sellerid) {
    if (!sellerid) return;
    const el = document.getElementById('seller-card');
    if (!el) return;

    const all = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    const sellerListings = all.filter(l => l.sellerid === sellerid);

    const itemsHtml = sellerListings.length
      ? sellerListings.map(l => `
          <div class="seller-listing-item" data-id="${escapeHtml(l.id)}">
            <div class="seller-listing-title">${escapeHtml(l.headerdescription || 'Untitled')}</div>
            <div class="seller-listing-meta">${escapeHtml(l.category || '')} · $${Number(l.price || 0).toFixed(2)} / ${escapeHtml(l.units || 'unit')}</div>
          </div>`).join('')
      : '<p class="muted">No listings found for this seller in the current data set.</p>';

    el.innerHTML = `
      <button class="close-card" aria-label="Close">×</button>
      <div class="seller-body">
        <h3>Seller: ${escapeHtml(sellerid)}</h3>
        <p class="seller-count">${sellerListings.length} listing${sellerListings.length === 1 ? '' : 's'}</p>
        <div class="seller-listings">${itemsHtml}</div>
        <button class="primary-btn filter-seller-btn" data-seller="${escapeHtml(sellerid)}">Filter map & list by this seller</button>
      </div>
    `;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', () => el.classList.remove('open'));
    el.querySelector('.filter-seller-btn')?.addEventListener('click', () => {
      const sel = document.getElementById('filter-seller');
      if (sel) { sel.value = sellerid; sel.dispatchEvent(new Event('change')); }
      el.classList.remove('open');
      if (global.FD_TOAST) global.FD_TOAST.show('Filtered by seller', 'info');
    });
    el.querySelectorAll('.seller-listing-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
        }
        el.classList.remove('open');
      });
    });
  }

  function openLightbox(src) {
    const lb = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img || !src) return;
    img.src = src;
    lb.classList.add('open');
  }
  function closeLightbox() {
    document.getElementById('image-lightbox')?.classList.remove('open');
  }

  function refresh() {
    if (currentListing) showProduct(currentListing);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.FD_CARDS = {
    showProduct,
    showSeller,
    closeLightbox,
    refresh,
    closeProduct
  };
})(window);
