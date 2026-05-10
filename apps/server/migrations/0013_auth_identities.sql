-- Move OAuth provider identifiers out of users and into provider-neutral identities.
CREATE TABLE auth_identity_backfill (
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO auth_identity_backfill (user_id, provider, provider_user_id, email, created_at, updated_at)
SELECT id, 'discord', discord_id, NULL, created_at, updated_at
FROM users
WHERE discord_id IS NOT NULL AND discord_id != '';

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'director' CHECK(role IN ('director', 'player')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id, username, avatar_url, role, created_at, updated_at)
SELECT
  id,
  username,
  avatar_url,
  CASE WHEN role IN ('director', 'player') THEN role ELSE 'director' END,
  created_at,
  updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

PRAGMA foreign_keys = ON;

CREATE TABLE user_identities (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX idx_user_identities_user_id ON user_identities(user_id);

INSERT OR IGNORE INTO user_identities (user_id, provider, provider_user_id, email, created_at, updated_at)
SELECT user_id, provider, provider_user_id, email, created_at, updated_at
FROM auth_identity_backfill;

DROP TABLE auth_identity_backfill;
