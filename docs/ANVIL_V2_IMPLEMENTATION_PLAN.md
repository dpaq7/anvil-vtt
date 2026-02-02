# Anvil V2 — Full Implementation Roadmap (Revised)

> Corrected plan with Cloudflare-only auth, lobby flow, server-side dice, and critical path fixes.

---

## Current State

- `@anvil/types` — Complete (2.5K lines, all 10 hero classes, VTT domain types)
- `@anvil/data` — Complete (20+ logic modules, GameData API, compendium, rules data)
- `@anvil/ui`, `@anvil/vtt`, `@anvil/server` — Stubs
- **Sync strategy**: WebSocket + last-write-wins (NO CRDTs)
- **Auth strategy**: Discord OAuth + D1 sessions (Cloudflare only, no Supabase)

---

## Architecture Principles

These are non-negotiable based on production VTT research:

1. **Server authoritative** — Server validates all actions, rolls all dice, broadcasts results
2. **Client displays** — Client renders server state, calculates fog of war locally
3. **Store source, derive computed** — Never persist calculated values
4. **Logic in modules** — All calculations in `@anvil/data/logic/`, not in components
5. **Eager loading** — Load full session state on "Go Live", no lazy hydration
6. **Simple reconnection** — Exponential backoff, request full state, "Refresh" fallback

---

## Phase 1: Foundation (Infrastructure + Design System)

**Goal**: Running Vite app with Discord auth, routing, dark theme, deployed Cloudflare Worker with D1 schema and R2 bucket.

### Deliverables

#### 1.1 D1 Schema
SQL migrations for all tables:

```sql
-- Auth
users (id, discord_id UNIQUE, username, avatar_url, created_at, updated_at)
sessions (id, user_id FK, expires_at, created_at)

-- Campaigns
campaigns (id, director_id FK, name, description, cover_image_url, settings JSONB, created_at, updated_at, deleted_at)
modules (id, campaign_id FK, name, description, order_index)
game_sessions (id, campaign_id FK, module_id FK, name, description, status ENUM, order_index, room_code, started_at, ended_at)
scenes (id, game_session_id FK, title, type ENUM, data JSONB, order_index, deleted_at)

-- Heroes
heroes (id, user_id FK, name, ancestry, culture, career, hero_class, subclass, level, characteristics JSONB, kit, skills, abilities, portrait_url, data JSONB, version, created_at, updated_at, deleted_at)

-- Membership
campaign_members (campaign_id, user_id, hero_id, role ENUM, joined_at)
campaign_invites (id, campaign_id FK, token UNIQUE, expires_at, max_uses, used_count)
session_participants (game_session_id, user_id, hero_id, status ENUM, joined_at, ready_at)

-- Assets
assets (id, user_id FK, name, type ENUM, storage_key, thumbnail_key, width, height, tags, created_at)
```

#### 1.2 Cloudflare Worker
- Hono router in `apps/server/src/index.ts`
- `wrangler.toml` with D1, R2, and Durable Object bindings
- Environment variables for Discord OAuth secrets
- CORS configuration for local dev

#### 1.3 Discord OAuth (Cloudflare Only)
Routes:
- `GET /api/auth/discord` — Redirect to Discord OAuth
- `GET /api/auth/callback` — Exchange code, upsert user, create session, set cookie
- `POST /api/auth/logout` — Delete session, clear cookie
- `GET /api/auth/me` — Return current user from session cookie

Implementation:
- D1 tables: `users`, `sessions`
- HttpOnly session cookie (7 day expiry)
- Auth middleware for protected API routes
- Session cleanup (expired sessions)

#### 1.4 Vite + React 19 App
- React Router routes: `/`, `/auth`, `/app/*`
- Zustand auth store with `checkAuth()`, `logout()`
- Protected route wrapper (redirects to `/auth` if unauthenticated)
- Environment config for API base URL

#### 1.5 Design System
- shadcn/ui initialization in `packages/ui`
- Dark theme CSS variables (from FRONTEND_DESIGN.md)
- Tailwind config with scene mode color tokens
- Base components: Button, Input, Card, Dialog, Tabs, Alert, ScrollArea, Tooltip

#### 1.6 Layout Shell
- `AppShell` component with slots for: TopBar, LeftRail, Stage, RightRail, FilmStrip, StatusBar
- All render placeholder content
- Responsive breakpoints defined

#### 1.7 Landing Page
- Simple marketing page at `/`
- "Login with Discord" CTA
- Brief product description

#### 1.8 R2 Bucket Setup
- Bucket created in wrangler.toml
- Presigned URL generation endpoint stubbed

### Files

```
apps/server/
├── src/
│   ├── index.ts                    # Hono entry
│   ├── routes/
│   │   └── auth.ts                 # Discord OAuth routes
│   └── middleware/
│       └── auth.ts                 # Session validation middleware
├── migrations/
│   ├── 0001_users_sessions.sql
│   ├── 0002_campaigns.sql
│   ├── 0003_heroes.sql
│   └── 0004_assets.sql
└── wrangler.toml

apps/vtt/
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── router.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   └── Auth.tsx
│   └── stores/
│       └── authStore.ts

packages/ui/src/
├── index.ts
├── globals.css                     # Theme variables
├── lib/utils.ts                    # cn() helper
└── components/
    ├── Button.tsx
    ├── Card.tsx
    ├── Dialog.tsx
    ├── Input.tsx
    ├── Tabs.tsx
    ├── Alert.tsx
    ├── ScrollArea.tsx
    ├── Tooltip.tsx
    └── layout/
        └── AppShell.tsx
```

### Verification

- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` passes
- [ ] Worker responds at `http://localhost:8787/api/health`
- [ ] App loads at `http://localhost:5173`
- [ ] Discord OAuth flow: click login → Discord → callback → redirected to `/app`
- [ ] Protected routes redirect to `/auth` when not logged in
- [ ] Session persists across page refresh
- [ ] Logout clears session

---

## Phase 2: Campaign Builder

**Goal**: Director can create campaigns, add modules/sessions/scenes, edit scene templates. All persists to D1.

### Deliverables

#### 2.1 REST API
CRUD endpoints with auth middleware:

```
Campaigns:  GET/POST /api/campaigns, GET/PUT/DELETE /api/campaigns/:id
Modules:    GET/POST /api/campaigns/:id/modules, PUT/DELETE /api/modules/:id
Sessions:   GET/POST /api/campaigns/:id/sessions, PUT/DELETE /api/sessions/:id  
Scenes:     GET/POST /api/sessions/:id/scenes, PUT/DELETE /api/scenes/:id
Invites:    POST /api/campaigns/:id/invites, GET /api/invites/:token
Assets:     POST /api/assets/upload (presigned URL), GET /api/assets
```

#### 2.2 Campaign List (`/app/campaigns`)
- Card grid showing user's campaigns (as Director)
- "Joined Campaigns" section (as Player)
- Create campaign dialog (name, description)
- Campaign card shows: cover image, name, player count, status

#### 2.3 Campaign Builder (`/app/campaigns/:id`)
- Tree sidebar: Campaign → Modules → Sessions → Scenes
- Breadcrumb navigation
- Card grid showing children of selected tree node
- Click card to select, double-click to edit
- Context menu: rename, delete, reorder

#### 2.4 Scene Editors
Sheet (side panel) for each scene type:

| Type | Editor Fields |
|------|---------------|
| **Battle** | Map picker, creature groups (from compendium), difficulty calculator, starting positions |
| **Story** | Read-aloud text, Director notes, asset references |
| **Montage** | Goal, difficulty, challenges, success/failure limits, outcomes |
| **Negotiation** | NPC selector, starting interest/patience, motivations, pitfalls |
| **Respite** | Location description, available activities, duration |

#### 2.5 Invite System
- Generate invite link (POST creates token with expiry)
- `/join/:token` page: validate token, show campaign info, accept button
- Accept: creates `campaign_members` row, redirects to campaign

#### 2.6 Asset Upload
- Presigned R2 upload URL endpoint
- File picker component
- Map library view in battle editor
- Thumbnail generation (client-side, upload both)

### Files

```
apps/server/src/routes/
├── campaigns.ts
├── modules.ts
├── sessions.ts
├── scenes.ts
├── invites.ts
└── assets.ts

apps/vtt/src/pages/
├── CampaignList.tsx
├── CampaignBuilder.tsx
└── JoinCampaign.tsx

apps/vtt/src/components/builder/
├── TreeSidebar.tsx
├── CardGrid.tsx
├── SceneEditorSheet.tsx
├── BattleSceneEditor.tsx
├── StorySceneEditor.tsx
├── MontageSceneEditor.tsx
├── NegotiationSceneEditor.tsx
└── RespiteSceneEditor.tsx

packages/ui/src/components/
├── TreeView.tsx
├── FileUpload.tsx
└── Sheet.tsx
```

### Verification

- [ ] Create campaign → appears in list
- [ ] Add module → add session → add scene → tree updates
- [ ] Edit battle scene → save → reload → data persists
- [ ] Edit all 5 scene types successfully
- [ ] Upload map image → appears in library → select in battle editor
- [ ] Generate invite → open link in incognito → accept → member added

**E2E Test:**
```typescript
test('Director creates campaign with battle scene', async () => {
  await loginAsDirector();
  await createCampaign('Test Campaign');
  await addSession('Session 1');
  await addScene('battle', 'Goblin Ambush');
  await editBattleScene({ map: 'forest.jpg', creatures: ['Goblin x3'] });
  await saveScene();
  await page.reload();
  await expect(sceneTitle).toBe('Goblin Ambush');
});
```

**Depends on**: Phase 1

---

## Phase 3: Character Wizard + Hero Management

**Goal**: Players create and manage Draw Steel heroes via 11-step wizard. Heroes persist and can be assigned to campaigns.

### Deliverables

#### 3.1 Hero API
```
GET    /api/heroes              # List user's heroes
POST   /api/heroes              # Create hero
GET    /api/heroes/:id          # Get hero
PUT    /api/heroes/:id          # Update hero
DELETE /api/heroes/:id          # Soft delete
```

#### 3.2 Hero List (`/app/heroes`)
- Row-based list with: portrait, name, class, level, stamina bar
- "Create Hero" button
- Click to view character sheet
- Delete with confirmation

#### 3.3 Character Wizard (`/app/heroes/new`)
11 steps driven by `WizardLogic` + `GameData` compendium:

| Step | Content | Outputs |
|------|---------|---------|
| 1. Ancestry | Ancestry picker with feature preview | `ancestry`, size, speed |
| 2. Culture | Culture options, language grant | `culture`, languages |
| 3. Career | Career picker, skill grants | `career`, skills, inciting incident |
| 4. Class | Class picker with role/resource info | `heroClass`, characteristics array |
| 5. Subclass | Subclass options (filtered by class) | `subclass` |
| 6. Characteristics | Assign array values to 5 stats | `characteristics` |
| 7. Kit | Kit picker with equipment/bonuses | `kit`, signature ability |
| 8. Skills | Select remaining skills (shows granted) | `skills` (final) |
| 9. Abilities | Choose starting abilities | `abilities` |
| 10. Personal | Name, pronouns, backstory, portrait | `name`, `backstory`, `portraitUrl` |
| 11. Review | Full character sheet preview | Confirm and save |

**Wizard Features:**
- Progress indicator (dots)
- Live preview panel (35% width) showing character-in-progress
- Back/Next navigation
- Step validation before proceeding
- **IndexedDB auto-save** (save progress every change, restore on return)

#### 3.4 Character Sheet (`/app/heroes/:id`)
Read-only display using Logic modules:
- Header: portrait, name, class, level
- Vitals: stamina bar, recoveries, heroic resource
- Characteristics: 5 stat boxes with modifiers
- Abilities: grouped by type, shows keywords/damage/distance
- Features: from ancestry, class, kit with sources
- Equipment: from kit
- Skills: with proficiency indicators

#### 3.5 IndexedDB Persistence
- `useWizardPersistence` hook
- Save wizard state on every step change
- Resume interrupted wizards
- Clear on successful D1 save

### Files

```
apps/server/src/routes/
└── heroes.ts

apps/vtt/src/pages/
├── HeroList.tsx
├── HeroWizard.tsx
└── HeroSheet.tsx

apps/vtt/src/components/wizard/
├── WizardLayout.tsx
├── WizardProgress.tsx
├── WizardPreview.tsx
├── AncestryStep.tsx
├── CultureStep.tsx
├── CareerStep.tsx
├── ClassStep.tsx
├── SubclassStep.tsx
├── CharacteristicsStep.tsx
├── KitStep.tsx
├── SkillsStep.tsx
├── AbilitiesStep.tsx
├── PersonalStep.tsx
└── ReviewStep.tsx

apps/vtt/src/hooks/
└── useWizardPersistence.ts
```

### Verification

- [ ] Start wizard → complete all 11 steps → hero saved
- [ ] Close browser mid-wizard → reopen → progress restored from IndexedDB
- [ ] View character sheet → all stats calculated correctly
- [ ] Delete hero → soft deleted, doesn't appear in list

**Depends on**: Phase 1  
**Parallelizable with**: Phase 4

---

## Phase 4: WebSocket + Session Room + Lobby

**Goal**: Director "Goes Live", players join via room code, see lobby, Director starts session, full state syncs over WebSocket.

### Deliverables

#### 4.1 SessionRoom Durable Object
```typescript
export class SessionRoom implements DurableObject {
  private state: SessionState | null = null;
  private connections: Map<WebSocket, { userId: string; role: 'director' | 'player' }>;
  
  async fetch(request: Request): Promise<Response>
  async webSocketMessage(ws: WebSocket, message: string): Promise<void>
  async webSocketClose(ws: WebSocket): Promise<void>
  
  private async hydrate(sessionId: string): Promise<void>
  private broadcast(message: ServerMessage, exclude?: WebSocket): void
  private validateAction(userId: string, action: ClientMessage): boolean
}
```

#### 4.2 WebSocket Upgrade Route
```
GET /api/sessions/:id/ws
```
- Validates session cookie
- Checks user is campaign member  
- Upgrades to WebSocket
- Attaches to SessionRoom DO

#### 4.3 Go Live Flow (CRITICAL ORDERING)
```
Director clicks [Go Live]
    │
    ▼
1. Client generates room code (6 chars, uppercase alphanumeric)
    │
    ▼
2. Client calls PUT /api/sessions/:id/go-live { roomCode }
   Server: UPDATE game_sessions SET room_code=?, status='lobby', started_at=NOW()
   *** THIS MUST COMPLETE BEFORE NAVIGATING ***
    │
    ▼
3. Client navigates to /app/session/:id/lobby
```

#### 4.4 Lobby Page (`/app/session/:id/lobby`)

**Director View:**
- Room code (large, copyable)
- Participant list with ready status
- "Start Session" button (enabled when ≥1 player ready OR override)
- "Cancel" button (returns to builder)

**Player View:**
- Session name, Director name
- Hero selector (from player's heroes in this campaign)
- "Ready" toggle button
- Participant list

**Real-time Updates:**
- Poll `GET /api/sessions/:id/participants` every 2 seconds

#### 4.5 Join Page (`/app/join/:code`)
- Room code input (if accessed without code)
- Validate code → show session info
- If not authenticated → redirect to `/auth` with returnTo
- If not campaign member → prompt to join campaign first
- Select hero → POST `/api/sessions/:id/join` → redirect to lobby

#### 4.6 Session Start Flow
```
Director clicks [Start Session]
    │
    ▼
1. POST /api/sessions/:id/start
   Server: UPDATE game_sessions SET status='active'
    │
    ▼
2. Client connects WebSocket to SessionRoom DO
    │
    ▼
3. DO hydrates full state from D1 (all scenes, entities)
    │
    ▼
4. DO sends { type: 'state', state: SessionState } to Director
    │
    ▼
5. Client navigates to /app/session/:id
    │
    ▼
6. Players detect status change (via polling), connect WebSocket, receive state, navigate
```

#### 4.7 Message Protocol

**Client → Server:**
```typescript
type ClientMessage =
  | { type: 'request_state' }
  | { type: 'ping' }
  | { type: 'switch_scene'; sceneId: string }           // Director only
  | { type: 'create_entity'; entity: EntityData }       // Director only
  | { type: 'update_entity'; entityId: string; changes: Partial<EntityData> }
  | { type: 'delete_entity'; entityId: string }         // Director only
  | { type: 'move_token'; entityId: string; x: number; y: number }
  | { type: 'combat_action'; action: CombatAction }
  | { type: 'use_ability'; sourceId: string; targetId: string; abilityId: string }
```

**Server → Client:**
```typescript
type ServerMessage =
  | { type: 'state'; state: SessionState }
  | { type: 'scene_changed'; sceneId: string; scene: Scene }
  | { type: 'entity_created'; entity: Entity }
  | { type: 'entity_updated'; entityId: string; changes: Partial<Entity> }
  | { type: 'entity_deleted'; entityId: string }
  | { type: 'entity_moved'; entityId: string; x: number; y: number }
  | { type: 'combat_updated'; combat: CombatState }
  | { type: 'ability_resolved'; result: AbilityResult }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' }
```

#### 4.8 Persistence Manager
Inside SessionRoom DO:

| Data | Strategy |
|------|----------|
| Combat state | Immediate write on every change |
| Entity CRUD | Immediate write |
| Token positions | Batched every 5 seconds |
| Full snapshot | Every 5 minutes |

#### 4.9 Client Hook
```typescript
function useSessionSocket(sessionId: string): {
  state: SessionState | null;
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  send: (message: ClientMessage) => void;
  error: string | null;
}
```
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 attempts)
- On reconnect: send `{ type: 'request_state' }`
- After 5 failures: show "Connection lost. Please refresh."

#### 4.10 Session Zustand Store
```typescript
interface SessionStore {
  scenes: Scene[];
  activeSceneId: string | null;
  entities: Map<string, Entity>;
  combat: CombatState | null;
  participants: Participant[];
  selectedEntityId: string | null;
  
  switchScene: (sceneId: string) => void;
  moveToken: (entityId: string, x: number, y: number) => void;
  handleServerMessage: (message: ServerMessage) => void;
}
```

### Files

```
apps/server/src/
├── durable-objects/
│   ├── SessionRoom.ts
│   └── PersistenceManager.ts
└── routes/
    └── sessions.ts

apps/vtt/src/
├── pages/
│   ├── Lobby.tsx
│   └── JoinSession.tsx
├── hooks/
│   └── useSessionSocket.ts
└── stores/
    └── sessionStore.ts
```

### Verification

- [ ] Director: Go Live → room code appears in lobby
- [ ] Player: Enter room code at `/join/:code` → sees lobby → selects hero → marks ready
- [ ] Director: Sees player in lobby with ready status
- [ ] Director: Clicks "Start Session" → both navigate to session view
- [ ] Both see same initial state
- [ ] Director switches scene → player sees scene change within 500ms
- [ ] Disconnect player → reconnect → state matches Director
- [ ] After 5 failed reconnects → "Refresh" message appears

**E2E Test (Critical Path):**
```typescript
test('Go live and player join flow', async ({ browser }) => {
  const directorPage = await browser.newPage();
  const playerPage = await browser.newPage();
  
  await directorPage.loginAsDirector();
  await directorPage.goLive(sessionId);
  const roomCode = await directorPage.getRoomCode();
  
  await playerPage.loginAsPlayer();
  await playerPage.goto(`/join/${roomCode}`);
  await playerPage.selectHero('Test Hero');
  await playerPage.click('[data-testid="join"]');
  await playerPage.click('[data-testid="ready"]');
  
  await expect(directorPage.locator('[data-testid="player-ready"]')).toBeVisible();
  
  await directorPage.click('[data-testid="start-session"]');
  
  await expect(directorPage).toHaveURL(/\/session\//);
  await expect(playerPage).toHaveURL(/\/session\//);
});
```

**Depends on**: Phase 1, Phase 2

---

## Phase 5: Live Session UI (Non-Battle Scenes)

**Goal**: Director and players run Story, Montage, Negotiation, and Respite scenes live with real-time sync.

### Deliverables

#### 5.1 XState Scene Machine
State machine for scene mode transitions, triggered by WebSocket messages.

#### 5.2 Film Strip (Director Only in Live)
- Horizontal scroll area (56px)
- Scene cards: 80×48px, type icon, title
- Click to switch scene
- Scene mode color tint

#### 5.3 Director Session Layout
- TopBar: Session name, room code, [End Session]
- LeftRail: Participants, scene tools
- Stage: Scene-specific content
- RightRail: Entity details, notes
- FilmStrip: Scene navigation
- StatusBar: Connection, mode, participant count

#### 5.4 Player Session Layout
- VitalsBar: Portrait, name, class, stamina bar, heroic resource
- LeftRail: Abilities panel
- Stage: Same as Director (minus hidden elements)
- RightRail: Character sheet
- StatusBar: Connection, turn indicator

#### 5.5 Story Stage
- Read-aloud text (large, cinematic)
- Asset display
- Director notes (hidden from players)

#### 5.6 Montage Stage
- Goal display
- Success/failure progress bars
- Challenge cards
- Test resolution flow
- Uses `MontageLogic`

#### 5.7 Negotiation Stage
- NPC portrait
- Interest meter (0-5)
- Patience meter
- Motivation/pitfall cards
- Argument log
- Uses `NegotiationLogic`

#### 5.8 Respite Stage
- Activity cards
- Party assignments
- Project tracker
- Uses `RespiteLogic`

#### 5.9 Status Bar
- Scene type with color
- Connection status
- Participant count

### Files

```
apps/vtt/src/
├── machines/sceneMachine.ts
├── pages/session/
│   ├── DirectorView.tsx
│   └── PlayerView.tsx
└── components/
    ├── session/
    │   ├── FilmStrip.tsx
    │   ├── VitalsBar.tsx
    │   └── StatusBar.tsx
    └── stages/
        ├── StoryStage.tsx
        ├── MontageStage.tsx
        ├── NegotiationStage.tsx
        └── RespiteStage.tsx

packages/ui/src/components/
├── StaminaBar.tsx
├── ResourcePips.tsx
├── InterestMeter.tsx
└── SceneTypeIcon.tsx
```

### Verification

- [ ] Director switches Story → Montage → player sees stage change
- [ ] Montage: Record test → success count updates for both
- [ ] Negotiation: Argument result → interest updates for both
- [ ] Scene mode colors tint UI correctly
- [ ] VitalsBar shows correct calculated stamina

**Depends on**: Phase 4

---

## Phase 6: Battle System (Canvas + Combat)

**Goal**: Full tactical battle with grid canvas, token movement, turn tracking, fog of war.

### Deliverables

#### 6.1 PixiJS Canvas
- `BattleStage` wrapping PixiJS v8
- Layers: Background → Grid → Tokens → Fog → UI
- Zoom/pan

#### 6.2 Grid Rendering
- Configurable square size
- Background image
- Coordinate labels (optional)

#### 6.3 Token Rendering
- Portrait or initials
- HP arc
- Role color ring
- Condition badges
- Selection highlight
- Size variants (1×1, 2×2, 3×3)

#### 6.4 Token Interaction
- Click to select
- Drag to move (grid-snapped)
- Server validates, broadcasts

#### 6.5 Quadtree Spatial Indexing
- O(log n) hit detection
- Update on token move

#### 6.6 Combat Tracker (Director)
- Initiative list
- Current turn indicator
- "Next Turn" button
- Round counter

#### 6.7 Combat Reducer in DO
```typescript
type CombatAction =
  | { type: 'START_COMBAT'; initiativeOrder: InitiativeEntry[] }
  | { type: 'END_COMBAT' }
  | { type: 'NEXT_TURN' }
  | { type: 'MARK_ACTION_USED'; entityId: string; actionType: ActionType }
  | { type: 'ADJUST_MALICE'; delta: number }
  | { type: 'APPLY_DAMAGE'; entityId: string; amount: number }
  | { type: 'APPLY_HEALING'; entityId: string; amount: number }
  | { type: 'APPLY_CONDITION'; entityId: string; condition: Condition }
  | { type: 'REMOVE_CONDITION'; entityId: string; conditionId: string }
```

#### 6.8 Malice Tracker
- Current malice display
- +/- buttons

#### 6.9 Damage/Healing Panel
- Target selection
- Amount input
- Apply button

#### 6.10 Condition Management
- Apply condition dialog
- Condition badges on tokens
- Remove condition

#### 6.11 Fog of War (Client-Side)
- Visibility polygon algorithm
- PixiJS mask
- Director sees all, players see hero's vision
- Wall data from scene

### Files

```
apps/vtt/src/
├── components/stages/BattleStage.tsx
├── canvas/
│   ├── BattleCanvas.tsx
│   ├── layers/
│   │   ├── BackgroundLayer.ts
│   │   ├── GridLayer.ts
│   │   ├── TokenLayer.ts
│   │   └── FogLayer.ts
│   ├── systems/
│   │   ├── InteractionManager.ts
│   │   ├── ViewportSystem.ts
│   │   └── Quadtree.ts
│   └── vision/
│       └── VisibilityCalculator.ts
└── components/session/
    ├── CombatTracker.tsx
    ├── MalicePanel.tsx
    └── DamageDialog.tsx
```

### Verification

- [ ] Battle map renders with grid and background
- [ ] Drag token → server validates → all clients see move
- [ ] Combat tracker shows initiative, advances turns
- [ ] Apply damage → stamina updates for all
- [ ] Fog of war: player only sees tokens near hero
- [ ] 50+ tokens: no lag in click detection

**Depends on**: Phase 4, Phase 5

---

## Phase 7: Abilities + Dice + Combat Resolution

**Goal**: Heroes and monsters use abilities with **server-side** power rolls. Full Draw Steel combat loop.

### Deliverables

#### 7.1 Ability Panel (Player)
- Abilities grouped by type
- Shows: name, keywords, distance, damage
- Filtered by action economy

#### 7.2 Ability Resolution Flow (SERVER-SIDE DICE)
```
Player clicks ability → selects target
    │
    ▼
Client sends: { type: 'use_ability', sourceId, targetId, abilityId }
    │
    ▼
Server validates:
  - Is it source's turn?
  - Is action type available?
  - Is target in range?
    │
    ▼
Server rolls dice:
  - Get characteristic modifier
  - Apply edges/banes from conditions
  - Roll 2d10 (crypto.getRandomValues)
  - Calculate tier
    │
    ▼
Server calculates effects:
  - Damage from tier
  - Conditions to apply
    │
    ▼
Server applies effects:
  - Update target stamina
  - Apply conditions
  - Mark action used
    │
    ▼
Server broadcasts: { type: 'ability_resolved', result }
    │
    ▼
All clients display same result
```

#### 7.3 Power Roll Display
- Dice values
- Modifier
- Total and tier
- Damage dealt

#### 7.4 Monster Abilities (Director)
- Same flow as player abilities

#### 7.5 Heroic Resource Tracking
- Display in VitalsBar
- Gain/spend per class rules

#### 7.6 Turn Action Tracking
- Checkboxes for action types
- Auto-mark on ability use
- Reset on turn change

#### 7.7 Combat Log
- Scrollable event log
- Shows all actions with details

### Files

```
apps/vtt/src/components/session/
├── AbilityPanel.tsx
├── AbilityCard.tsx
├── TargetSelector.tsx
├── PowerRollDisplay.tsx
├── TurnActions.tsx
└── CombatLog.tsx

apps/server/src/durable-objects/
└── SessionRoom.ts  # Add ability resolution
```

### Verification

- [ ] Player uses ability → server rolls → both see same dice result
- [ ] Damage calculated correctly per tier
- [ ] Target stamina updates for all clients
- [ ] Action marked as used
- [ ] Combat log shows ability use with details

**E2E Test (Critical):**
```typescript
test('Ability resolution uses server-side dice', async ({ director, player }) => {
  await director.startCombat(['hero1', 'goblin1']);
  
  await player.click('[data-ability="Strike"]');
  await player.click('[data-entity="goblin1"]');
  
  const playerResult = await player.locator('[data-roll-result]').textContent();
  const directorResult = await director.locator('[data-roll-result]').textContent();
  
  expect(playerResult).toBe(directorResult); // Same roll
});
```

**Depends on**: Phase 6

---

## Phase 8: Polish + Production

**Goal**: Production-ready with error handling, performance optimization, quality-of-life features.

### Deliverables

#### 8.1 Reconnection UX
- "Reconnecting..." overlay
- "Connection lost. Please refresh." after 5 failures

#### 8.2 Error Boundaries
- Per-route and per-stage
- Graceful fallback UI

#### 8.3 Loading States
- Skeleton screens
- Canvas progressive loading

#### 8.4 Keyboard Shortcuts
- `Escape`: Deselect, close dialogs
- `Space`: End turn
- `?`: Show help

#### 8.5 Canvas Performance
- Token batching
- Visibility throttling
- Off-screen culling

#### 8.6 Session End Flow
- End session → persist → redirect → mark completed

#### 8.7 Accessibility
- Focus management
- ARIA labels
- Keyboard navigation

### Files

```
apps/vtt/src/components/
├── ErrorBoundary.tsx
├── ReconnectOverlay.tsx
└── LoadingSkeleton.tsx
```

### Verification

- [ ] Disconnect → reconnect → state correct
- [ ] 5 failures → "Refresh" appears
- [ ] Error in stage → doesn't crash app
- [ ] Keyboard shortcuts work
- [ ] 100 tokens → smooth performance

**Depends on**: All prior phases

---

## Dependency Graph

```
Phase 1 (Foundation)
    │
    ├───────────────┬──────────────────┐
    │               │                  │
    ▼               ▼                  │
Phase 2         Phase 3                │
(Campaign)      (Heroes)               │
    │               │                  │
    └───────┬───────┘                  │
            │                          │
            ▼                          │
        Phase 4 ◄──────────────────────┘
   (WebSocket + Lobby)
            │
            ▼
        Phase 5
   (Non-Battle Scenes)
            │
            ▼
        Phase 6
    (Battle Canvas)
            │
            ▼
        Phase 7
   (Abilities + Dice)
            │
            ▼
        Phase 8
        (Polish)
```

**Parallelizable:** Phases 2 and 3

---

## Deferred to Post-MVP

| Feature | Reason |
|---------|--------|
| Drawing tools | Nice-to-have |
| Measurement tool | Players can count squares |
| Chat | Use Discord |
| Dice animations | Show result first |
| Level up flow | Create new hero |
| Audio/music | Significant scope |

---

## Quick Reference

### Key Architecture Decisions
1. **No CRDTs** — WebSocket + LWW
2. **Server rolls dice** — Fairness
3. **Client calculates fog** — Performance
4. **Eager session loading** — No hydration races
5. **Logic in modules** — Not components
6. **Store source data** — Derive on render

### Logic Modules (in @anvil/data)
- `HeroLogic`, `MonsterLogic`, `AbilityLogic`, `RollLogic`, `CombatLogic`
- `MontageLogic`, `NegotiationLogic`, `RespiteLogic`
- `EncounterLogic`, `WizardLogic`, `ConditionLogic`

---

*Plan Version: 2.0 — Revised with Cloudflare-only auth, lobby flow, server-side dice, critical path ordering*
