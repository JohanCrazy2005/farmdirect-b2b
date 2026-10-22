// FarmDirect B2B – configuration
window.FD_CONFIG = window.FD_CONFIG || {
  // Live Cloudflare Worker + D1 (set after deploy; empty uses seed/demo fallback)
  API_BASE: '',
  SEED_URL: 'data/seed-listings.json',
  MAP_CENTER: [39.7392, -104.9903], // Denver
  MAP_ZOOM: 10,
};

// Runtime override from localStorage (set via options menu) for testing after deploy
try {
  const stored = localStorage.getItem('fd-api-base');
  if (stored && typeof stored === 'string') {
    window.FD_CONFIG.API_BASE = stored.trim();
  }
} catch (_) {
  // localStorage may be unavailable
}
