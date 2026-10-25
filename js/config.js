// FarmDirect B2B – configuration
window.FD_CONFIG = window.FD_CONFIG || {
  // Live Cloudflare Worker + D1
  API_BASE: 'https://farmdirect-b2b.fehrjohan65.workers.dev',
  SEED_URL: 'data/seed-listings.json',
  SEED_SELLERS_URL: 'data/seed-sellers.json',
  // Default center matches seed listings (Denver metro) for better first-load seed/demo UX.
  // Live listings or saved view / URL hash still override.
  MAP_CENTER: [39.7392, -104.9903],
  MAP_ZOOM: 11,
};

// Runtime override from localStorage (set via options menu)
try {
  const stored = localStorage.getItem('fd-api-base');
  if (stored && typeof stored === 'string') {
    window.FD_CONFIG.API_BASE = stored.trim();
  }
} catch (_) {
  // localStorage may be unavailable
}
