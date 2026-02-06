-- Director Assets: Maps, NPCs, Scene Monsters, Terrain, Audio, Activities, Montage Tests

-- Maps with structured metadata
CREATE TABLE IF NOT EXISTS maps (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  scene_type TEXT CHECK(scene_type IN ('battle','negotiation','montage','story','respite')),
  grid_type TEXT DEFAULT 'gridded' CHECK(grid_type IN ('gridded','gridless','hex')),
  size TEXT DEFAULT 'medium' CHECK(size IN ('small','medium','large')),
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_maps_campaign ON maps(campaign_id);
CREATE INDEX idx_maps_scene_type ON maps(campaign_id, scene_type);

CREATE TABLE IF NOT EXISTS map_terrains (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  terrain TEXT NOT NULL CHECK(terrain IN ('forest','cave','urban','dungeon','castle','ship','wilderness','underwater','planar')),
  PRIMARY KEY (map_id, terrain)
);

CREATE TABLE IF NOT EXISTS map_biomes (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  biome TEXT NOT NULL CHECK(biome IN ('arctic','desert','coastal','mountain','swamp','volcanic','grassland','underground')),
  PRIMARY KEY (map_id, biome)
);

CREATE TABLE IF NOT EXISTS map_tags (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (map_id, tag)
);

-- Director-created NPCs (narrative only)
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  portrait_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_npcs_campaign ON npcs(campaign_id);

-- Monsters assigned to scenes from bestiary
CREATE TABLE IF NOT EXISTS scene_monsters (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_scene_monsters_scene ON scene_monsters(scene_id);

-- Custom terrain objects (built-in terrains come from @anvil/data, not DB)
CREATE TABLE IF NOT EXISTS custom_terrain (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('environmental','fieldwork','mechanism','siege-engine','power-fixture','supernatural')),
  grid_width INTEGER NOT NULL DEFAULT 1,
  grid_height INTEGER NOT NULL DEFAULT 1,
  material TEXT CHECK(material IN ('wood','stone','metal','organic')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_custom_terrain_campaign ON custom_terrain(campaign_id);

-- Audio assets
CREATE TABLE IF NOT EXISTS audio_assets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  duration_seconds INTEGER,
  audio_type TEXT CHECK(audio_type IN ('ambient','music','sound_effect')),
  mood TEXT CHECK(mood IN ('combat','tense','calm','celebratory','eerie','exploration')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audio_campaign ON audio_assets(campaign_id);

CREATE TABLE IF NOT EXISTS audio_scene_types (
  audio_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
  scene_type TEXT NOT NULL CHECK(scene_type IN ('battle','negotiation','montage','story','respite')),
  PRIMARY KEY (audio_id, scene_type)
);

CREATE TABLE IF NOT EXISTS audio_tags (
  audio_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (audio_id, tag)
);

-- Respite activity cards (persist across scenes, tied to campaign)
CREATE TABLE IF NOT EXISTS activity_cards (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('recover','craft','research','socialize','change_kit','project','custom')),
  activity_data TEXT,
  points_spent INTEGER NOT NULL DEFAULT 0,
  points_total INTEGER,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_activity_cards_campaign ON activity_cards(campaign_id);

-- Montage tests (tied to scenes)
CREATE TABLE IF NOT EXISTS montage_tests (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_data TEXT,
  successes INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  target_successes INTEGER NOT NULL,
  max_failures INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','succeeded','failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_montage_tests_scene ON montage_tests(scene_id);
