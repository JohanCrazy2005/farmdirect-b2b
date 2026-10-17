/**
 * FarmDirect B2B – product & seller cards
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

  function showProduct(listing) {
    const el = document.getElementById('product-card');
    if (!el) return;
    el.innerHTML = `
      <button class="close-btn" aria-label="Close" onclick="this.closest('.detail-card').classList.remove('open')">×</button>
      <img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.headerdescription)}" onerror="this.style.display='none'">
      <h3>${escapeHtml(listing.headerdescription)}</h3>
      <div class="price">$${Number(listing.price).toFixed(2)} <span style="font-weight:400;color:var(--muted)">/ ${escapeHtml(listing.units)}</span></div>
      <p style="margin:0.5rem 0;font-size:0.9rem">${escapeHtml(listing.description)}</p>
      <div style="font-size:0.8rem;color:var(--muted)">
        Category: ${escapeHtml(listing.category)} · Visibility: ${escapeHtml(listing.visibility)}<br>
        Address: ${escapeHtml(listing.address)}
      </div>
      <button class="icon-btn" style="margin-top:0.75rem;width:auto;padding:0 0.75rem" onclick="FD_CARDS.showSeller('${escapeHtml(listing.sellerid)}')">View seller</button>
    `;
    el.classList.add('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  function showSeller(sellerid) {
    // Minimal seller card from listing data (no separate sellers table yet)
    const el = document.getElementById('seller-card');
    if (!el) return;
    el.innerHTML = `
      <button class="close-btn" aria-label="Close" onclick="this.closest('.seller-card-overlay').classList.remove('open')">×</button>
      <h3>Seller ${escapeHtml(sellerid)}</h3>
      <p style="font-size:0.9rem;color:var(--muted)">Seller profile details will appear here once the sellers table is populated.</p>
    `;
    el.classList.add('open');
  }

  function hideAll() {
    document.getElementById('product-card')?.classList.remove('open');
    document.getElementById('seller-card')?.classList.remove('open');
  }

  global.FD_CARDS = { showProduct, showSeller, hideAll };
})(window);
