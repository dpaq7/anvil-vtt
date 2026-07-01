-- Personal notes: per-user notebooks available without campaign membership

CREATE TABLE IF NOT EXISTS personal_note_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_folder_id TEXT REFERENCES personal_note_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_auto_generated INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_personal_note_folders_user ON personal_note_folders(user_id);
CREATE INDEX idx_personal_note_folders_parent ON personal_note_folders(parent_folder_id);

CREATE TABLE IF NOT EXISTS personal_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL REFERENCES personal_note_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_personal_notes_folder ON personal_notes(folder_id);
CREATE INDEX idx_personal_notes_user ON personal_notes(user_id);
