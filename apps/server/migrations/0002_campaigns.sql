-- Campaign tables
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  director_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image_url TEXT,
  settings TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  module_id TEXT REFERENCES modules(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'lobby', 'active', 'paused', 'completed')),
  order_index INTEGER NOT NULL DEFAULT 0,
  room_code TEXT,
  started_at TEXT,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  game_session_id TEXT NOT NULL REFERENCES game_sessions(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('battle', 'story', 'montage', 'negotiation', 'respite')),
  data TEXT DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

-- Membership
CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  hero_id TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('director', 'player')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS campaign_invites (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS session_participants (
  game_session_id TEXT NOT NULL REFERENCES game_sessions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  hero_id TEXT,
  status TEXT NOT NULL DEFAULT 'joined' CHECK(status IN ('joined', 'ready', 'active', 'disconnected')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  ready_at TEXT,
  PRIMARY KEY (game_session_id, user_id)
);

CREATE INDEX idx_campaigns_director ON campaigns(director_id);
CREATE INDEX idx_modules_campaign ON modules(campaign_id);
CREATE INDEX idx_game_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX idx_scenes_session ON scenes(game_session_id);
CREATE INDEX idx_campaign_invites_token ON campaign_invites(token);
