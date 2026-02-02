-- Heroes table
CREATE TABLE IF NOT EXISTS heroes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  ancestry TEXT,
  culture TEXT,
  career TEXT,
  hero_class TEXT,
  subclass TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  characteristics TEXT DEFAULT '{}',
  kit TEXT,
  skills TEXT DEFAULT '[]',
  abilities TEXT DEFAULT '[]',
  portrait_url TEXT,
  data TEXT DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX idx_heroes_user ON heroes(user_id);
