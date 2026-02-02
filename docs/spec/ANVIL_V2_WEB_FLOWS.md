# Anvil V2 — Web Flow Design

> User journeys for Directors and Players, optimized to minimize failure points and duplication

---

## Design Principles

### 1. Single Source of Truth
Every piece of data has ONE authoritative location:
- **Campaign/Hero data** → D1 database
- **Live session state** → Durable Object memory
- **User identity** → Supabase Auth
- **Assets** → R2 storage

### 2. Fail Fast, Recover Gracefully
- Validate early (before expensive operations)
- Show clear error states with actionable recovery
- Always provide a path forward

### 3. Progressive Disclosure
- Start simple, reveal complexity as needed
- Director sees management UI; Players see only what they need
- Loading states show progress, not spinners

### 4. Offline-Aware, Online-Required for Multiplayer
- Campaign Builder works offline (sync on reconnect)
- Live sessions require connection (show clear status)
- Character Wizard saves locally, syncs to cloud

---

## 1. Application Entry Points

```
┌─────────────────────────────────────────────────────────────────┐
│                         anvil.app                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    /auth     │  │   /join/:id  │  │     /app     │          │
│  │              │  │              │  │              │          │
│  │  Login/      │  │  Campaign    │  │  Main App   │          │
│  │  Register    │  │  Invite      │  │  (authed)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────────────┴────────┬────────┘                   │
│                                   │                             │
│                          ┌────────▼────────┐                   │
│                          │   Auth Check    │                   │
│                          │   Middleware    │                   │
│                          └────────┬────────┘                   │
│                                   │                             │
│         ┌─────────────────────────┼─────────────────────────┐   │
│         │                         │                         │   │
│  ┌──────▼──────┐  ┌───────────────▼───────────────┐ ┌──────▼──────┐
│  │   /app/     │  │         /app/campaigns        │ │   /app/     │
│  │   heroes    │  │                               │ │   session   │
│  │             │  │  ┌─────────┐ ┌─────────┐     │ │   /:id      │
│  │ Hero List   │  │  │ Builder │ │  Live   │     │ │             │
│  │ + Wizard    │  │  │  Mode   │ │  Mode   │     │ │ Active Game │
│  └─────────────┘  │  └─────────┘ └─────────┘     │ └─────────────┘
│                   └───────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### URL Structure

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page | No |
| `/auth` | Login/Register | No |
| `/auth/callback` | OAuth callback | No |
| `/join/:inviteToken` | Accept campaign invite | Yes* |
| `/app` | Dashboard (redirect to campaigns) | Yes |
| `/app/heroes` | Hero list + wizard | Yes |
| `/app/heroes/:id` | Hero detail/edit | Yes |
| `/app/campaigns` | Campaign list | Yes |
| `/app/campaigns/:id` | Campaign Builder | Yes (Director) |
| `/app/session/:id` | Live session | Yes (Member) |
| `/app/session/:id/lobby` | Session lobby | Yes (Member) |

*Redirects to `/auth` first if not authenticated, then back to invite

---

## 2. Authentication Flow

### 2.1 State Machine

```
┌─────────────┐
│   Unknown   │ ─── Check Session ───▶ ┌─────────────┐
└─────────────┘                        │ Checking... │
       ▲                               └──────┬──────┘
       │                                      │
       │                    ┌─────────────────┴─────────────────┐
       │                    │                                   │
       │                    ▼                                   ▼
       │           ┌─────────────┐                     ┌─────────────┐
       │           │Authenticated│                     │   Guest     │
       │           └──────┬──────┘                     └──────┬──────┘
       │                  │                                   │
       │                  │ Logout                            │ Login
       │                  ▼                                   ▼
       └──────────────────┴───────────────────────────────────┘
```

### 2.2 Login Flow

```typescript
// Client: apps/vtt/src/features/auth/useAuth.ts

async function login(email: string, password: string) {
  // 1. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw new AuthError(error.message);
  
  // 2. Fetch user profile (created by trigger on signup)
  const profile = await fetchProfile(data.user.id);
  
  // 3. Store session
  // Supabase handles this automatically via cookies
  
  // 4. Redirect to intended destination or dashboard
  const returnTo = sessionStorage.getItem('returnTo') || '/app';
  navigate(returnTo);
}
```

### 2.3 OAuth Flow (Google/Discord)

```
User clicks "Login with Google"
    │
    ▼
Redirect to Supabase OAuth endpoint
    │
    ▼
User authenticates with Google
    │
    ▼
Redirect to /auth/callback?code=...
    │
    ▼
Exchange code for session (Supabase handles)
    │
    ▼
Check if profile exists
    │
    ├── Yes → Redirect to /app
    │
    └── No → Create profile via trigger, then redirect
```

### 2.4 Session Persistence

```typescript
// Supabase handles session refresh automatically
// We just need to check on app load

async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    setUser(session.user);
    await loadProfile(session.user.id);
  } else {
    setUser(null);
  }
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      setUser(null);
      navigate('/auth');
    }
  });
}
```

---

## 3. Director Flows

### 3.1 Campaign Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Campaign Creation                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Campaign    │     │   Module     │     │   Session    │    │
│  │  List View   │────▶│  Created     │────▶│  Created     │    │
│  │              │     │  (optional)  │     │  (optional)  │    │
│  └──────┬───────┘     └──────────────┘     └──────────────┘    │
│         │                                                        │
│         │ Click "New Campaign"                                  │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Campaign   │                                               │
│  │   Dialog     │                                               │
│  │              │                                               │
│  │  - Name *    │                                               │
│  │  - Desc      │                                               │
│  │  - Cover     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │ Submit                                                │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  1. INSERT INTO campaigns (director_id, name, ...)       │  │
│  │  2. INSERT INTO campaign_members (campaign_id, user_id,  │  │
│  │     role='director')                                     │  │
│  │  3. Navigate to /app/campaigns/:id                       │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Campaign Builder Navigation

```
Campaign Builder (/app/campaigns/:id)
┌────────────────┬─────────────────────────────────────────────────┐
│                │                                                 │
│   Tree View    │              Main Content Area                  │
│                │                                                 │
│ ▼ Campaign     │  ┌─────────────────────────────────────────┐   │
│   ├─ Module 1  │  │                                         │   │
│   │  ├─ Sess 1 │  │   Card Grid of selected level's        │   │
│   │  │  ├─ S1  │  │   children                               │   │
│   │  │  ├─ S2  │  │                                         │   │
│   │  │  └─ S3  │  │   Click card → Select in tree           │   │
│   │  └─ Sess 2 │  │   Double-click → Open editor            │   │
│   │     └─ ...│  │                                         │   │
│   └─ Module 2  │  │                                         │   │
│      └─ ...   │  └─────────────────────────────────────────┘   │
│                │                                                 │
│ ─────────────  │  ┌─────────────────────────────────────────┐   │
│ Players (2)    │  │  Scene Editor (floating window)         │   │
│   • Alice      │  │  - Opens on double-click scene card     │   │
│   • Bob        │  │  - Multiple can be open                 │   │
│ ─────────────  │  │  - [Cancel] [Save] [Save & Preview]     │   │
│ Assets         │  └─────────────────────────────────────────┘   │
│                │                                                 │
└────────────────┴─────────────────────────────────────────────────┘
```

### 3.3 Scene CRUD Operations

All scene operations go through the same pattern:

```typescript
// Single source: D1 database via Supabase client

// CREATE
async function createScene(sessionId: string, type: SceneType) {
  const template = FactoryLogic.createSceneTemplate(type);
  
  const { data, error } = await supabase
    .from('scenes')
    .insert({
      session_id: sessionId,
      title: template.title,
      type: type,
      data: template,
      order_index: await getNextOrderIndex(sessionId),
    })
    .select()
    .single();
  
  if (error) throw new DatabaseError('Failed to create scene', error);
  return data;
}

// READ (with live subscription for multi-device)
function useScenes(sessionId: string) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  useEffect(() => {
    // Initial fetch
    fetchScenes(sessionId).then(setScenes);
    
    // Subscribe to changes (for multi-device editing)
    const subscription = supabase
      .channel(`scenes:${sessionId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scenes', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          // Update local state
          handleSceneChange(payload, setScenes);
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [sessionId]);
  
  return scenes;
}

// UPDATE
async function updateScene(sceneId: string, changes: Partial<SceneData>) {
  const { error } = await supabase
    .from('scenes')
    .update({
      data: changes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sceneId);
  
  if (error) throw new DatabaseError('Failed to save scene', error);
}

// DELETE (soft delete)
async function deleteScene(sceneId: string) {
  const { error } = await supabase
    .from('scenes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sceneId);
  
  if (error) throw new DatabaseError('Failed to delete scene', error);
}
```

### 3.4 "Go Live" Flow (Critical Path)

This is the most important transition. Simplified from V1 learnings.

```
                    Campaign Builder                    Live Session
                          │                                  │
                          │                                  │
    ┌─────────────────────▼───────────────────┐              │
    │         Session in "planned" status      │              │
    │                                          │              │
    │  Director clicks [Go Live] button        │              │
    └─────────────────────┬───────────────────┘              │
                          │                                  │
                          ▼                                  │
    ┌──────────────────────────────────────────┐              │
    │  1. Generate room code (client-side)     │              │
    │     roomCode = generateRoomCode()        │              │
    │     // "ABC123" format                   │              │
    └─────────────────────┬────────────────────┘              │
                          │                                  │
                          ▼                                  │
    ┌──────────────────────────────────────────┐              │
    │  2. Write room code to database FIRST    │              │
    │     UPDATE sessions                      │              │
    │     SET room_code = 'ABC123',            │              │
    │         status = 'active',               │              │
    │         started_at = NOW()               │              │
    │     WHERE id = :sessionId                │              │
    └─────────────────────┬────────────────────┘              │
                          │                                  │
                          ▼                                  │
    ┌──────────────────────────────────────────┐              │
    │  3. Navigate to lobby                    │              │
    │     /app/session/:id/lobby               │              │
    └─────────────────────┬────────────────────┘              │
                          │                                  │
                          ▼                                  │
    ┌──────────────────────────────────────────┐              │
    │  4. Lobby page shows:                    │              │
    │     - Room code for players              │              │
    │     - Connected players list             │              │
    │     - [Start Session] button             │              │
    └─────────────────────┬────────────────────┘              │
                          │                                  │
                          │ Director clicks [Start Session]  │
                          ▼                                  │
    ┌──────────────────────────────────────────┐              │
    │  5. Connect WebSocket to Durable Object  │──────────────▶
    │     wss://api/session/:id?token=...      │              │
    │                                          │              │
    │  6. DO wakes up, loads ALL scenes from   │              │
    │     D1 into memory                       │              │
    │                                          │              │
    │  7. DO sends full state to Director      │              │
    │                                          │              │
    │  8. Navigate to /app/session/:id         │              │
    └──────────────────────────────────────────┘              │
```

### 3.5 Go Live Implementation

```typescript
// apps/vtt/src/features/session/useGoLive.ts

export function useGoLive(sessionId: string) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'starting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const goLive = async () => {
    setStatus('starting');
    setError(null);
    
    try {
      // Step 1: Generate room code
      const roomCode = generateRoomCode(); // e.g., "ABC123"
      
      // Step 2: Write to database FIRST (critical - must happen before WebSocket)
      const { error: dbError } = await supabase
        .from('sessions')
        .update({
          room_code: roomCode,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      
      if (dbError) throw new Error(`Database update failed: ${dbError.message}`);
      
      // Step 3: Navigate to lobby
      navigate(`/app/session/${sessionId}/lobby`);
      
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Failed to start session');
    }
  };
  
  return { goLive, status, error };
}

// Room code generator (single implementation, used everywhere)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### 3.6 In-Session Director Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Director Session View                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Film Strip: [Scene1] [Scene2*] [Scene3] [+Add]         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────┬────────────────────────────────┬───────────┐     │
│  │          │                                │           │     │
│  │  Scene   │         Stage                  │  Party    │     │
│  │  Tools   │    (Battle/Story/etc)          │  Panel    │     │
│  │          │                                │           │     │
│  │ ──────── │                                │ ───────── │     │
│  │ Combat:  │                                │ Heroes:   │     │
│  │ Turn:3   │                                │ • Kira    │     │
│  │ Round:2  │                                │ • Thane   │     │
│  │ Malice:5 │                                │           │     │
│  │          │                                │ Enemies:  │     │
│  │ [End     │                                │ • Goblin  │     │
│  │  Turn]   │                                │ • Orc     │     │
│  │          │                                │           │     │
│  └──────────┴────────────────────────────────┴───────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Status: Connected (4 players) │ Round 2 │ Battle Mode   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Director Actions (all via WebSocket to DO):
─────────────────────────────────────────────
• Switch scene      → { type: 'switch_scene', sceneId }
• Add token         → { type: 'create_entity', entity }
• Move token        → { type: 'move_token', entityId, x, y }
• Start combat      → { type: 'combat_action', action: { type: 'START_COMBAT', ... } }
• Next turn         → { type: 'combat_action', action: { type: 'NEXT_TURN' } }
• Adjust malice     → { type: 'adjust_malice', delta: 2 }
• Reveal fog        → { type: 'reveal_fog', area: [...] }
```

---

## 4. Player Flows

### 4.1 Hero Creation (Character Wizard)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Character Wizard                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Progress: ● ● ● ○ ○ ○ ○ ○ ○ ○ ○  (Step 3 of 11)               │
│                                                                  │
│  ┌───────────────────────────────────┬─────────────────────┐    │
│  │                                   │                     │    │
│  │     Step Content                  │   Live Preview      │    │
│  │     (65% width)                   │   (35% width)       │    │
│  │                                   │                     │    │
│  │  ┌─────────────────────────────┐  │  ┌───────────────┐  │    │
│  │  │  Career Selection           │  │  │ [Portrait]    │  │    │
│  │  │                             │  │  │               │  │    │
│  │  │  ○ Artisan                  │  │  │ Name: ???     │  │    │
│  │  │  ● Criminal                 │  │  │ Mwangi Human  │  │    │
│  │  │  ○ Gladiator                │  │  │ Level 1       │  │    │
│  │  │  ○ Sage                     │  │  │               │  │    │
│  │  │  ○ Soldier                  │  │  │ ────────────  │  │    │
│  │  │                             │  │  │ Stamina: --   │  │    │
│  │  │  Grants:                    │  │  │ Speed: 5      │  │    │
│  │  │  • Hide, Sneak skills       │  │  │               │  │    │
│  │  │  • Thieves' Cant language   │  │  │ Skills:       │  │    │
│  │  │  • Criminal Renown          │  │  │ • Climb 🔒    │  │    │
│  │  │                             │  │  │ • Sneak 🔒    │  │    │
│  │  └─────────────────────────────┘  │  └───────────────┘  │    │
│  │                                   │                     │    │
│  └───────────────────────────────────┴─────────────────────┘    │
│                                                                  │
│  [← Back]                                            [Next →]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Wizard Steps:
─────────────
1. Ancestry      → Size, speed, signature feature
2. Culture       → Language, 3 skills
3. Career        → Skills, languages, renown, inciting incident
4. Class         → Characteristics array, stamina, recoveries
5. Subclass      → Class-specific features
6. Characteristics → Assign values from class array
7. Kit           → Equipment, bonuses, signature ability
8. Skills        → Final selections
9. Abilities     → Class ability choices
10. Personal     → Name, pronouns, backstory, portrait
11. Review       → Confirm and save
```

### 4.2 Wizard Persistence Strategy

```typescript
// Hybrid: IndexedDB for instant saves, D1 for cloud backup

interface WizardState {
  heroId: string;
  currentStep: number;
  data: Partial<HeroData>;
  lastSavedToCloud: number | null;
  isDirty: boolean;
}

// Auto-save to IndexedDB on every change (instant)
useEffect(() => {
  if (wizardState.isDirty) {
    saveToIndexedDB(wizardState);
  }
}, [wizardState]);

// Save to cloud on step completion
async function completeStep(stepNumber: number, stepData: Partial<HeroData>) {
  // 1. Update local state
  setWizardState(s => ({
    ...s,
    currentStep: stepNumber + 1,
    data: { ...s.data, ...stepData },
    isDirty: true,
  }));
  
  // 2. Save to IndexedDB (instant)
  await saveToIndexedDB(wizardState);
  
  // 3. Background save to cloud (non-blocking)
  saveToCloud(wizardState).catch(console.error);
}

// Final save creates the complete hero
async function finalizeHero() {
  // Validate all required fields
  const validated = HeroLogic.validateComplete(wizardState.data);
  if (!validated.success) {
    throw new ValidationError(validated.errors);
  }
  
  // Insert hero to database
  const { data, error } = await supabase
    .from('heroes')
    .insert({
      user_id: user.id,
      ...snakeCase(wizardState.data),
      version: HERO_SCHEMA_VERSION,
    })
    .select()
    .single();
  
  if (error) throw new DatabaseError('Failed to save hero', error);
  
  // Clear wizard state from IndexedDB
  await clearIndexedDB(wizardState.heroId);
  
  return data;
}
```

### 4.3 Join Campaign Flow

```
Player receives invite link: anvil.app/join/abc123token
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Is user authenticated?                                      │
│                                                              │
│  ├── No  → Store returnTo = /join/abc123token                │
│  │         Redirect to /auth                                 │
│  │         After login, redirect back to /join/abc123token   │
│  │                                                           │
│  └── Yes → Continue                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Validate invite token:                                      │
│  SELECT * FROM campaign_invites                              │
│  WHERE token = 'abc123token'                                 │
│    AND expires_at > NOW()                                    │
│    AND (max_uses IS NULL OR used_count < max_uses)           │
│                                                              │
│  ├── Invalid → Show error: "Invite expired or invalid"       │
│  │                                                           │
│  └── Valid   → Show campaign preview page                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Campaign Preview Page                                       │
│  ─────────────────────                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [Cover Image]                                         │  │
│  │                                                        │  │
│  │  Campaign: "Blackshard Dungeon Delve"                  │  │
│  │  Director: Alice                                       │  │
│  │  Players: 3 joined                                     │  │
│  │                                                        │  │
│  │  ────────────────────────────────────────────────────  │  │
│  │                                                        │  │
│  │  Select a hero to join with:                           │  │
│  │                                                        │  │
│  │  ○ Kira the Shadow (Level 3)                           │  │
│  │  ○ Thane the Fury (Level 2)                            │  │
│  │  ○ [Create New Hero]                                   │  │
│  │                                                        │  │
│  │  [Join Campaign]                                       │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                      │
                                      │ Click [Join Campaign]
                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  accept_campaign_invite RPC:                                 │
│                                                              │
│  1. Validate token again (race condition check)              │
│  2. INSERT INTO campaign_members (campaign_id, user_id,      │
│     hero_id, role='player')                                  │
│  3. UPDATE campaign_invites SET used_count = used_count + 1  │
│  4. Return success                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                       Navigate to /app/campaigns/:id
                       (Player view of campaign)
```

### 4.4 Join Session Flow

```
Player navigates to campaign page
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Is there an active session?                                │
│  SELECT * FROM sessions WHERE campaign_id = :id             │
│    AND status = 'active'                                    │
│                                                             │
│  ├── No  → Show "No active session" message                 │
│  │         Player can browse campaign content               │
│  │                                                          │
│  └── Yes → Show [Join Session] button                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ Click [Join Session]
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Session Lobby (/app/session/:id/lobby)                     │
│  ───────────────────────────────────────                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Session: "Into the Blackshard Mines"               │   │
│  │  Director: Alice                                    │   │
│  │                                                     │   │
│  │  Your Hero: [Kira the Shadow ▼]                     │   │
│  │                                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  Players:                                           │   │
│  │  ✓ Alice (Director) - Ready                         │   │
│  │  ○ You (Kira) - [Mark Ready]                        │   │
│  │  ✓ Bob (Thane) - Ready                              │   │
│  │  ○ Carol (Pending...)                               │   │
│  │                                                     │   │
│  │  Waiting for Director to start...                   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ Player clicks [Mark Ready]
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  UPDATE session_participants                                │
│  SET status = 'ready', ready_at = NOW()                     │
│  WHERE session_id = :sessionId AND user_id = :userId        │
│                                                             │
│  Supabase Realtime broadcasts change to all in lobby        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │ Director clicks [Start Session]
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Supabase Realtime: "session_started" event              │
│  2. All players connect WebSocket to Durable Object         │
│  3. Navigate to /app/session/:id                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 In-Session Player Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Player Session View                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Portrait] Kira │ Shadow │ ████████░░ 42/50 │ ⚡ 3       │    │
│  │                 │ Lvl 3  │ Stamina         │ Insight    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────┬────────────────────────────────┬───────────┐     │
│  │          │                                │           │     │
│  │ Abilities│         Stage                  │  Hero     │     │
│  │          │    (sees fog of war)           │  Sheet    │     │
│  │ ──────── │                                │           │     │
│  │ Actions: │    Only sees tokens visible    │ Stats,    │     │
│  │ • Strike │    to their hero               │ Inventory │     │
│  │ • Fade   │                                │ Conditions│     │
│  │ • Shadow │                                │           │     │
│  │   Step   │                                │           │     │
│  │          │                                │           │     │
│  │ Maneuvers│                                │           │     │
│  │ • Aid    │                                │           │     │
│  │ • Hide   │                                │           │     │
│  │          │                                │           │     │
│  │ ──────── │                                │           │     │
│  │ Actions: │                                │           │     │
│  │ ☑ Main   │                                │           │     │
│  │ ☐ Maneuv │                                │           │     │
│  │ ☐ Move   │                                │           │     │
│  │ ☐ Trigger│                                │           │     │
│  └──────────┴────────────────────────────────┴───────────┘     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Your Turn! │ Connected │ Round 2 │ Battle Mode          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Player Actions (via WebSocket to DO):
─────────────────────────────────────
• Move own token    → { type: 'move_token', entityId, x, y }
• Use ability       → { type: 'use_ability', sourceId, targetId, abilityId }
• Mark action used  → { type: 'toggle_action', entityId, actionType }
• Roll dice         → { type: 'roll_dice', formula, purpose }
```

---

## 5. Shared Flows

### 5.1 WebSocket Connection Flow

```typescript
// apps/vtt/src/features/session/useSessionConnection.ts

export function useSessionConnection(sessionId: string) {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    error: null,
  });
  
  const connect = useCallback(async () => {
    setState({ status: 'connecting', error: null });
    
    try {
      // 1. Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      // 2. Connect WebSocket
      const ws = new WebSocket(
        `${WS_URL}/session/${sessionId}?token=${session.access_token}`
      );
      
      ws.onopen = () => {
        setState({ status: 'connected', error: null });
        // Request full state
        ws.send(JSON.stringify({ type: 'request_state' }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as ServerMessage;
        handleServerMessage(message);
      };
      
      ws.onclose = (event) => {
        if (!event.wasClean) {
          setState({ status: 'reconnecting', error: null });
          scheduleReconnect();
        } else {
          setState({ status: 'disconnected', error: null });
        }
      };
      
      ws.onerror = () => {
        // Error details come in onclose
      };
      
      wsRef.current = ws;
      
    } catch (e) {
      setState({ 
        status: 'disconnected', 
        error: e instanceof Error ? e.message : 'Connection failed' 
      });
    }
  }, [sessionId]);
  
  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);
  
  return state;
}
```

### 5.2 Reconnection Strategy

```
Connection lost (unexpected close)
         │
         ▼
┌─────────────────────────────────────────┐
│  Show "Reconnecting..." banner          │
│  Status: reconnecting                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Attempt = 1   │
         └───────┬───────┘
                 │
    ┌────────────▼────────────┐
    │  Wait: 2^attempt * 1000 │  (exponential backoff)
    │  (2s, 4s, 8s, 16s, 32s) │
    └────────────┬────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │  Try to connect        │
    └────────────┬───────────┘
                 │
         ┌──────┴──────┐
         │             │
    Success?      Failure
         │             │
         ▼             ▼
    ┌─────────┐  ┌─────────────────────┐
    │Connected│  │ Attempt < 5?        │
    │Request  │  │                     │
    │full     │  │ Yes → Increment,    │
    │state    │  │       loop back     │
    └─────────┘  │                     │
                 │ No → Show error:    │
                 │ "Connection lost.   │
                 │  Please refresh."   │
                 │ [Refresh] button    │
                 └─────────────────────┘
```

### 5.3 Error Handling Patterns

```typescript
// Centralized error handling

interface AppError {
  code: string;
  message: string;
  recoveryAction?: 'retry' | 'refresh' | 'logout' | 'contact_support';
  details?: Record<string, unknown>;
}

const ERROR_HANDLERS: Record<string, (error: any) => AppError> = {
  // Auth errors
  'PGRST301': () => ({
    code: 'AUTH_EXPIRED',
    message: 'Your session has expired. Please log in again.',
    recoveryAction: 'logout',
  }),
  
  // Permission errors
  'PGRST403': () => ({
    code: 'PERMISSION_DENIED',
    message: 'You don\'t have permission to do that.',
    recoveryAction: 'refresh',
  }),
  
  // Connection errors
  'WEBSOCKET_CLOSED': () => ({
    code: 'CONNECTION_LOST',
    message: 'Connection lost. Reconnecting...',
    recoveryAction: 'retry',
  }),
  
  // Conflict errors
  'CONFLICT': () => ({
    code: 'CONFLICT',
    message: 'Someone else made changes. Refreshing...',
    recoveryAction: 'refresh',
  }),
};

function handleError(error: unknown): AppError {
  // Extract error code
  const code = extractErrorCode(error);
  
  // Get handler or use default
  const handler = ERROR_HANDLERS[code] ?? (() => ({
    code: 'UNKNOWN',
    message: 'Something went wrong. Please try again.',
    recoveryAction: 'retry' as const,
  }));
  
  return handler(error);
}

// Error display component
function ErrorBanner({ error, onRetry, onRefresh, onLogout }: {
  error: AppError;
  onRetry?: () => void;
  onRefresh?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="bg-red-900 text-white p-4 flex items-center justify-between">
      <span>{error.message}</span>
      <div className="flex gap-2">
        {error.recoveryAction === 'retry' && onRetry && (
          <button onClick={onRetry}>Retry</button>
        )}
        {error.recoveryAction === 'refresh' && (
          <button onClick={() => window.location.reload()}>Refresh</button>
        )}
        {error.recoveryAction === 'logout' && onLogout && (
          <button onClick={onLogout}>Log Out</button>
        )}
      </div>
    </div>
  );
}
```

---

## 6. API Routes Summary

### 6.1 REST API (Cloudflare Workers)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/api/health` | Health check | No |
| `POST` | `/api/auth/session` | Validate session token | Yes |
| `GET` | `/api/campaigns` | List user's campaigns | Yes |
| `POST` | `/api/campaigns` | Create campaign | Yes |
| `GET` | `/api/campaigns/:id` | Get campaign details | Member |
| `PUT` | `/api/campaigns/:id` | Update campaign | Director |
| `DELETE` | `/api/campaigns/:id` | Delete campaign | Director |
| `POST` | `/api/campaigns/:id/invite` | Generate invite | Director |
| `POST` | `/api/invites/:token/accept` | Accept invite | Yes |
| `GET` | `/api/heroes` | List user's heroes | Yes |
| `POST` | `/api/heroes` | Create hero | Yes |
| `GET` | `/api/heroes/:id` | Get hero details | Owner |
| `PUT` | `/api/heroes/:id` | Update hero | Owner |
| `DELETE` | `/api/heroes/:id` | Delete hero | Owner |
| `POST` | `/api/assets/upload` | Get presigned upload URL | Yes |

### 6.2 WebSocket (Durable Objects)

| Route | Purpose |
|-------|---------|
| `wss://api/session/:id` | Live session connection |

### 6.3 WebSocket Messages

See [Revised Architecture Doc] for full message protocol.

---

## 7. State Management Summary

### 7.1 What Lives Where

| Data | Storage | Why |
|------|---------|-----|
| User session | Supabase Auth | Industry standard, handles refresh |
| User profile | D1 (Supabase) | Persistent, synced |
| Heroes | D1 (Supabase) | Persistent, player-owned |
| Campaigns | D1 (Supabase) | Persistent, director-owned |
| Sessions (metadata) | D1 (Supabase) | Persistent, status tracking |
| Scenes (templates) | D1 (Supabase) | Persistent, prepared content |
| Live session state | Durable Object | Real-time, authoritative |
| Wizard progress | IndexedDB + D1 | Local first, cloud backup |
| UI state | Zustand | Client-only, ephemeral |
| Connection state | React state | Component-scoped |

### 7.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Zustand    │  │   React     │  │  IndexedDB  │             │
│  │  (UI state) │  │   Query     │  │  (wizard)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │  Services │                                │
│                    └─────┬─────┘                                │
│                          │                                      │
│         ┌────────────────┼────────────────┐                    │
│         │                │                │                    │
│    ┌────▼────┐     ┌─────▼─────┐    ┌────▼────┐               │
│    │Supabase │     │ REST API  │    │WebSocket│               │
│    │ Client  │     │  fetch()  │    │         │               │
│    └────┬────┘     └─────┬─────┘    └────┬────┘               │
│         │                │               │                     │
└─────────┼────────────────┼───────────────┼─────────────────────┘
          │                │               │
          ▼                ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│    Supabase     │ │  Cloudflare │ │   Durable   │
│   (D1 + Auth)   │ │   Workers   │ │   Objects   │
└─────────────────┘ └─────────────┘ └─────────────┘
```

---

## 8. Critical Path Tests (E2E)

Based on V1 lessons, these E2E tests must pass before release:

### 8.1 Director Critical Path

```typescript
test('Director can create campaign, add scene, go live, and see scene', async () => {
  // 1. Login as director
  await loginAs('director@test.com');
  
  // 2. Create campaign
  await page.click('[data-testid="new-campaign"]');
  await page.fill('[name="name"]', 'Test Campaign');
  await page.click('[data-testid="create-campaign"]');
  
  // 3. Create session
  await page.click('[data-testid="new-session"]');
  await page.fill('[name="name"]', 'Test Session');
  await page.click('[data-testid="create-session"]');
  
  // 4. Add battle scene
  await page.click('[data-testid="new-scene"]');
  await page.click('[data-testid="scene-type-battle"]');
  await page.fill('[name="title"]', 'Test Battle');
  await page.click('[data-testid="save-scene"]');
  
  // 5. Go live
  await page.click('[data-testid="go-live"]');
  await page.waitForURL(/\/lobby$/);
  
  // 6. Start session
  await page.click('[data-testid="start-session"]');
  await page.waitForURL(/\/session\//);
  
  // 7. Verify scene appears
  await expect(page.locator('[data-testid="scene-title"]')).toHaveText('Test Battle');
  await expect(page.locator('[data-testid="scene-type"]')).toHaveText('battle');
});
```

### 8.2 Player Critical Path

```typescript
test('Player can join campaign, join session, and see their hero', async () => {
  // Setup: Director creates campaign and session
  const { campaignId, inviteToken } = await setupCampaignWithSession();
  
  // 1. Login as player
  await loginAs('player@test.com');
  
  // 2. Create hero (or use existing)
  const heroId = await createTestHero();
  
  // 3. Accept invite
  await page.goto(`/join/${inviteToken}`);
  await page.click(`[data-testid="hero-${heroId}"]`);
  await page.click('[data-testid="join-campaign"]');
  
  // 4. Navigate to active session
  await page.goto(`/app/campaigns/${campaignId}`);
  await page.click('[data-testid="join-session"]');
  
  // 5. Mark ready in lobby
  await page.click('[data-testid="mark-ready"]');
  
  // 6. Wait for Director to start (simulate)
  await startSessionAsDirector(campaignId);
  
  // 7. Verify in session
  await page.waitForURL(/\/session\//);
  await expect(page.locator('[data-testid="hero-name"]')).toHaveText('Test Hero');
});
```

### 8.3 Reconnection Test

```typescript
test('Player reconnects and sees current state after disconnect', async () => {
  // Setup: Director and player in active session
  const { sessionId } = await setupActiveSession();
  
  // 1. Player joins
  await loginAs('player@test.com');
  await page.goto(`/app/session/${sessionId}`);
  await page.waitForSelector('[data-testid="connected-status"]');
  
  // 2. Simulate disconnect
  await page.evaluate(() => {
    // @ts-ignore
    window.__testDisconnect();
  });
  
  // 3. Director makes changes while disconnected
  await directorMovesToken(sessionId, 'token-1', { x: 100, y: 200 });
  
  // 4. Player reconnects
  await page.waitForSelector('[data-testid="connected-status"]');
  
  // 5. Verify player sees updated state
  const tokenPosition = await page.evaluate(() => {
    const token = document.querySelector('[data-testid="token-1"]');
    return { x: token?.dataset.x, y: token?.dataset.y };
  });
  expect(tokenPosition).toEqual({ x: '100', y: '200' });
});
```

---

*Document Version: 1.0*
*Based on: Anvil V2 Revised Architecture, V1 Lessons Learned, Production VTT Research*
