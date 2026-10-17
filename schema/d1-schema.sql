-- FarmDirect B2B D1 schema
-- Database: b2bistening (id: ad22b284-cafd-4f74-a8bc-6205056d38f8)
-- Binding: DB

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  long REAL NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('worldwide', 'country', 'province')),
  address TEXT NOT NULL,
  sellerid TEXT NOT NULL,
  category TEXT NOT NULL,
  headerdescription TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  units TEXT NOT NULL,
  description TEXT,
  image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_coords ON listings(lat, long);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(sellerid);
CREATE INDEX IF NOT EXISTS idx_listings_visibility ON listings(visibility);

-- Optional: simple sellers table for future profile cards
CREATE TABLE IF NOT EXISTS sellers (
  sellerid TEXT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  bio TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
