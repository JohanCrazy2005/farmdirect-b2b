/**
 * FarmDirect B2B – private listing notes
 * Lets users attach private local notes to any listing (stored in localStorage under fd-notes).
 * Useful for seed/demo exploration: remember prices, follow-ups, quality impressions, etc.
 * Notes appear on the product card and can be managed in a dedicated modal.
 * Fully client-side; no server dependency.
 */
(function (global) {
  'use strict';

  const NOTES_KEY = 'fd-notes';

  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function saveNotes(notes) {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (_) {}
  }

  function getNote(id) {
    if (!id) return '';
    const notes = loadNotes();
    return notes[id] || '';
  }

  function setNote(id, text) {
    if (!id) return;
    const notes = loadNotes();
    const trimmed = (text || '').trim();
    if (trimmed) {
      notes[id] = trimmed;
    } else {
      delete notes[id];
    }
    saveNotes(notes);
  }

  function deleteNote(id) {
    setNote(id, '');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '"');
  }

  function open() {
    const modal = document.getElementById('notes-modal');
    if (!modal) return;
    renderModal();
    modal.classList.add('open');
  }

  function close() {
    document.getElementById('notes-modal')?.classList.remove('open');
  }

  function renderModal() {
    const content = document.querySelector('#notes-modal .modal-content');
    if (!content) return;
    const notes = loadNotes();
    const ids = Object.keys(notes).filter(id => notes[id]);
    const listings = (global.FD_LIST && typeof global.FD_LIST.getListings === 'function')
      ? (global.FD_LIST.getListings() || [])
      : [];
    const byId = Object.fromEntries(listings.map(l => [String(l.id), l]));

    let html = `
      <button type="button" id="close-notes-btn" class="close-modal">×</button>
      <h3>Private notes</h3>
      <p class="small muted">Notes are stored only in this browser. They help you remember details while exploring seed/demo data.</p>
    `;

    if (!ids.length) {
      html += `<p class="empty-state">No notes yet. Open a listing and use the “Add note” button on the product card.</p>`;
    } else {
      html += `<div class="notes-list">`;
      ids.sort().forEach(id => {
        const listing = byId[id] || {};
        const title = listing.headerdescription || id;
        const note = notes[id];
        const preview = note.length > 140 ? note.slice(0, 137) + '…' : note;
        html += `
          <div class="note-item" data-id="${escapeHtml(id)}">
            <div class="note-header">
              <strong>${escapeHtml(title)}</strong>
              <span class="muted small">${escapeHtml(listing.category || '')}</span>
            </div>
            <p class="note-preview">${escapeHtml(preview)}</p>
            <div class="note-actions">
              <button type="button" class="small-btn view-listing" data-id="${escapeHtml(id)}">View</button>
              <button type="button" class="small-btn edit-note" data-id="${escapeHtml(id)}">Edit</button>
              <button type="button" class="small-btn delete-note" data-id="${escapeHtml(id)}">Delete</button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    content.innerHTML = html;

    document.getElementById('close-notes-btn')?.addEventListener('click', close);
    content.querySelectorAll('.view-listing').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (global.FD_LIST && typeof global.FD_LIST.select === 'function') {
          global.FD_LIST.select(id);
        }
        close();
      });
    });
    content.querySelectorAll('.edit-note').forEach(btn => {
      btn.addEventListener('click', () => editNote(btn.dataset.id));
    });
    content.querySelectorAll('.delete-note').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this note?')) {
          deleteNote(btn.dataset.id);
          renderModal();
          if (global.FD_TOAST) global.FD_TOAST.show('Note deleted', 'info');
        }
      });
    });
  }

  function editNote(id) {
    const current = getNote(id);
    const next = prompt('Edit private note:', current);
    if (next === null) return;
    setNote(id, next);
    renderModal();
    if (global.FD_TOAST) global.FD_TOAST.show(next.trim() ? 'Note saved' : 'Note cleared', 'success');
    // Refresh open product card if it matches
    if (global.FD_CARDS && typeof global.FD_CARDS.openProduct === 'function') {
      const listings = (global.FD_LIST && global.FD_LIST.getListings) ? global.FD_LIST.getListings() : [];
      const listing = listings.find(l => String(l.id) === String(id));
      if (listing && document.getElementById('product-card')?.classList.contains('open')) {
        global.FD_CARDS.openProduct(listing);
      }
    }
  }

  function bind() {
    // Options menu button is wired in main.js
    // Product card button is added by cards.js and calls FD_NOTES.editNote
  }

  global.FD_NOTES = {
    open,
    close,
    getNote,
    setNote,
    editNote,
    deleteNote,
    bind
  };
})(window);
