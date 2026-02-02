# Anvil V2 — Revised Real-Time Architecture

> Updated based on production VTT research (Foundry, Owlbear Rodeo, PlanarAlly, Roll20)

---

## Key Changes from Original Spec

This document revises the Anvil V2 architecture based on how production VTTs actually solve these problems. The core principle: **simpler solutions that work beat theoretically optimal ones that add complexity**.

| Original Approach | Revised Approach | Rationale |
|------------------|------------------|-----------|
| CRDTs (Yjs) for sync | Last-write-wins WebSocket | No VTT uses CRDTs; LWW is sufficient |
| Server filters visible entities | Client-side fog rendering | Offloads computation, eliminates bottleneck |
| Complex reconnection with input reconciliation | Socket reconnection + page refresh fallback | How Foundry handles it (and it works) |
| Automated combat interrupt queue | Manual turn tracker + action checkboxes | GMs handle edge cases; that's the TTRPG way |
| Scene preloading | Loading indicators + progressive rendering | No VTT does sophisticated preloading |
| Lazy scene hydration | Load all scene data on session start | Eliminates hydration race conditions |

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
Campaign Builder (D1)  →  Go Live  →  Durable Object  →  All Clients
        ↑                    |              ↓
   Director prep       Load ALL scenes   Broadcast to all
                       into memory       (no per-client filtering)
```

### 1.2 Tech Stack (Unchanged)

| Component | Technology | Role |
|-----------|------------|------|
| **API / Router** | Cloudflare Workers | HTTP routes, WebSocket upgrade |
| **Game Server** | Durable Objects | Session state, broadcast, validation |
| **Database** | D1 (SQLite) | Campaign/hero persistence |
| **Assets** | R2 | Map images, token art |
| **Client Rendering** | PixiJS v8 | Canvas, fog of war |
| **Client State** | Zustand | UI state derived from server |
| **Client Modes** | XState 5.x | Scene type state machine |

---

## 2. Session Lifecycle

### 2.1 "Go Live" Sequence

**Simplified**: When a session starts, the Durable Object loads ALL scene data into memory. No lazy loading, no race conditions.

```
Director clicks "Go Live"
    ↓
Worker creates/wakes Durable Object (DO)
    ↓
First connection triggers DO.fetch()
    ↓
DO loads ALL scenes from D1 into memory
    ↓
DO broadcasts "ready" with full state
    ↓
Clients render; session is live
```

**Implementation:**

```typescript
// apps/server/src/durable-objects/SessionRoom.ts

export class SessionRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  
  // In-memory state (loaded from D1)
  private sessionData: SessionData | null = null;
  private connections = new Map<string, WebSocket>();
  private isHydrated = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const sessionId = url.searchParams.get("sessionId");
      const token = url.searchParams.get("token");
      
      // Hydrate on first connection (not before)
      if (!this.isHydrated) {
        await this.hydrateFromD1(sessionId!);
        this.isHydrated = true;
      }
      
      return this.handleWebSocket(request, token!);
    }
    
    return new Response("Expected WebSocket", { status: 400 });
  }

  private async hydrateFromD1(sessionId: string) {
    // Load ALL session data at once
    const result = await this.env.DB.prepare(`
      SELECT 
        s.*,
        json_group_array(
          json_object(
            'id', sc.id,
            'type', sc.type,
            'title', sc.title,
            'data', sc.data,
            'order_index', sc.order_index
          )
        ) as scenes
      FROM sessions s
      LEFT JOIN scenes sc ON sc.session_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `).bind(sessionId).first<SessionRow>();
    
    if (!result) throw new Error("Session not found");
    
    // Parse and store in memory
    this.sessionData = {
      id: result.id,
      name: result.name,
      status: result.status,
      scenes: JSON.parse(result.scenes).map(hydrateScene),
      activeSceneId: JSON.parse(result.scenes)[0]?.id || null,
      entities: new Map(),
      combat: null,
    };
    
    console.log(`Hydrated session ${sessionId} with ${this.sessionData.scenes.length} scenes`);
  }
}
```

### 2.2 Persistence Strategy

Following PlanarAlly's pattern: **write-through for critical state, periodic snapshots for safety.**

| Data Type | Persistence | Timing |
|-----------|-------------|--------|
| Combat state changes | Immediate | On every combat action |
| Entity creation/deletion | Immediate | On action |
| Token positions | Batched | Every 5 seconds |
| Drawing strokes | Batched | Every 10 seconds |
| Session metadata | Periodic | Every 5 minutes + on session end |

```typescript
// Persistence manager within SessionRoom

class PersistenceManager {
  private pendingPositions = new Map<string, Position>();
  private pendingDrawings: Drawing[] = [];
  private lastSnapshotAt = Date.now();
  
  // Called on every game tick
  async tick() {
    const now = Date.now();
    
    // Batch position updates every 5 seconds
    if (this.pendingPositions.size > 0 && now - this.lastPositionFlush > 5000) {
      await this.flushPositions();
    }
    
    // Full snapshot every 5 minutes
    if (now - this.lastSnapshotAt > 5 * 60 * 1000) {
      await this.saveSnapshot();
      this.lastSnapshotAt = now;
    }
  }
  
  // Critical state: persist immediately
  async persistCombatAction(action: CombatAction) {
    await this.env.DB.prepare(`
      INSERT INTO session_events (session_id, event_type, event_data, timestamp)
      VALUES (?, 'combat_action', ?, ?)
    `).bind(this.sessionId, JSON.stringify(action), Date.now()).run();
  }
  
  // Session end: save everything
  async onSessionEnd() {
    await this.flushPositions();
    await this.flushDrawings();
    await this.saveSnapshot();
    
    await this.env.DB.prepare(`
      UPDATE sessions SET status = 'completed', ended_at = ? WHERE id = ?
    `).bind(Date.now(), this.sessionId).run();
  }
}
```

---

## 3. Vision & Fog of War

### 3.1 Key Insight: Client-Side Calculation

**Every production VTT calculates fog of war on the client, not the server.**

The server broadcasts ALL entity positions to ALL clients. Each client:
1. Determines which entities their tokens can see
2. Renders fog overlay locally
3. Hides tokens in fog

**Why this works:**
- Offloads expensive visibility computation from server
- Eliminates server as bottleneck
- Simpler protocol (broadcast everything)

**Trade-off accepted:** A player could hack their client to see through fog. Production VTTs accept this as a social problem, not technical.

### 3.2 Client-Side Visibility Calculator

```typescript
// packages/canvas/src/vision/VisibilityCalculator.ts

import { Quadtree, Rectangle, Point } from './spatial';

export class VisibilityCalculator {
  private wallTree: Quadtree<WallSegment>;
  private visibilityCache = new Map<string, VisibilityPolygon>();
  private dirtyTokens = new Set<string>();
  
  constructor(walls: WallSegment[]) {
    // Build quadtree for fast wall lookups
    this.wallTree = new Quadtree<WallSegment>(
      new Rectangle(0, 0, 10000, 10000),
      10 // max items per node
    );
    
    for (const wall of walls) {
      this.wallTree.insert(wall, wall.bounds);
    }
  }
  
  /**
   * Mark a token as needing visibility recalculation
   */
  markDirty(tokenId: string) {
    this.dirtyTokens.add(tokenId);
    this.visibilityCache.delete(tokenId);
  }
  
  /**
   * Calculate visibility polygon for a token using rotational sweep
   * Based on Red Blob Games algorithm
   */
  calculateVisibility(token: TokenState): VisibilityPolygon {
    // Check cache first
    const cached = this.visibilityCache.get(token.id);
    if (cached && !this.dirtyTokens.has(token.id)) {
      return cached;
    }
    
    const center = { x: token.x, y: token.y };
    const visionRadius = token.visionRange || 1000;
    
    // Get walls near this token
    const nearbyWalls = this.wallTree.query(
      new Rectangle(
        center.x - visionRadius,
        center.y - visionRadius,
        visionRadius * 2,
        visionRadius * 2
      )
    );
    
    // Collect all wall endpoints
    const endpoints: RayEndpoint[] = [];
    for (const wall of nearbyWalls) {
      endpoints.push(
        { x: wall.x1, y: wall.y1, wall },
        { x: wall.x2, y: wall.y2, wall }
      );
    }
    
    // Sort by angle from center
    endpoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });
    
    // Rotational sweep to build visibility polygon
    const polygon = this.sweepVisibility(center, endpoints, visionRadius);
    
    // Cache result
    this.visibilityCache.set(token.id, polygon);
    this.dirtyTokens.delete(token.id);
    
    return polygon;
  }
  
  /**
   * Check if a point is visible from a token
   */
  isVisible(fromToken: TokenState, point: Point): boolean {
    const polygon = this.calculateVisibility(fromToken);
    return this.pointInPolygon(point, polygon);
  }
  
  private sweepVisibility(
    center: Point,
    endpoints: RayEndpoint[],
    maxRadius: number
  ): VisibilityPolygon {
    // Implementation of rotational sweep algorithm
    // See: https://www.redblobgames.com/articles/visibility/
    const polygon: Point[] = [];
    
    // ... sweep logic ...
    
    return { center, points: polygon, radius: maxRadius };
  }
  
  private pointInPolygon(point: Point, polygon: VisibilityPolygon): boolean {
    // Ray casting algorithm
    let inside = false;
    const { points } = polygon;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
}
```

### 3.3 Fog Rendering (PixiJS)

```typescript
// packages/canvas/src/fog/FogRenderer.ts

import { Container, Graphics, BLEND_MODES, RenderTexture } from 'pixi.js';

export class FogRenderer {
  private fogContainer: Container;
  private fogMask: Graphics;
  private exploredTexture: RenderTexture;
  private visibilityCalc: VisibilityCalculator;
  
  constructor(app: Application, walls: WallSegment[]) {
    this.visibilityCalc = new VisibilityCalculator(walls);
    
    // Fog layer covers entire canvas
    this.fogContainer = new Container();
    this.fogContainer.zIndex = 1000; // Above tokens
    
    // Explored areas texture (persists visibility history)
    this.exploredTexture = RenderTexture.create({
      width: app.screen.width,
      height: app.screen.height,
    });
  }
  
  /**
   * Update fog based on controlled tokens' visibility
   */
  render(controlledTokens: TokenState[], allTokens: TokenState[]) {
    const visible = new Graphics();
    
    // Calculate combined visibility for all controlled tokens
    for (const token of controlledTokens) {
      const polygon = this.visibilityCalc.calculateVisibility(token);
      visible.poly(polygon.points);
    }
    
    // Use visibility polygon to mask the fog
    visible.fill({ color: 0xffffff });
    
    // Apply to fog overlay using DST_OUT to "punch holes"
    this.fogMask.clear();
    this.fogMask.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.fogMask.fill({ color: 0x000000, alpha: 0.7 });
    this.fogMask.addChild(visible);
    visible.blendMode = BLEND_MODES.DST_OUT;
    
    // Filter which tokens are visible
    for (const token of allTokens) {
      const isVisible = controlledTokens.some(controlled =>
        this.visibilityCalc.isVisible(controlled, { x: token.x, y: token.y })
      );
      
      // Token sprite visibility
      const sprite = this.tokenSprites.get(token.id);
      if (sprite) {
        sprite.visible = isVisible;
      }
    }
  }
}
```

---

## 4. Combat System

### 4.1 Key Insight: Manual Tracking

Production VTTs (even Foundry) use **manual combat tracking**. The core tracker just answers: "whose turn is it?"

Action economy (action, bonus action, reaction) is tracked via checkboxes that players click. There's no automated interrupt detection.

**Why this works:**
- TTRPGs have GMs who adjudicate edge cases
- Draw Steel's "triggered actions" are GM-decided, not system-detected
- Simpler to implement, less to go wrong

### 4.2 Combat State

```typescript
// packages/types/src/combat.ts

interface CombatState {
  round: number;
  phase: 'setup' | 'active' | 'resolved';
  initiativeOrder: InitiativeEntry[];
  currentTurnIndex: number;
  malice: number;
  malicePerRound: number;
  
  // Action economy per entity (manual tracking)
  actionEconomy: Record<string, {
    mainActionUsed: boolean;
    maneuverUsed: boolean;
    moveActionUsed: boolean;
    triggeredActionUsed: boolean; // Per round, not per turn
  }>;
}

interface InitiativeEntry {
  entityId: string;
  name: string;
  initiative: number;
  side: 'heroes' | 'enemies';
  isActive: boolean;
  isDefeated: boolean;
}
```

### 4.3 Combat Reducer (Simplified)

```typescript
// apps/server/src/combat/combatReducer.ts

type CombatAction =
  | { type: 'START_COMBAT'; initiativeOrder: InitiativeEntry[] }
  | { type: 'NEXT_TURN' }
  | { type: 'END_ROUND' }
  | { type: 'END_COMBAT' }
  | { type: 'MARK_ACTION_USED'; entityId: string; actionType: ActionType }
  | { type: 'RESET_ACTIONS'; entityId: string }
  | { type: 'ADJUST_MALICE'; delta: number }
  | { type: 'MARK_DEFEATED'; entityId: string }
  | { type: 'REVIVE'; entityId: string };

type ActionType = 'mainAction' | 'maneuver' | 'moveAction' | 'triggeredAction';

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'START_COMBAT':
      return {
        ...state,
        phase: 'active',
        round: 1,
        currentTurnIndex: 0,
        initiativeOrder: action.initiativeOrder,
        actionEconomy: initializeActionEconomy(action.initiativeOrder),
      };
      
    case 'NEXT_TURN': {
      const nextIndex = state.currentTurnIndex + 1;
      
      // End of round?
      if (nextIndex >= state.initiativeOrder.length) {
        return combatReducer(state, { type: 'END_ROUND' });
      }
      
      // Reset turn-based actions for the entity whose turn is starting
      const nextEntityId = state.initiativeOrder[nextIndex].entityId;
      return {
        ...state,
        currentTurnIndex: nextIndex,
        actionEconomy: {
          ...state.actionEconomy,
          [nextEntityId]: {
            ...state.actionEconomy[nextEntityId],
            mainActionUsed: false,
            maneuverUsed: false,
            moveActionUsed: false,
            // Note: triggeredAction is NOT reset (per round, not per turn)
          },
        },
      };
    }
    
    case 'END_ROUND': {
      // Reset triggered actions for all entities (they refresh each round)
      const resetTriggered = Object.fromEntries(
        Object.entries(state.actionEconomy).map(([id, economy]) => [
          id,
          { ...economy, triggeredActionUsed: false }
        ])
      );
      
      return {
        ...state,
        round: state.round + 1,
        currentTurnIndex: 0,
        malice: state.malice + state.malicePerRound,
        actionEconomy: resetTriggered,
      };
    }
    
    case 'MARK_ACTION_USED':
      return {
        ...state,
        actionEconomy: {
          ...state.actionEconomy,
          [action.entityId]: {
            ...state.actionEconomy[action.entityId],
            [`${action.actionType}Used`]: true,
          },
        },
      };
      
    case 'ADJUST_MALICE':
      return {
        ...state,
        malice: Math.max(0, state.malice + action.delta),
      };
      
    case 'MARK_DEFEATED':
      return {
        ...state,
        initiativeOrder: state.initiativeOrder.map(entry =>
          entry.entityId === action.entityId
            ? { ...entry, isDefeated: true }
            : entry
        ),
      };
      
    case 'END_COMBAT':
      return {
        ...state,
        phase: 'resolved',
      };
      
    default:
      return state;
  }
}

function initializeActionEconomy(order: InitiativeEntry[]): Record<string, ActionEconomy> {
  return Object.fromEntries(
    order.map(entry => [entry.entityId, {
      mainActionUsed: false,
      maneuverUsed: false,
      moveActionUsed: false,
      triggeredActionUsed: false,
    }])
  );
}
```

### 4.4 Combat UI (Action Economy Checkboxes)

```tsx
// apps/vtt/src/components/combat/ActionEconomyTracker.tsx

interface ActionEconomyTrackerProps {
  entityId: string;
  economy: ActionEconomy;
  isMyTurn: boolean;
  onToggle: (actionType: ActionType) => void;
}

export function ActionEconomyTracker({
  entityId,
  economy,
  isMyTurn,
  onToggle,
}: ActionEconomyTrackerProps) {
  return (
    <div className="flex gap-2 items-center">
      <ActionCheckbox
        label="Action"
        used={economy.mainActionUsed}
        disabled={!isMyTurn}
        onClick={() => onToggle('mainAction')}
      />
      <ActionCheckbox
        label="Maneuver"
        used={economy.maneuverUsed}
        disabled={!isMyTurn}
        onClick={() => onToggle('maneuver')}
      />
      <ActionCheckbox
        label="Move"
        used={economy.moveActionUsed}
        disabled={!isMyTurn}
        onClick={() => onToggle('moveAction')}
      />
      <ActionCheckbox
        label="Triggered"
        used={economy.triggeredActionUsed}
        disabled={false} // Can use triggered action on anyone's turn
        onClick={() => onToggle('triggeredAction')}
        className="border-yellow-500" // Visual distinction
      />
    </div>
  );
}

function ActionCheckbox({ label, used, disabled, onClick, className }: {
  label: string;
  used: boolean;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-2 py-1 rounded border text-sm",
        used && "bg-gray-600 line-through opacity-60",
        !used && "bg-gray-800 hover:bg-gray-700",
        disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {label}
    </button>
  );
}
```

---

## 5. Reconnection Handling

### 5.1 Key Insight: Keep It Simple

Foundry VTT has an **unfixed issue** where clients desync if they miss WebSocket messages. Their solution: tell users to refresh.

**Our approach:**
- Use native WebSocket reconnection
- On reconnect, client requests full state
- If that fails, show "Connection lost. Refresh to reconnect."

### 5.2 Connection Manager

```typescript
// apps/vtt/src/hooks/useSessionConnection.ts

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  lastError: string | null;
  reconnectAttempts: number;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;

export function useSessionConnection(sessionId: string, token: string) {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    lastError: null,
    reconnectAttempts: 0,
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const connect = useCallback(() => {
    setState(s => ({ ...s, status: 'connecting' }));
    
    const ws = new WebSocket(
      `wss://api.anvil.app/session/${sessionId}?token=${token}`
    );
    
    ws.onopen = () => {
      setState({ status: 'connected', lastError: null, reconnectAttempts: 0 });
      // Request full state on connect/reconnect
      ws.send(JSON.stringify({ type: 'request_state' }));
    };
    
    ws.onclose = (event) => {
      if (event.wasClean) {
        setState(s => ({ ...s, status: 'disconnected' }));
        return;
      }
      
      // Unexpected disconnect - try to reconnect
      setState(s => ({
        ...s,
        status: 'reconnecting',
        reconnectAttempts: s.reconnectAttempts + 1,
      }));
      
      if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = window.setTimeout(
          connect,
          RECONNECT_DELAY_MS * (state.reconnectAttempts + 1) // Exponential backoff
        );
      } else {
        setState(s => ({
          ...s,
          status: 'disconnected',
          lastError: 'Connection lost. Please refresh the page.',
        }));
      }
    };
    
    ws.onerror = () => {
      // Error will trigger onclose
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage;
      handleMessage(message);
    };
    
    wsRef.current = ws;
  }, [sessionId, token, state.reconnectAttempts]);
  
  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);
  
  return {
    status: state.status,
    error: state.lastError,
    send: (msg: ClientMessage) => wsRef.current?.send(JSON.stringify(msg)),
  };
}
```

### 5.3 Reconnection UI

```tsx
// apps/vtt/src/components/ConnectionStatus.tsx

export function ConnectionStatus({ status, error }: {
  status: ConnectionState['status'];
  error: string | null;
}) {
  if (status === 'connected') return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-black p-2 text-center z-50">
      {status === 'connecting' && "Connecting..."}
      {status === 'reconnecting' && "Connection lost. Reconnecting..."}
      {status === 'disconnected' && error && (
        <div className="flex items-center justify-center gap-4">
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Scene Switching

### 6.1 Key Insight: Loading Indicators Over Preloading

No VTT preloads adjacent scenes. They show loading progress and let assets stream in.

**Our approach:**
1. Director clicks scene in Film Strip
2. Show loading overlay
3. Load map background first (largest asset)
4. Render tokens as they load
5. Hide overlay when complete

### 6.2 Scene Loader

```typescript
// apps/vtt/src/hooks/useSceneLoader.ts

interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  currentStep: string;
}

export function useSceneLoader() {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    currentStep: '',
  });
  
  const loadScene = useCallback(async (scene: Scene) => {
    setLoading({ isLoading: true, progress: 0, currentStep: 'Loading map...' });
    
    // 1. Load map background (if any)
    if (scene.state.type === 'battle' && scene.state.grid.backgroundUrl) {
      await preloadImage(scene.state.grid.backgroundUrl);
      setLoading(s => ({ ...s, progress: 40, currentStep: 'Loading tokens...' }));
    }
    
    // 2. Load token images
    const tokenUrls = scene.entityIds
      .map(id => entities.get(id)?.tokenUrl)
      .filter(Boolean) as string[];
    
    let loaded = 0;
    await Promise.all(
      tokenUrls.map(url =>
        preloadImage(url).then(() => {
          loaded++;
          setLoading(s => ({
            ...s,
            progress: 40 + (loaded / tokenUrls.length) * 50,
          }));
        })
      )
    );
    
    setLoading({ isLoading: false, progress: 100, currentStep: '' });
  }, []);
  
  return { loading, loadScene };
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}
```

### 6.3 Loading Overlay

```tsx
// apps/vtt/src/components/SceneLoadingOverlay.tsx

export function SceneLoadingOverlay({ state }: { state: LoadingState }) {
  if (!state.isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
      <div className="text-center">
        <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <p className="mt-4 text-gray-300">{state.currentStep}</p>
      </div>
    </div>
  );
}
```

---

## 7. WebSocket Message Protocol

### 7.1 Client → Server Messages

```typescript
type ClientMessage =
  // Session
  | { type: 'request_state' }
  | { type: 'ping' }
  
  // Movement (no prediction - simplified)
  | { type: 'move_token'; entityId: string; x: number; y: number }
  
  // Combat
  | { type: 'combat_action'; action: CombatAction }
  | { type: 'toggle_action'; entityId: string; actionType: ActionType }
  
  // Drawing
  | { type: 'drawing_stroke'; stroke: DrawingStroke }
  
  // Director only
  | { type: 'switch_scene'; sceneId: string }
  | { type: 'create_entity'; entity: Entity }
  | { type: 'update_entity'; entityId: string; changes: Partial<Entity> }
  | { type: 'delete_entity'; entityId: string }
  | { type: 'adjust_malice'; delta: number };
```

### 7.2 Server → Client Messages

```typescript
type ServerMessage =
  // Full state (on connect, reconnect, scene switch)
  | { type: 'state'; session: SessionState }
  
  // Incremental updates
  | { type: 'entity_moved'; entityId: string; x: number; y: number }
  | { type: 'entity_updated'; entity: Entity }
  | { type: 'entity_created'; entity: Entity }
  | { type: 'entity_deleted'; entityId: string }
  | { type: 'combat_updated'; combat: CombatState }
  | { type: 'drawing_added'; stroke: DrawingStroke }
  | { type: 'scene_changed'; sceneId: string }
  | { type: 'malice_changed'; malice: number }
  
  // Connection
  | { type: 'pong' }
  | { type: 'error'; code: string; message: string };
```

### 7.3 Server Broadcast (No Filtering)

**Key decision:** Server broadcasts ALL state to ALL clients. Clients filter locally.

```typescript
// apps/server/src/durable-objects/SessionRoom.ts

class SessionRoom {
  private broadcast(message: ServerMessage) {
    const data = JSON.stringify(message);
    
    // Send to ALL connections - no filtering
    for (const [userId, ws] of this.connections) {
      try {
        ws.send(data);
      } catch (e) {
        // Connection dead, clean up
        this.connections.delete(userId);
      }
    }
  }
  
  private handleMoveToken(userId: string, entityId: string, x: number, y: number) {
    // Validate permission
    const entity = this.sessionData!.entities.get(entityId);
    if (!entity) return;
    
    const canMove = this.isDirector(userId) || entity.ownerId === userId;
    if (!canMove) {
      this.sendError(userId, 'PERMISSION_DENIED', 'Cannot move this token');
      return;
    }
    
    // Update state
    entity.x = x;
    entity.y = y;
    
    // Broadcast to ALL clients (they filter locally)
    this.broadcast({ type: 'entity_moved', entityId, x, y });
    
    // Queue for batched persistence
    this.persistence.queuePositionUpdate(entityId, { x, y });
  }
}
```

---

## 8. Summary: What Changed

### Removed Complexity

| Feature | Original | Now |
|---------|----------|-----|
| **CRDTs (Yjs)** | Complex offline-first sync | Simple WebSocket + LWW |
| **Server visibility filtering** | O(players × entities × walls) per tick | Client-side calculation |
| **Input reconciliation** | Pending input queue, replay on reconnect | Request full state on reconnect |
| **Combat interrupt queue** | Priority queue for triggered actions | Manual checkboxes |
| **Scene preloading** | Preload adjacent scenes | Loading indicator |
| **Hydration race conditions** | Complex coordination | Load everything upfront |

### Preserved Complexity (Worth It)

| Feature | Why Keep |
|---------|----------|
| **Durable Objects** | Single authoritative server per session, automatic persistence |
| **Client-side prediction** | Responsive token dragging (optional, can defer) |
| **Entity interpolation** | Smooth movement for other players' tokens |
| **Visibility polygon algorithm** | Required for fog of war |
| **Server-side dice rolls** | Trust/fairness in multiplayer |

### Development Priority

1. **SessionRoom DO** - WebSocket handling, state broadcast
2. **Simple combat tracker** - Turn order, action checkboxes
3. **Client visibility** - Fog rendering, token hiding
4. **Scene switching** - Loading indicator, state swap
5. **Persistence** - Batched saves, critical write-through
6. **Polish** - Reconnection UX, error handling

---

## 9. Migration from V1 Concepts

If building on V1 code, here's what changes:

| V1 Component | V2 Equivalent |
|--------------|---------------|
| `SessionDocument` (Yjs) | `SessionRoom` (Durable Object) |
| `SyncProvider` (y-websocket) | `useSessionConnection` (native WebSocket) |
| Yjs `Y.Map`, `Y.Array` | Plain TypeScript `Map`, `Array` in DO memory |
| `bindState` hydration | `hydrateFromD1()` on first connection |
| `IndexedDB` persistence | D1 batched saves |
| Client-side combat state machine | Server-side `combatReducer` |
| Server-filtered broadcasts | Client-side visibility filtering |

---

*Document Version: 2.0*
*Based on: Production VTT research (Foundry, Owlbear Rodeo, PlanarAlly, Roll20)*
*Key insight: Simpler solutions that work beat theoretically optimal ones that add complexity.*
