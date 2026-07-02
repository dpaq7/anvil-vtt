-- Capture client-side crashes and severe runtime errors for follow-up.
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  component_stack TEXT,
  source TEXT,
  url TEXT,
  user_agent TEXT,
  context_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  notified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
