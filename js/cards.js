/**
 * FarmDirect B2B – product & seller floating cards
 * Opens detailed product card on listing select (from list or map popup).
 * Seller card on request. Image lightbox, RFQ button, favorites, close handlers.
 * Fully client-side; works with seed/demo and live data. Matches index.html structure.
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

  function getDisplayName(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName)
      ? global.FD_SELLERS.getDisplayName(sellerid)
      : (sellerid || 'Unknown seller');
  }

  function isFavorite(id) {
    return global.FD_LIST && typeof global.FD_LIST.isFavorite === 'function'
      ? global.FD_LIST.isFavorite(id)
      : false;
  }

  function closeCards() {
    const product = document.getElementById('product-card');
    const seller = document.getElementById('seller-card');
    if (product) product.innerHTML = '';
    if (seller) seller.innerHTML = '';
    if (product) product.classList.remove('open');
    if (seller) seller.classList.remove('open');
  }

  function openLightbox(src, alt) {
    const lb = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img || !src) return;
    img.src = src;
    img.alt = alt || '';
    lb.classList.add('open');
    const close = () => lb.classList.remove('open');
    lb.onclick = close;
    img.onclick = (e) => e.stopPropagation();
  }

  function openProduct(listing) {
    if (!listing) return;
    closeCards();
    const el = document.getElementById('product-card');
    if (!el) return;

    const seller = getDisplayName(listing.sellerid);
    const price = listing.price != null ? `$${Number(listing.price).toFixed(2)} / ${escapeHtml(listing.units || 'unit')}` : 'Price on request';
    const fav = isFavorite(listing.id);
    const img = listing.image
      ? `<img class="card-image" src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.headerdescription || '')}" data-src="${escapeHtml(listing.image)}">`
      : `<div class="card-image placeholder">${escapeHtml((listing.category || '?').slice(0, 3).toUpperCase())}</div>`;

    el.innerHTML = `
      <button type="button" class="icon-btn card-close" aria-label="Close">×</button>
      ${img}
      <div class="card-body">
        <h3>${escapeHtml(listing.headerdescription || 'Listing')}</h3>
        <div class="card-meta">
          <span class="price">${price}</span>
          <span class="muted">${escapeHtml(listing.category || '')}</span>
          <span class="muted">${escapeHtml(listing.visibility || '')}</span>
        </div>
        <p class="card-desc">${escapeHtml(listing.description || '')}</p>
        <div class="card-address muted small">${escapeHtml(listing.address || '')}</div>
        <div class="card-actions">
          <button type="button" class="small-btn seller-link" data-seller="${escapeHtml(listing.sellerid)}">Seller: ${escapeHtml(seller)}</button>
          <button type="button" class="small-btn fav-toggle" data-id="${escapeHtml(listing.id)}">${fav ? '★ Favorited' : '☆ Favorite'}</button>
          <button type="button" class="small-btn primary rfq-btn" data-id="${escapeHtml(listing.id)}">Request quote</button>
        </div>
      </div>
    `;
    el.classList.add('open');

    el.querySelector('.card-close')?.addEventListener('click', closeCards);
    el.querySelector('.card-image')?.addEventListener('click', (e) => {
      const src = e.target.dataset.src || e.target.src;
      if (src) openLightbox(src, listing.headerdescription);
    });
    el.querySelector('.seller-link')?.addEventListener('click', () => openSeller(listing.sellerid, listing));
    el.querySelector('.fav-toggle')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.toggleFavorite) global.FD_LIST.toggleFavorite(listing.id);
      openProduct(listing); // refresh
    });
    el.querySelector('.rfq-btn')?.addEventListener('click', () => {
      if (global.FD_RFQ && typeof global.FD_RFQ.open === 'function') {
        global.FD_RFQ.open(listing.id);
      } else if (global.FD_TOAST) {
        global.FD_TOAST.show('RFQ module not ready', 'info');
      }
    });

    if (global.FD_MAP && global.FD_MAP.flyToListing) {
      global.FD_MAP.flyToListing(listing);
    }
  }

  function openSeller(sellerid, sampleListing) {
    if (!sellerid) return;
    const el = document.getElementById('seller-card');
    if (!el) return;

    const name = getDisplayName(sellerid);
    // Collect listings for this seller from current set
    const all = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
    const mine = all.filter(l => l.sellerid === sellerid);
    const count = mine.length;
    const cats = [...new Set(mine.map(l => l.category).filter(Boolean))].join(', ') || 'various';

    el.innerHTML = `
      <button type="button" class="icon-btn card-close" aria-label="Close">×</button>
      <div class="card-body">
        <h3>${escapeHtml(name)}</h3>
        <div class="muted small">Seller ID: ${escapeHtml(sellerid)}</div>
        <p>${count} listing${count === 1 ? '' : 's'} · ${escapeHtml(cats)}</p>
        ${sampleListing ? `<div class="muted small">Example: ${escapeHtml(sampleListing.headerdescription || '')}</div>` : ''}
        <div class="card-actions">
          <button type="button" class="small-btn" id="filter-to-seller">Filter list to this seller</button>
          <button type="button" class="small-btn" id="close-seller-card">Close</button>
        </div>
      </div>
    `;
    el.classList.add('open');

    el.querySelector('.card-close')?.addEventListener('click', () => {
      el.innerHTML = '';
      el.classList.remove('open');
    });
    el.querySelector('#close-seller-card')?.addEventListener('click', () => {
      el.innerHTML = '';
      el.classList.remove('open');
    });
    el.querySelector('#filter-to-seller')?.addEventListener('click', () => {
      if (global.FD_LIST && global.FD_LIST.setSellerFilter) {
        global.FD_LIST.setSellerFilter(sellerid);
        if (global.FD_TOAST) global.FD_TOAST.show('Filtered to seller', 'info');
      }
      el.innerHTML = '';
      el.classList.remove('open');
    });
  }

  function bind() {
    // Close on Escape is handled in shortcuts or main; here we just expose
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCards();
    });
  }

  global.FD_CARDS = {
    openProduct,
    openSeller,
    closeCards,
    bind
  };
})(window);
