-- FarmDirect B2B – P3 auth + publication migration
-- Database: b2bistening
-- Run once in D1 Console (or wrangler d1 execute --remote --file=...)
-- Safe to re-run: uses IF NOT EXISTS / ignore duplicate column errors if already applied

-- ---- Sellers: ensure table + auth columns ----
CREATE TABLE IF NOT EXISTS sellers (
  sellerid TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  contact TEXT,
  bio TEXT,
  password_hash TEXT,
  password_salt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- If sellers already existed without password columns, add them.
-- D1/SQLite: ALTER ADD COLUMN fails if column exists – run each once; ignore "duplicate column" errors.
-- ALTER TABLE sellers ADD COLUMN email TEXT;
-- ALTER TABLE sellers ADD COLUMN password_hash TEXT;
-- ALTER TABLE sellers ADD COLUMN password_salt TEXT;

-- Prefer explicit adds (uncomment if your sellers table is the old 5-column version):
-- ALTER TABLE sellers ADD COLUMN email TEXT;
-- ALTER TABLE sellers ADD COLUMN password_hash TEXT;
-- ALTER TABLE sellers ADD COLUMN password_salt TEXT;

-- ---- Sessions ----
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  sellerid TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_seller ON sessions(sellerid);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ---- Listings publication fields ----
-- Run these; if column already exists, skip that line.
ALTER TABLE listings ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE listings ADD COLUMN published_at TEXT;

-- Backfill: existing rows stay public
UPDATE listings SET status = 'published' WHERE status IS NULL OR status = '';
UPDATE listings SET published_at = COALESCE(published_at, created_at) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller_status ON listings(sellerid, status);
