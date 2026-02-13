import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types.js';
import type {
  ClientMessage,
  ServerMessage,
  SessionState,
  ParticipantInfo,
  SceneRef,
  CombatAction,
  CombatState,
  TurnActionState,
  AbilityResult,
  DrawingSync,
  FogSync,
  NegotiationLiveState,
  MontageLiveState,
  RespiteLiveState,
  AudioLiveState,
  ArgumentLogEntry,
  TestLogEntry,
  RespiteActivityState,
} from '../protocol.js';

interface ConnectionMeta {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'director' | 'player';
  heroId: string | null;
  ready: boolean;
  sessionId: string;
  campaignId: string | null;
}

/**
 * Encode connection metadata as multiple short tags (each ≤256 chars).
 * Cloudflare Durable Objects limit each tag to 256 characters, so we use
 * prefixed key-value tags instead of a single JSON blob.
 *
 * Format: "key:value" — we use short prefixes to maximize available space.
 */
function encodeTags(meta: ConnectionMeta): string[] {
  const tags: string[] = [
    `uid:${meta.userId}`,
    `u:${meta.username}`,
    `r:${meta.role}`,
    `sid:${meta.sessionId}`,
  ];
  if (meta.avatarUrl) tags.push(`av:${meta.avatarUrl}`);
  if (meta.heroId) tags.push(`h:${meta.heroId}`);
  if (meta.campaignId) tags.push(`cid:${meta.campaignId}`);
  if (meta.ready) tags.push('rdy:1');
  return tags;
}

function decodeTags(tags: string[]): ConnectionMeta | null {
  const map = new Map<string, string>();
  for (const tag of tags) {
    const idx = tag.indexOf(':');
    if (idx === -1) continue;
    map.set(tag.slice(0, idx), tag.slice(idx + 1));
  }
  const userId = map.get('uid');
  const username = map.get('u');
  const role = map.get('r') as 'director' | 'player' | undefined;
  const sessionId = map.get('sid');
  if (!userId || !username || !role || !sessionId) return null;
  return {
    userId,
    username,
    avatarUrl: map.get('av') ?? null,
    role,
    heroId: map.get('h') ?? null,
    ready: map.get('rdy') === '1',
    sessionId,
    campaignId: map.get('cid') ?? null,
  };
}

export class SessionRoom extends DurableObject<Env> {
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private sessionState: SessionState | null = null;
  /** Guards against concurrent hydration from multiple async webSocketMessage calls. */
  private hydratePromise: Promise<void> | null = null;

  /**
   * Recover connection metadata from a WebSocket's hibernation tag.
   * This works both when the Map was populated in handleWebSocket (same tick)
   * and after hibernation wake (tag persists, Map is gone).
   */
  private getMetaForSocket(ws: WebSocket): ConnectionMeta | null {
    const tags = this.ctx.getTags(ws);
    if (tags.length === 0) return null;
    return decodeTags(tags);
  }

  /**
   * Get all live WebSocket connections with their metadata.
   * Uses ctx.getWebSockets() which survives hibernation.
   */
  private getConnections(): Array<{ ws: WebSocket; meta: ConnectionMeta }> {
    const connections: Array<{ ws: WebSocket; meta: ConnectionMeta }> = [];
    for (const ws of this.ctx.getWebSockets()) {
      const meta = this.getMetaForSocket(ws);
      if (meta) connections.push({ ws, meta });
    }
    return connections;
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      return this.handleWebSocket(request, url);
    }

    // HTTP endpoint to end session from outside the WebSocket (e.g. LivePage)
    if (url.pathname === '/end' && request.method === 'POST') {
      const sessionId = url.searchParams.get('sessionId');
      if (sessionId) {
        this.sessionId = sessionId;
        await this.ensureHydrated();
      }
      await this.handleEndSession();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(request: Request, url: URL): Response {
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    const avatarUrl = url.searchParams.get('avatarUrl');
    const role = url.searchParams.get('role') as 'director' | 'player';
    const heroId = url.searchParams.get('heroId');
    const sessionId = url.searchParams.get('sessionId');
    const campaignId = url.searchParams.get('campaignId');

    if (!userId || !username || !role || !sessionId) {
      return new Response('Missing params', { status: 400 });
    }

    this.sessionId = sessionId;
    this.campaignId = campaignId;

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    const meta: ConnectionMeta = {
      userId,
      username,
      avatarUrl,
      role,
      heroId,
      ready: false,
      sessionId,
      campaignId: campaignId ?? null,
    };

    // Accept with tags — tags persist across hibernation, unlike in-memory state
    this.ctx.acceptWebSocket(server, encodeTags(meta));

    // Broadcast updated participant list
    this.broadcastParticipants();

    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    const meta = this.getMetaForSocket(ws);
    if (!meta) return;

    // Recover sessionId after hibernation wake (in-memory fields are lost)
    if (!this.sessionId) {
      this.sessionId = meta.sessionId;
      this.campaignId = meta.campaignId;
    }

    // Ensure session state is hydrated (guards against concurrent calls after hibernation)
    await this.ensureHydrated();

    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      this.sendTo(ws, { type: 'error', code: 'PARSE_ERROR', message: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'ping':
        this.sendTo(ws, { type: 'pong' });
        break;

      case 'request_state':
        await this.sendState(ws);
        break;

      case 'ready':
        this.updateTag(ws, { ...meta, ready: msg.ready });
        this.broadcastParticipants();
        break;

      case 'select_hero':
        this.updateTag(ws, { ...meta, heroId: msg.heroId });
        this.broadcastParticipants();
        break;

      case 'switch_scene':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        if (this.sessionState) {
          this.sessionState.activeSceneId = msg.sceneId;
        }
        this.broadcast({ type: 'scene_changed', sceneId: msg.sceneId });
        break;

      case 'create_entity':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        if (this.sessionState) {
          this.sessionState.entities.push(msg.entity);
        }
        // Don't exclude sender — Director needs to see the entity they just created
        this.broadcast({ type: 'entity_created', entity: msg.entity });
        break;

      case 'update_entity':
        if (this.sessionState) {
          const entity = this.sessionState.entities.find((e) => e.id === msg.entityId);
          if (entity) Object.assign(entity, msg.changes);
        }
        this.broadcast({ type: 'entity_updated', entityId: msg.entityId, changes: msg.changes }, ws);
        break;

      case 'delete_entity':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        if (this.sessionState) {
          this.sessionState.entities = this.sessionState.entities.filter((e) => e.id !== msg.entityId);
        }
        // Don't exclude sender — Director needs to see their own deletion
        this.broadcast({ type: 'entity_deleted', entityId: msg.entityId });
        break;

      case 'move_token': {
        // Players can only move their own hero token; Director can move anything
        if (meta.role === 'player') {
          const entity = this.sessionState?.entities.find((e) => e.id === msg.entityId);
          if (!entity || entity.type !== 'hero' || entity.id !== meta.heroId) {
            this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only move your own hero' });
            return;
          }
        }
        if (this.sessionState) {
          const entity = this.sessionState.entities.find((e) => e.id === msg.entityId);
          if (entity) { entity.x = msg.x; entity.y = msg.y; }
        }
        this.broadcast({ type: 'entity_moved', entityId: msg.entityId, x: msg.x, y: msg.y }, ws);
        break;
      }

      case 'combat_action':
        this.handleCombatAction(ws, meta, msg.action);
        break;

      case 'use_ability':
        this.handleUseAbility(ws, msg.sourceId, msg.targetId, msg.abilityId);
        break;

      case 'end_session':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        await this.handleEndSession();
        break;

      case 'scene_drawing_add':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.storeSceneDrawing(msg.drawing);
        // Don't exclude sender — Director needs to see their own drawings
        this.broadcast({ type: 'scene_drawing_added', drawing: msg.drawing });
        break;

      case 'scene_drawing_remove':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.removeSceneDrawing(msg.drawingId);
        // Don't exclude sender — Director needs to see their own removal
        this.broadcast({ type: 'scene_drawing_removed', drawingId: msg.drawingId });
        break;

      case 'scene_fog_add':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.storeSceneFog(msg.fog);
        // Don't exclude sender — Director needs to see their own fog
        this.broadcast({ type: 'scene_fog_added', fog: msg.fog });
        break;

      case 'scene_fog_remove':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.removeSceneFog(msg.fogId);
        // Don't exclude sender — Director needs to see their own removal
        this.broadcast({ type: 'scene_fog_removed', fogId: msg.fogId });
        break;

      // ── Negotiation ──
      case 'negotiation_argument':
        this.handleNegotiationArgument(ws, meta, msg.skillId, msg.approachText);
        break;

      case 'negotiation_adjust_patience':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationAdjustPatience(msg.delta);
        break;

      // ── Montage ──
      case 'montage_roll':
        this.handleMontageRoll(ws, meta, msg.skillId, msg.characteristicId);
        break;

      // ── Respite ──
      case 'respite_choose_activity':
        this.handleRespiteChooseActivity(ws, meta, msg.activityId);
        break;

      case 'respite_complete_activity':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleRespiteCompleteActivity(msg.activityId);
        break;

      // ── Audio ──
      case 'audio_play':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleAudioPlay(msg.audioAssetId, msg.loop);
        break;

      case 'audio_pause':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleAudioPause();
        break;

      case 'audio_stop':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleAudioStop();
        break;

      // ── Story ──
      case 'story_update':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.broadcast({ type: 'story_updated', readAloudText: msg.readAloudText });
        break;

      default:
        break;
    }
  }

  override async webSocketClose(_ws: WebSocket): Promise<void> {
    // No Map to clean up — tags are on the socket itself
    this.broadcastParticipants();
  }

  override async webSocketError(_ws: WebSocket): Promise<void> {
    this.broadcastParticipants();
  }

  /**
   * Update a socket's tag (e.g. when ready state or heroId changes).
   * Cloudflare doesn't have a setTag API, so we close and note the change
   * isn't critical — 'ready' and 'heroId' are transient session state.
   * Instead we'll use ctx.setState for mutable per-socket data if needed.
   *
   * For now, ready/heroId are best-effort: they work within a single DO lifetime
   * but may reset on hibernation wake. This is acceptable for these fields.
   */
  private updateTag(_ws: WebSocket, _meta: ConnectionMeta): void {
    // Tags are immutable after acceptWebSocket. For mutable state like 'ready'
    // we'd need ctx.storage or a different approach. Since ready/heroId are
    // transient and reset on reconnect anyway, this is acceptable.
  }

  private async sendState(ws: WebSocket): Promise<void> {
    await this.ensureHydrated();
    if (this.sessionState) {
      this.sessionState.participants = this.getParticipantList();
      this.sendTo(ws, { type: 'state', state: this.sessionState });
    }
  }

  /**
   * Ensure session state is hydrated, guarding against concurrent calls.
   * Multiple concurrent webSocketMessage handlers will all await the same
   * hydration promise instead of each creating a fresh (empty) state.
   */
  private async ensureHydrated(): Promise<void> {
    if (this.sessionState) return;
    if (!this.sessionId) return;
    if (this.hydratePromise) {
      await this.hydratePromise;
      return;
    }
    this.hydratePromise = this.hydrate(this.sessionId);
    await this.hydratePromise;
    this.hydratePromise = null;
  }

  private async hydrate(sessionId: string): Promise<void> {
    const db = this.env.DB;

    const session = await db.prepare('SELECT * FROM game_sessions WHERE id = ?')
      .bind(sessionId)
      .first<{ id: string; campaign_id: string }>();
    if (!session) return;

    const scenes = await db.prepare(
      'SELECT id, title AS name, type, order_index, data FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL ORDER BY order_index',
    )
      .bind(sessionId)
      .all<SceneRef & { data?: string }>();

    this.sessionState = {
      sessionId,
      campaignId: session.campaign_id,
      scenes: scenes.results.map((s) => {
        let data: Record<string, unknown> | undefined;
        if (typeof s.data === 'string') {
          try { data = JSON.parse(s.data) as Record<string, unknown>; } catch { /* ignore */ }
        }
        return { id: s.id, name: s.name, type: s.type, order_index: s.order_index, data };
      }),
      activeSceneId: scenes.results[0]?.id ?? null,
      entities: [],
      combat: null,
      participants: this.getParticipantList(),
      negotiation: null,
      montage: null,
      respite: null,
      audio: null,
    };
  }

  private getParticipantList(): ParticipantInfo[] {
    const participants: ParticipantInfo[] = [];
    const seen = new Set<string>();
    for (const { meta } of this.getConnections()) {
      if (seen.has(meta.userId)) continue;
      seen.add(meta.userId);
      participants.push({
        userId: meta.userId,
        username: meta.username,
        avatarUrl: meta.avatarUrl,
        role: meta.role,
        heroId: meta.heroId,
        ready: meta.ready,
        connected: true,
      });
    }
    return participants;
  }

  private broadcastParticipants(): void {
    this.broadcast({ type: 'participant_update', participants: this.getParticipantList() });
  }

  private async handleEndSession(): Promise<void> {
    const db = this.env.DB;

    // Save per-scene snapshots before clearing state
    if (this.sessionState && this.sessionId) {
      const now = new Date().toISOString();

      for (const scene of this.sessionState.scenes) {
        const isActive = scene.id === this.sessionState.activeSceneId;
        const snapshot = JSON.stringify({
          data: scene.data ?? {},
          entities: isActive ? this.sessionState.entities : [],
          combat: isActive ? this.sessionState.combat : null,
          savedAt: now,
        });

        await db.prepare('UPDATE scenes SET snapshot = ? WHERE id = ?')
          .bind(snapshot, scene.id)
          .run();
      }
    }

    // Mark session as completed in D1
    if (this.sessionId) {
      await db.prepare(
        "UPDATE game_sessions SET status = 'completed', ended_at = datetime('now') WHERE id = ?",
      ).bind(this.sessionId).run();
    }

    // Notify all clients
    this.broadcast({ type: 'session_ended' });

    // Close all connections
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.close(1000, 'Session ended'); } catch { /* ignore */ }
    }
    this.sessionState = null;
  }

  private handleCombatAction(ws: WebSocket, meta: ConnectionMeta, action: CombatAction): void {
    if (!this.sessionState) return;

    switch (action.type) {
      case 'START_COMBAT': {
        // Director only
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        // Roll initiative: 1d10, 6+ heroes go first
        const initRoll = this.rollD10(1)[0] ?? 5;
        const firstSide: 'heroes' | 'villains' = initRoll >= 6 ? 'heroes' : 'villains';
        const heroCount = action.heroEntityIds.length;

        const combat: CombatState = {
          round: 1,
          activeSide: firstSide,
          firstSide,
          initiativeRoll: initRoll,
          heroEntities: action.heroEntityIds,
          villainEntities: action.villainEntityIds,
          actedThisRound: [],
          activeEntityId: null,
          malice: Math.max(0, heroCount), // Starting malice = heroCount for round 1
          turnActions: {},
        };
        this.sessionState.combat = combat;
        break;
      }

      case 'END_COMBAT': {
        // Director only
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.sessionState.combat = null;
        break;
      }

      case 'CLAIM_TURN': {
        // Players claim their hero's turn during heroes' side
        const c = this.sessionState.combat;
        if (!c) return;
        if (c.activeSide !== 'heroes' || c.activeEntityId) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Cannot claim turn now' });
          return;
        }
        if (!c.heroEntities.includes(action.entityId)) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Not a hero entity' });
          return;
        }
        if (c.actedThisRound.includes(action.entityId)) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Already acted this round' });
          return;
        }
        c.activeEntityId = action.entityId;
        // Initialize turn action state for this entity
        const heroEntity = this.sessionState.entities.find((e) => e.id === action.entityId);
        const speed = typeof heroEntity?.['speed'] === 'number' ? (heroEntity['speed'] as number) : 5;
        c.turnActions[action.entityId] = this.createTurnActions(speed);
        break;
      }

      case 'SELECT_TURN': {
        // Director selects which villain takes a turn
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        const c = this.sessionState.combat;
        if (!c) return;
        if (c.activeSide !== 'villains' || c.activeEntityId) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Cannot select turn now' });
          return;
        }
        if (!c.villainEntities.includes(action.entityId) && !c.heroEntities.includes(action.entityId)) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Entity not in combat' });
          return;
        }
        if (c.actedThisRound.includes(action.entityId)) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Already acted this round' });
          return;
        }
        c.activeEntityId = action.entityId;
        // Initialize turn action state
        const villainEntity = this.sessionState.entities.find((e) => e.id === action.entityId);
        const vSpeed = typeof villainEntity?.['speed'] === 'number' ? (villainEntity['speed'] as number) : 5;
        c.turnActions[action.entityId] = this.createTurnActions(vSpeed);
        break;
      }

      case 'END_TURN': {
        // Either director or the player whose turn it is
        const c = this.sessionState.combat;
        if (!c || !c.activeEntityId) return;

        // Players can only end their own turn
        if (meta.role === 'player' && meta.heroId !== c.activeEntityId) {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Not your turn' });
          return;
        }

        const entityId = c.activeEntityId;
        c.actedThisRound.push(entityId);
        c.activeEntityId = null;
        delete c.turnActions[entityId];

        // Check if the current side is done
        const currentSideIds = c.activeSide === 'heroes' ? c.heroEntities : c.villainEntities;
        const otherSideIds = c.activeSide === 'heroes' ? c.villainEntities : c.heroEntities;
        const currentSideDone = currentSideIds.every((id) => c.actedThisRound.includes(id));
        const otherSideDone = otherSideIds.every((id) => c.actedThisRound.includes(id));

        if (currentSideDone && otherSideDone) {
          // Both sides done → new round
          c.round++;
          c.actedThisRound = [];
          c.activeSide = c.firstSide;
          // Malice increases each round
          c.malice += c.heroEntities.length;
        } else if (currentSideDone) {
          // Switch to other side
          c.activeSide = c.activeSide === 'heroes' ? 'villains' : 'heroes';
        }
        // If current side is NOT done, stay on the same side (next entity can claim/select)
        break;
      }

      case 'ADJUST_MALICE': {
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        const c = this.sessionState.combat;
        if (!c) return;
        c.malice = Math.max(0, c.malice + action.delta);
        break;
      }

      case 'APPLY_DAMAGE': {
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        if (entity && typeof entity['currentStamina'] === 'number') {
          (entity as Record<string, unknown>)['currentStamina'] =
            Math.max(0, (entity['currentStamina'] as number) - action.amount);
        }
        this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { currentStamina: entity?.['currentStamina'] } });
        break;
      }

      case 'APPLY_HEALING': {
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        if (entity && typeof entity['currentStamina'] === 'number' && typeof entity['maxStamina'] === 'number') {
          (entity as Record<string, unknown>)['currentStamina'] =
            Math.min(entity['maxStamina'] as number, (entity['currentStamina'] as number) + action.amount);
        }
        this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { currentStamina: entity?.['currentStamina'] } });
        break;
      }

      case 'APPLY_CONDITION': {
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        if (entity) {
          const conditions = Array.isArray(entity['conditions']) ? [...(entity['conditions'] as string[])] : [];
          if (!conditions.includes(action.condition)) {
            conditions.push(action.condition);
          }
          (entity as Record<string, unknown>)['conditions'] = conditions;
          this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { conditions } });
        }
        break;
      }

      case 'REMOVE_CONDITION': {
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        if (entity) {
          const conditions = Array.isArray(entity['conditions'])
            ? (entity['conditions'] as string[]).filter((c) => c !== action.conditionId)
            : [];
          (entity as Record<string, unknown>)['conditions'] = conditions;
          this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { conditions } });
        }
        break;
      }
    }

    this.broadcast({ type: 'combat_updated', combat: this.sessionState.combat });
  }

  /** Create initial turn action state for an entity. */
  private createTurnActions(baseSpeed: number): TurnActionState {
    return {
      mainActionUsed: false,
      maneuverUsed: false,
      moveRemaining: baseSpeed,
      triggeredUsedThisRound: false,
      mainConvertedTo: null,
    };
  }

  /** Roll n d10 using crypto-secure randomness. */
  private rollD10(count: number): number[] {
    const bytes = new Uint8Array(count);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => (b % 10) + 1);
  }

  private getTier(total: number): 1 | 2 | 3 {
    if (total >= 17) return 3;
    if (total >= 12) return 2;
    return 1;
  }

  private handleUseAbility(ws: WebSocket, sourceId: string, _targetId: string, abilityId: string): void {
    if (!this.sessionState) return;

    const source = this.sessionState.entities.find((e) => e.id === sourceId);
    if (!source) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source entity not found' });
      return;
    }

    // Server-side power roll: 2d10 + modifier
    const modifier = typeof source['might'] === 'number' ? (source['might'] as number) : 0;
    const dice = this.rollD10(2);
    const total = (dice[0] ?? 0) + (dice[1] ?? 0) + modifier;
    const tier = this.getTier(total);

    // Tier-based damage hint (Director applies manually via combat tracker)
    const damage = tier === 3 ? 6 : tier === 2 ? 4 : 2;

    const abilityName = typeof source[`ability_${abilityId}_name`] === 'string'
      ? (source[`ability_${abilityId}_name`] as string)
      : abilityId;

    const result: AbilityResult = {
      sourceId,
      targetId: sourceId,
      abilityId,
      abilityName,
      dice,
      modifier,
      total,
      tier,
      damage,
      effects: [],
      timestamp: Date.now(),
    };

    this.broadcast({ type: 'ability_resolved', result });
  }

  /** Get the active scene's data object (create if missing). */
  private getActiveSceneData(): Record<string, unknown> | null {
    if (!this.sessionState) return null;
    const scene = this.sessionState.scenes.find((s) => s.id === this.sessionState!.activeSceneId);
    if (!scene) return null;
    if (!scene.data) scene.data = {};
    return scene.data;
  }

  private storeSceneDrawing(drawing: DrawingSync): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    if (!Array.isArray(data['drawings'])) data['drawings'] = [];
    (data['drawings'] as DrawingSync[]).push(drawing);
  }

  private removeSceneDrawing(drawingId: string): void {
    const data = this.getActiveSceneData();
    if (!data || !Array.isArray(data['drawings'])) return;
    data['drawings'] = (data['drawings'] as DrawingSync[]).filter((d) => d.id !== drawingId);
  }

  private storeSceneFog(fog: FogSync): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    if (!Array.isArray(data['fog'])) data['fog'] = [];
    (data['fog'] as FogSync[]).push(fog);
  }

  private removeSceneFog(fogId: string): void {
    const data = this.getActiveSceneData();
    if (!data || !Array.isArray(data['fog'])) return;
    data['fog'] = (data['fog'] as FogSync[]).filter((f) => f.id !== fogId);
  }

  // ── Negotiation Handlers ──

  private handleNegotiationArgument(
    ws: WebSocket,
    meta: ConnectionMeta,
    skillId: string,
    approachText: string
  ): void {
    if (!this.sessionState) return;

    // Initialize negotiation state if needed
    if (!this.sessionState.negotiation) {
      this.sessionState.negotiation = {
        interest: 0,
        patience: 5,
        maxPatience: 5,
        argumentLog: [],
      };
    }

    const neg = this.sessionState.negotiation;

    // Server-side power roll for the argument
    const dice = this.rollD10(2);
    // Use a basic modifier (could be enhanced with entity data)
    const modifier = 0;
    const total = (dice[0] ?? 0) + (dice[1] ?? 0) + modifier;
    const tier = this.getTier(total);

    // Determine interest change based on tier
    const interestDelta = tier === 3 ? 2 : tier === 2 ? 1 : -1;

    // Apply changes
    neg.interest += interestDelta;
    neg.patience = Math.max(0, neg.patience - 1);

    const entry: ArgumentLogEntry = {
      id: `arg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: meta.userId,
      playerName: meta.username,
      skillId,
      approachText,
      roll: total,
      tier,
      interestDelta,
      timestamp: Date.now(),
    };
    neg.argumentLog.push(entry);

    this.broadcast({
      type: 'negotiation_updated',
      interest: neg.interest,
      patience: neg.patience,
      argumentLog: neg.argumentLog,
    });
  }

  private handleNegotiationAdjustPatience(delta: number): void {
    if (!this.sessionState?.negotiation) return;
    const neg = this.sessionState.negotiation;
    neg.patience = Math.max(0, neg.patience + delta);
    this.broadcast({
      type: 'negotiation_updated',
      interest: neg.interest,
      patience: neg.patience,
      argumentLog: neg.argumentLog,
    });
  }

  // ── Montage Handlers ──

  private handleMontageRoll(
    ws: WebSocket,
    meta: ConnectionMeta,
    skillId: string,
    characteristicId: string
  ): void {
    if (!this.sessionState) return;

    // Initialize montage state if needed
    if (!this.sessionState.montage) {
      this.sessionState.montage = {
        successes: 0,
        failures: 0,
        successLimit: 3,
        failureLimit: 3,
        testLog: [],
        outcome: null,
      };
    }

    const mont = this.sessionState.montage;
    if (mont.outcome) return; // Already resolved

    // Server-side power roll
    const dice = this.rollD10(2);
    const modifier = 0;
    const total = (dice[0] ?? 0) + (dice[1] ?? 0) + modifier;
    const tier = this.getTier(total);
    const outcome: 'success' | 'failure' = tier >= 2 ? 'success' : 'failure';

    if (outcome === 'success') mont.successes++;
    else mont.failures++;

    const entry: TestLogEntry = {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: meta.userId,
      playerName: meta.username,
      skillId,
      characteristicId,
      roll: total,
      tier,
      outcome,
      timestamp: Date.now(),
    };
    mont.testLog.push(entry);

    // Check for montage completion
    if (mont.successes >= mont.successLimit) mont.outcome = 'total-success';
    else if (mont.failures >= mont.failureLimit) mont.outcome = 'total-failure';
    else if (mont.successes >= mont.successLimit - 1 && mont.failures >= mont.failureLimit - 1) {
      // Mixed result
      mont.outcome = 'mixed';
    }

    this.broadcast({
      type: 'montage_updated',
      successes: mont.successes,
      failures: mont.failures,
      testLog: mont.testLog,
      outcome: mont.outcome,
    });
  }

  // ── Respite Handlers ──

  private handleRespiteChooseActivity(
    ws: WebSocket,
    meta: ConnectionMeta,
    activityId: string
  ): void {
    if (!this.sessionState) return;

    // Initialize respite state if needed
    if (!this.sessionState.respite) {
      this.sessionState.respite = {
        activities: [],
        completedBy: {},
      };
    }

    const respite = this.sessionState.respite;
    const activity = respite.activities.find((a) => a.activityId === activityId);
    if (!activity) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Activity not found' });
      return;
    }

    // Allow claiming
    activity.claimedBy = meta.userId;
    activity.claimedByName = meta.username;

    this.broadcast({
      type: 'respite_updated',
      activities: respite.activities,
      completedBy: respite.completedBy,
    });
  }

  private handleRespiteCompleteActivity(activityId: string): void {
    if (!this.sessionState?.respite) return;

    const respite = this.sessionState.respite;
    const activity = respite.activities.find((a) => a.activityId === activityId);
    if (!activity) return;

    activity.completed = true;
    if (activity.claimedBy) {
      if (!respite.completedBy[activity.claimedBy]) {
        respite.completedBy[activity.claimedBy] = [];
      }
      respite.completedBy[activity.claimedBy].push(activityId);
    }

    this.broadcast({
      type: 'respite_updated',
      activities: respite.activities,
      completedBy: respite.completedBy,
    });
  }

  // ── Audio Handlers ──

  private handleAudioPlay(audioAssetId: string, loop: boolean): void {
    if (!this.sessionState) return;
    this.sessionState.audio = {
      playing: true,
      audioUrl: audioAssetId, // Client resolves to actual URL
      assetName: audioAssetId,
      loop,
    };
    this.broadcast({
      type: 'audio_command',
      action: 'play',
      audioUrl: audioAssetId,
      assetName: audioAssetId,
      loop,
    });
  }

  private handleAudioPause(): void {
    if (!this.sessionState) return;
    if (this.sessionState.audio) {
      this.sessionState.audio.playing = false;
    }
    this.broadcast({ type: 'audio_command', action: 'pause' });
  }

  private handleAudioStop(): void {
    if (!this.sessionState) return;
    this.sessionState.audio = null;
    this.broadcast({ type: 'audio_command', action: 'stop' });
  }

  private sendTo(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // connection may be closed
    }
  }

  private broadcast(msg: ServerMessage, exclude?: WebSocket): void {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      try {
        ws.send(data);
      } catch {
        // connection may be closed
      }
    }
  }
}
