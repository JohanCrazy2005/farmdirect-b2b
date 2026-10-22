-- FarmDirect B2B – RFQ (Request for Quote) persistence
-- Database: b2bistening (binding DB)
-- Run after auth-migration.sql (sellers table exists).
-- Ignore "table already exists" on re-run.

CREATE TABLE IF NOT EXISTS rfqs (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  sellerid TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  quantity TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rfqs_sellerid ON rfqs(sellerid);
CREATE INDEX IF NOT EXISTS idx_rfqs_listing_id ON rfqs(listing_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_created ON rfqs(created_at);
