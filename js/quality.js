/**
 * FarmDirect B2B – data quality inspector
 * Scans current listings for schema issues (missing/invalid fields per canonical schema)
 * and presents a filterable report with jump-to-listing actions.
 * Improves seed/demo fallback clarity while the Worker may be empty or offline.
 * Fully client-side; no new product features.
 */
(function (global) {
  'use strict';

  const REQUIRED = [
    'location', 'visibility', 'address', 'sellerid', 'category',
    'headerdescription', 'price', 'units', 'description'
  ];

  const VISIBILITIES = ['worldwide', 'country', 'province'];

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isValidLatLng(loc) {
    if (!loc || typeof loc !== 'object') return false;
    const lat = Number(loc.lat);
    const lng = Number(loc.long);
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function checkListing(l) {
    const issues = [];
    const id = l.id || '(no id)';

    if (!l.location || !isValidLatLng(l.location)) {
      issues.push({ severity: 'error', field: 'location', msg: 'Missing or invalid lat/long' });
    }
    if (!VISIBILITIES.includes(l.visibility)) {
      issues.push({ severity: 'error', field: 'visibility', msg: 'Must be worldwide|country|province' });
    }
    REQUIRED.forEach(field => {
      if (field === 'location' || field === 'visibility' || field === 'price') return;
      const val = l[field];
      if (val == null || String(val).trim() === '') {
        issues.push({ severity: 'warning', field, msg: 'Missing or empty' });
      }
    });
    if (l.price == null || !Number.isFinite(Number(l.price)) || Number(l.price) < 0) {
      issues.push({ severity: 'warning', field: 'price', msg: 'Missing, non-numeric, or negative' });
    }
    if (!l.image || String(l.image).trim() === '') {
      issues.push({ severity: 'info', field: 'image', msg: 'No image URL' });
    }

    return issues.length ? { id, header: l.headerdescription || id, sellerid: l.sellerid || '', issues } : null;
  }

  function analyze(listings) {
    const results = [];
    (listings || []).forEach(l => {
      const result = checkListing(l);
      if (result) results.push(result);
    });
    const errorCount = results.reduce((n, r) => n + r.issues.filter(i => i.severity === 'error').length, 0);
    const warnCount = results.reduce((n, r) => n + r.issues.filter(i => i.severity === 'warning').length, 0);
    return { results, errorCount, warnCount, totalListings: (listings || []).length };
  }

  function render(analysis) {
    const { results, errorCount, warnCount, totalListings } = analysis;
    if (!results.length) {
      return `
        <h3>Data quality</h3>
        <p>All ${totalListings} listings pass basic schema checks.</p>
        <p class="small muted">Scanned for valid location, visibility enum, and non-empty required fields. Fully client-side.</p>
      `;
    }
    let html = `
      <h3>Data quality</h3>
      <p>${results.length} listing(s) with issues · ${errorCount} errors · ${warnCount} warnings (of ${totalListings} total)</p>
      <p class="small muted">Click “View” to open the listing on the map and in the product card. Useful for cleaning seed/demo data.</p>
    `;
    results.forEach(r => {
      const sevClass = r.issues.some(i => i.severity === 'error') ? 'error' : 'warning';
      html += `
        <div class="quality-item quality-${sevClass}">
          <div class="quality-head">
            <strong>${escapeHtml(r.header)}</strong>
            <span class="small muted">${escapeHtml(r.id)} · ${escapeHtml(r.sellerid)}</span>
          </div>
          <ul class="quality-issues">
            ${r.issues.map(i => `<li class="quality-${i.severity}"><span class="quality-sev">${i.severity}</span> ${escapeHtml(i.field)}: ${escapeHtml(i.msg)}</li>`).join('')}
          </ul>
          <div class="quality-actions">
            <button type="button" class="small-btn quality-view-btn" data-id="${escapeHtml(r.id)}">View</button>
          </div>
        </div>
      `;
    });
    html += `<p class="small muted" style="margin-top:10px;">Schema: location{lat,long}, visibility, address, sellerid, category, headerdescription, price, units, description, image</p>`;
    return html;
  }

  function open() {
    const modal = document.getElementById('quality-modal');
    const content = modal?.querySelector('.modal-content');
    if (!modal || !content) return;

    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    const analysis = analyze(listings);

    const closeBtn = content.querySelector('.close-modal');
    content.innerHTML = '';
    if (closeBtn) content.appendChild(closeBtn);
    else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close-modal';
      btn.id = 'close-quality-btn';
      btn.textContent = '×';
      btn.addEventListener('click', close);
      content.appendChild(btn);
    }

    const wrap = document.createElement('div');
    wrap.innerHTML = render(analysis);
    content.appendChild(wrap);
    modal.classList.add('open');

    wrap.querySelectorAll('.quality-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (id && global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
          close();
        }
      });
    });
  }

  function close() {
    document.getElementById('quality-modal')?.classList.remove('open');
  }

  function bind() {
    document.getElementById('open-quality')?.addEventListener('click', () => {
      const menu = document.getElementById('options-menu');
      menu?.setAttribute('hidden', '');
      document.getElementById('options-btn')?.setAttribute('aria-expanded', 'false');
      open();
    });
    document.getElementById('close-quality-btn')?.addEventListener('click', close);
    document.getElementById('quality-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'quality-modal') close();
    });
  }

  global.FD_QUALITY = { open, close, bind };
})(window);
