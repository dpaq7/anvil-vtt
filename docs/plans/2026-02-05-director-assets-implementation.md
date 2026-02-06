# Director Assets System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete asset management system for the Director — a standalone `/app/assets` page and scene-aware live session panels — covering heroes, NPCs, maps, bestiary, terrain, and audio.

**Architecture:** Six-folder asset tree (Heroes, NPCs, Maps, Bestiary, Terrain, Audio) with a shared component library used by both the standalone page and the Director View right rail. Backend on Cloudflare Workers (Hono) with D1 for metadata and R2 for file storage. Game data (bestiary, built-in terrain, respite activities, montage scenarios) is read-only from `@anvil/data`.

**Tech Stack:** React 19, TypeScript strict, Zustand (stores), shadcn/ui + Radix + Tailwind (dark theme), Hono (Worker routes), D1 (SQLite), R2 (object storage), Vitest (tests)

**Design doc:** `docs/plans/2026-02-05-director-assets-design.md`

---

## Key Codebase References

| What | Where |
|------|-------|
| Campaign Builder (layout pattern) | `apps/vtt/src/pages/CampaignBuilder.tsx` |
| FileTree components | `apps/vtt/src/components/builder/FileTree.tsx` |
| TreeSidebar pattern | `apps/vtt/src/components/builder/TreeSidebar.tsx` |
| CardGrid pattern | `apps/vtt/src/components/builder/CardGrid.tsx` |
| Existing assets route | `apps/server/src/routes/assets.ts` |
| Existing assets migration | `apps/server/migrations/0004_assets.sql` |
| API client | `apps/vtt/src/lib/api.ts` |
| Auth middleware | `apps/server/src/middleware/auth.ts` |
| Zustand store pattern | `apps/vtt/src/stores/sessionStore.ts` |
| AppShell layout | `packages/ui/src/components/layout/AppShell.tsx` |
| DirectorView | `apps/vtt/src/pages/session/DirectorView.tsx` |
| Monster data | `packages/data/src/game-data/generated/monsters.json` |
| Monster logic | `packages/data/src/logic/monster-logic.ts` |
| Monster types | `packages/data/src/types/monster.ts` |
| Terrain types | `packages/types/src/terrain.ts` |
| Terrain data + utilities | `packages/data/src/terrain/index.ts` |
| Respite logic | `packages/data/src/logic/respite-logic.ts` |
| Montage logic | `packages/data/src/logic/montage-logic.ts` |
| Montage scenarios | `packages/data/src/pregen/scenes/montage-scenarios.ts` |
| Hono server entry | `apps/server/src/index.ts` |
| Wrangler config | `apps/server/wrangler.toml` |
| UI components | `packages/ui/src/index.ts` |
| Scene type colors | Battle=red, Story=purple, Montage=amber, Negotiation=blue, Respite=green |

**Existing bindings (wrangler.toml):** D1 → `DB` (anvil-db), R2 → `ASSETS` (anvil-assets)

**API client pattern:** `api.get<T>(path)`, `api.post<T>(path, body)`, `api.put<T>(path, body)`, `api.delete<T>(path)` — credentials included, JSON by default.

**Next migration number:** `0006`

---

## Phase 1: Database Migrations & Shared Types

### Task 1.1: Create D1 Migration for Asset Tables

**Files:**
- Create: `apps/server/migrations/0006_director_assets.sql`

**Step 1: Write the migration**

```sql
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
```

**Step 2: Verify migration syntax**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/server exec wrangler d1 migrations list --local`
Expected: Migration 0006 shows as pending

**Step 3: Apply migration locally**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/server exec wrangler d1 migrations apply --local`
Expected: Migration applied successfully

**Step 4: Commit**

```bash
git add apps/server/migrations/0006_director_assets.sql
git commit -m "feat(server): add D1 migration for director assets tables

Maps, NPCs, scene monsters, custom terrain, audio, activity cards,
and montage tests with full metadata and join tables."
```

---

### Task 1.2: Create Shared Asset Types

**Files:**
- Create: `packages/types/src/assets.ts`
- Modify: `packages/types/src/index.ts` (add export)

**Step 1: Write the types**

Create `packages/types/src/assets.ts`:

```typescript
/**
 * Director Assets — shared types for maps, NPCs, terrain, audio,
 * activity cards, montage tests, and scene monsters.
 */

// ── Scene type (shared across all asset metadata) ──

export type SceneType = 'battle' | 'negotiation' | 'montage' | 'story' | 'respite';

// ── Maps ──

export type MapTerrainTag =
  | 'forest' | 'cave' | 'urban' | 'dungeon' | 'castle'
  | 'ship' | 'wilderness' | 'underwater' | 'planar';

export type MapBiome =
  | 'arctic' | 'desert' | 'coastal' | 'mountain'
  | 'swamp' | 'volcanic' | 'grassland' | 'underground';

export type GridType = 'gridded' | 'gridless' | 'hex';

export type MapSize = 'small' | 'medium' | 'large';

export interface MapAsset {
  id: string;
  campaignId: string;
  name: string;
  assetId: string | null;
  /** Presigned or proxied URL for the image */
  imageUrl?: string;
  sceneType: SceneType | null;
  gridType: GridType;
  size: MapSize;
  width: number | null;
  height: number | null;
  terrains: MapTerrainTag[];
  biomes: MapBiome[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapInput {
  name: string;
  sceneType?: SceneType;
  gridType?: GridType;
  size?: MapSize;
  width?: number;
  height?: number;
  terrains?: MapTerrainTag[];
  biomes?: MapBiome[];
  tags?: string[];
}

export interface UpdateMapInput {
  name?: string;
  sceneType?: SceneType | null;
  gridType?: GridType;
  size?: MapSize;
  terrains?: MapTerrainTag[];
  biomes?: MapBiome[];
  tags?: string[];
}

// ── NPCs ──

export interface Npc {
  id: string;
  campaignId: string;
  name: string;
  portraitAssetId: string | null;
  portraitUrl?: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNpcInput {
  name: string;
  location?: string;
  notes?: string;
}

export interface UpdateNpcInput {
  name?: string;
  location?: string | null;
  notes?: string | null;
}

// ── Scene Monsters ──

export interface SceneMonster {
  id: string;
  sceneId: string;
  monsterName: string;
  quantity: number;
  createdAt: string;
}

export interface AddSceneMonstersInput {
  monsterName: string;
  quantity: number;
}

// ── Audio ──

export type AudioType = 'ambient' | 'music' | 'sound_effect';

export type AudioMood =
  | 'combat' | 'tense' | 'calm'
  | 'celebratory' | 'eerie' | 'exploration';

export interface AudioAsset {
  id: string;
  campaignId: string;
  name: string;
  assetId: string;
  audioUrl?: string;
  durationSeconds: number | null;
  audioType: AudioType | null;
  mood: AudioMood | null;
  sceneTypes: SceneType[];
  tags: string[];
  createdAt: string;
}

export interface CreateAudioInput {
  name: string;
  durationSeconds?: number;
  audioType?: AudioType;
  mood?: AudioMood;
  sceneTypes?: SceneType[];
  tags?: string[];
}

export interface UpdateAudioInput {
  name?: string;
  audioType?: AudioType | null;
  mood?: AudioMood | null;
  sceneTypes?: SceneType[];
  tags?: string[];
}

// ── Custom Terrain ──

export interface CustomTerrain {
  id: string;
  campaignId: string;
  name: string;
  assetId: string | null;
  imageUrl?: string;
  category: import('./terrain.js').TerrainCategory;
  gridWidth: number;
  gridHeight: number;
  material: 'wood' | 'stone' | 'metal' | 'organic' | null;
  createdAt: string;
}

export interface CreateCustomTerrainInput {
  name: string;
  category: import('./terrain.js').TerrainCategory;
  gridWidth?: number;
  gridHeight?: number;
  material?: 'wood' | 'stone' | 'metal' | 'organic';
}

// ── Activity Cards (Respite) ──

export type RespiteActivityType =
  | 'recover' | 'craft' | 'research' | 'socialize'
  | 'change_kit' | 'project' | 'custom';

export interface ActivityCard {
  id: string;
  campaignId: string;
  activityName: string;
  activityType: RespiteActivityType;
  activityData: Record<string, unknown> | null;
  pointsSpent: number;
  pointsTotal: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityCardInput {
  activityName: string;
  activityType: RespiteActivityType;
  activityData?: Record<string, unknown>;
  pointsTotal?: number;
  notes?: string;
}

export interface UpdateActivityCardInput {
  pointsSpent?: number;
  notes?: string | null;
  isActive?: boolean;
}

// ── Montage Tests ──

export type MontageTestStatus = 'in_progress' | 'succeeded' | 'failed';

export interface MontageTest {
  id: string;
  sceneId: string;
  testName: string;
  testData: Record<string, unknown> | null;
  successes: number;
  failures: number;
  targetSuccesses: number;
  maxFailures: number;
  status: MontageTestStatus;
  createdAt: string;
}

export interface CreateMontageTestInput {
  testName: string;
  testData?: Record<string, unknown>;
  targetSuccesses: number;
  maxFailures: number;
}

export interface UpdateMontageTestInput {
  successes?: number;
  failures?: number;
  status?: MontageTestStatus;
}

// ── Asset folder type for tree sidebar ──

export type AssetFolder = 'heroes' | 'npcs' | 'maps' | 'bestiary' | 'terrain' | 'audio';
```

**Step 2: Export from types index**

Add to `packages/types/src/index.ts`:

```typescript
export * from './assets.js';
```

**Step 3: Build types package**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/types build`
Expected: Builds successfully with no errors

**Step 4: Commit**

```bash
git add packages/types/src/assets.ts packages/types/src/index.ts
git commit -m "feat(types): add shared asset types for director assets system

MapAsset, Npc, SceneMonster, AudioAsset, CustomTerrain, ActivityCard,
MontageTest with create/update input types and metadata enums."
```

---

## Phase 2: Server — API Routes

### Task 2.1: Map CRUD Routes

**Files:**
- Create: `apps/server/src/routes/maps.ts`
- Modify: `apps/server/src/index.ts` (register route)

**Step 1: Create the route file**

Create `apps/server/src/routes/maps.ts` with Hono routes:

- `GET /api/campaigns/:campaignId/maps` — List maps with query param filters (`scene_type`, `terrain`, `biome`, `grid_type`, `size`, `tag`, `q`). Joins `map_terrains`, `map_biomes`, `map_tags` to hydrate arrays. Returns `{ maps: MapAsset[] }`.
- `POST /api/campaigns/:campaignId/maps` — Create map record. Accepts `CreateMapInput` body. Generates UUID. Inserts into `maps` + join tables. Returns `{ map: MapAsset }`.
- `PATCH /api/campaigns/:campaignId/maps/:mapId` — Update metadata. Accepts `UpdateMapInput`. Deletes and re-inserts join table rows for terrains/biomes/tags. Returns `{ map: MapAsset }`.
- `DELETE /api/campaigns/:campaignId/maps/:mapId` — Delete map + cascades. If `asset_id` exists, also delete from `assets` table and R2. Returns `{ ok: true }`.

Follow the existing pattern in `apps/server/src/routes/assets.ts`: use `authMiddleware`, access `c.env.DB` for D1, `c.env.ASSETS` for R2. Use `crypto.randomUUID()` for IDs.

**Step 2: Register in server index**

Add to `apps/server/src/index.ts`:
```typescript
import { mapRoutes } from './routes/maps.js';
app.route('/api/campaigns', mapRoutes);
```

**Step 3: Build server to verify**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/server build`
Expected: No type errors

**Step 4: Commit**

```bash
git add apps/server/src/routes/maps.ts apps/server/src/index.ts
git commit -m "feat(server): add map CRUD routes with metadata filtering

GET/POST/PATCH/DELETE for campaign maps with terrain, biome, scene type,
grid type, size, and tag filtering via join tables."
```

---

### Task 2.2: NPC CRUD Routes

**Files:**
- Create: `apps/server/src/routes/npcs.ts`
- Modify: `apps/server/src/index.ts` (register route)

**Step 1: Create the route file**

Create `apps/server/src/routes/npcs.ts`:

- `GET /api/campaigns/:campaignId/npcs` — List NPCs. Optional `?q=search` for name search. Returns `{ npcs: Npc[] }`.
- `POST /api/campaigns/:campaignId/npcs` — Create NPC from `CreateNpcInput`. Returns `{ npc: Npc }`.
- `PATCH /api/campaigns/:campaignId/npcs/:npcId` — Update NPC from `UpdateNpcInput`. Returns `{ npc: Npc }`.
- `DELETE /api/campaigns/:campaignId/npcs/:npcId` — Delete NPC. Returns `{ ok: true }`.

Same auth + D1 pattern as maps.

**Step 2: Register in server index**

**Step 3: Build server**

**Step 4: Commit**

```bash
git add apps/server/src/routes/npcs.ts apps/server/src/index.ts
git commit -m "feat(server): add NPC CRUD routes for director narratives"
```

---

### Task 2.3: Scene Monster Routes

**Files:**
- Create: `apps/server/src/routes/scene-monsters.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create the route file**

- `GET /api/scenes/:sceneId/monsters` — List monsters in scene. Returns `{ monsters: SceneMonster[] }`.
- `POST /api/scenes/:sceneId/monsters` — Add monster(s). Accepts `AddSceneMonstersInput`. Returns `{ monster: SceneMonster }`.
- `DELETE /api/scenes/:sceneId/monsters/:entryId` — Remove. Returns `{ ok: true }`.

**Step 2–4: Register, build, commit**

```bash
git commit -m "feat(server): add scene monster assignment routes"
```

---

### Task 2.4: Audio Asset Routes

**Files:**
- Create: `apps/server/src/routes/audio.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create the route file**

- `GET /api/campaigns/:campaignId/audio` — List with filters (`?scene_type`, `?mood`, `?audio_type`, `?tag`, `?q`). Joins `audio_scene_types`, `audio_tags`.
- `POST /api/campaigns/:campaignId/audio` — Create from `CreateAudioInput`. Insert into `audio_assets` + join tables.
- `PATCH /api/campaigns/:campaignId/audio/:audioId` — Update from `UpdateAudioInput`. Re-insert join tables.
- `DELETE /api/campaigns/:campaignId/audio/:audioId` — Delete + cascade + R2 cleanup via linked asset_id.

**Step 2–4: Register, build, commit**

```bash
git commit -m "feat(server): add audio asset routes with metadata filtering"
```

---

### Task 2.5: Custom Terrain Routes

**Files:**
- Create: `apps/server/src/routes/custom-terrain.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create the route file**

- `GET /api/campaigns/:campaignId/terrain` — List custom terrain. Filter `?category`.
- `POST /api/campaigns/:campaignId/terrain` — Create from `CreateCustomTerrainInput`.
- `PATCH /api/campaigns/:campaignId/terrain/:terrainId` — Update metadata.
- `DELETE /api/campaigns/:campaignId/terrain/:terrainId` — Delete + R2 cleanup.

**Step 2–4: Register, build, commit**

```bash
git commit -m "feat(server): add custom terrain object routes"
```

---

### Task 2.6: Activity Card Routes

**Files:**
- Create: `apps/server/src/routes/activities.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create the route file**

- `GET /api/campaigns/:campaignId/activities` — List activity cards. Filter `?is_active=true`.
- `POST /api/campaigns/:campaignId/activities` — Create from `CreateActivityCardInput`.
- `PATCH /api/campaigns/:campaignId/activities/:activityId` — Update progress/notes from `UpdateActivityCardInput`.
- `DELETE /api/campaigns/:campaignId/activities/:activityId` — Remove card.

**Step 2–4: Register, build, commit**

```bash
git commit -m "feat(server): add respite activity card routes with progress tracking"
```

---

### Task 2.7: Montage Test Routes

**Files:**
- Create: `apps/server/src/routes/montage-tests.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create the route file**

- `GET /api/scenes/:sceneId/montage-tests` — List tests for scene.
- `POST /api/scenes/:sceneId/montage-tests` — Create from `CreateMontageTestInput`.
- `PATCH /api/scenes/:sceneId/montage-tests/:testId` — Update successes/failures/status from `UpdateMontageTestInput`.
- `DELETE /api/scenes/:sceneId/montage-tests/:testId` — Remove test.

**Step 2–4: Register, build, commit**

```bash
git commit -m "feat(server): add montage test routes with progress tracking"
```

---

## Phase 3: Frontend — Zustand Store & API Layer

### Task 3.1: Assets Zustand Store

**Files:**
- Create: `apps/vtt/src/stores/assetsStore.ts`

**Step 1: Create the store**

Follow the pattern in `apps/vtt/src/stores/sessionStore.ts`. The store manages:

```typescript
interface AssetsState {
  // Currently selected folder in the tree
  selectedFolder: AssetFolder;

  // Data per folder
  maps: MapAsset[];
  npcs: Npc[];
  sceneMonsters: SceneMonster[];       // per active scene
  customTerrain: CustomTerrain[];
  audioAssets: AudioAsset[];
  activityCards: ActivityCard[];        // per campaign
  montageTests: MontageTest[];         // per active scene

  // UI state
  loading: boolean;
  error: string | null;
  selectedItemId: string | null;

  // Filters
  mapFilters: {
    sceneType?: SceneType;
    terrain?: MapTerrainTag[];
    biome?: MapBiome[];
    gridType?: GridType;
    size?: MapSize;
    search?: string;
  };

  // Actions — maps
  setSelectedFolder: (folder: AssetFolder) => void;
  setSelectedItemId: (id: string | null) => void;
  loadMaps: (campaignId: string) => Promise<void>;
  createMap: (campaignId: string, input: CreateMapInput, file: File) => Promise<MapAsset>;
  updateMap: (campaignId: string, mapId: string, input: UpdateMapInput) => Promise<void>;
  deleteMap: (campaignId: string, mapId: string) => Promise<void>;
  setMapFilters: (filters: Partial<AssetsState['mapFilters']>) => void;

  // Actions — NPCs
  loadNpcs: (campaignId: string) => Promise<void>;
  createNpc: (campaignId: string, input: CreateNpcInput) => Promise<Npc>;
  updateNpc: (campaignId: string, npcId: string, input: UpdateNpcInput) => Promise<void>;
  deleteNpc: (campaignId: string, npcId: string) => Promise<void>;

  // Actions — Scene monsters
  loadSceneMonsters: (sceneId: string) => Promise<void>;
  addSceneMonster: (sceneId: string, input: AddSceneMonstersInput) => Promise<void>;
  removeSceneMonster: (sceneId: string, entryId: string) => Promise<void>;

  // Actions — Audio
  loadAudio: (campaignId: string) => Promise<void>;
  createAudio: (campaignId: string, input: CreateAudioInput, file: File) => Promise<AudioAsset>;
  updateAudio: (campaignId: string, audioId: string, input: UpdateAudioInput) => Promise<void>;
  deleteAudio: (campaignId: string, audioId: string) => Promise<void>;

  // Actions — Custom terrain
  loadCustomTerrain: (campaignId: string) => Promise<void>;
  createCustomTerrain: (campaignId: string, input: CreateCustomTerrainInput, file?: File) => Promise<CustomTerrain>;
  deleteCustomTerrain: (campaignId: string, terrainId: string) => Promise<void>;

  // Actions — Activity cards
  loadActivityCards: (campaignId: string) => Promise<void>;
  createActivityCard: (campaignId: string, input: CreateActivityCardInput) => Promise<ActivityCard>;
  updateActivityCard: (campaignId: string, activityId: string, input: UpdateActivityCardInput) => Promise<void>;
  deleteActivityCard: (campaignId: string, activityId: string) => Promise<void>;

  // Actions — Montage tests
  loadMontageTests: (sceneId: string) => Promise<void>;
  createMontageTest: (sceneId: string, input: CreateMontageTestInput) => Promise<MontageTest>;
  updateMontageTest: (sceneId: string, testId: string, input: UpdateMontageTestInput) => Promise<void>;
  deleteMontageTest: (sceneId: string, testId: string) => Promise<void>;
}
```

File upload flow follows existing pattern: `api.post('/api/assets/upload', { name, type, contentType })` → get `{ id, storageKey }` → `api.put(`/api/assets/${id}/data`, fileArrayBuffer)` → then create the domain record (map, audio, terrain) linking to `asset_id`.

**Step 2: Build vtt to verify types**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/vtt build`
Expected: No type errors

**Step 3: Commit**

```bash
git add apps/vtt/src/stores/assetsStore.ts
git commit -m "feat(vtt): add Zustand assets store with full CRUD actions

Manages maps, NPCs, audio, custom terrain, activity cards, montage tests,
and scene monsters with file upload integration."
```

---

## Phase 4: Frontend — Standalone Assets Page

### Task 4.1: Install shadcn Table Component

**Step 1: Check if Table exists**

Run: `ls "/Users/danpaquin/Desktop/Projects/Anvil v2/packages/ui/src/components/ui/table.tsx" 2>/dev/null || echo "not found"`

**Step 2: Add shadcn Table component**

If not found, add it manually to `packages/ui/src/components/ui/table.tsx` following shadcn patterns. Export from `packages/ui/src/index.ts`.

Also add:
- `DropdownMenu` (for context menus in bestiary table actions column)
- `Select` (for filter dropdowns)
- `Badge` (for metadata chips)
- `Progress` (for activity card / montage test progress bars)
- `Textarea` (for NPC notes)

**Step 3: Build UI package**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/ui build`

**Step 4: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): add Table, DropdownMenu, Select, Badge, Progress, Textarea components"
```

---

### Task 4.2: Asset Tree Sidebar

**Files:**
- Create: `apps/vtt/src/components/assets/AssetTreeSidebar.tsx`

**Step 1: Build the component**

Reuse `FileTreeRoot`, `FileTreeFolder`, `FileTreeFile` from `components/builder/FileTree.tsx`. Six top-level folders with count badges and Lucide icons:

```
Heroes    — Users icon
NPCs      — UserCircle icon
Maps      — Map icon
Bestiary  — Skull icon
Terrain   — Mountain icon
Audio     — Music icon
```

Props:
```typescript
interface AssetTreeSidebarProps {
  selectedFolder: AssetFolder;
  onSelect: (folder: AssetFolder) => void;
  counts: Record<AssetFolder, number>;
}
```

Uses `FileTreeRoot` + `FileTreeFile` (no folders since flat structure). Each item renders the icon, label, and count badge.

**Step 2: Build vtt**

**Step 3: Commit**

```bash
git commit -m "feat(vtt): add AssetTreeSidebar with 6 folder categories"
```

---

### Task 4.3: Hero Grid Component

**Files:**
- Create: `apps/vtt/src/components/assets/HeroGrid.tsx`

**Step 1: Build the component**

Grid layout following `CardGrid.tsx` pattern: `grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.

Each card shows:
- Placeholder portrait div (aspect-square, zinc-800 background, User icon centered)
- Name (bold) + title (if any, muted)
- Class / Subclass line
- Level badge + Ancestry
- Stat row: Stamina (via `HeroLogic` if available), Recoveries, Victories, XP as small `Badge` components

Props:
```typescript
interface HeroGridProps {
  heroes: Hero[];  // from existing hero types
  onSelect: (heroId: string) => void;
  selectedId?: string | null;
  compact?: boolean;  // for live session rail
}
```

Uses `Card`, `CardHeader`, `CardContent`, `Badge` from `@anvil/ui`.

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add HeroGrid component with stat chips"
```

---

### Task 4.4: NPC Grid Component

**Files:**
- Create: `apps/vtt/src/components/assets/NpcGrid.tsx`

**Step 1: Build the component**

Same grid layout. Each card:
- Placeholder portrait
- Name (bold)
- Location (muted, if set)

Props:
```typescript
interface NpcGridProps {
  npcs: Npc[];
  onSelect: (npcId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}
```

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add NpcGrid component"
```

---

### Task 4.5: NPC Detail Pane

**Files:**
- Create: `apps/vtt/src/components/assets/NpcDetailPane.tsx`

**Step 1: Build the component**

Right-side panel (w-80, border-l, overflow-y-auto). Contains:
- Close button (X icon, top-right)
- Editable name field (`Input`)
- Editable location field (`Input`)
- Editable notes field (`Textarea`, resizable, min-h-[200px])
- Save button that calls `updateNpc`
- Delete button (with confirmation)

Props:
```typescript
interface NpcDetailPaneProps {
  npc: Npc;
  onUpdate: (npcId: string, input: UpdateNpcInput) => Promise<void>;
  onDelete: (npcId: string) => Promise<void>;
  onClose: () => void;
}
```

Uses local state for draft edits, saves on blur or explicit save click.

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add NpcDetailPane with editable notes"
```

---

### Task 4.6: Map Grid Component

**Files:**
- Create: `apps/vtt/src/components/assets/MapGrid.tsx`

**Step 1: Build the component**

Grid layout. Each card:
- Map image thumbnail (`img` with `object-cover`, aspect-video)
- Name overlaid at bottom with gradient scrim
- Scene type `Badge` (color-coded: battle=red, story=purple, montage=amber, negotiation=blue, respite=green)
- Terrain + biome chips as small muted badges below image

Props:
```typescript
interface MapGridProps {
  maps: MapAsset[];
  onSelect: (mapId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}
```

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add MapGrid component with metadata badges"
```

---

### Task 4.7: Map Filter Bar & Upload Dialog

**Files:**
- Create: `apps/vtt/src/components/assets/MapFilterBar.tsx`
- Create: `apps/vtt/src/components/assets/MapUploadDialog.tsx`

**Step 1: Build the filter bar**

Horizontal bar with:
- `Select` for scene type (single)
- Multi-select checkboxes for terrain (dropdown with checkboxes)
- Multi-select checkboxes for biome
- `Select` for grid type
- `Select` for size
- `Input` for text search (name + tags)
- Clear filters button

**Step 2: Build the upload dialog**

Uses `Dialog` from `@anvil/ui`. Two modes:

**Single upload:** File input → name field (defaults to filename) → scene type select → terrain multi-select → biome multi-select → grid type radio → size radio → tags input → Upload button.

**Bulk upload:** Multi-file input → shared metadata form → per-file name override list → progress bar → Upload All button.

Upload flow:
1. For each file: `api.post('/api/assets/upload', { name, type: 'map', contentType })` → get `{ id, storageKey }`
2. `fetch(API_BASE + '/api/assets/' + id + '/data', { method: 'PUT', body: file })` (raw binary, no JSON wrapper)
3. `api.post('/api/campaigns/' + campaignId + '/maps', { ...metadata, assetId: id })`

**Step 3: Build, commit**

```bash
git commit -m "feat(vtt): add MapFilterBar and MapUploadDialog with bulk support"
```

---

### Task 4.8: Bestiary Table Component

**Files:**
- Create: `apps/vtt/src/components/assets/BestiaryTable.tsx`
- Create: `apps/vtt/src/components/assets/BestiaryFilterBar.tsx`
- Create: `apps/vtt/src/components/assets/AddToSceneMenu.tsx`

**Step 1: Build the filter bar**

Search input + Level range select + Role multi-select dropdown.

**Step 2: Build AddToSceneMenu**

`DropdownMenu` that renders differently based on monster role:

- Non-minion: "Add to Scene →" with scene list submenu
- Minion: "Add Minion Group →" with formation submenu (Horde/Platoon/Elite/Custom Count) → each has scene submenu

Scene list comes from campaigns store (loaded separately). Calls `addSceneMonster(sceneId, { monsterName, quantity })`.

For custom count: renders a small `Dialog` with number input before showing scene picker.

**Step 3: Build the bestiary table**

Load monster data from `@anvil/data`:
```typescript
import { GameData } from '@anvil/data';
const monsters = GameData.getMonsters(); // or equivalent compendium accessor
```

Use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `@anvil/ui`.

Columns: Name (+ ancestry subtitle), Level, Role, EV, Stamina, Speed (+ movement icons), Characteristics (MGT/AGI/RSN/INT/PRE as compact labels), Actions (AddToSceneMenu trigger button).

Row click expands an accordion detail below showing: immunities, weaknesses, features list, flavor text. Use `Collapsible` from `@anvil/ui`.

Props:
```typescript
interface BestiaryTableProps {
  compact?: boolean;          // fewer columns for live session
  onAddToScene?: (monsterName: string, quantity: number, sceneId: string) => void;
  availableScenes?: Array<{ id: string; name: string; sceneType: string }>;
}
```

**Step 4: Build, commit**

```bash
git commit -m "feat(vtt): add BestiaryTable with expandable statblocks and AddToSceneMenu"
```

---

### Task 4.9: Terrain Grid Component

**Files:**
- Create: `apps/vtt/src/components/assets/TerrainGrid.tsx`

**Step 1: Build the component**

Merges two data sources:
1. Built-in terrains from `@anvil/data`: `getAllTerrains()` from `packages/data/src/terrain/index.ts`
2. Custom terrain from store: `customTerrain` array

Filter dropdown by category (environmental, fieldwork, etc.) using `TERRAIN_CATEGORY_NAMES` from `@anvil/data`.

Card layout:
- Built-in: icon placeholder (Mountain icon) + text label, category badge, "Level X" badge, EV value
- Custom: uploaded image thumbnail (or placeholder), name, category badge, grid size label, material badge

Click on built-in terrain expands detail showing: description, role, stamina, abilities, deactivation method, upgrades.

Props:
```typescript
interface TerrainGridProps {
  builtInTerrains: CompendiumTerrain[];
  customTerrains: CustomTerrain[];
  onSelectBuiltIn?: (terrainId: string) => void;
  onSelectCustom?: (terrainId: string) => void;
  compact?: boolean;
}
```

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add TerrainGrid combining built-in and custom terrain"
```

---

### Task 4.10: Audio Grid Component

**Files:**
- Create: `apps/vtt/src/components/assets/AudioGrid.tsx`
- Create: `apps/vtt/src/components/assets/AudioUploadDialog.tsx`

**Step 1: Build AudioGrid**

Grid of cards showing: name (bold), mood badge (color-coded), audio type badge, duration (formatted mm:ss), scene type chips.

No playback controls — just library display.

**Step 2: Build AudioUploadDialog**

Similar to MapUploadDialog but for audio files (mp3, wav, ogg). Fields: file picker, name, audio type select, mood select, scene type multi-select, tags input.

**Step 3: Build, commit**

```bash
git commit -m "feat(vtt): add AudioGrid and AudioUploadDialog"
```

---

### Task 4.11: Assemble Standalone Assets Page

**Files:**
- Modify: `apps/vtt/src/pages/Assets.tsx`

**Step 1: Replace the stub**

Layout structure:
```
┌────────────┬───────────────────────────────────┬──────────┐
│ Tree       │  Content Pane                      │ Detail   │
│ Sidebar    │  (switches based on selectedFolder) │ Pane     │
│ w-64       │  flex-1                            │ w-80     │
│            │                                    │ (when    │
│            │                                    │  open)   │
└────────────┴───────────────────────────────────┴──────────┘
```

State management:
- `selectedFolder` from assets store
- `selectedItemId` from assets store (opens detail pane)
- Load all data for current campaign on mount via `useEffect`

Content pane switching:
```typescript
const renderContent = () => {
  switch (selectedFolder) {
    case 'heroes': return <HeroGrid ... />;
    case 'npcs': return <NpcGrid ... />;
    case 'maps': return (
      <>
        <MapFilterBar ... />
        <MapGrid ... />
      </>
    );
    case 'bestiary': return (
      <>
        <BestiaryFilterBar ... />
        <BestiaryTable ... />
      </>
    );
    case 'terrain': return <TerrainGrid ... />;
    case 'audio': return <AudioGrid ... />;
  }
};
```

Top bar per folder with action buttons (Create Hero, Create NPC, Upload Map, Upload Audio, etc.).

Detail pane renders contextually: `HeroDetailPane` for heroes (reuse existing hero detail component), `NpcDetailPane` for NPCs, `MapDetailPane` for maps.

**Step 2: Build vtt**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/vtt build`

**Step 3: Commit**

```bash
git commit -m "feat(vtt): assemble standalone Assets page with tree sidebar and content switching

Replaces stub with full layout: AssetTreeSidebar, content grids for all
6 folders, detail panes, upload dialogs, and bestiary table."
```

---

## Phase 5: Frontend — Live Session Asset Panels

### Task 5.1: Scene-Aware Asset Panel Component

**Files:**
- Create: `apps/vtt/src/components/session/AssetPanel.tsx`

**Step 1: Build the component**

A tabbed panel for the Director View right rail. Tabs change based on the active scene type.

```typescript
interface AssetPanelProps {
  sceneType: SceneType;
  sceneId: string;
  campaignId: string;
  heroCount: number;
}
```

Tab configuration:
```typescript
const SCENE_TABS: Record<SceneType, AssetFolder[]> = {
  battle: ['bestiary', 'heroes', 'terrain', 'maps'],
  negotiation: ['npcs', 'heroes', 'maps'],
  montage: ['montage_tests', 'npcs', 'maps'],
  story: ['npcs', 'heroes', 'maps'],
  respite: ['activities', 'npcs', 'maps'],
};
```

Uses `Tabs` from `@anvil/ui`. Each tab renders the corresponding compact component (`compact={true}` prop).

Key differences from standalone:
- No upload/create buttons
- One-click add to current scene (no scene picker)
- Compact cards (~320px width)
- Tooltip popovers instead of detail panes

**Step 2: Build, commit**

```bash
git commit -m "feat(vtt): add scene-aware AssetPanel for Director View right rail"
```

---

### Task 5.2: Respite Activity List & Card

**Files:**
- Create: `apps/vtt/src/components/assets/RespiteActivityList.tsx`
- Create: `apps/vtt/src/components/assets/RespiteActivityCard.tsx`

**Step 1: Build RespiteActivityList**

Searchable list of standard respite activities from `@anvil/data`:
```typescript
import { RespiteLogic } from '@anvil/data';
const activities = RespiteLogic.getStandardActivities();
```

Each item shows: activity name, brief description. Click calls `createActivityCard` which adds a persistent card.

**Step 2: Build RespiteActivityCard**

Displays on the respite "map" area. Shows:
- Activity name + type badge
- Description / rules from `activityData`
- **Points progress:** "12 / 30 points" label + `Progress` bar (value = `Math.floor((pointsSpent / pointsTotal) * 100)`)
- +/- buttons and direct input for `pointsSpent`
- Editable notes `Textarea`
- Active/completed toggle

Persists via `updateActivityCard` on every points change (debounced 500ms).

**Step 3: Build, commit**

```bash
git commit -m "feat(vtt): add RespiteActivityList and RespiteActivityCard with points-based progress"
```

---

### Task 5.3: Montage Test Catalog & Tracker

**Files:**
- Create: `apps/vtt/src/components/assets/MontageTestCatalog.tsx`
- Create: `apps/vtt/src/components/assets/MontageTestTracker.tsx`

**Step 1: Build MontageTestCatalog**

Searchable catalog. Data source:
```typescript
import { FIGHT_FIRE, INFILTRATE_PALACE, PREPARE_FOR_BATTLE, TRACK_THE_FUGITIVE, WILDERNESS_RACE } from '@anvil/data';
```

Each scenario card shows: name, description, level, challenge count, base success/failure limits.

When Director selects a scenario, compute effective limits:
```typescript
import { MontageLogic } from '@anvil/data';
const effectiveSuccesses = MontageLogic.getEffectiveSuccessLimit(scenario.template, heroCount);
const effectiveFailures = MontageLogic.getEffectiveFailureLimit(scenario.template, heroCount);
```

Then call `createMontageTest(sceneId, { testName, testData, targetSuccesses: effectiveSuccesses, maxFailures: effectiveFailures })`.

**Step 2: Build MontageTestTracker**

Map overlay component showing:
- Test name
- Success counter: green circles, filled for each success, target shown
- Failure counter: red circles, filled for each failure, max shown
- +Success / +Failure buttons for Director
- Status badge: "In Progress" / "Success!" / "Failed"
- Auto-computes status: if successes >= target → succeeded, if failures >= max → failed, if both hit simultaneously → partial success (display as "Partial Success")

**Step 3: Build, commit**

```bash
git commit -m "feat(vtt): add MontageTestCatalog and MontageTestTracker with scaled limits"
```

---

### Task 5.4: Integrate AssetPanel into DirectorView

**Files:**
- Modify: `apps/vtt/src/pages/session/DirectorView.tsx`

**Step 1: Add AssetPanel to the right rail**

The Director View currently has combat-specific panels in the right rail. Add the `AssetPanel` as a toggleable tab alongside existing panels.

Add an "Assets" toggle button (e.g. `Package` icon from Lucide) in the top bar or as a rail tab. When toggled, the right rail shows `AssetPanel` instead of combat-specific panels. Both should be available simultaneously via tabs.

**Step 2: Wire scene type from XState**

The active scene type comes from the session state. Pass it to `AssetPanel`:
```typescript
<AssetPanel
  sceneType={activeScene?.type ?? 'story'}
  sceneId={activeScene?.id ?? ''}
  campaignId={sessionState.campaignId}
  heroCount={sessionState.entities.filter(e => e.type === 'hero').length}
/>
```

**Step 3: Build entire project**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm build`

**Step 4: Commit**

```bash
git commit -m "feat(vtt): integrate AssetPanel into DirectorView right rail

Scene-aware asset panel shows relevant tabs based on active scene type.
Toggleable alongside existing combat panels."
```

---

## Phase 6: Testing

### Task 6.1: Server Route Tests

**Files:**
- Create: `apps/server/src/routes/__tests__/maps.test.ts`
- Create: `apps/server/src/routes/__tests__/npcs.test.ts`
- Create: `apps/server/src/routes/__tests__/scene-monsters.test.ts`

**Step 1: Write map route tests**

Test cases:
- `GET /campaigns/:id/maps` returns empty array when no maps
- `GET /campaigns/:id/maps?scene_type=battle` filters correctly
- `POST /campaigns/:id/maps` creates map with metadata + join tables
- `PATCH /campaigns/:id/maps/:mapId` updates metadata and replaces join table rows
- `DELETE /campaigns/:id/maps/:mapId` removes map and cascades

Follow existing test patterns if present, otherwise use Vitest + Hono test helpers.

**Step 2: Write NPC route tests**

Test CRUD operations + search filtering.

**Step 3: Write scene monster tests**

Test add/remove/list operations.

**Step 4: Run tests**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/server test:run` (or equivalent)

**Step 5: Commit**

```bash
git commit -m "test(server): add route tests for maps, NPCs, and scene monsters"
```

---

### Task 6.2: Asset Types Tests

**Files:**
- Create: `packages/data/src/logic/__tests__/asset-helpers.test.ts`

**Step 1: Test derived value calculations**

Test cases:
- Activity card percentage: `Math.floor((12 / 30) * 100)` === 40
- Activity card 0/0 edge case (no division by zero)
- Montage test status derivation: successes >= target → 'succeeded'
- Montage test status: failures >= max → 'failed'
- Montage test status: both hit → check partial success handling

**Step 2: Run tests**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/data test:run`

**Step 3: Commit**

```bash
git commit -m "test(data): add asset helper calculation tests"
```

---

## Phase 7: Polish & Integration

### Task 7.1: Loading States & Error Handling

**Files:**
- Modify: `apps/vtt/src/pages/Assets.tsx`
- Modify: All grid/table components

**Step 1: Add loading skeletons**

When `loading` is true in the store, show skeleton cards (zinc-800 pulsing rectangles matching card dimensions). Use Tailwind `animate-pulse` on placeholder divs.

**Step 2: Add error state**

When `error` is set in the store, show an `Alert` component with the error message and a retry button.

**Step 3: Add empty states**

When a folder is empty, show a centered message with the relevant action button:
- "No maps yet. Upload your first map." + Upload button
- "No NPCs yet. Create your first NPC." + Create button
- etc.

**Step 4: Commit**

```bash
git commit -m "feat(vtt): add loading skeletons, error handling, and empty states to Assets page"
```

---

### Task 7.2: Full Build & Lint Check

**Step 1: Build all packages**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm build`
Expected: All packages build successfully

**Step 2: Lint**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm lint`
Expected: No lint errors (fix any that appear)

**Step 3: Run all tests**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm test`
Expected: All tests pass

**Step 4: Commit any fixes**

```bash
git commit -m "chore: fix lint and build issues from assets implementation"
```

---

## Task Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1.1–1.2 | DB migration + shared types |
| 2 | 2.1–2.7 | Server API routes (7 route files) |
| 3 | 3.1 | Zustand store |
| 4 | 4.1–4.11 | Standalone Assets page (all components) |
| 5 | 5.1–5.4 | Live session panels |
| 6 | 6.1–6.2 | Tests |
| 7 | 7.1–7.2 | Polish + final build |

**Total: ~25 tasks across 7 phases**

Phases 1–2 (backend) have no frontend dependencies and can be built first. Phase 3 bridges backend and frontend. Phases 4–5 build all UI. Phase 6–7 validate everything.
