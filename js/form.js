/**
 * FarmDirect B2B – add listing form
 * Client-side form for creating listings matching schema/listings.schema.json.
 * Validates required fields, posts to Worker when API_BASE is set, otherwise shows seed-mode guidance.
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

  function openForm() {
    const modal = document.getElementById('listing-form-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.getElementById('listing-form')?.reset();
    const status = document.getElementById('form-status');
    if (status) status.textContent = '';
    // Prefill sellerid placeholder
    const seller = document.getElementById('form-sellerid');
    if (seller && !seller.value) seller.value = 'seller-demo';
  }

  function closeForm() {
    document.getElementById('listing-form-modal')?.classList.remove('open');
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
    if (!data.image?.trim() || !/^https?:\/\//.test(data.image)) errors.push('Valid image URL required');
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

    if (global.FD_API && global.FD_API.createListing) {
      const result = await global.FD_API.createListing(data);
      if (result.ok) {
        status.textContent = result.message || 'Listing created';
        status.className = 'form-status success';
        // Refresh list if possible
        if (global.FD_API.fetchListings) {
          const fresh = await global.FD_API.fetchListings();
          if (global.FD_LIST && global.FD_LIST.setListings) {
            global.FD_LIST.setListings(fresh.listings);
          }
        }
        setTimeout(closeForm, 1200);
      } else {
        status.textContent = result.error || 'Failed to create listing';
        status.className = 'form-status error';
      }
    } else {
      status.textContent = 'API layer unavailable';
      status.className = 'form-status error';
    }
  }

  function bindForm() {
    const form = document.getElementById('listing-form');
    if (form) form.addEventListener('submit', handleSubmit);
    const locBtn = document.getElementById('use-location-btn');
    if (locBtn) locBtn.addEventListener('click', useCurrentLocation);
    document.getElementById('close-form-btn')?.addEventListener('click', closeForm);
    // Close on backdrop click
    document.getElementById('listing-form-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'listing-form-modal') closeForm();
    });
  }

  global.FD_FORM = { openForm, closeForm, bindForm };
})(window);
