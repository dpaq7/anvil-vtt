-- Notes: per-user, per-campaign notebooks with hierarchical folders

CREATE TABLE IF NOT EXISTS note_folders (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_folder_id TEXT REFERENCES note_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_auto_generated INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_note_folders_campaign_user ON note_folders(campaign_id, user_id);
CREATE INDEX idx_note_folders_parent ON note_folders(parent_folder_id);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL REFERENCES note_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notes_folder ON notes(folder_id);
CREATE INDEX idx_notes_campaign_user ON notes(campaign_id, user_id);
