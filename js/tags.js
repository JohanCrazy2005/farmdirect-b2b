/**
 * FarmDirect B2B – local listing tags
 * Lets users attach private local tags to any listing (stored in localStorage under fd-tags).
 * Useful for seed/demo exploration: mark "interested", "contacted", "sample-received", "follow-up", etc.
 * Tags appear on the product card and can be managed in a dedicated modal.
 * Fully client-side; no server dependency. Complements notes and favorites.
 */
(function (global) {
  'use strict';

  const TAGS_KEY = 'fd-tags';

  function loadTags() {
    try {
      const raw = localStorage.getItem(TAGS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function saveTags(tags) {
    try {
      localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
    } catch (_) {}
  }

  function getTags(id) {
    if (!id) return [];
    const all = loadTags();
    const arr = all[String(id)];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  }

  function setTags(id, list) {
    if (!id) return;
    const all = loadTags();
    const cleaned = (Array.isArray(list) ? list : [])
      .map(t => String(t).trim())
      .filter(Boolean);
    if (cleaned.length) {
      all[String(id)] = [...new Set(cleaned)];
    } else {
      delete all[String(id)];
    }
    saveTags(all);
  }

  function parseTagsInput(input) {
    if (!input) return [];
    return String(input)
      .split(/[,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean);
  }

  function editTags(id) {
    const current = getTags(id).join(', ');
    const next = prompt('Edit tags (comma-separated):', current);
    if (next === null) return;
    setTags(id, parseTagsInput(next));
    if (global.FD_TOAST) {
      global.FD_TOAST.show(next.trim() ? 'Tags saved' : 'Tags cleared', 'success');
    }
    // Refresh open product card if matching
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
        ? global.FD_LIST.getListings() : [];
      const listing = listings.find(l => String(l.id) === String(id));
      if (listing && document.getElementById('product-card')?.classList.contains('open')) {
        global.FD_CARDS.openProduct(listing);
      }
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function open() {
    const modal = document.getElementById('tags-modal');
    if (!modal) return;
    renderModal();
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('tags-modal')?.classList.remove('open');
  }

  function renderModal() {
    const content = document.querySelector('#tags-modal .modal-content');
    if (!content) return;
    const all = loadTags();
    const ids = Object.keys(all).filter(id => Array.isArray(all[id]) && all[id].length);
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? (global.FD_LIST.getListings() || [])
      : [];
    const byId = Object.fromEntries(listings.map(l => [String(l.id), l]));

    let html = `
      <button type="button" id="close-tags-btn" class="close-modal">×</button>
      <h3>Listing tags</h3>
      <p class="small muted">Tags are stored only in this browser. Use them to organize seed/demo listings (e.g. interested, contacted, sample).</p>
    `;

    if (!ids.length) {
      html += `<p class="empty-state">No tags yet. Open a listing and use the “Tags” button on the product card.</p>`;
    } else {
      html += `<div class="tags-list">`;
      ids.sort().forEach(id => {
        const listing = byId[id] || {};
        const title = listing.headerdescription || id;
        const tags = all[id] || [];
        const tagsHtml = tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join(' ');
        html += `
          <div class="tag-item" data-id="${escapeHtml(id)}">
            <div class="tag-header">
              <strong>${escapeHtml(title)}</strong>
              <span class="muted small">${escapeHtml(listing.category || '')}</span>
            </div>
            <div class="tag-pills">${tagsHtml}</div>
            <div class="tag-actions">
              <button type="button" class="small-btn view-listing" data-id="${escapeHtml(id)}">View</button>
              <button type="button" class="small-btn edit-tags" data-id="${escapeHtml(id)}">Edit</button>
              <button type="button" class="small-btn clear-tags" data-id="${escapeHtml(id)}">Clear</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    content.innerHTML = html;

    document.getElementById('close-tags-btn')?.addEventListener('click', close);
    content.querySelectorAll('.view-listing').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
        }
        close();
      });
    });
    content.querySelectorAll('.edit-tags').forEach(btn => {
      btn.addEventListener('click', () => editTags(btn.dataset.id));
    });
    content.querySelectorAll('.clear-tags').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Clear all tags for this listing?')) {
          setTags(btn.dataset.id, []);
          renderModal();
          if (global.FD_TOAST) global.FD_TOAST.show('Tags cleared', 'info');
        }
      });
    });
  }

  function bind() {
    // Options menu button is wired in main.js
    // Product card button is added by cards.js and calls FD_TAGS.editTags
  }

  global.FD_TAGS = {
    open,
    close,
    getTags,
    setTags,
    editTags,
    bind
  };
})(window);
