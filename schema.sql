-- FarmDirect B2B listings schema (SQLite / libSQL / PostgreSQL-compatible core)
-- Open source: SQLite is public domain; use with better-sqlite3, sql.js, or Turso (libSQL).

CREATE TABLE IF NOT EXISTS listings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  farm          TEXT,
  product       TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'tomatoes',
  price         REAL NOT NULL CHECK (price >= 0),
  unit          TEXT NOT NULL DEFAULT 'kg',
  qty           TEXT,
  organic       INTEGER NOT NULL DEFAULT 0,
  verified      INTEGER NOT NULL DEFAULT 0,
  rating        REAL NOT NULL DEFAULT 0,
  reviews       INTEGER NOT NULL DEFAULT 0,
  distance      REAL,
  lat           REAL NOT NULL,
  lng           REAL NOT NULL,
  color         TEXT DEFAULT '#84cc16',
  emoji         TEXT DEFAULT '🌱',
  img           TEXT,
  moq           INTEGER DEFAULT 10,
  lead_time_days INTEGER DEFAULT 3,
  stock_status  TEXT DEFAULT 'in_stock',
  available_qty INTEGER DEFAULT 0,
  payment_terms TEXT DEFAULT 'due_on_receipt',
  fulfillment   TEXT DEFAULT 'both',
  harvest_days_ago INTEGER DEFAULT 0,
  bio           TEXT,
  is_user_listing INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_coords ON listings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_listings_stock ON listings(stock_status);

-- Example seed (coordinates required on every row)
-- INSERT INTO listings (name, product, category, price, unit, lat, lng, rating, reviews)
-- VALUES ('Demo Farm', 'Tomatoes', 'tomatoes', 1.5, 'kg', 51.51, -0.08, 0, 0);
