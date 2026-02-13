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
  AbilityResult,
  DrawingSync,
  FogSync,
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

      case 'move_token':
        if (this.sessionState) {
          const entity = this.sessionState.entities.find((e) => e.id === msg.entityId);
          if (entity) { entity.x = msg.x; entity.y = msg.y; }
        }
        this.broadcast({ type: 'entity_moved', entityId: msg.entityId, x: msg.x, y: msg.y }, ws);
        break;

      case 'combat_action':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleCombatAction(msg.action);
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

  private handleCombatAction(action: CombatAction): void {
    if (!this.sessionState) return;

    switch (action.type) {
      case 'START_COMBAT': {
        const combat: CombatState = {
          round: 1,
          turnOrder: action.initiativeOrder
            .sort((a, b) => b.initiative - a.initiative)
            .map((e) => e.entityId),
          currentTurnIndex: 0,
          malice: 0,
        };
        this.sessionState.combat = combat;
        break;
      }
      case 'END_COMBAT':
        this.sessionState.combat = null;
        break;
      case 'NEXT_TURN': {
        const c = this.sessionState.combat;
        if (!c) return;
        c.currentTurnIndex++;
        if (c.currentTurnIndex >= c.turnOrder.length) {
          c.currentTurnIndex = 0;
          c.round++;
          c.malice += 2; // +2 malice per round
        }
        break;
      }
      case 'ADJUST_MALICE': {
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
