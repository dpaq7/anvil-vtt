-- Store upload metadata for validation, serving, and asset cleanup.
ALTER TABLE assets ADD COLUMN content_type TEXT;
ALTER TABLE assets ADD COLUMN file_size INTEGER;
ALTER TABLE assets ADD COLUMN uploaded_at TEXT;

-- Allow explicit audio assets; older rows may still use 'other'.
PRAGMA foreign_keys=off;
CREATE TABLE assets_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('map', 'token', 'portrait', 'handout', 'audio', 'other')),
  storage_key TEXT NOT NULL,
  thumbnail_key TEXT,
  width INTEGER,
  height INTEGER,
  tags TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_type TEXT,
  file_size INTEGER,
  uploaded_at TEXT
);
INSERT INTO assets_new (id, user_id, name, type, storage_key, thumbnail_key, width, height, tags, created_at, content_type, file_size, uploaded_at)
SELECT id, user_id, name, type, storage_key, thumbnail_key, width, height, tags, created_at, content_type, file_size, uploaded_at FROM assets;
DROP TABLE assets;
ALTER TABLE assets_new RENAME TO assets;
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);
PRAGMA foreign_keys=on;
