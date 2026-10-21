/**
 * FarmDirect B2B – Compare Listings
 * Select 2–4 listings from the sidebar (or product card) and open a side-by-side
 * comparison modal. Fully client-side; works in pure seed/demo mode.
 * Selection persists briefly in localStorage. Complements existing filters/favorites.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'fd-compare-ids';
  const MAX = 4;
  let selected = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) selected = new Set(JSON.parse(raw).slice(0, MAX));
    } catch (_) {}
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    } catch (_) {}
  }

  function showToast(msg, type) {
    if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
      global.FD_TOAST.show(msg, type || 'info');
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getListing(id) {
    const all = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? global.FD_LIST.getListings()
      : [];
    return all.find(l => l.id === id);
  }

  function toggle(id) {
    if (!id) return false;
    if (selected.has(id)) {
      selected.delete(id);
      showToast('Removed from compare', 'info');
    } else {
      if (selected.size >= MAX) {
        showToast(`Compare limited to ${MAX} listings`, 'info');
        return false;
      }
      selected.add(id);
      showToast('Added to compare', 'success');
    }
    save();
    updateButtons();
    return selected.has(id);
  }

  function isSelected(id) {
    return selected.has(id);
  }

  function clear() {
    selected.clear();
    save();
    updateButtons();
    showToast('Compare selection cleared', 'info');
  }

  function updateButtons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
      const id = btn.dataset.id;
      const on = selected.has(id);
      btn.classList.toggle('active', on);
      btn.textContent = on ? '✓ Comparing' : 'Compare';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const opt = document.getElementById('compare-btn');
    if (opt) {
      opt.textContent = selected.size
        ? `Compare listings (${selected.size})`
        : 'Compare listings';
    }
  }

  function open() {
    const modal = document.getElementById('compare-modal');
    const content = document.getElementById('compare-content');
    if (!modal || !content) return;

    const ids = [...selected];
    if (ids.length < 2) {
      showToast('Select at least 2 listings to compare', 'info');
      return;
    }

    const listings = ids.map(getListing).filter(Boolean);
    if (listings.length < 2) {
      showToast('Some selected listings are no longer available', 'error');
      return;
    }

    const user = (global.FD_MAP && typeof global.FD_MAP.getUserLatLng === 'function')
      ? global.FD_MAP.getUserLatLng()
      : null;

    function distLabel(l) {
      if (!user || !l.location) return '—';
      const km = haversine(user.lat, user.lng, l.location.lat, l.location.long);
      if (!isFinite(km)) return '—';
      return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
    }

    const rows = [
      { label: 'Image', html: l => `<img src="${escapeHtml(l.image)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:0.3rem" onerror="this.style.display='none'">` },
      { label: 'Product', html: l => `<strong>${escapeHtml(l.headerdescription || '')}</strong>` },
      { label: 'Category', html: l => escapeHtml(l.category || '—') },
      { label: 'Price', html: l => `$${Number(l.price || 0).toFixed(2)} / ${escapeHtml(l.units || '')}` },
      { label: 'Seller', html: l => escapeHtml(l.sellerid || '—') },
      { label: 'Visibility', html: l => escapeHtml(l.visibility || '—') },
      { label: 'Address', html: l => escapeHtml(l.address || '—') },
      { label: 'Distance', html: l => distLabel(l) },
      { label: 'Description', html: l => `<div style="font-size:0.8rem;max-width:180px">${escapeHtml((l.description || '').slice(0, 120))}${(l.description || '').length > 120 ? '…' : ''}</div>` }
    ];

    let table = `<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th></th>`;
    listings.forEach(l => {
      table += `<th>${escapeHtml((l.headerdescription || l.id).slice(0, 24))}</th>`;
    });
    table += '</tr></thead><tbody>';

    rows.forEach(row => {
      table += `<tr><th>${row.label}</th>`;
      listings.forEach(l => {
        table += `<td>${row.html(l)}</td>`;
      });
      table += '</tr>';
    });

    table += '</tbody></table></div>';

    table += `<div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">`;
    listings.forEach(l => {
      table += `<button type="button" class="small-btn" data-open="${escapeHtml(l.id)}">Open ${escapeHtml((l.headerdescription || '').slice(0, 16))}</button>`;
    });
    table += `<button type="button" id="compare-clear-btn" class="clear-filters">Clear selection</button>`;
    table += `</div>`;

    content.innerHTML = table;
    modal.classList.add('open');

    content.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.open;
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
        }
        modal.classList.remove('open');
      });
    });
    document.getElementById('compare-clear-btn')?.addEventListener('click', () => {
      clear();
      modal.classList.remove('open');
    });
  }

  function close() {
    document.getElementById('compare-modal')?.classList.remove('open');
  }

  function haversine(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function bind() {
    load();
    document.getElementById('compare-btn')?.addEventListener('click', open);
    document.getElementById('close-compare-btn')?.addEventListener('click', close);
    document.getElementById('compare-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'compare-modal') close();
    });
    updateButtons();
  }

  global.FD_COMPARE = {
    bind,
    toggle,
    isSelected,
    clear,
    open,
    updateButtons
  };
})(window);
