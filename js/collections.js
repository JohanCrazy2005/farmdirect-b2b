/**
 * FarmDirect B2B – local listing collections
 * Lets users group listings into named collections stored in localStorage (fd-collections).
 * Useful for seed/demo exploration: create "Spring seeds", "Bulk grain", "Follow-up", etc.
 * Collections appear on the product card; manage them in a dedicated modal.
 * Fully client-side; no server dependency. Complements tags, notes, and favorites.
 */
(function (global) {
  'use strict';

  const COLLECTIONS_KEY = 'fd-collections';

  function loadCollections() {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function saveCollections(cols) {
    try {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
    } catch (_) {}
  }

  function getCollections() {
    return loadCollections();
  }

  function getCollectionsForListing(id) {
    if (!id) return [];
    const all = loadCollections();
    return Object.keys(all).filter(name => Array.isArray(all[name]) && all[name].includes(String(id)));
  }

  function addToCollection(id, name) {
    if (!id || !name) return;
    const cleanName = String(name).trim();
    if (!cleanName) return;
    const all = loadCollections();
    if (!Array.isArray(all[cleanName])) all[cleanName] = [];
    const sid = String(id);
    if (!all[cleanName].includes(sid)) {
      all[cleanName].push(sid);
      saveCollections(all);
    }
  }

  function removeFromCollection(id, name) {
    if (!id || !name) return;
    const all = loadCollections();
    const cleanName = String(name).trim();
    if (!Array.isArray(all[cleanName])) return;
    all[cleanName] = all[cleanName].filter(x => x !== String(id));
    if (!all[cleanName].length) delete all[cleanName];
    saveCollections(all);
  }

  function deleteCollection(name) {
    if (!name) return;
    const all = loadCollections();
    delete all[String(name).trim()];
    saveCollections(all);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function editCollections(id) {
    const current = getCollectionsForListing(id);
    const allNames = Object.keys(loadCollections());
    const promptText = current.length
      ? `Collections (comma-separated names). Current: ${current.join(', ')}\nLeave empty to clear.`
      : 'Add to collection (name, or comma-separated to add to several):';
    const next = prompt(promptText, current.join(', '));
    if (next === null) return;
    const names = next.split(/[,;]+/).map(n => n.trim()).filter(Boolean);
    // Remove from all first, then add to the new ones
    const all = loadCollections();
    Object.keys(all).forEach(name => {
      all[name] = (all[name] || []).filter(x => x !== String(id));
      if (!all[name].length) delete all[name];
    });
    names.forEach(name => {
      if (!Array.isArray(all[name])) all[name] = [];
      if (!all[name].includes(String(id))) all[name].push(String(id));
    });
    saveCollections(all);
    if (global.FD_TOAST) {
      global.FD_TOAST.show(names.length ? 'Collections updated' : 'Removed from all collections', 'success');
    }
    // Refresh open product card
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
        ? global.FD_LIST.getListings() : [];
      const listing = listings.find(l => String(l.id) === String(id));
      if (listing && document.getElementById('product-card')?.classList.contains('open')) {
        global.FD_CARDS.openProduct(listing);
      }
    }
  }

  function open() {
    const modal = document.getElementById('collections-modal');
    if (!modal) return;
    renderModal();
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('collections-modal')?.classList.remove('open');
  }

  function renderModal() {
    const content = document.querySelector('#collections-modal .modal-content');
    if (!content) return;
    const all = loadCollections();
    const names = Object.keys(all).filter(n => Array.isArray(all[n]) && all[n].length);
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? (global.FD_LIST.getListings() || [])
      : [];
    const byId = Object.fromEntries(listings.map(l => [String(l.id), l]));

    let html = `
      <button type="button" id="close-collections-btn" class="close-modal">×</button>
      <h3>Listing collections</h3>
      <p class="small muted">Collections are stored only in this browser. Group seed/demo listings into named sets (e.g. Spring seeds, Bulk grain, Follow-up).</p>
      <div class="collection-create">
        <input type="text" id="new-collection-name" placeholder="New collection name" style="flex:1;height:36px;border:1px solid var(--border);border-radius:8px;padding:0 10px;background:var(--surface);color:var(--fg);">
        <button type="button" id="create-collection-btn" class="small-btn primary">Create</button>
      </div>
    `;

    if (!names.length) {
      html += `<p class="empty-state">No collections yet. Open a listing and use the “Collections” button, or create one above.</p>`;
    } else {
      html += `<div class="collections-list">`;
      names.sort().forEach(name => {
        const ids = all[name] || [];
        const itemsHtml = ids.slice(0, 5).map(id => {
          const listing = byId[id] || {};
          return escapeHtml(listing.headerdescription || id);
        }).join(', ');
        const more = ids.length > 5 ? ` +${ids.length - 5} more` : '';
        html += `
          <div class="collection-item" data-name="${escapeHtml(name)}">
            <div class="collection-head">
              <strong>${escapeHtml(name)}</strong>
              <span class="muted small">${ids.length} listing${ids.length === 1 ? '' : 's'}</span>
            </div>
            <div class="collection-preview muted small">${itemsHtml}${more}</div>
            <div class="collection-actions">
              <button type="button" class="small-btn view-collection" data-name="${escapeHtml(name)}">View first</button>
              <button type="button" class="small-btn delete-collection" data-name="${escapeHtml(name)}">Delete</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    content.innerHTML = html;

    document.getElementById('close-collections-btn')?.addEventListener('click', close);
    document.getElementById('create-collection-btn')?.addEventListener('click', () => {
      const input = document.getElementById('new-collection-name');
      const name = input?.value.trim();
      if (!name) return;
      const allNow = loadCollections();
      if (!allNow[name]) {
        allNow[name] = [];
        saveCollections(allNow);
        if (global.FD_TOAST) global.FD_TOAST.show(`Created “${name}”`, 'success');
      }
      input.value = '';
      renderModal();
    });
    content.querySelectorAll('.view-collection').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const ids = (loadCollections()[name] || []);
        if (ids.length && global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(ids[0]);
        }
        close();
      });
    });
    content.querySelectorAll('.delete-collection').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        if (confirm(`Delete collection “${name}”?`)) {
          deleteCollection(name);
          renderModal();
          if (global.FD_TOAST) global.FD_TOAST.show('Collection deleted', 'info');
        }
      });
    });
  }

  function bind() {
    // Options menu button is wired in main.js
    // Product card button is added by cards.js and calls FD_COLLECTIONS.editCollections
  }

  global.FD_COLLECTIONS = {
    open,
    close,
    getCollections,
    getCollectionsForListing,
    addToCollection,
    removeFromCollection,
    deleteCollection,
    editCollections,
    bind
  };
})(window);
