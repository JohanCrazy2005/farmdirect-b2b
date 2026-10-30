/**
 * FarmDirect B2B – listing form (create + edit)
 * Client-side form matching schema/listings.schema.json.
 * Validates required fields, posts/puts to Worker when API_BASE is set, otherwise shows seed-mode guidance.
 * Image: accepts https URL or local file (resized to data URL).
 * Prefills sellerid from current dashboard session when available.
 * Shows draft guidance and toast feedback for the publish workflow.
 * openSampleForm() pre-fills a valid Denver-area listing for seed/demo UX.
 * After successful create in seed/demo, success status includes a one-click Open dashboard button.
 */
(function (global) {
  'use strict';

  let editingId = null;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  function openForm(listing) {
    const modal = document.getElementById('listing-form-modal');
    if (!modal) return;
    modal.classList.add('open');
    const form = document.getElementById('listing-form');
    const title = document.getElementById('form-title');
    const submitBtn = form?.querySelector('button[type=\"submit\"]');
    const status = document.getElementById('form-status');
    const preview = document.getElementById('image-preview');
    const draftNote = document.getElementById('form-draft-note');
    if (status) status.textContent = '';
    if (preview) { preview.src = ''; preview.style.display = 'none'; }

    if (listing && listing.id) {
      // Edit mode
      editingId = listing.id;
      if (title) title.textContent = 'Edit listing';
      if (submitBtn) submitBtn.textContent = 'Save changes';
      if (draftNote) draftNote.hidden = true;
      form.lat.value = listing.location?.lat ?? '';
      form.long.value = listing.location?.long ?? '';
      form.visibility.value = listing.visibility || 'province';
      form.address.value = listing.address || '';
      form.sellerid.value = listing.sellerid || '';
      form.category.value = listing.category || '';
      form.headerdescription.value = listing.headerdescription || '';
      form.price.value = listing.price ?? '';
      form.units.value = listing.units || '';
      form.description.value = listing.description || '';
      form.image.value = listing.image || '';
      if (listing.image && preview) {
        preview.src = listing.image;
        preview.style.display = 'block';
      }
    } else {
      // Create mode
      editingId = null;
      if (title) title.textContent = 'Add listing';
      if (submitBtn) submitBtn.textContent = 'Create listing';
      if (draftNote) draftNote.hidden = false;
      form?.reset();
      const sellerInput = document.getElementById('form-sellerid');
      const current = (global.FD_DASHBOARD && global.FD_DASHBOARD.getCurrentSeller)
        ? global.FD_DASHBOARD.getCurrentSeller()
        : '';
      if (sellerInput) sellerInput.value = current || 'seller-demo';
    }
  }

  /**
   * Opens the create form pre-filled with a valid sample listing
   * so users can immediately try the seed/demo create → persist → publish flow.
   */
  function openSampleForm() {
    openForm(null);
    setTimeout(() => {
      const form = document.getElementById('listing-form');
      const preview = document.getElementById('image-preview');
      if (!form) return;
      form.lat.value = '39.7392';
      form.long.value = '-104.9903';
      form.visibility.value = 'country';
      form.address.value = 'Demo Farm, 123 Green Valley Rd, Denver, CO 80202';
      form.category.value = 'produce';
      form.headerdescription.value = 'Sample demo vine-ripened tomatoes';
      form.price.value = '1.50';
      form.units.value = 'kg';
      form.description.value = 'This is a sample listing created in seed/demo mode. Edit it, save, then publish from your dashboard. Changes persist locally in this browser.';
      const sampleImage = 'https://images.unsplash.com/photo-1592924357228-91a4daeaa8c9?w=400&h=300&fit=crop';
      form.image.value = sampleImage;
      if (preview) {
        preview.src = sampleImage;
        preview.style.display = 'block';
      }
      if (global.FD_TOAST) global.FD_TOAST.show('Sample listing pre-filled — edit and create to try demo mode', 'info');
    }, 40);
  }

  function closeForm() {
    document.getElementById('listing-form-modal')?.classList.remove('open');
    editingId = null;
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('form-lat').value = pos.coords.latitude.toFixed(6);
        document.getElementById('form-long').value = pos.coords.longitude.toFixed(6);
      },
      () => alert('Could not get location')
    );
  }

  function resizeImageToDataUrl(file, maxDim = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load image'));
      };
      img.src = url;
    });
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    const status = document.getElementById('form-status');
    const preview = document.getElementById('image-preview');
    const urlInput = document.querySelector('#listing-form input[name=\"image\"]');
    if (!file || !urlInput) return;
    if (!file.type.startsWith('image/')) {
      if (status) { status.textContent = 'Please choose an image file'; status.className = 'form-status error'; }
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      if (status) { status.textContent = 'Image too large (max ~8 MB before resize)'; status.className = 'form-status error'; }
      return;
    }
    if (status) { status.textContent = 'Processing image…'; status.className = 'form-status'; }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      urlInput.value = dataUrl;
      if (preview) {
        preview.src = dataUrl;
        preview.style.display = 'block';
      }
      if (status) { status.textContent = 'Image ready (resized)'; status.className = 'form-status success'; }
    } catch (err) {
      if (status) { status.textContent = err.message || 'Image processing failed'; status.className = 'form-status error'; }
    }
  }

  function validate(data) {
    const errors = [];
    if (!data.location?.lat || isNaN(data.location.lat) || data.location.lat < -90 || data.location.lat > 90) errors.push('Valid latitude required');
    if (!data.location?.long || isNaN(data.location.long) || data.location.long < -180 || data.location.long > 180) errors.push('Valid longitude required');
    if (!['worldwide','country','province'].includes(data.visibility)) errors.push('Visibility must be worldwide, country, or province');
    if (!data.address?.trim()) errors.push('Address required');
    if (!data.sellerid?.trim()) errors.push('Seller ID required');
    if (!data.category?.trim()) errors.push('Category required');
    if (!data.headerdescription?.trim() || data.headerdescription.length > 120) errors.push('Header description required (max 120 chars)');
    if (data.price == null || isNaN(data.price) || data.price < 0) errors.push('Price must be >= 0');
    if (!data.units?.trim()) errors.push('Units required');
    const img = data.image?.trim() || '';
    if (!img || !( /^https?:\/\//.test(img) || /^data:image\//.test(img) )) {
      errors.push('Valid image URL or uploaded image required');
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('form-status');
    status.textContent = 'Submitting…';
    status.className = 'form-status';

    const data = {
      location: {
        lat: parseFloat(form.lat.value),
        long: parseFloat(form.long.value),
      },
      visibility: form.visibility.value,
      address: form.address.value.trim(),
      sellerid: form.sellerid.value.trim(),
      category: form.category.value.trim(),
      headerdescription: form.headerdescription.value.trim(),
      price: parseFloat(form.price.value),
      units: form.units.value.trim(),
      description: form.description.value.trim(),
      image: form.image.value.trim(),
    };

    const errors = validate(data);
    if (errors.length) {
      status.textContent = errors.join(' · ');
      status.className = 'form-status error';
      return;
    }

    let result;
    if (editingId && global.FD_API && global.FD_API.updateListing) {
      result = await global.FD_API.updateListing(editingId, data);
    } else if (global.FD_API && global.FD_API.createListing) {
      result = await global.FD_API.createListing(data);
    } else {
      status.textContent = 'API layer unavailable';
      status.className = 'form-status error';
      return;
    }

    if (result.ok) {
      const msg = result.message || (editingId ? 'Listing updated' : 'Listing created as draft');
      const isCreate = !editingId;
      status.innerHTML = escapeHtml(msg) + (isCreate ? ' – publish it from your dashboard. ' : '') +
        (isCreate && !(global.FD_API && global.FD_API.isLive && global.FD_API.isLive())
          ? '<button type=\"button\" class=\"small-btn\" id=\"form-open-dash\" style=\"margin-left:0.4rem\">Open dashboard</button>'
          : '');
      status.className = 'form-status success';
      if (isCreate) {
        document.getElementById('form-open-dash')?.addEventListener('click', () => {
          closeForm();
          if (global.FD_DASHBOARD && typeof global.FD_DASHBOARD.openDashboard === 'function') {
            global.FD_DASHBOARD.openDashboard();
          }
        });
      }
      if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
        global.FD_TOAST.show(msg, 'success');
      }
      // Refresh list if possible
      if (global.FD_API.fetchListings) {
        const fresh = await global.FD_API.fetchListings();
        if (global.FD_LIST && global.FD_LIST.setListings) {
          global.FD_LIST.setListings(fresh.listings);
        }
      }
      setTimeout(closeForm, 2800);
    } else {
      status.textContent = result.error || 'Failed to save listing';
      status.className = 'form-status error';
      if (global.FD_TOAST && typeof global.FD_TOAST.show === 'function') {
        global.FD_TOAST.show(result.error || 'Failed to save listing', 'error');
      }
    }
  }

  function bindForm() {
    const form = document.getElementById('listing-form');
    if (form) form.addEventListener('submit', handleSubmit);
    const locBtn = document.getElementById('use-location-btn');
    if (locBtn) locBtn.addEventListener('click', useCurrentLocation);
    const fileInput = document.getElementById('image-file');
    if (fileInput) fileInput.addEventListener('change', handleImageFile);
    document.getElementById('close-form-btn')?.addEventListener('click', closeForm);
    // Close on backdrop click
    document.getElementById('listing-form-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'listing-form-modal') closeForm();
    });
  }

  global.FD_FORM = { openForm, closeForm, bindForm, openSampleForm };
})(window);
