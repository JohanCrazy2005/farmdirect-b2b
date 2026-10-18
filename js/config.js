// FarmDirect B2B – configuration
window.FD_CONFIG = window.FD_CONFIG || {
  // After wrangler deploy, set this to the Worker URL (or use the options menu override)
  API_BASE: '', // e.g. 'https://farmdirect-b2b.<subdomain>.workers.dev'
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
