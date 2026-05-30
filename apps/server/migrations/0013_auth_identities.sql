-- Move OAuth provider identifiers into provider-neutral identities.
-- D1 applies migration files transactionally, so rebuilding the users table
-- while sessions/campaign rows reference it fails foreign-key validation.
-- Keep the legacy discord_id column for existing local databases; application
-- code no longer depends on it once user_identities exists.
CREATE TABLE IF NOT EXISTS user_identities (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);

INSERT OR IGNORE INTO user_identities (user_id, provider, provider_user_id, email, created_at, updated_at)
SELECT id, 'discord', discord_id, NULL, created_at, updated_at
FROM users
WHERE discord_id IS NOT NULL AND discord_id != '';
