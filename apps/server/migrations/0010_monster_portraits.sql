-- Monster portraits: per-campaign custom art for compendium monsters
CREATE TABLE IF NOT EXISTS monster_portraits (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monster_portraits_unique ON monster_portraits(campaign_id, monster_name);
CREATE INDEX IF NOT EXISTS idx_monster_portraits_campaign ON monster_portraits(campaign_id);
