-- Short-lived tokens for WebSocket auth (avoids cookie issues with proxy)
CREATE TABLE IF NOT EXISTS ws_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  hero_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
