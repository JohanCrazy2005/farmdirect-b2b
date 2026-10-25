/**
 * FarmDirect B2B – product & seller cards + lightbox
 * Max 3 badges, friendly seller names, image lightbox. Works with seed/demo.
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
    return (global.FD_SELLERS && global.FD_SELLERS.getDisplayName) ? global.FD_SELLERS.getDisplayName(sellerid) : (sellerid || '');
  }

  function getBio(sellerid) {
    return (global.FD_SELLERS && global.FD_SELLERS.getBio) ? global.FD_SELLERS.getBio(sellerid) : '';
  }

  function getTopBadges(l) {
    const badges = [];
    if (l.verified) badges.push('Verified');
    if (/organic/i.test(l.headerdescription + ' ' + (l.description||'') + ' ' + (l.category||''))) badges.push('Organic');
    if (l.status === 'published') badges.push('In stock');
    else if (l.status) badges.push(l.status);
    if (l.grade && /premium|a\+/i.test(l.grade)) badges.push('Premium');
    if (l.lotTracked) badges.push('Lot-tracked');
    return badges.slice(0, 3);
  }

  function showProduct(l) {
    const el = document.getElementById('product-card');
    if (!el || !l) return;
    const badges = getTopBadges(l).map(b => `<span class="badge">${escapeHtml(b)}</span>`).join('');
    const price = l.price != null ? `$${Number(l.price).toFixed(2)} / ${escapeHtml(l.units||'')}` : 'Price on request';
    const name = getDisplayName(l.sellerid);
    const img = l.image ? `<img class="card-img" src="${escapeHtml(l.image)}" alt="" data-full="${escapeHtml(l.image)}">` : '';
    el.innerHTML = `
      <button type="button" class="close-card" aria-label="Close">×</button>
      ${img}
      <div class="card-body">
        <h3>${escapeHtml(l.headerdescription || 'Listing')}</h3>
        <div class="badges">${badges}</div>
        <p class="price">${price}</p>
        <p class="muted">${escapeHtml(l.address || '')}</p>
        <p>${escapeHtml(l.description || '')}</p>
        <div class="card-actions">
          <button type="button" class="small-btn view-seller" data-seller="${escapeHtml(l.sellerid)}">View seller: ${escapeHtml(name)}</button>
          <button type="button" class="small-btn rfq-btn" data-id="${escapeHtml(l.id)}">Request quote</button>
        </div>
      </div>`;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', closeProduct);
    el.querySelector('.card-img')?.addEventListener('click', () => openLightbox(l.image));
    el.querySelector('.view-seller')?.addEventListener('click', () => showSeller(l.sellerid, l));
    el.querySelector('.rfq-btn')?.addEventListener('click', () => {
      if (global.FD_RFQ) global.FD_RFQ.open(l.id);
    });
  }

  function closeProduct() {
    const el = document.getElementById('product-card');
    if (el) {
      el.classList.remove('open');
      el.innerHTML = '';
    }
  }

  function showSeller(sellerid, sample) {
    const el = document.getElementById('seller-card');
    if (!el) return;
    const name = getDisplayName(sellerid);
    const bio = getBio(sellerid);
    const listings = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings().filter(x => x.sellerid === sellerid) : [];
    const count = listings.length;
    const avg = listings.reduce((s, l) => s + (Number(l.price)||0), 0) / (count || 1);
    el.innerHTML = `
      <button type="button" class="close-card" aria-label="Close">×</button>
      <div class="card-body">
        <h3>${escapeHtml(name)}</h3>
        ${bio ? `<p>${escapeHtml(bio)}</p>` : ''}
        <p class="muted">${count} listing${count===1?'':'s'} · Avg $${avg.toFixed(2)}</p>
        ${sample?.address ? `<p class="small">${escapeHtml(sample.address)}</p>` : ''}
        <div class="card-actions">
          <button type="button" class="small-btn filter-seller" data-seller="${escapeHtml(sellerid)}">Filter to this seller</button>
        </div>
      </div>`;
    el.classList.add('open');
    el.querySelector('.close-card')?.addEventListener('click', closeSeller);
    el.querySelector('.filter-seller')?.addEventListener('click', () => {
      const sel = document.getElementById('filter-seller');
      if (sel) {
        sel.value = sellerid;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closeSeller();
      if (global.FD_TOAST) global.FD_TOAST.show(`Filtered to ${name}`, 'info');
    });
  }

  function closeSeller() {
    const el = document.getElementById('seller-card');
    if (el) {
      el.classList.remove('open');
      el.innerHTML = '';
    }
  }

  function openLightbox(src) {
    const lb = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img || !src) return;
    img.src = src;
    lb.classList.add('open');
  }

  function closeLightbox() {
    const lb = document.getElementById('image-lightbox');
    if (lb) lb.classList.remove('open');
  }

  global.FD_CARDS = {
    showProduct,
    closeProduct,
    showSeller,
    closeSeller,
    openLightbox,
    closeLightbox
  };
})(window);
