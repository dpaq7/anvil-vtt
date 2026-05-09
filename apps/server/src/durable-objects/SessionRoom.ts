import { DurableObject } from 'cloudflare:workers';
import { GameData, HeroLogic, KitLogic } from '@anvil/data';
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
  TerrainSync,
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

interface HeroEntityRow {
  id: string;
  name: string;
  user_id: string;
  ancestry: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  characteristics: string | null;
  kit: string | null;
  abilities: string | null;
  portrait_url: string | null;
  data: string | null;
}

interface AbilityEffectLike {
  effect?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
}

interface AbilityLike {
  name?: string;
  usage?: string;
  cost?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
  effects?: AbilityEffectLike[];
  metadata?: {
    item_id?: string;
    scc?: string[];
  };
}

interface RuntimeAbility {
  id: string;
  name: string;
  keywords: string[];
  actionType: string;
  distance: string;
  damage: string;
  cost: string;
  tier1Effect: string;
  tier2Effect: string;
  tier3Effect: string;
}

type SessionEntity = SessionState['entities'][number];

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


function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function resolveAbility(abilityId: string): AbilityLike | undefined {
  const slug = abilityId.includes(':') ? abilityId.split(':').pop() ?? abilityId : abilityId;
  return (
    (GameData.getByScc(abilityId) as AbilityLike | undefined) ??
    (GameData.getAbility(abilityId) as AbilityLike | undefined) ??
    (GameData.getAbility(slug) as AbilityLike | undefined) ??
    (GameData.getFeature(abilityId) as AbilityLike | undefined) ??
    (GameData.getFeature(slug) as AbilityLike | undefined) ??
    ((GameData.getAllAbilities() as AbilityLike[]).find((candidate) =>
      candidate.metadata?.item_id === abilityId ||
      candidate.metadata?.item_id === slug ||
      candidate.metadata?.scc?.includes(abilityId)
    ))
  );
}

function normalizeActionType(usage: string | undefined): RuntimeAbility['actionType'] {
  const value = usage?.toLowerCase() ?? '';
  if (value.includes('free')) return 'free';
  if (value.includes('maneuver')) return 'maneuver';
  if (value.includes('triggered')) return 'triggered';
  if (value.includes('move')) return 'move';
  return 'action';
}

function getTierText(effect: AbilityEffectLike | undefined, tier: 1 | 2 | 3): string {
  if (!effect) return '';
  if (tier === 1) return effect.tier1 ?? effect.effect ?? '';
  if (tier === 2) return effect.tier2 ?? effect.effect ?? '';
  return effect.tier3 ?? effect.effect ?? '';
}

function extractDamage(effectText: string): number {
  const match = /(\d+)(?:\s+\w+)*\s+damage/i.exec(effectText);
  return match?.[1] ? Number.parseInt(match[1], 10) : 0;
}

function firstTieredEffect(ability: AbilityLike | undefined): AbilityEffectLike | undefined {
  return ability?.effects?.find((effect) => effect.tier1 || effect.tier2 || effect.tier3);
}

function summarizeDamage(ability: AbilityLike | undefined): string {
  const effect = firstTieredEffect(ability);
  const values = [effect?.tier1, effect?.tier2, effect?.tier3]
    .map((text) => extractDamage(text ?? ''))
    .filter((damage) => damage > 0);
  if (values.length === 0) return '';
  return `${Array.from(new Set(values)).join('/')} damage`;
}

function toRuntimeAbility(abilityId: string): RuntimeAbility {
  const ability = resolveAbility(abilityId);
  const effect = firstTieredEffect(ability);
  return {
    id: abilityId,
    name: ability?.name ?? abilityId,
    keywords: ability?.keywords ?? [],
    actionType: normalizeActionType(ability?.usage),
    distance: ability?.distance ?? '',
    damage: summarizeDamage(ability),
    cost: ability?.cost ?? '',
    tier1Effect: effect?.tier1 ?? '',
    tier2Effect: effect?.tier2 ?? '',
    tier3Effect: effect?.tier3 ?? '',
  };
}

function getAbilityForSource(source: Record<string, unknown>, abilityId: string): RuntimeAbility {
  const abilities = Array.isArray(source['abilities']) ? source['abilities'] as RuntimeAbility[] : [];
  return abilities.find((ability) => ability.id === abilityId) ?? toRuntimeAbility(abilityId);
}

function getRollModifier(source: Record<string, unknown>): number {
  const values = ['might', 'agility', 'reason', 'intuition', 'presence']
    .map((key) => (typeof source[key] === 'number' ? source[key] as number : 0));
  return Math.max(0, ...values);
}

function isTargetInRange(source: Record<string, unknown>, target: Record<string, unknown>, distance: string): boolean {
  const normalized = distance.toLowerCase();
  if (normalized.includes('self')) return source['id'] === target['id'];
  const range = /(?:melee|ranged|area|burst|line|cube)\s+(\d+)/i.exec(distance)?.[1];
  if (!range) return true;
  const sourceX = typeof source['x'] === 'number' ? source['x'] : 0;
  const sourceY = typeof source['y'] === 'number' ? source['y'] : 0;
  const targetX = typeof target['x'] === 'number' ? target['x'] : 0;
  const targetY = typeof target['y'] === 'number' ? target['y'] : 0;
  return Math.max(Math.abs(sourceX - targetX), Math.abs(sourceY - targetY)) <= Number.parseInt(range, 10);
}

export class SessionRoom extends DurableObject<Env> {
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private sessionState: SessionState | null = null;
  private mutableConnectionMeta = new WeakMap<WebSocket, ConnectionMeta>();
  /** Guards against concurrent hydration from multiple async webSocketMessage calls. */
  private hydratePromise: Promise<void> | null = null;

  /**
   * Recover connection metadata from a WebSocket's hibernation tag.
   * This works both when the Map was populated in handleWebSocket (same tick)
   * and after hibernation wake (tag persists, Map is gone).
   */
  private getMetaForSocket(ws: WebSocket): ConnectionMeta | null {
    const mutableMeta = this.mutableConnectionMeta.get(ws);
    if (mutableMeta) return mutableMeta;
    const tags = this.ctx.getTags(ws);
    if (tags.length === 0) return null;
    const meta = decodeTags(tags);
    if (meta) this.mutableConnectionMeta.set(ws, meta);
    return meta;
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

    // HTTP endpoint to start session from REST route — broadcasts session_started to lobby clients
    if (url.pathname === '/start' && request.method === 'POST') {
      this.broadcast({ type: 'session_started' });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
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

    this.mutableConnectionMeta.set(server, meta);

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
        await this.env.DB.prepare(
          `UPDATE session_participants
           SET status = ?, ready_at = CASE WHEN ? THEN datetime('now') ELSE NULL END
           WHERE game_session_id = ? AND user_id = ?`,
        )
          .bind(msg.ready ? 'ready' : 'joined', msg.ready ? 1 : 0, meta.sessionId, meta.userId)
          .run();
        this.updateTag(ws, { ...meta, ready: msg.ready });
        this.broadcastParticipants();
        break;

      case 'select_hero': {
        const hero = await this.env.DB.prepare('SELECT id FROM heroes WHERE id = ? AND user_id = ? AND deleted_at IS NULL')
          .bind(msg.heroId, meta.userId)
          .first<{ id: string }>();
        if (!hero) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_HERO', message: 'Hero not found' });
          return;
        }

        await this.env.DB.prepare(
          `INSERT INTO session_participants (game_session_id, user_id, hero_id, status)
           VALUES (?, ?, ?, 'joined')
           ON CONFLICT(game_session_id, user_id) DO UPDATE SET hero_id = excluded.hero_id`,
        )
          .bind(meta.sessionId, meta.userId, msg.heroId)
          .run();

        if (meta.campaignId) {
          await this.env.DB.prepare('UPDATE campaign_members SET hero_id = ? WHERE campaign_id = ? AND user_id = ?')
            .bind(msg.heroId, meta.campaignId, meta.userId)
            .run();
        }

        if (this.sessionState) {
          const heroEntities = this.applyHeroStart(
            await this.loadHeroEntities(meta.sessionId),
            this.getActiveSceneData() ?? {},
          );
          const nonHeroEntities = this.sessionState.entities.filter((entity) => entity.type !== 'hero');
          this.sessionState.entities = [...heroEntities, ...nonHeroEntities];
        }

        this.updateTag(ws, { ...meta, heroId: msg.heroId });
        this.broadcastParticipants();
        break;
      }

      case 'switch_scene':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        if (this.sessionState) {
          if (!this.sessionState.scenes.some((scene) => scene.id === msg.sceneId)) {
            this.sendTo(ws, { type: 'error', code: 'INVALID_SCENE', message: 'Scene not found' });
            return;
          }
          this.sessionState.activeSceneId = msg.sceneId;
          await this.persistActiveScene(msg.sceneId);
          this.replaceSceneEntities(msg.sceneId);
          // Initialize mode-specific live state for the new scene
          this.initializeSceneLiveState(msg.sceneId);
        }
        this.broadcast({ type: 'scene_changed', sceneId: msg.sceneId });
        if (this.sessionState) this.broadcast({ type: 'state', state: this.sessionState });
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
          if (!entity) {
            this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Entity not found' });
            return;
          }

          const changes = meta.role === 'director'
            ? msg.changes
            : this.sanitizePlayerEntityChanges(ws, meta, entity, msg.changes);
          if (!changes) return;

          Object.assign(entity, changes);
          this.broadcast({ type: 'entity_updated', entityId: msg.entityId, changes }, ws);
        }
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
        const entity = this.sessionState?.entities.find((e) => e.id === msg.entityId);
        if (!entity) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Token not found' });
          return;
        }

        // Players can only move their own hero token; Director can move anything
        if (meta.role === 'player' && (entity.type !== 'hero' || entity.id !== meta.heroId)) {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only move your own hero' });
          return;
        }

        const bounded = this.clampToActiveBattleGrid(msg.x, msg.y);
        entity.x = bounded.x;
        entity.y = bounded.y;
        this.broadcast({ type: 'entity_moved', entityId: msg.entityId, x: bounded.x, y: bounded.y });
        break;
      }

      case 'combat_action':
        this.handleCombatAction(ws, meta, msg.action);
        break;

      case 'use_ability':
        this.handleUseAbility(ws, meta, msg.sourceId, msg.targetId, msg.abilityId);
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

      case 'scene_terrain_add':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.storeSceneTerrain(msg.terrain);
        this.broadcast({ type: 'scene_terrain_added', terrain: msg.terrain });
        break;

      case 'scene_terrain_remove':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.removeSceneTerrain(msg.terrainId);
        this.broadcast({ type: 'scene_terrain_removed', terrainId: msg.terrainId });
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

      case 'negotiation_adjust_interest':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationAdjustInterest(msg.delta);
        break;

      case 'negotiation_reveal_motivation':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationReveal('motivations', msg.id);
        break;

      case 'negotiation_reveal_pitfall':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationReveal('pitfalls', msg.id);
        break;

      case 'negotiation_end':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationEnd(msg.phase);
        break;

      // ── Montage ──
      case 'montage_roll':
        this.handleMontageRoll(ws, meta, msg.skillId, msg.characteristicId);
        break;

      case 'montage_adjust_successes':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleMontageAdjust('successes', msg.delta);
        break;

      case 'montage_adjust_failures':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleMontageAdjust('failures', msg.delta);
        break;

      case 'montage_reset':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleMontageReset();
        break;

      // ── Respite ──
      case 'respite_choose_activity':
        this.handleRespiteChooseActivity(ws, meta, msg.activityId);
        break;

      case 'respite_complete_activity':
        this.handleRespiteCompleteActivity(ws, meta, msg.activityId);
        break;

      // ── Audio ──
      case 'audio_play':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        await this.handleAudioPlay(ws, msg.audioAssetId, msg.loop);
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
        this.storeStoryReadAloud(msg.readAloudText);
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
  private updateTag(ws: WebSocket, meta: ConnectionMeta): void {
    this.mutableConnectionMeta.set(ws, meta);
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
      .first<{ id: string; campaign_id: string; active_scene_id: string | null }>();
    if (!session) return;

    const scenes = await db.prepare(
      'SELECT id, title AS name, type, order_index, data FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL ORDER BY order_index',
    )
      .bind(sessionId)
      .all<SceneRef & { data?: string }>();

    const sceneRefs = scenes.results.map((s) => {
        let data: Record<string, unknown> | undefined;
        if (typeof s.data === 'string') {
          try { data = JSON.parse(s.data) as Record<string, unknown>; } catch { /* ignore */ }
        }
        return { id: s.id, name: s.name, type: s.type, order_index: s.order_index, data };
      });
    const activeSceneId = sceneRefs.some((scene) => scene.id === session.active_scene_id)
      ? session.active_scene_id
      : sceneRefs[0]?.id ?? null;

    const activeScene = sceneRefs.find((scene) => scene.id === activeSceneId);
    const heroEntities = this.applyHeroStart(await this.loadHeroEntities(sessionId), activeScene?.data ?? {});

    this.sessionState = {
      sessionId,
      campaignId: session.campaign_id,
      scenes: sceneRefs,
      activeSceneId,
      entities: [...heroEntities, ...this.createSceneEntities(activeScene?.data ?? {})],
      combat: null,
      participants: this.getParticipantList(),
      negotiation: null,
      montage: null,
      respite: null,
      audio: null,
    };

    if (activeSceneId) this.initializeSceneLiveState(activeSceneId, false);
  }

  private async loadHeroEntities(sessionId: string): Promise<SessionState['entities']> {
    const rows = await this.env.DB.prepare(
      `SELECT h.id, h.name, h.user_id, h.ancestry, h.hero_class, h.subclass, h.level,
              h.characteristics, h.kit, h.abilities, h.portrait_url, h.data
       FROM session_participants sp
       JOIN heroes h ON h.id = sp.hero_id
       WHERE sp.game_session_id = ? AND h.deleted_at IS NULL
       ORDER BY h.created_at`,
    )
      .bind(sessionId)
      .all<HeroEntityRow>();

    return rows.results.map((hero, index) => this.createHeroEntity(hero, index));
  }

  private createHeroEntity(hero: HeroEntityRow, index: number): SessionState['entities'][number] {
    const data = parseJson<Record<string, unknown>>(hero.data, {});
    const characteristics = parseJson<Record<string, number>>(hero.characteristics, {});
    const selectedAbilityIds = parseJson<string[]>(hero.abilities, []);
    const heroClass = hero.hero_class && HeroLogic.isValidHeroClass(hero.hero_class)
      ? hero.hero_class
      : null;
    const kit = hero.kit ? GameData.getKit(hero.kit) : null;
    const maxStamina = heroClass
      ? HeroLogic.getMaxStaminaWithKit(heroClass, hero.level, kit?.staminaPerEchelon ?? 0)
      : 20;
    const resourceType = heroClass ? HeroLogic.getHeroicResourceType(heroClass) : null;
    const speed = HeroLogic.getBaseSpeed(hero.ancestry ?? '') + (hero.kit ? KitLogic.getKitSpeedBonus(hero.kit) : 0);

    return {
      id: hero.id,
      name: hero.name,
      type: 'hero',
      x: 2,
      y: 2 + index,
      ownerUserId: hero.user_id,
      ancestry: hero.ancestry,
      heroClass,
      subclass: hero.subclass,
      level: hero.level,
      kit: hero.kit,
      portraitUrl: hero.portrait_url,
      maxStamina,
      currentStamina: typeof data['staminaCurrent'] === 'number' ? data['staminaCurrent'] : maxStamina,
      recoveriesCurrent: typeof data['recoveriesCurrent'] === 'number' ? data['recoveriesCurrent'] : null,
      heroicResource: heroClass ? HeroLogic.getStartingHeroicResource(heroClass) : 0,
      heroicResourceName: resourceType ? HeroLogic.getHeroicResourceName(resourceType) : 'Resource',
      speed,
      conditions: [],
      might: characteristics['might'] ?? 0,
      agility: characteristics['agility'] ?? 0,
      reason: characteristics['reason'] ?? 0,
      intuition: characteristics['intuition'] ?? 0,
      presence: characteristics['presence'] ?? 0,
      abilities: selectedAbilityIds.map(toRuntimeAbility),
    };
  }

  private replaceSceneEntities(sceneId: string): void {
    if (!this.sessionState) return;
    const scene = this.sessionState.scenes.find((candidate) => candidate.id === sceneId);
    const data = scene?.data ?? {};
    const heroEntities = this.applyHeroStart(
      this.sessionState.entities.filter((entity) => entity.type === 'hero'),
      data,
    );
    this.sessionState.entities = [...heroEntities, ...this.createSceneEntities(data)];
    this.sessionState.combat = null;
  }

  private applyHeroStart(heroes: SessionEntity[], data: Record<string, unknown>): SessionEntity[] {
    const start = data['heroStart'];
    if (!start || typeof start !== 'object') return heroes;
    const item = start as Record<string, unknown>;
    const x = this.getNumericSceneValue(item['x'], undefined, 2);
    const y = this.getNumericSceneValue(item['y'], undefined, 2);
    const width = Math.max(1, this.getNumericSceneValue(item['width'], item['w'], 3));

    return heroes.map((hero, index) => ({
      ...hero,
      x: x + (index % width),
      y: y + Math.floor(index / width),
    }));
  }

  private createSceneEntities(data: Record<string, unknown>): SessionEntity[] {
    const rawTokens = data['tokens'];
    if (!Array.isArray(rawTokens)) return [];
    return rawTokens
      .map((token, index) => this.createSceneEntityFromToken(token, index))
      .filter((entity): entity is SessionEntity => entity !== null);
  }

  private createSceneEntityFromToken(rawToken: unknown, index: number): SessionEntity | null {
    if (!rawToken || typeof rawToken !== 'object') return null;
    const token = rawToken as Record<string, unknown>;
    const rawType = typeof token['type'] === 'string' ? token['type'] : 'monster';
    if (rawType === 'hero') return null;
    const type = rawType === 'npc' ? 'npc' : 'monster';

    const name = typeof token['name'] === 'string' && token['name'].trim()
      ? token['name'].trim()
      : `Scene Token ${index + 1}`;
    const monsterName = typeof token['monsterName'] === 'string' && token['monsterName'].trim()
      ? token['monsterName'].trim()
      : type === 'monster'
        ? name.replace(/\s+\d+$/, '').trim()
        : undefined;
    const monster = monsterName ? GameData.getMonster(monsterName) : undefined;
    const maxStamina = this.getNumericSceneValue(token['maxStamina'], monster?.stamina, 0);
    const currentStamina = this.getNumericSceneValue(token['currentStamina'], undefined, maxStamina);
    const roles = Array.isArray(token['roles'])
      ? token['roles'].map(String)
      : monster?.roles ?? [];

    return {
      id: typeof token['id'] === 'string' && token['id'].trim() ? token['id'].trim() : `scene-token-${index}`,
      name,
      type,
      x: this.getNumericSceneValue(token['x'], undefined, 0),
      y: this.getNumericSceneValue(token['y'], undefined, 0),
      size: this.getNumericSceneValue(token['size'], undefined, 1),
      maxStamina,
      currentStamina,
      monsterName,
      level: this.getNumericSceneValue(token['level'], monster?.level, 1),
      roles,
      conditions: Array.isArray(token['conditions']) ? token['conditions'].map(String) : [],
      ...(typeof token['squadId'] === 'string' ? { squadId: token['squadId'] } : {}),
      ...(typeof token['squadSize'] === 'number' ? { squadSize: token['squadSize'] } : {}),
      ...(typeof token['portraitUrl'] === 'string' ? { portraitUrl: token['portraitUrl'] } : {}),
      ...(typeof token['notes'] === 'string' ? { notes: token['notes'] } : {}),
      ...(monster?.features ? { features: monster.features } : {}),
    };
  }

  private async persistActiveScene(sceneId: string): Promise<void> {
    if (!this.sessionId) return;
    await this.env.DB.prepare('UPDATE game_sessions SET active_scene_id = ? WHERE id = ?')
      .bind(sceneId, this.sessionId)
      .run();
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

  /** Initialize mode-specific live state when switching to a scene. */
  private initializeSceneLiveState(sceneId: string, shouldBroadcast = true): void {
    if (!this.sessionState) return;
    const scene = this.sessionState.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    this.sessionState.negotiation = null;
    this.sessionState.montage = null;
    this.sessionState.respite = null;

    const data = scene.data ?? {};
    if (scene.type === 'negotiation') {
      this.sessionState.negotiation = this.createNegotiationState(data);
      if (shouldBroadcast) this.broadcastNegotiationUpdate();
    } else if (scene.type === 'montage') {
      this.sessionState.montage = this.createMontageState(data);
      if (shouldBroadcast) this.broadcastMontageUpdate();
    } else if (scene.type === 'respite') {
      this.sessionState.respite = this.createRespiteState(data);
      if (shouldBroadcast) this.broadcastRespiteUpdate();
    }
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
        const heroEntityIds = action.heroEntityIds.filter((id) => {
          const entity = this.sessionState?.entities.find((candidate) => candidate.id === id);
          return entity?.type === 'hero' && this.canEntityAct(id);
        });
        const villainEntityIds = action.villainEntityIds.filter((id) => {
          const entity = this.sessionState?.entities.find((candidate) => candidate.id === id);
          return (entity?.type === 'monster' || entity?.type === 'npc') && this.canEntityAct(id);
        });
        if (heroEntityIds.length === 0 || villainEntityIds.length === 0) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Combat needs at least one hero and one villain' });
          return;
        }

        // Roll initiative: 1d10, 6+ heroes go first
        const initRoll = this.rollD10(1)[0] ?? 5;
        const firstSide: 'heroes' | 'villains' = initRoll >= 6 ? 'heroes' : 'villains';
        const heroCount = heroEntityIds.length;

        const combat: CombatState = {
          round: 1,
          activeSide: firstSide,
          firstSide,
          initiativeRoll: initRoll,
          heroEntities: heroEntityIds,
          villainEntities: villainEntityIds,
          actedThisRound: [],
          activeEntityId: null,
          malice: Math.max(0, heroCount + 1), // Starting malice = heroCount + round(1)
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
        if (meta.role === 'player' && meta.heroId !== action.entityId) {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only claim your own hero turn' });
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
        const currentSideIds = this.getActingCombatants(c.activeSide === 'heroes' ? c.heroEntities : c.villainEntities);
        const otherSideIds = this.getActingCombatants(c.activeSide === 'heroes' ? c.villainEntities : c.heroEntities);
        const currentSideDone = currentSideIds.every((id) => c.actedThisRound.includes(id));
        const otherSideDone = otherSideIds.every((id) => c.actedThisRound.includes(id));

        if (currentSideDone && otherSideDone) {
          // Both sides done → new round
          c.round++;
          c.actedThisRound = [];
          c.activeSide = c.firstSide;
          // Malice increases each round: heroCount + roundNumber
          c.malice += c.heroEntities.length + c.round;
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

      case 'CATCH_BREATH': {
        // Catch Breath: spend main action, recover floor(maxStamina / 3) stamina
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        const combat = this.sessionState.combat;
        if (!combat || combat.activeEntityId !== action.entityId) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Catch Breath requires the active turn' });
          return;
        }
        const turnActions = combat.turnActions[action.entityId] ?? this.createTurnActions(
          typeof entity?.['speed'] === 'number' ? entity['speed'] as number : 5,
        );
        combat.turnActions[action.entityId] = turnActions;
        if (!this.consumeActionSlot(ws, turnActions, 'action')) return;
        if (entity && typeof entity['currentStamina'] === 'number' && typeof entity['maxStamina'] === 'number') {
          const maxStamina = entity['maxStamina'] as number;
          const recovery = Math.floor(maxStamina / 3);
          const newStamina = Math.min(maxStamina, (entity['currentStamina'] as number) + recovery);
          (entity as Record<string, unknown>)['currentStamina'] = newStamina;
          this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { currentStamina: newStamina } });
        }
        break;
      }

      case 'DEFEND': {
        // Defend: apply Defending condition (grants +2 to defense rolls until next turn)
        const entity = this.sessionState.entities.find((e) => e.id === action.entityId);
        const combat = this.sessionState.combat;
        if (!combat || combat.activeEntityId !== action.entityId) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Defend requires the active turn' });
          return;
        }
        const turnActions = combat.turnActions[action.entityId] ?? this.createTurnActions(
          typeof entity?.['speed'] === 'number' ? entity['speed'] as number : 5,
        );
        combat.turnActions[action.entityId] = turnActions;
        if (!this.consumeActionSlot(ws, turnActions, 'maneuver')) return;
        if (entity) {
          const conditions = Array.isArray(entity['conditions'])
            ? [...(entity['conditions'] as string[])]
            : [];
          if (!conditions.includes('Defending')) {
            conditions.push('Defending');
          }
          (entity as Record<string, unknown>)['conditions'] = conditions;
          this.broadcast({ type: 'entity_updated', entityId: action.entityId, changes: { conditions } });
        }
        break;
      }
    }

    this.broadcast({ type: 'combat_updated', combat: this.sessionState.combat });
  }

  private canEntityAct(entityId: string): boolean {
    const entity = this.sessionState?.entities.find((candidate) => candidate.id === entityId);
    if (!entity) return false;
    return typeof entity['currentStamina'] !== 'number' || entity['currentStamina'] > 0;
  }

  private getActingCombatants(entityIds: string[]): string[] {
    return entityIds.filter((id) => this.canEntityAct(id));
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

  private sanitizePlayerEntityChanges(
    ws: WebSocket,
    meta: ConnectionMeta,
    entity: SessionEntity,
    changes: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (entity.type !== 'hero' || entity.id !== meta.heroId) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only update your own hero' });
      return null;
    }

    const sanitized: Record<string, unknown> = {};
    for (const key of ['currentStamina', 'recoveriesCurrent', 'heroicResource']) {
      const value = changes[key];
      if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value;
    }

    const conditions = changes['conditions'];
    if (Array.isArray(conditions) && conditions.every((condition) => typeof condition === 'string')) {
      sanitized['conditions'] = conditions;
    }

    if (Object.keys(sanitized).length === 0) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'No permitted entity changes' });
      return null;
    }

    return sanitized;
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

  private handleUseAbility(ws: WebSocket, meta: ConnectionMeta, sourceId: string, targetId: string, abilityId: string): void {
    if (!this.sessionState) return;

    const source = this.sessionState.entities.find((e) => e.id === sourceId) as Record<string, unknown> | undefined;
    const target = this.sessionState.entities.find((e) => e.id === targetId) as Record<string, unknown> | undefined;
    if (!source || !target) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source or target entity not found' });
      return;
    }

    if (meta.role === 'player' && meta.heroId !== sourceId) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only use your own hero abilities' });
      return;
    }

    const combat = this.sessionState.combat;
    if (!combat || combat.activeEntityId !== sourceId) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'It is not that entity\'s turn' });
      return;
    }

    const ability = getAbilityForSource(source, abilityId);
    if (!isTargetInRange(source, target, ability.distance)) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Target is out of range' });
      return;
    }

    const turnActions = combat.turnActions[sourceId] ?? this.createTurnActions(
      typeof source['speed'] === 'number' ? source['speed'] as number : 5,
    );
    combat.turnActions[sourceId] = turnActions;
    if (!this.consumeActionSlot(ws, turnActions, ability.actionType)) return;

    // Server-side power roll: 2d10 + best available characteristic modifier.
    const modifier = getRollModifier(source);
    const dice = this.rollD10(2);
    const total = (dice[0] ?? 0) + (dice[1] ?? 0) + modifier;
    const tier = this.getTier(total);
    const effect = firstTieredEffect(resolveAbility(abilityId));
    const effectText = getTierText(effect, tier);
    const damage = extractDamage(effectText);
    const effects = effectText ? [effectText] : [];

    if (damage > 0) {
      const current = typeof target['currentStamina'] === 'number'
        ? target['currentStamina'] as number
        : typeof target['maxStamina'] === 'number'
          ? target['maxStamina'] as number
          : 0;
      const next = Math.max(0, current - damage);
      target['currentStamina'] = next;
      this.broadcast({ type: 'entity_updated', entityId: targetId, changes: { currentStamina: next } });
    }

    const result: AbilityResult = {
      sourceId,
      targetId,
      abilityId,
      abilityName: ability.name,
      dice,
      modifier,
      total,
      tier,
      damage,
      effects,
      timestamp: Date.now(),
    };

    this.broadcast({ type: 'ability_resolved', result });
    this.broadcast({ type: 'combat_updated', combat });
  }

  private consumeActionSlot(ws: WebSocket, turnActions: TurnActionState, actionType: string): boolean {
    switch (actionType) {
      case 'action':
      case 'main':
        if (turnActions.mainActionUsed || turnActions.mainConvertedTo !== null) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Main action already used' });
          return false;
        }
        turnActions.mainActionUsed = true;
        return true;
      case 'maneuver':
        if (turnActions.maneuverUsed) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Maneuver already used' });
          return false;
        }
        turnActions.maneuverUsed = true;
        return true;
      case 'triggered':
        if (turnActions.triggeredUsedThisRound) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Triggered action already used this round' });
          return false;
        }
        turnActions.triggeredUsedThisRound = true;
        return true;
      case 'move':
      case 'free':
      default:
        return true;
    }
  }

  /** Get the active scene's data object (create if missing). */
  private getActiveSceneData(): Record<string, unknown> | null {
    if (!this.sessionState) return null;
    const scene = this.sessionState.scenes.find((s) => s.id === this.sessionState!.activeSceneId);
    if (!scene) return null;
    if (!scene.data) scene.data = {};
    return scene.data;
  }

  private clampToActiveBattleGrid(x: number, y: number): { x: number; y: number } {
    const data = this.getActiveSceneData();
    const cols = typeof data?.['gridCols'] === 'number'
      ? data['gridCols'] as number
      : typeof data?.['gridSize'] === 'number'
        ? data['gridSize'] as number
        : 30;
    const rows = typeof data?.['gridRows'] === 'number' ? data['gridRows'] as number : 20;
    return {
      x: Math.max(0, Math.min(cols - 1, Math.round(x))),
      y: Math.max(0, Math.min(rows - 1, Math.round(y))),
    };
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

  private storeSceneTerrain(terrain: TerrainSync): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    if (!Array.isArray(data['terrain'])) data['terrain'] = [];
    const zones = data['terrain'] as TerrainSync[];
    if (!zones.some((zone) => zone.id === terrain.id)) zones.push(terrain);
  }

  private removeSceneTerrain(terrainId: string): void {
    const data = this.getActiveSceneData();
    if (!data || !Array.isArray(data['terrain'])) return;
    data['terrain'] = (data['terrain'] as TerrainSync[]).filter((zone) => zone.id !== terrainId);
  }


  private storeStoryReadAloud(readAloudText: string): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    data['readAloud'] = readAloudText;
  }

  private createNegotiationState(data: Record<string, unknown>): NegotiationLiveState {
    const template = data['template'] as Record<string, unknown> | undefined;
    const rawMotivations = Array.isArray(template?.['motivations'])
      ? template['motivations']
      : Array.isArray(data['motivations'])
        ? data['motivations']
        : [];
    const rawPitfalls = Array.isArray(template?.['pitfalls'])
      ? template['pitfalls']
      : Array.isArray(data['pitfalls'])
        ? data['pitfalls']
        : [];
    const startingInterest = this.getNumericSceneValue(template?.['startingInterest'], data['interest'], 2);
    const startingPatience = this.getNumericSceneValue(template?.['startingPatience'], data['patience'], 4);
    return {
      interest: startingInterest,
      patience: startingPatience,
      maxPatience: this.getNumericSceneValue(data['maxPatience'], undefined, Math.max(5, startingPatience)),
      phase: this.getNegotiationPhase(data['phase']),
      motivations: this.parseNegotiationSecrets(rawMotivations),
      pitfalls: this.parseNegotiationSecrets(rawPitfalls),
      argumentLog: [],
    };
  }

  private createMontageState(data: Record<string, unknown>): MontageLiveState {
    const outcome = typeof data['outcome'] === 'string' ? data['outcome'] : null;
    return {
      successes: this.getNumericSceneValue(data['successes'], undefined, 0),
      failures: this.getNumericSceneValue(data['failures'], undefined, 0),
      successLimit: this.getNumericSceneValue(data['successesNeeded'], undefined, 3),
      failureLimit: this.getNumericSceneValue(data['failureLimit'], undefined, 3),
      testLog: Array.isArray(data['testLog']) ? data['testLog'] as TestLogEntry[] : [],
      outcome,
    };
  }

  private createRespiteState(data: Record<string, unknown>): RespiteLiveState {
    return {
      activities: Array.isArray(data['liveActivities'])
        ? data['liveActivities'] as RespiteActivityState[]
        : this.parseRespiteActivities(data),
      completedBy: data['completedBy'] && typeof data['completedBy'] === 'object'
        ? data['completedBy'] as Record<string, string[]>
        : {},
    };
  }

  private getNumericSceneValue(primary: unknown, secondary: unknown, fallback: number): number {
    if (typeof primary === 'number' && Number.isFinite(primary)) return primary;
    if (typeof secondary === 'number' && Number.isFinite(secondary)) return secondary;
    return fallback;
  }

  private getNegotiationPhase(value: unknown): 'active' | 'success' | 'failure' {
    return value === 'success' || value === 'failure' ? value : 'active';
  }

  private parseNegotiationSecrets(rawSecrets: unknown[]): NegotiationLiveState['motivations'] {
    return rawSecrets.map((secret, index) => {
      const item = secret && typeof secret === 'object' ? secret as Record<string, unknown> : {};
      return {
        id: typeof item['id'] === 'string' ? item['id'] : `secret-${index}`,
        type: typeof item['type'] === 'string' ? item['type'] : 'discovery',
        description: typeof item['description'] === 'string' ? item['description'] : '',
        revealed: item['revealed'] === true,
      };
    });
  }

  private parseRespiteActivities(data: Record<string, unknown>): RespiteActivityState[] {
    const rawActivities = data['activities'];
    if (Array.isArray(rawActivities)) {
      return rawActivities.map((activity, index) => {
        const item = activity && typeof activity === 'object' ? activity as Record<string, unknown> : {};
        const activityType = typeof item['activityType'] === 'string' ? item['activityType'] : undefined;
        const name = typeof item['name'] === 'string'
          ? item['name']
          : activityType
            ? this.formatActivityName(activityType)
            : 'Activity';
        return {
          activityId: typeof item['id'] === 'string' ? item['id'] : activityType ?? `activity-${index}`,
          name,
          description: typeof item['description'] === 'string' ? item['description'] : '',
          claimedBy: null,
          claimedByName: null,
          completed: item['completed'] === true,
        };
      });
    }

    const availableActivities = data['availableActivities'];
    if (Array.isArray(availableActivities)) {
      return availableActivities.map((activityId, index) => {
        const id = String(activityId);
        return {
          activityId: id || `activity-${index}`,
          name: this.formatActivityName(id),
          description: '',
          claimedBy: null,
          claimedByName: null,
          completed: false,
        };
      });
    }

    if (typeof rawActivities === 'string' && rawActivities.trim()) {
      return rawActivities.split('\n').filter(Boolean).map((line, index) => {
        const name = line.trim();
        return {
          activityId: name.toLowerCase().replace(/\s+/g, '_') || `activity-${index}`,
          name,
          description: '',
          claimedBy: null,
          claimedByName: null,
          completed: false,
        };
      });
    }

    return [];
  }

  private formatActivityName(activityId: string): string {
    return activityId
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Activity';
  }

  private ensureNegotiationState(): NegotiationLiveState | null {
    if (!this.sessionState) return null;
    if (!this.sessionState.negotiation) {
      this.sessionState.negotiation = this.createNegotiationState(this.getActiveSceneData() ?? {});
    }
    return this.sessionState.negotiation;
  }

  private ensureMontageState(): MontageLiveState | null {
    if (!this.sessionState) return null;
    if (!this.sessionState.montage) {
      this.sessionState.montage = this.createMontageState(this.getActiveSceneData() ?? {});
    }
    return this.sessionState.montage;
  }

  private ensureRespiteState(): RespiteLiveState | null {
    if (!this.sessionState) return null;
    if (!this.sessionState.respite) {
      this.sessionState.respite = this.createRespiteState(this.getActiveSceneData() ?? {});
    }
    return this.sessionState.respite;
  }

  private broadcastNegotiationUpdate(): void {
    const neg = this.sessionState?.negotiation;
    if (!neg) return;
    this.syncNegotiationData(neg);
    this.broadcast({
      type: 'negotiation_updated',
      interest: neg.interest,
      patience: neg.patience,
      maxPatience: neg.maxPatience,
      phase: neg.phase,
      motivations: neg.motivations,
      pitfalls: neg.pitfalls,
      argumentLog: neg.argumentLog,
    });
  }

  private broadcastMontageUpdate(): void {
    const mont = this.sessionState?.montage;
    if (!mont) return;
    this.syncMontageData(mont);
    this.broadcast({
      type: 'montage_updated',
      successes: mont.successes,
      failures: mont.failures,
      successLimit: mont.successLimit,
      failureLimit: mont.failureLimit,
      testLog: mont.testLog,
      outcome: mont.outcome,
    });
  }

  private broadcastRespiteUpdate(): void {
    const respite = this.sessionState?.respite;
    if (!respite) return;
    this.syncRespiteData(respite);
    this.broadcast({
      type: 'respite_updated',
      activities: respite.activities,
      completedBy: respite.completedBy,
    });
  }

  private syncNegotiationData(neg: NegotiationLiveState): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    data['interest'] = neg.interest;
    data['patience'] = neg.patience;
    data['maxPatience'] = neg.maxPatience;
    data['phase'] = neg.phase;
  }

  private syncMontageData(mont: MontageLiveState): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    data['successes'] = mont.successes;
    data['failures'] = mont.failures;
    data['successesNeeded'] = mont.successLimit;
    data['failureLimit'] = mont.failureLimit;
    data['testLog'] = mont.testLog;
    data['outcome'] = mont.outcome;
  }

  private syncRespiteData(respite: RespiteLiveState): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    data['liveActivities'] = respite.activities;
    data['completedBy'] = respite.completedBy;
  }

  private syncNegotiationSecretReveal(kind: 'motivations' | 'pitfalls', id: string): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    const template = data['template'] as Record<string, unknown> | undefined;
    const rawSecrets = Array.isArray(template?.[kind])
      ? template?.[kind]
      : Array.isArray(data[kind])
        ? data[kind]
        : null;
    if (!Array.isArray(rawSecrets)) return;
    for (const secret of rawSecrets) {
      if (secret && typeof secret === 'object' && (secret as Record<string, unknown>)['id'] === id) {
        (secret as Record<string, unknown>)['revealed'] = true;
      }
    }
  }

  private syncNegotiationPhase(phase: 'success' | 'failure'): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    data['phase'] = phase;
  }

  // ── Negotiation Handlers ──

  private handleNegotiationArgument(
    ws: WebSocket,
    meta: ConnectionMeta,
    skillId: string,
    approachText: string
  ): void {
    const neg = this.ensureNegotiationState();
    if (!neg || neg.phase !== 'active') return;

    const dice = this.rollD10(2);
    const modifier = 0;
    const total = (dice[0] ?? 0) + (dice[1] ?? 0) + modifier;
    const tier = this.getTier(total);
    const interestDelta = tier === 3 ? 2 : tier === 2 ? 1 : -1;

    neg.interest = Math.max(0, Math.min(5, neg.interest + interestDelta));
    neg.patience = Math.max(0, neg.patience - 1);
    if (neg.patience === 0) neg.phase = neg.interest >= 3 ? 'success' : 'failure';

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

    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationAdjustPatience(delta: number): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.patience = Math.max(0, Math.min(neg.maxPatience, neg.patience + delta));
    if (neg.phase !== 'active' && neg.patience > 0) neg.phase = 'active';
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationAdjustInterest(delta: number): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.interest = Math.max(0, Math.min(5, neg.interest + delta));
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationReveal(kind: 'motivations' | 'pitfalls', id: string): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    const secret = neg[kind].find((candidate) => candidate.id === id);
    if (!secret) return;
    secret.revealed = true;
    this.syncNegotiationSecretReveal(kind, id);
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationEnd(phase: 'success' | 'failure'): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.phase = phase;
    this.syncNegotiationPhase(phase);
    this.broadcastNegotiationUpdate();
  }

  // ── Montage Handlers ──

  private handleMontageRoll(
    ws: WebSocket,
    meta: ConnectionMeta,
    skillId: string,
    characteristicId: string
  ): void {
    const mont = this.ensureMontageState();
    if (!mont) return;
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
    this.updateMontageOutcome(mont);
    this.broadcastMontageUpdate();
  }

  private handleMontageAdjust(track: 'successes' | 'failures', delta: number): void {
    const mont = this.ensureMontageState();
    if (!mont) return;
    const limit = track === 'successes' ? mont.successLimit : mont.failureLimit;
    mont[track] = Math.max(0, Math.min(limit, mont[track] + delta));
    this.updateMontageOutcome(mont);
    this.broadcastMontageUpdate();
  }

  private handleMontageReset(): void {
    const mont = this.ensureMontageState();
    if (!mont) return;
    mont.successes = 0;
    mont.failures = 0;
    mont.outcome = null;
    mont.testLog = [];
    this.broadcastMontageUpdate();
  }

  private updateMontageOutcome(mont: MontageLiveState): void {
    if (mont.successes >= mont.successLimit) mont.outcome = 'total_success';
    else if (mont.failures >= mont.failureLimit) mont.outcome = 'total_failure';
    else if (mont.successes >= mont.successLimit - 1 && mont.failures >= mont.failureLimit - 1) mont.outcome = 'mixed';
    else mont.outcome = null;
  }

  // ── Respite Handlers ──

  private handleRespiteChooseActivity(
    ws: WebSocket,
    meta: ConnectionMeta,
    activityId: string
  ): void {
    const respite = this.ensureRespiteState();
    if (!respite) return;

    const activity = respite.activities.find((a) => a.activityId === activityId);
    if (!activity) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Activity not found' });
      return;
    }
    if (activity.completed) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Activity already completed' });
      return;
    }
    if (activity.claimedBy && activity.claimedBy !== meta.userId && meta.role !== 'director') {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Activity already claimed' });
      return;
    }

    activity.claimedBy = meta.userId;
    activity.claimedByName = meta.username;
    this.broadcastRespiteUpdate();
  }

  private handleRespiteCompleteActivity(
    ws: WebSocket,
    meta: ConnectionMeta,
    activityId: string
  ): void {
    const respite = this.ensureRespiteState();
    if (!respite) return;

    const activity = respite.activities.find((a) => a.activityId === activityId);
    if (!activity) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Activity not found' });
      return;
    }
    if (meta.role !== 'director' && activity.claimedBy !== meta.userId) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only complete your claimed activity' });
      return;
    }

    activity.completed = true;
    const completedFor = activity.claimedBy ?? meta.userId;
    const completedActivities = respite.completedBy[completedFor] ?? [];
    if (!completedActivities.includes(activityId)) completedActivities.push(activityId);
    respite.completedBy[completedFor] = completedActivities;

    this.broadcastRespiteUpdate();
  }

  // ── Audio Handlers ──

  private async handleAudioPlay(ws: WebSocket, audioAssetId: string, loop: boolean): Promise<void> {
    if (!this.sessionState) return;

    const audio = await this.env.DB.prepare(
      `SELECT aa.name, aa.asset_id
       FROM audio_assets aa
       WHERE aa.id = ? AND aa.campaign_id = ?`,
    )
      .bind(audioAssetId, this.sessionState.campaignId)
      .first<{ name: string; asset_id: string }>();
    if (!audio) {
      this.sendTo(ws, { type: 'error', code: 'AUDIO_NOT_FOUND', message: 'Audio asset not found' });
      return;
    }

    const audioUrl = `/api/assets/${audio.asset_id}/data`;
    this.sessionState.audio = {
      playing: true,
      audioUrl,
      assetName: audio.name,
      loop,
    };
    this.broadcast({
      type: 'audio_command',
      action: 'play',
      audioUrl,
      assetName: audio.name,
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
