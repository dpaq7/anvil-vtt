# Director Assets System — Design Document

**Date:** 2026-02-05
**Status:** Draft

---

## Overview

The Assets system gives the Director a complete library for managing all game resources: heroes, NPCs, maps, bestiary, terrain, and audio. It exists in two forms:

1. **Standalone page** (`/app/assets`) — Full-featured asset management with uploads, metadata editing, and organization. Used for session prep.
2. **Live session panels** — Scene-aware right-rail panels in the Director View that surface relevant assets based on the active scene type (battle, negotiation, montage, story, respite).

Both share the same backend storage and component library.

---

## Architecture

### Backend (Cloudflare)

- **D1 tables:** `maps`, `map_terrains`, `map_biomes`, `map_tags`, `npcs`, `scene_monsters`, `terrain_objects`, `audio_assets`, `audio_scene_types`, `audio_tags`, `activity_cards`, `montage_tests`
- **R2 bucket:** `assets/` — stores uploaded map images, terrain images, audio files, NPC portraits
- **Worker routes:** CRUD for all asset types, bulk upload for maps

### Frontend

```
apps/vtt/src/
  pages/
    Assets.tsx                    — Standalone page (tree sidebar + content pane)
  components/
    assets/
      AssetTreeSidebar.tsx        — FileTree with 6 top-level folders
      HeroGrid.tsx                — Thumbnail card grid for Director heroes
      HeroDetailPane.tsx          — Right-side detail (reuses hero creator detail pane)
      NpcGrid.tsx                 — Thumbnail card grid for NPCs
      NpcDetailPane.tsx           — Right-side detail with editable notes
      MapGrid.tsx                 — Thumbnail card grid with metadata badges
      MapDetailPane.tsx           — Right-side detail with metadata editor
      MapUploadDialog.tsx         — Single + bulk upload with structured metadata
      BestiaryTable.tsx           — Table view with inline add-to-scene actions
      BestiaryDetailRow.tsx       — Expandable statblock row
      TerrainGrid.tsx             — Grid of built-in + custom terrain objects
      AudioGrid.tsx               — Grid of uploaded audio files
      AddToSceneMenu.tsx          — Shared context menu for adding monsters to scenes
      RespiteActivityList.tsx     — Searchable respite activity catalog
      RespiteActivityCard.tsx     — Persistent map card with points-based progress
      MontageTestCatalog.tsx      — Searchable montage test browser
      MontageTestTracker.tsx      — Map overlay with success/failure tracking
```

### Data Flow

Components call Worker API routes → Workers read/write D1 + R2 → responses hydrate Zustand stores on the client. Bestiary and terrain game data are read-only from `@anvil/data` compendium (no backend storage needed for built-in content).

---

## Database Schema

### Maps

```sql
CREATE TABLE maps (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  scene_type TEXT,                -- battle|negotiation|montage|story|respite
  grid_type TEXT DEFAULT 'gridded', -- gridded|gridless|hex
  size TEXT DEFAULT 'medium',    -- small|medium|large
  width INTEGER,
  height INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE map_terrains (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  terrain TEXT NOT NULL,         -- forest|cave|urban|dungeon|castle|ship|wilderness|underwater|planar
  PRIMARY KEY (map_id, terrain)
);

CREATE TABLE map_biomes (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  biome TEXT NOT NULL,           -- arctic|desert|coastal|mountain|swamp|volcanic|grassland|underground
  PRIMARY KEY (map_id, biome)
);

CREATE TABLE map_tags (
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (map_id, tag)
);
```

### NPCs

```sql
CREATE TABLE npcs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  portrait_r2_key TEXT,
  location TEXT,
  notes TEXT,                    -- markdown for flavor and campaign details
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Scene Monsters

```sql
CREATE TABLE scene_monsters (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  monster_name TEXT NOT NULL,    -- reference to compendium monster name
  quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Terrain Objects

```sql
CREATE TABLE terrain_objects (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  is_builtin BOOLEAN DEFAULT false,
  r2_key TEXT,                   -- null for built-in placeholders
  type TEXT NOT NULL,            -- environmental|fieldwork|mechanism|siege-engine|power-fixture|supernatural
  grid_width INTEGER DEFAULT 1,
  grid_height INTEGER DEFAULT 1,
  material TEXT,                 -- wood|stone|metal|organic
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Audio Assets

```sql
CREATE TABLE audio_assets (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  duration_seconds INTEGER,
  audio_type TEXT,               -- ambient|music|sound_effect
  mood TEXT,                     -- combat|tense|calm|celebratory|eerie|exploration
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE audio_scene_types (
  audio_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
  scene_type TEXT NOT NULL,
  PRIMARY KEY (audio_id, scene_type)
);

CREATE TABLE audio_tags (
  audio_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (audio_id, tag)
);
```

### Respite Activity Cards

```sql
CREATE TABLE activity_cards (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  activity_name TEXT NOT NULL,
  activity_type TEXT NOT NULL,   -- recover|craft|research|socialize|change_kit|project|custom
  activity_data TEXT,            -- JSON blob of game data details
  points_spent INTEGER DEFAULT 0,
  points_total INTEGER,          -- total cost from game data
  notes TEXT,                    -- Director's notes on this instance
  is_active BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

Percentage complete is derived client-side: `Math.floor((points_spent / points_total) * 100)` — following the project's "store source, derive computed" principle.

### Montage Tests

```sql
CREATE TABLE montage_tests (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_data TEXT,                -- JSON blob of test details
  successes INTEGER DEFAULT 0,
  failures INTEGER DEFAULT 0,
  target_successes INTEGER,      -- scales with hero count
  max_failures INTEGER,          -- scales with hero count
  status TEXT DEFAULT 'in_progress', -- in_progress|succeeded|failed
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## API Routes

### Maps

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/:id/maps` | List maps with filters |
| POST | `/api/campaigns/:id/maps` | Upload map (multipart) |
| POST | `/api/campaigns/:id/maps/bulk` | Bulk upload maps |
| PATCH | `/api/campaigns/:id/maps/:mapId` | Update map metadata |
| DELETE | `/api/campaigns/:id/maps/:mapId` | Delete map + R2 object |

Query params: `?scene_type=battle&terrain=forest&biome=mountain&grid_type=gridded&size=medium&tag=module+3&q=search+term`

### NPCs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/:id/npcs` | List NPCs |
| POST | `/api/campaigns/:id/npcs` | Create NPC |
| PATCH | `/api/campaigns/:id/npcs/:npcId` | Update NPC |
| DELETE | `/api/campaigns/:id/npcs/:npcId` | Delete NPC |

### Scene Monsters

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/scenes/:id/monsters` | List monsters in scene |
| POST | `/api/scenes/:id/monsters` | Add monster(s) to scene |
| DELETE | `/api/scenes/:id/monsters/:entryId` | Remove monster from scene |

### Terrain Objects

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/:id/terrain` | List terrain objects |
| POST | `/api/campaigns/:id/terrain` | Upload custom terrain |
| PATCH | `/api/campaigns/:id/terrain/:objId` | Update terrain metadata |
| DELETE | `/api/campaigns/:id/terrain/:objId` | Delete custom terrain |

### Audio Assets

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/:id/audio` | List audio assets |
| POST | `/api/campaigns/:id/audio` | Upload audio file |
| PATCH | `/api/campaigns/:id/audio/:audioId` | Update audio metadata |
| DELETE | `/api/campaigns/:id/audio/:audioId` | Delete audio + R2 object |

### Activity Cards

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/:id/activities` | List activity cards |
| POST | `/api/campaigns/:id/activities` | Create activity card |
| PATCH | `/api/campaigns/:id/activities/:actId` | Update progress/notes |
| DELETE | `/api/campaigns/:id/activities/:actId` | Remove activity card |

### Montage Tests

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/scenes/:id/montage-tests` | List montage tests for scene |
| POST | `/api/scenes/:id/montage-tests` | Add montage test to scene |
| PATCH | `/api/scenes/:id/montage-tests/:testId` | Update progress |
| DELETE | `/api/scenes/:id/montage-tests/:testId` | Remove montage test |

---

## Standalone Assets Page (`/app/assets`)

### Layout

Same two-panel pattern as Campaign Builder: 256px tree sidebar on the left, content pane filling the rest. When an item is selected, a detail pane slides in from the right.

### Tree Sidebar

Six top-level folders using existing `FileTree` components:

```
Assets
├── Heroes (count)
├── NPCs (count)
├── Maps (count)
├── Bestiary (count)
├── Terrain (count)
└── Audio (count)
```

Each folder shows a count badge. Clicking switches the content pane. Flat structure (no sub-folders for v1).

### Content Pane — Heroes

- **Top bar:** "Create Hero" button (navigates to hero creator) + search input
- **Grid of hero cards:**
  - Placeholder portrait (image upload not yet implemented)
  - Name and title (if any)
  - Class / Subclass
  - Level
  - Ancestry
  - Stat chips: current stamina, recoveries, victories, XP
- **Click:** Opens hero detail pane on the right (same component as hero creator flow with full character details)

### Content Pane — NPCs

- **Top bar:** "Create NPC" button + search input
- **Grid of NPC cards:**
  - Placeholder portrait
  - Name
  - Location
- **Click:** Opens NPC detail pane on the right with editable name, location, and a markdown text field for flavor and campaign details

### Content Pane — Maps

- **Top bar:** "Upload Map" button + "Bulk Import" button + filter controls
  - Filters: scene type dropdown, terrain multi-select, biome multi-select, grid type, size, text search (name + tags)
- **Grid of map cards:**
  - Map image thumbnail (aspect-ratio preserved, cropped to card)
  - Name overlaid at bottom
  - Scene type badge (color-coded per scene type)
  - Terrain + biome chips
- **Click:** Opens detail pane with full metadata, tag editor, delete option
- **Bulk Import:** Local file multi-select. After selecting files, a batch metadata dialog lets the Director apply shared metadata (scene type, terrain, biome, etc.) to all files at once, with per-file name override.

### Content Pane — Bestiary

Full-width shadcn table. Top bar has search input and filter dropdowns for Level, Role.

**Table columns:**

| Column | Content | Width |
|--------|---------|-------|
| Name | Monster name, ancestry subtitle | flex |
| Level | Numeric | narrow |
| Role | Role label (Brute, Controller, Solo, etc.) | medium |
| EV | Encounter Value | narrow |
| Stamina | HP | narrow |
| Speed | Movement + special movement icon tooltips | narrow |
| Characteristics | Compact: MGT/AGI/RSN/INT/PRE | medium |
| Actions | Context menu button | narrow |

**Actions context menu:**

For standard/solo/leader/elite monsters:
- "Add to Scene →" submenu listing available scenes grouped by campaign

For minion-role monsters:
- "Add Minion Group →" submenu:
  - Horde → scene submenu
  - Platoon → scene submenu
  - Elite → scene submenu
  - Custom Count... → number input dialog, then scene picker

**Row click:** Expands an accordion detail section showing the full statblock: immunities, weaknesses, features/abilities, flavor text. Data sourced from `@anvil/data` compendium.

**Data source:** Read-only from `packages/data/src/game-data/generated/monsters.json`. No backend storage — bestiary is built-in game data.

### Content Pane — Terrain

- **Top bar:** "Upload Custom Terrain" button + filter by type (environmental, fieldwork, mechanism, siege-engine, power-fixture, supernatural)
- **Grid of terrain cards:**
  - Text label with icon placeholder (future AI-generated visuals)
  - Type badge
  - Grid size label (e.g. "1x1", "1x2")
  - Material tag (if set)
- **Built-in terrains:** 35 tactical terrains across 6 categories from `@anvil/data` terrain system. Read-only, always present.
- **Custom terrains:** Director-uploaded images with metadata (type, grid size, material). Stored in D1 + R2.

### Content Pane — Audio

- **Top bar:** "Upload Audio" button + filter by scene type, mood, audio type
- **Grid of audio cards:**
  - Name
  - Mood badge
  - Audio type badge (ambient/music/sound effect)
  - Duration
  - Scene type chips
- **No playback controls in v1** — library management and organization only. Playback is a future feature.

### Map Upload Dialog

**Single upload:**
- File picker (accepts image formats: jpg, png, webp)
- Name input (defaults to filename)
- Scene type dropdown (battle, negotiation, montage, story, respite)
- Terrain multi-select (forest, cave, urban, dungeon, castle, ship, wilderness, underwater, planar)
- Biome multi-select (arctic, desert, coastal, mountain, swamp, volcanic, grassland, underground)
- Grid type radio (gridded, gridless, hex)
- Size radio (small, medium, large)
- Custom tags input (free-form, comma-separated)

**Bulk upload:**
- Multi-file picker
- Shared metadata form (same fields as single) applied to all files
- Per-file name override in a list below the shared form
- Upload progress indicator

---

## Live Session — Scene-Aware Asset Panels

During a live session, the Director gets a slimmed-down asset panel in the right rail, toggled via a tab or button. Content changes based on the active scene type from the XState machine.

### Key Differences from Standalone

- **No upload/create** — reference and quick-add only
- **Compact card sizes** for ~320px rail width
- **One-click "Add to scene"** — always targets the active scene (no scene picker)
- **Tooltip popovers** on card click instead of full detail panes
- **Compact bestiary table** with fewer columns and horizontal scroll

### Tabs by Scene Type

| Scene | Tabs |
|-------|------|
| **Battle** | Bestiary, Heroes, Terrain, Maps |
| **Negotiation** | NPCs, Heroes, Maps |
| **Montage** | Montage Tests, NPCs, Maps |
| **Story** | NPCs, Heroes, Maps |
| **Respite** | Respite Activities, NPCs, Maps |

Audio will be added as a universal tab across all scene types once playback controls are implemented.

### Battle Scene

- **Bestiary tab:** Compact table (name, level, role, EV, stamina, actions). One-click add to current scene.
- **Heroes tab:** Compact grid of Director heroes. One-click add to battle.
- **Terrain tab:** Browse built-in (35 tactical terrains) and custom terrain objects. Filter by type. Click or drag to place on PixiJS canvas. Objects snap to grid and are resizable via drag handles.
- **Maps tab:** Filtered to `scene_type=battle`.

**Canvas toolbar** (separate from right rail):
- Pencil / freehand draw
- Shape tools (rectangle, circle, line)
- Fog of war brush (reveal/hide areas)
- Grid overlay controls: scale, color, transparency, x/y axis shifting

### Negotiation Scene

- **NPCs tab:** Compact grid of campaign NPCs (participants).
- **Heroes tab:** Compact grid of Director heroes.
- **Maps tab:** Filtered to `scene_type=negotiation`.

### Montage Scene

- **Montage Tests tab:** Searchable catalog of montage tests from game data. 5 pre-built scenarios (Fight Fire, Infiltrate the Palace, Prepare for Battle, Track the Fugitive, Wilderness Race) plus any custom tests.
  - Each entry shows: test name, description, relevant skills, success/failure thresholds
  - Thresholds scale with hero count when `heroCountAdjustment` is enabled: `base + (heroCount - 5)`, minimum 2
  - When selected: a progress tracker appears on the map showing success count, failure count, target thresholds, and current status
  - Director manually increments successes/failures via +/- buttons
  - Visual states: in_progress, succeeded (total success), failed (total failure), partial success (both limits hit simultaneously)
- **NPCs tab:** For montage test interactions.
- **Maps tab:** Filtered to `scene_type=montage`.

### Story Scene

- **NPCs tab:** Campaign NPCs for narrative scenes.
- **Heroes tab:** Director heroes.
- **Maps tab:** Filtered to `scene_type=story`.

### Respite Scene

- **Respite Activities tab:** Searchable list of standard activities from game data: recover, craft, research, socialize, change kit, ongoing project, custom.
  - Each hero can only do ONE activity per respite
  - When the Director selects an activity: a persistent card appears on the respite map area
  - **Activity card shows:**
    - Activity name and description
    - Relevant rules/requirements from game data
    - Points spent / Total cost (e.g. "12 / 30 points") as primary progress indicator
    - Derived percentage complete shown as a progress bar fill
    - Director adjusts points via +/- buttons or direct input
    - Director notes field
  - Cards persist across respite scenes (tied to campaign, not scene) since activities like ongoing projects can span multiple sessions
  - Cards display regardless of which map is loaded
- **NPCs tab:** Merchants, quest givers, etc.
- **Maps tab:** Filtered to `scene_type=respite`.

---

## Built-in Game Data Sources

| Asset Type | Source | Mutable? |
|-----------|--------|----------|
| Bestiary (monsters) | `packages/data/src/game-data/generated/monsters.json` | Read-only |
| Terrain (35 tactical) | `packages/data/src/terrain/` (6 category files) | Read-only |
| Respite activities | `packages/data/src/logic/respite-logic.ts` → `getStandardActivities()` | Read-only |
| Montage scenarios | `packages/data/src/pregen/scenes/montage-scenarios.ts` (5 pre-built) | Read-only |
| Monster roles | `packages/data/src/types/monster.ts` → `MonsterRole` type | Read-only |
| Monster logic | `packages/data/src/logic/monster-logic.ts` | Read-only |
| Montage logic | `packages/data/src/logic/montage-logic.ts` | Read-only |

---

## Structured Metadata Reference

### Map Metadata

| Field | Type | Values |
|-------|------|--------|
| Scene Type | single-select | battle, negotiation, montage, story, respite |
| Terrain | multi-select | forest, cave, urban, dungeon, castle, ship, wilderness, underwater, planar |
| Biome | multi-select | arctic, desert, coastal, mountain, swamp, volcanic, grassland, underground |
| Grid Type | single-select | gridded, gridless, hex |
| Size | single-select | small, medium, large |
| Custom Tags | free-form | any string |

### Audio Metadata

| Field | Type | Values |
|-------|------|--------|
| Scene Type | multi-select | battle, negotiation, montage, story, respite |
| Mood | single-select | combat, tense, calm, celebratory, eerie, exploration |
| Audio Type | single-select | ambient, music, sound_effect |
| Custom Tags | free-form | any string |

### Terrain Object Metadata

| Field | Type | Values |
|-------|------|--------|
| Type | single-select | environmental, fieldwork, mechanism, siege-engine, power-fixture, supernatural |
| Grid Size | dimensions | width x height in grid squares |
| Material | single-select | wood, stone, metal, organic |

---

## Future Considerations (Out of Scope for v1)

- **Token visuals:** Custom token images for heroes and monsters on the battle canvas
- **On-hover behavior:** Showing stat previews when hovering over tokens
- **Context menus:** Right-click actions on canvas tokens (damage, conditions, move)
- **Movement:** Token movement with distance calculation, difficult terrain, opportunity attacks
- **Triggered actions:** Automated responses to game events
- **Audio playback:** In-session playback controls, crossfading, scene-triggered audio
- **Cloud storage import:** Google Drive / Dropbox integration for bulk map import
- **Sub-folders:** Director-created folder hierarchy within asset categories
- **AI-generated terrain visuals:** Replace text placeholders with generated images
- **Portrait upload:** Hero and NPC portrait image upload workflow
