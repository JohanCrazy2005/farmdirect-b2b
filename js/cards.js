/**
 * FarmDirect B2B – product & seller cards + lightbox
 * Renders detailed product cards (visibility badge, price/units, seller display name
 * from seed-sellers.json, RFQ, favorite, share) and seller cards.
 * Opens from list/map selection. Fully client-side; works with seed/demo fallback.
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtPrice(price, units) {
    if (price == null || isNaN(Number(price))) return 'Price on request';
    return '$' + Number(price).toFixed(2) + (units ? ' / ' + units : '');
  }

  function visibilityLabel(v) {
    const map = { worldwide: 'Worldwide', country: 'Country', province: 'Province' };
    return map[v] || v || 'Unknown';
  }

  function openProduct(listing) {
    const el = document.getElementById('product-card');
    if (!el || !listing) return;
    const sellerName = (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
      ? global.FD_SELLERS.getDisplayName(listing.sellerid)
      : (listing.sellerid || '');
    const favs = (global.FD_LIST && typeof global.FD_LIST.getFavorites === 'function')
      ? global.FD_LIST.getFavorites() : new Set();
    const isFav = favs.has ? favs.has(listing.id) : false;
    el.innerHTML = `
      <button type="button" class="close-card" aria-label="Close">×</button>
      ${listing.image ? `<img class="card-image" src="${escapeHtml(listing.image)}" alt="" data-full="${escapeHtml(listing.image)}">` : ''}
      <div class="card-body">
        <h3>${escapeHtml(listing.headerdescription || 'Listing')}</h3>
        <div class="card-meta">
          <span class="category-badge">${escapeHtml(listing.category || '')}</span>
          <span class="visibility-badge vis-${escapeHtml(listing.visibility || '')}">${escapeHtml(visibilityLabel(listing.visibility))}</span>
          <span class="price">${escapeHtml(fmtPrice(listing.price, listing.units))}</span>
        </div>
        <p class="address muted">${escapeHtml(listing.address || '')}</p>
        <p class="description">${escapeHtml(listing.description || '')}</p>
        <div class="seller-link">Seller: <button type="button" class="link-btn open-seller" data-seller="${escapeHtml(listing.sellerid || '')}">${escapeHtml(sellerName)}</button></div>
        <div class="card-actions">
          <button type="button" class="small-btn rfq-btn" data-id="${escapeHtml(listing.id)}">Request quote</button>
          <button type="button" class="small-btn fav-btn" data-id="${escapeHtml(listing.id)}">${isFav ? '★ Unfavorite' : '☆ Favorite'}</button>
          <button type="button" class="small-btn share-btn" data-id="${escapeHtml(listing.id)}">Share</button>
        </div>
      </div>
    `;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', () => closeProduct());
    el.querySelector('.card-image')?.addEventListener('click', () => openLightbox(listing.image));
    el.querySelector('.open-seller')?.addEventListener('click', () => openSeller(listing.sellerid));
    el.querySelector('.rfq-btn')?.addEventListener('click', () => {
      if (global.FD_RFQ && typeof global.FD_RFQ.open === 'function') global.FD_RFQ.open(listing.id);
    });
    el.querySelector('.fav-btn')?.addEventListener('click', () => {
      if (global.FD_LIST && typeof global.FD_LIST.toggleFavorite === 'function') global.FD_LIST.toggleFavorite(listing.id);
      openProduct(listing);
    });
    el.querySelector('.share-btn')?.addEventListener('click', async () => {
      const url = location.origin + location.pathname + '#listing=' + encodeURIComponent(listing.id);
      try {
        await navigator.clipboard.writeText(url);
        if (global.FD_TOAST) global.FD_TOAST.show('Listing link copied', 'success');
      } catch (_) {
        if (global.FD_TOAST) global.FD_TOAST.show(url, 'info');
      }
    });
  }

  function closeProduct() {
    document.getElementById('product-card')?.classList.remove('open');
  }

  function openSeller(sellerid) {
    const el = document.getElementById('seller-card');
    if (!el || !sellerid) return;
    const name = (global.FD_SELLERS && typeof global.FD_SELLERS.getDisplayName === 'function')
      ? global.FD_SELLERS.getDisplayName(sellerid) : sellerid;
    const bio = (global.FD_SELLERS && typeof global.FD_SELLERS.getBio === 'function')
      ? global.FD_SELLERS.getBio(sellerid) : '';
    el.innerHTML = `
      <button type="button" class="close-card" aria-label="Close">×</button>
      <div class="card-body">
        <h3>${escapeHtml(name)}</h3>
        ${bio ? `<p class="description">${escapeHtml(bio)}</p>` : ''}
        <p class="muted">ID: ${escapeHtml(sellerid)}</p>
        <button type="button" class="small-btn filter-seller" data-seller="${escapeHtml(sellerid)}">Show their listings</button>
      </div>
    `;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', () => closeSeller());
    el.querySelector('.filter-seller')?.addEventListener('click', () => {
      const sel = document.getElementById('filter-seller');
      if (sel) {
        sel.value = sellerid;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closeSeller();
      closeProduct();
      if (global.FD_TOAST) global.FD_TOAST.show('Filtered to ' + name, 'info');
    });
  }

  function closeSeller() {
    document.getElementById('seller-card')?.classList.remove('open');
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

  global.FD_CARDS = {
    openProduct,
    closeProduct,
    openSeller,
    closeSeller,
    openLightbox,
    closeLightbox
  };
})(window);
