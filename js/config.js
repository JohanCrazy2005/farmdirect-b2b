// FarmDirect B2B – configuration
window.FD_CONFIG = window.FD_CONFIG || {
  // Live Cloudflare Worker + D1
  API_BASE: 'https://farmdirect-b2b.fehrjohan65.workers.dev',
  SEED_URL: 'data/seed-listings.json',
  MAP_CENTER: [28.4089, -106.8667], // Cuauhtémoc, Chihuahua (override via options if needed)
  MAP_ZOOM: 12,
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
