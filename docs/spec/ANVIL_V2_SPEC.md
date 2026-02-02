# Anvil V2 — Full Specification

> A Virtual Tabletop for the Draw Steel TTRPG.
> "The Director controls scenes like a film."

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Real-Time Sync Architecture](#5-real-time-sync-architecture)
6. [Scene System](#6-scene-system)
7. [Entity System](#7-entity-system)
8. [User Flows](#8-user-flows)
9. [UI Layout & Design System](#9-ui-layout--design-system)
10. [Campaign Builder](#10-campaign-builder)
11. [Character Wizard](#11-character-wizard)
12. [Draw Steel Game Rules](#12-draw-steel-game-rules)
13. [Lessons Learned from V1](#13-lessons-learned-from-v1)

---

## 1. Product Vision

Anvil is a desktop-first virtual tabletop for the **Draw Steel** TTRPG. It provides asymmetric Director/Player views, real-time multiplayer via CRDTs, and a cinematic "film director" metaphor where the Director navigates scenes via a Film Strip.

### Core Principles

- **Sync First** — All shared state uses CRDTs for offline-first, conflict-free collaboration
- **Mode Over Menus** — The UI transforms entirely for each of 5 scene types; components don't check mode internally
- **Director's Console** — Asymmetric views: Director sees everything, players see what's revealed
- **Event-Driven Mutations** — Never mutate state directly; always emit events

### What Makes It Different

- 5 distinct scene modes (Story, Battle, Montage, Negotiation, Respite) each transform the entire UI
- Film Strip navigation lets the Director sequence scenes like a film
- Deep Draw Steel rules integration (not a generic VTT)
- Offline-capable: works without internet, syncs when reconnected

---

## 2. Architecture Overview

### Monorepo Structure

```
apps/
├── vtt/              # Tauri + React main app (desktop + web)
└── server/           # Sync server (WebSocket + REST)

packages/
├── types/            # TypeScript types only (no runtime) — Draw Steel data model
├── core/             # Business logic: sync (Yjs), modes (XState), combat, dice
├── canvas/           # Pixi.js tactical grid rendering
├── ui/               # React components (Radix UI + Tailwind + shadcn)
├── data/             # Game compendium data with Zod schemas + GameData access layer
└── supabase/         # Database client, services, auth integration
```

### Data Flow

```
Campaign Builder (Supabase) → Server Hydration → Yjs Document → React UI
        ↑                          ↓
   Director edits            Players connect
   scenes in prep            via room code
```

### Key Architectural Boundaries

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **Persistence** | Campaign/hero storage, auth | Supabase (PostgreSQL + RLS) |
| **Sync** | Real-time document collaboration | Yjs CRDT + WebSocket server |
| **State** | UI-facing reactive state | Zustand (derived from Yjs doc) |
| **Rendering** | Tactical grid/canvas | Pixi.js v8 (WebGL) |
| **UI** | Components and layout | React 19 + Tailwind + shadcn |
| **Modes** | Scene type state machine | XState 5.0 |

---

## 3. Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 + TypeScript (strict) | Largest ecosystem, best tooling |
| Desktop | Tauri 2.x | Lighter than Electron, Rust backend |
| Sync | Yjs CRDT + WebSocket server | Offline-first, conflict-free multiplayer |
| Server | Hocuspocus (replaces y-websocket) | Server-side document lifecycle hooks |
| Canvas | Pixi.js v8 | 60fps WebGL tactical grid rendering |
| State | Zustand | UI state derived from Yjs document |
| Modes | XState 5.0 | Explicit state machine, no invalid states |
| Database | Supabase (PostgreSQL) | RLS, real-time subscriptions, auth |
| Styling | Tailwind CSS + shadcn/ui + Radix | Design system consistency |
| Validation | Zod | Schema validation for game data |
| Build | Vite + Turborepo | Fast builds with monorepo caching |
| Testing | Vitest + Playwright | Unit + E2E |
| Dice | Server-side rolls | Trusted in multiplayer |

---

## 4. Database Schema

### Core Tables

```sql
-- User profiles (extends Supabase auth.users)
profiles (id UUID PK, display_name, avatar_url, settings JSONB)

-- Heroes (full character sheets from wizard)
heroes (
  id UUID PK, user_id FK, name, hero_class, level, status,
  -- Character creation
  ancestry, ancestry_traits[], culture JSONB, career, inciting_incident,
  subclass, complication JSONB, characteristics JSONB, kit,
  -- Selected options
  selected_skills[], selected_languages[], selected_perks[],
  selected_titles JSONB, selected_abilities[],
  -- Personal
  pronouns, backstory, appearance, portrait_url,
  -- Combat stats (derived from class/kit/ancestry)
  max_stamina, current_stamina, max_recoveries, current_recoveries,
  speed, stability, size, heroic_resource, hero_tokens,
  -- Progression
  victories, xp,
  -- Metadata
  version, deleted_at, created_at, updated_at
)

-- Campaign hierarchy
campaigns (id, director_id FK, name, description, cover_image_url, settings JSONB)
modules (id, campaign_id FK, name, description, order_index)
sessions (id, campaign_id FK, module_id FK, name, description, status, order_index,
          recap, date_scheduled, yjs_room_id, scene_data JSONB, started_at, ended_at)
scenes (id, session_id FK, title, type, data JSONB, order_index)

-- Membership & invites
campaign_members (campaign_id, user_id, hero_id, role)
campaign_invites (id, campaign_id, token, expires_at, max_uses, used_count)

-- Session lobby
session_participants (session_id, user_id, hero_id, status, joined_at, ready_at)

-- Hero state tracking
hero_abilities (id, hero_id, ability_id, source_type, is_signature, uses_remaining, max_uses)
hero_conditions (id, hero_id, condition_name, source, stacks, duration_type, rounds_remaining)
hero_equipment (id, hero_id, name, slot, properties JSONB, charges, max_charges)
hero_projects (id, hero_id, name, description, progress, target, status)

-- Assets
map_library (id, user_id, name, storage_path, thumbnail_path, width_squares, height_squares, tags[])
npc_library (id, user_id, name, role, disposition, characteristics JSONB, abilities JSONB, ...)
```

### Enums

```sql
hero_class: censor | conduit | elementalist | fury | null | shadow | summoner | tactician | talent | troubadour
campaign_role: director | player | spectator
session_status: draft | planned | active | completed | archived
hero_status: active | retired | deceased
scene_type: battle | story | montage | negotiation | respite
participant_status: in_lobby | ready | in_session
```

### RLS Patterns

- Users manage own heroes (`auth.uid() = user_id`)
- Directors manage campaigns (`auth.uid() = director_id`)
- Members view campaigns via `campaign_members` join
- Game templates are read-only for everyone

### Key Database Functions

- `handle_new_user()` — Auto-creates profile on signup (trigger)
- `generate_invite_token()` — Creates secure hex token
- `accept_campaign_invite(token)` — Validates and consumes invite (RPC)

---

## 5. Real-Time Sync Architecture

### The Problem V1 Tried to Solve

Campaign Builder stores scenes in Supabase. Live sessions use Yjs documents for real-time sync. Bridging these two worlds — **hydrating** Supabase scenes into a Yjs document when a session starts — was the core challenge.

### Recommended Architecture: Hocuspocus Server

Use **Hocuspocus** instead of raw y-websocket. Key advantage: the `onLoadDocument` hook fires **only for the first connection** to a room, eliminating race conditions.

```
Director creates room → Writes yjs_room_id to Supabase → Connects WebSocket
                                                              ↓
                                                   Hocuspocus onLoadDocument
                                                   (first connection only)
                                                              ↓
                                                   Lookup session by yjs_room_id
                                                              ↓
                                                   Fetch scenes from Supabase
                                                              ↓
                                                   Hydrate Yjs document
                                                              ↓
                                                   All clients sync from memory
```

### Critical Design Decisions

1. **Write `yjs_room_id` to Supabase BEFORE connecting** — The room code → session UUID mapping must exist before the server tries to hydrate. Do this client-side via `updateSession()`.

2. **Server-side hydration only** — Clients should NOT hydrate from Supabase. The server does it once in `onLoadDocument`, and all clients sync from the in-memory document.

3. **Room code generation** — Use a single room code generator. Don't generate different codes on client vs server.

4. **`campaignLink` object** — Thread `{ campaignId, sessionId, sessionName, ... }` through the entire chain: UI state → AppProviders → SyncProvider params → WebSocket URL query params → server room registry.

### Session Document Structure (Yjs)

```
Y.Doc
├── session (Y.Map) — activeSceneId, hydratedAt, hydratedFrom, metadata
├── scenes (Y.Array<Scene>) — ordered scene list
└── entities (Y.Map<Entity>) — entityId → Entity
```

### Connection States

```
disconnected → connecting → connected → synced
                    ↓                      ↓
              connection-error        (ready for use)
```

### Event-Driven Mutations

```typescript
// WRONG: Direct mutation
entity.stamina.current -= 5;

// RIGHT: Event-based
emit({ type: 'STAMINA_CHANGED', payload: { entityId, delta: -5 } });
```

---

## 6. Scene System

Five scene types, each with its own state shape and UI:

### Scene Type Union

```typescript
type SceneType = 'story' | 'battle' | 'montage' | 'negotiation' | 'respite';

interface Scene {
  id: string;
  type: SceneType;
  title: string;
  order: number;
  entityIds: string[];
  state: StoryState | BattleState | MontageState | NegotiationState | RespiteState;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  lastModifiedBy: string;
}
```

### Story Scene

```typescript
interface StoryState {
  type: 'story';
  directorNotes: string;
  readAloudText: string;
}
```

Theater-of-mind narrative. Asset placement (maps, NPC portraits). Director notes hidden from players.

### Battle Scene

```typescript
interface BattleState {
  type: 'battle';
  round: number;
  turn: number;
  phase: 'setup' | 'initiative' | 'active' | 'resolved';
  initiativeOrder: InitiativeEntry[];
  grid: GridState;
  malice: number;
  malicePerRound: number;
  combatState?: {
    firstSide: 'heroes' | 'enemies';
    activeSide: 'heroes' | 'enemies';
    activeEntityId: string | null;
    combatants: SerializedCombatant[];
    enemyGroups: SerializedEnemyGroup[];
  };
  heroicResources?: Record<string, number>;
  combatLog?: CombatLogEntry[];
}

interface GridState {
  width: number;      // squares
  height: number;     // squares
  squareSize: number; // pixels per square (default 70)
  backgroundUrl?: string;
  tokens: TokenState[];
  walls: WallSegment[];
  lights: LightSource[];
  fogRevealed: boolean[][];
  difficultTerrain: boolean[][];
  drawings?: DrawingData;
  gridOpacity?: number;
  gridColor?: string;
  showGrid?: boolean;
}
```

Tactical grid with tokens, fog of war, initiative tracking, malice resource.

### Montage Scene

```typescript
interface MontageState {
  type: 'montage';
  title: string;
  goal: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  baseSuccessLimit: number;
  baseFailureLimit: number;
  heroCountAdjustment: boolean;
  currentRound: number;
  currentSuccesses: number;
  currentFailures: number;
  outcome: 'pending' | 'total_success' | 'partial_success' | 'total_failure';
  challenges: MontageChallenge[];
  tests: MontageTest[];
  assists: MontageAssist[];
  usedSkills: Record<string, string[]>; // heroId → skill names used
}
```

Collaborative skill challenge. Heroes make tests, accumulate successes/failures. Skills can't be reused by same hero.

### Negotiation Scene

```typescript
interface NegotiationState {
  type: 'negotiation';
  npcEntityId: string;
  interest: number;        // 0-5, determines offer quality
  patience: number;        // countdown, at 0 negotiation ends
  targetInterest: number;  // what heroes are aiming for
  interestRevealed: boolean;
  phase: 'active' | 'concluded';
  motivations: Motivation[];
  pitfalls: Pitfall[];
  arguments: NegotiationArgument[];
}
```

Structured social encounter. Interest scale 0-5 determines outcome. Patience depletes on failures.

### Respite Scene

```typescript
interface RespiteState {
  type: 'respite';
  location: string;
  activities: RespiteActivity[];
  completed: boolean;
  victoriesConverted: number;
}
```

Downtime recovery. Activities: recovery, research, crafting, training.

### Scene Templates (Campaign Builder → Live Session)

Each scene type has a **template** format (stored in Supabase `scenes.data`) and a **state** format (used in Yjs document). The server's hydration step converts templates to state.

```typescript
// Battle template (stored in Supabase)
interface BattleSceneTemplate {
  mapUrl?: string;
  placedTokens: PlacedToken[];
  creatureGroups: CreatureGroupEntry[];
  partyConfig: PartyConfig;
  maliceFeatures?: MaliceFeature[];
  dynamicTerrain?: TerrainEntry[];
  fogRevealed?: boolean[][];
  drawings?: DrawingData;
}

// Server hydration converts template → BattleState + Entity[]
function hydrateBattleScene(template: BattleSceneTemplate, context: HydrationContext): {
  scene: Scene;
  entities: Entity[];
}
```

---

## 7. Entity System

Everything on the stage is an Entity:

```typescript
type EntityType = 'hero' | 'npc' | 'enemy' | 'object' | 'hazard';

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  portraitUrl?: string;
  tokenUrl?: string;
  color?: string;
  panePosition: 'left' | 'right' | 'stage' | 'hidden';

  // Combat stats (optional per type)
  stamina?: { current: number; max: number };
  recoveries?: { current: number; max: number };
  heroicResource?: { current: number; max: number; name: string };
  characteristics?: { might: number; agility: number; reason: number; intuition: number; presence: number };
  conditions?: ConditionInstance[];

  // Type-specific data
  data: HeroData | NPCData | EnemyData | ObjectData | HazardData;

  // Metadata
  ownerId?: string;
  visibility: 'all' | 'director' | 'owner';
  version: number;
  isDeleted: boolean;
}
```

### Entity Types

| Type | Purpose | Key Data |
|------|---------|----------|
| **Hero** | Player character | class, ancestry, level, abilities, kit, mettleHeroId |
| **NPC** | Non-player character | role, disposition, negotiation data |
| **Enemy** | Hostile creature | creatureType, role (minion/standard/leader/solo), actions, traits |
| **Object** | Interactive prop | interactable, description, optional stamina |
| **Hazard** | Environmental danger | effect, damage, trigger condition |

### Type Guards

```typescript
function isHero(e: Entity): e is Entity & { data: HeroData }
function isEnemy(e: Entity): e is Entity & { data: EnemyData }
function isMinion(e: Entity): boolean // isEnemy && data.isMinion
// etc.
```

---

## 8. User Flows

### Director Flow

1. **Create Campaign** → Name, description, cover image
2. **Build Module** → Story arc within campaign
3. **Create Session** → Plan individual game sessions
4. **Add Scenes** → Configure each scene type (battle maps, montage challenges, NPC negotiations)
5. **Start Session** → Generate room code, transition to lobby
6. **Run Live Session** → Navigate scenes via Film Strip, manage combat, reveal info to players

### Player Flow

1. **Create Hero** → 11-step wizard (see Character Wizard section)
2. **Join Campaign** → Via invite link/code
3. **Join Session Lobby** → Select hero, mark ready
4. **Play Session** → View stage, manage hero vitals, roll dice, use abilities

### Session Lifecycle

```
Campaign Builder (draft) → Lobby (waiting) → Active (playing) → Completed (archived)
```

**Key transition: Lobby → Active**
1. Director clicks "Start Session" in lobby
2. Client writes `yjs_room_id` to Supabase session record
3. Client registers room with server via `POST /rooms` (with campaignLink)
4. Lobby shows room code for players
5. Director clicks "Enter Session"
6. WebSocket connects → server's `onLoadDocument` fires → hydrates from Supabase
7. Players connect via room code and sync from the in-memory document

---

## 9. UI Layout & Design System

### Director View Layout

```
┌─────────────────────────────────────────────────────┐
│ Campaign Nav    │    Film Strip (scene cards)        │
├────────┬────────┴───────────────────────┬───────────┤
│        │                                │           │
│  Left  │         Stage                  │   Right   │
│  Pane  │    (adapts per scene)          │   Pane    │
│200-400 │                                │  200-300  │
│  px    │                                │    px     │
│        │                                │           │
├────────┴────────────────────────────────┴───────────┤
│ Status Bar: Connection │ Round │ Sync │ Mode        │
└─────────────────────────────────────────────────────┘
```

- **Left Pane**: Scene-specific tools (initiative tracker, montage progress, negotiation controls)
- **Stage**: Canvas for battle, narrative area for story, etc.
- **Right Pane**: Party overview, entity cards
- **Film Strip**: 80x60px scene cards with type icon, name, visibility toggle

### Player View Layout

```
┌─────────────────────────────────────────────────────┐
│ Portrait │ Name │ Class │ Stamina Bar │ Resources   │  60px vitals bar
├────────┬─┴──────┴───────┴─────────────┬─────────────┤
│        │                              │             │
│Abilities│        Stage                │  Character  │
│(grouped│   (same as director)         │   Info      │
│by type)│                              │             │
│        │                              │             │
├────────┴──────────────────────────────┴─────────────┤
│ Status Bar: Turn indicator │ Connection │ Mode       │
└─────────────────────────────────────────────────────┘
```

### Color Palette (Dark Theme)

```css
/* Backgrounds */
--bg-void: #09090b;
--bg-deep: #0f0f14;
--bg-surface: #1a1a2e;
--bg-elevated: #25253a;
--bg-inset: #12121a;

/* Text */
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-muted: #71717a;

/* Accent */
--accent-primary: #3b82f6;

/* Scene Mode Colors */
--mode-story: #00BCD4;     /* Cyan */
--mode-battle: #ef4444;    /* Red */
--mode-montage: #22c55e;   /* Green */
--mode-negotiation: #f59e0b; /* Amber */
--mode-respite: #fbbf24;   /* Yellow */

/* Status */
--status-success: #22c55e;
--status-warning: #f59e0b;
--status-error: #ef4444;

/* Entity Role Colors */
--role-defender: #3b82f6;  /* Blue */
--role-controller: #8b5cf6; /* Purple */
--role-striker: #ef4444;    /* Red */
--role-support: #22c55e;    /* Green */
```

### Typography

- Display/headings: serif or display font (cinematic feel)
- Body: system sans-serif
- Code/data: monospace

### Film Strip Scene Cards

- 80×60px thumbnails
- Scene type icon overlay
- Scene name (truncated)
- Active scene highlighted with accent border
- Visibility toggle (eye icon) for Director
- Drag to reorder

---

## 10. Campaign Builder

### Hierarchy

```
Campaign
└── Module (story arc)
    └── Session (game session)
        └── Scene (individual encounter)
```

### Layout

- **Tree Sidebar** (256px): Expandable campaign tree, players section, assets
- **Card Grid** (main area): Shows children of selected tree item
- **Scene Editor**: Floating moveable/resizable window (default 800x600px, min 400x300px)
  - Can open multiple simultaneously
  - Drag by title bar, resize from edges
  - [Cancel] [Save] [Save & Preview] buttons

### Scene Editor by Type

**Battle Scene Editor:**
- Map selector (from map library or upload)
- Token placement (drag creatures from bestiary)
- Creature groups with role assignment
- Party configuration (hero count, level)
- Fog of war painting
- Drawing tools (whiteboard layer)
- Malice feature configuration

**Montage Scene Editor:**
- Goal description
- Difficulty setting (easy/moderate/hard)
- Challenge definitions
- Success/failure limits
- Outcome descriptions

**Negotiation Scene Editor:**
- NPC selection/creation
- Starting attitude (Hostile → Trusting)
- Motivation definitions (12 types)
- Pitfall definitions
- Response templates per tier

**Story Scene Editor:**
- Read-aloud text (for players)
- Director notes (hidden)
- Asset placement

**Respite Scene Editor:**
- Location description
- Available activities
- Project tracking

### Invite System

- Generate shareable links with expiration and max-uses
- Players join via link, see campaign info, select hero
- `accept_campaign_invite()` RPC validates and creates membership

---

## 11. Character Wizard

11-step linear wizard with dependency tracking:

| Step | Name | Outputs |
|------|------|---------|
| 1 | Ancestry | Size, speed, signature feature |
| 2 | Culture | Language, 3 skills |
| 3 | Career | Skills, languages, renown, inciting incident |
| 4 | Class | Characteristics array, stamina, recoveries, heroic resource |
| 5 | Subclass | Class-specific features (locked until class selected) |
| 6 | Characteristics | Assign values from class array |
| 7 | Kit | Equipment, bonuses, signature ability |
| 8 | Skills | Final selections (excluding already-granted) |
| 9 | Starting Abilities | Class ability choices |
| 10 | Personal Details | Name, pronouns, backstory, appearance, portrait |
| 11 | Review & Confirm | Final character sheet |

### Layout

- Left/Center (65%): Step content area
- Right (35%): Live character preview (updates as you go)
- Step indicator dots at bottom
- [Back] [Next →] navigation

### Skill/Language Grant Tracking

Multiple sources grant skills (ancestry, culture, career, class). Solution:
- Desaturate and lock granted skills with 🔒 icon
- Show source of grant ("From Culture")
- Available skills show [Select] button

### Output

Creates a `heroes` row in Supabase with all fields populated. The hero can then be selected when joining a session lobby.

---

## 12. Draw Steel Game Rules

### Power Rolls

- Roll 2d10 + characteristic modifier
- **Tier 1** (≤11): Weak result
- **Tier 2** (12-16): Moderate result
- **Tier 3** (17+): Strong result
- Natural 19-20: Always success with bonus

### Edges and Banes

- Edge: Roll 3d10, keep highest 2
- Bane: Roll 3d10, keep lowest 2
- Edges and banes cancel each other 1:1

### Characteristics (5)

`might`, `agility`, `reason`, `intuition`, `presence`

### Hero Classes (10)

| Class | Heroic Resource | Role |
|-------|----------------|------|
| Censor | Judgment | Controller |
| Conduit | Piety | Support |
| Elementalist | Essence | Controller |
| Fury | Rage | Striker |
| Null | Void | Controller |
| Shadow | Insight | Striker |
| Summoner | Minions | Controller |
| Tactician | Focus | Support |
| Talent | Clarity | Striker |
| Troubadour | Drama | Support |

### Stamina System

- **Max Stamina**: Determined by class + kit + ancestry
- **Recovery Value**: `floor(maxStamina / 3)`
- **Winded**: `currentStamina ≤ maxStamina / 2`
- **Dying**: `currentStamina ≤ 0`
- **Recoveries**: Spend to heal Recovery Value stamina

### Conditions (9)

`bleeding`, `dazed`, `frightened`, `grabbed`, `prone`, `restrained`, `slowed`, `taunted`, `weakened`

### Actions Per Turn

- 1 main action
- 1 maneuver
- 1 move action
- 1 triggered action (per round, not per turn)

### Malice (Director Resource)

- +2 per round
- +2 when heroes fail tests
- Spend to activate villain abilities and malice features
- Tracks across the entire battle

### Negotiation Rules

- **Interest** (0-5): Determines offer quality
  - 0: "No, and..." (hostile)
  - 3: "Yes, but..." (conditional)
  - 5: "Yes, and..." (generous)
- **Patience** (2-5): Countdown, ends negotiation at 0
- **Motivations**: Appeal to these for +Interest
- **Pitfalls**: Using these costs -1 Interest, -1 Patience

### Montage Rules

- Collaborative skill challenge
- Accumulate successes and failures toward limits
- Same hero can't reuse a skill
- Outcomes: Total Success, Partial Success, Total Failure

---

## 13. Lessons Learned from V1

These are hard-won lessons from the first implementation. **Do not repeat these mistakes.**

### 1. Hydration Must Be Server-Side Only

**Problem**: Client-side hydration from Supabase caused race conditions. Multiple clients would try to hydrate simultaneously, stale IndexedDB data would overwrite fresh Supabase data, and `bindState` would fire before the session ID mapping was available.

**Solution**: Use Hocuspocus `onLoadDocument` hook. Server hydrates once on first connection. All clients sync from the in-memory document. **Never hydrate from Supabase on the client.**

### 2. Room Code → Session ID Mapping Must Be Pre-Written

**Problem**: The room code (e.g., "ABC123") is what the WebSocket connects to. The Supabase session UUID is what the server needs to fetch scenes. The mapping between these was fragile — passed through URL params, room registries, and async fire-and-forget Supabase updates that raced with each other.

**Solution**: Write `sessions.yjs_room_id = roomCode` to Supabase **synchronously before** the WebSocket connection is established. Use a single source of truth for this mapping. Don't rely on URL params or in-memory registries as the primary lookup.

### 3. Single Room Code Generator

**Problem**: Client generated room codes one way, Supabase's `startSession()` generated them differently. Room codes didn't match.

**Solution**: One function, one format, used everywhere. Generate the room code on the client, write it to Supabase, connect to the server with it.

### 4. Don't Thread State Through 5 Layers

**Problem**: `campaignLink` had to pass through: UI state machine → AppProviders props → SyncProvider config → WebSocket URL params → server connection handler → room registry → bindState. Any break in this chain = no hydration.

**Solution**: Minimize indirection. Write the mapping to the database and let the server look it up directly. Don't rely on ephemeral in-memory state or URL params for critical data.

### 5. IndexedDB Persistence Creates Stale State

**Problem**: y-websocket's IndexedDB persistence would cache old documents. When reconnecting, stale data from IndexedDB would be treated as the "current" document, overwriting fresh server-hydrated data.

**Solution**: Be very careful with IndexedDB persistence. Consider not using it for session documents, or implement a clear versioning/timestamp strategy to detect and discard stale data.

### 6. Test the Full Flow End-to-End

**Problem**: Individual components worked in isolation. The Campaign Builder saved scenes correctly. The hydration function converted templates correctly. But the full flow from "save scene" → "start session" → "see scene in live game" was never tested as one path.

**Solution**: Write E2E tests for the critical path: create campaign, add scene, start session, verify scene appears. This is the single most important test.

### 7. Auth in Dev Mode Needs Care

**Problem**: Dev mode (`REQUIRE_AUTH=false`) used mock users with hardcoded roles, which masked real auth issues. The mock user was always `role: 'director'`, hiding player-specific bugs.

**Solution**: Dev mode mock users should derive their role from the request (URL params, etc.), not hardcode it.

### 8. `useCallback` + `useState` Initialization Order Matters

**Problem**: `useCallback` defined before `useState` hooks that provide its dependencies would reference undefined values during the first render.

**Solution**: Define all state hooks first, then derived values, then callbacks.

---

## Appendix A: File Reference

### Key Source Files from V1

These files contain the most important logic and can serve as reference:

| File | Purpose |
|------|---------|
| `packages/types/src/scene.ts` | All scene type definitions and templates |
| `packages/types/src/entity.ts` | Entity system types |
| `packages/core/src/sync/provider.ts` | SyncProvider (Yjs + WebSocket wrapper) |
| `packages/core/src/session/SessionDocument.ts` | Yjs document wrapper for session state |
| `packages/core/src/session/hydration.ts` | Template → state conversion logic |
| `packages/core/src/campaign/templateToScene.ts` | Scene template hydration |
| `packages/supabase/src/campaigns.ts` | All campaign/module/session/scene CRUD |
| `packages/supabase/src/heroes.ts` | Hero CRUD and wizard integration |
| `packages/supabase/src/types.ts` | Database row types |
| `packages/data/src/game-data/` | GameData access layer for Draw Steel rules |
| `apps/server/src/hydration/index.ts` | Server-side scene hydration |

### Design Documents

| Document | Purpose |
|----------|---------|
| `docs/FIGMA_DESIGN_BRIEF.md` | Core VTT UI specifications (Director + Player views) |
| `docs/FIGMA_CAMPAIGN_BUILDER_BRIEF.md` | Campaign Builder UI |
| `docs/FIGMA_CHARACTER_WIZARD_BRIEF.md` | 11-step hero creation wizard |
| `docs/FIGMA_NEGOTIATION_BRIEF.md` | Negotiation scene mechanics |
| `docs/KNOWLEDGE_BIBLE.md` | Development guide and Draw Steel rules reference |
| `docs/USER_FLOWS.md` | Player and Director user journeys |
| `docs/data-rules-md/` | Complete Draw Steel ruleset in Markdown |
