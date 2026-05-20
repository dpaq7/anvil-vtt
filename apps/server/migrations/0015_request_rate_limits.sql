-- Lightweight application-level rate limit counters for public abuse-sensitive routes.
CREATE TABLE IF NOT EXISTS request_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_request_rate_limits_reset_at ON request_rate_limits(reset_at);
