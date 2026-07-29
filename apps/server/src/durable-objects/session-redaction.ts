/**
 * Server-side redaction of director-only secrets before session state is
 * broadcast to player connections.
 *
 * The original design broadcast the full SessionState to every client and
 * relied on the client to hide what players shouldn't see (fog-of-war entities,
 * unrevealed negotiation motivations/pitfalls). That let any player read
 * director-only data straight out of the WebSocket payload. These pure helpers
 * strip that data for player recipients; directors still receive everything.
 */
import type {
  SessionState,
  SceneRef,
  EntityData,
  CombatState,
  NegotiationSecretState,
  NegotiationLiveState,
} from '../protocol.js';

export interface FogZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Parse fog zones out of a battle scene's data blob (the `fog` array). */
export function parseFogZones(sceneData: Record<string, unknown> | undefined | null): FogZone[] {
  if (!sceneData) return [];
  const raw = sceneData['fog'];
  if (!Array.isArray(raw)) return [];
  const zones: FogZone[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const x = finiteNumber(e['x']);
    const y = finiteNumber(e['y']);
    const w = finiteNumber(e['w']);
    const h = finiteNumber(e['h']);
    if (x === null || y === null || w === null || h === null) continue;
    zones.push({ x, y, w, h });
  }
  return zones;
}

/** Fog rectangles are half-open: [x, x + w) by [y, y + h). */
export function isInFog(x: number, y: number, zones: FogZone[]): boolean {
  for (const zone of zones) {
    if (x >= zone.x && x < zone.x + zone.w && y >= zone.y && y < zone.y + zone.h) return true;
  }
  return false;
}

/** A non-hero entity standing inside a fog zone is hidden from players. */
export function isEntityHiddenFromPlayers(entity: EntityData, fogZones: FogZone[]): boolean {
  if (fogZones.length === 0) return false;
  if (entity.type === 'hero') return false;
  const x = finiteNumber(entity.x);
  const y = finiteNumber(entity.y);
  if (x === null || y === null) return false;
  return isInFog(x, y, fogZones);
}

/** Blank the description of every secret that has not been revealed yet. */
function redactSecretList(list: unknown): NegotiationSecretState[] | null {
  if (!Array.isArray(list)) return null;
  return list.map((item) => {
    if (!item || typeof item !== 'object') return item as NegotiationSecretState;
    const secret = item as Record<string, unknown>;
    if (secret['revealed'] === true) return item as NegotiationSecretState;
    return { ...secret, description: '' } as unknown as NegotiationSecretState;
  });
}

/** Strip unrevealed motivation/pitfall text from live negotiation state. */
export function redactNegotiationLive(neg: NegotiationLiveState): NegotiationLiveState {
  return {
    ...neg,
    motivations: redactSecretList(neg.motivations) ?? neg.motivations,
    pitfalls: redactSecretList(neg.pitfalls) ?? neg.pitfalls,
  };
}

/**
 * Strip unrevealed motivation/pitfall text from a static scene-data blob.
 * Secrets live under `template.{motivations,pitfalls}` for template-authored
 * scenes, or as top-level `{motivations,pitfalls}` for the legacy shape.
 */
export function redactSceneDataNegotiation(data: Record<string, unknown>): Record<string, unknown> {
  let changed = false;
  const next: Record<string, unknown> = { ...data };

  const redactKey = (container: Record<string, unknown>, key: string): void => {
    const redacted = redactSecretList(container[key]);
    if (redacted) {
      container[key] = redacted;
      changed = true;
    }
  };

  const template = next['template'];
  if (template && typeof template === 'object' && !Array.isArray(template)) {
    const templateCopy = { ...(template as Record<string, unknown>) };
    redactKey(templateCopy, 'motivations');
    redactKey(templateCopy, 'pitfalls');
    next['template'] = templateCopy;
  }

  redactKey(next, 'motivations');
  redactKey(next, 'pitfalls');

  return changed ? next : data;
}

/**
 * Build the set of entity ids that players must not learn about.
 * Heroes are never hidden; a non-hero token standing in fog is.
 */
export function hiddenEntityIds(entities: EntityData[], fogZones: FogZone[]): Set<string> {
  const hidden = new Set<string>();
  if (fogZones.length === 0) return hidden;
  for (const entity of entities) {
    if (isEntityHiddenFromPlayers(entity, fogZones)) hidden.add(String(entity.id));
  }
  return hidden;
}

/**
 * Produce a player-safe copy of combat state.
 *
 * The Director's initiative tracker always lists every combatant, hidden or
 * not. Players see the same order with hidden combatants removed, so the
 * tracker fills in naturally as fog is lifted. Every id-keyed field has to be
 * filtered together: the client resolves ids to names through the (already
 * redacted) entity list, so an id left behind here renders as a raw uuid.
 */
export function redactCombatForPlayer(combat: CombatState, hidden: Set<string>): CombatState {
  if (hidden.size === 0) return combat;

  const visible = (id: string): boolean => !hidden.has(String(id));

  const villainGroups = combat.villainGroups
    ?.map((group) => ({ ...group, entityIds: group.entityIds.filter(visible) }))
    .filter((group) => group.entityIds.length > 0);

  const turnActions: CombatState['turnActions'] = {};
  for (const [entityId, actions] of Object.entries(combat.turnActions)) {
    if (visible(entityId)) turnActions[entityId] = actions;
  }

  return {
    ...combat,
    heroEntities: combat.heroEntities.filter(visible),
    villainEntities: combat.villainEntities.filter(visible),
    ...(villainGroups ? { villainGroups } : {}),
    actedThisRound: combat.actedThisRound.filter(visible),
    // A hidden combatant taking its turn shows players an active villain side
    // with nobody highlighted, rather than naming the hidden token.
    activeEntityId: combat.activeEntityId && visible(combat.activeEntityId)
      ? combat.activeEntityId
      : null,
    turnActions,
  };
}

/** Placeholder substituted for the name of an entity players cannot see. */
export const HIDDEN_ACTOR_LABEL = 'Something';

/**
 * True if a token action involves a hidden entity as its source, its target, or
 * the subject of any effect. Such a result is director-only: it names the hidden
 * token and reports its stamina.
 */
export function tokenActionTouchesHidden(
  result: { sourceId?: string; targetId?: string; effects?: Array<{ entityId?: string }> },
  hidden: Set<string>,
): boolean {
  if (hidden.size === 0) return false;
  if (result.sourceId && hidden.has(String(result.sourceId))) return true;
  if (result.targetId && hidden.has(String(result.targetId))) return true;
  return (result.effects ?? []).some((effect) => effect.entityId && hidden.has(String(effect.entityId)));
}

/**
 * Produce a player-safe copy of an action-log entry, or null if the entry
 * should not reach players at all.
 *
 * Entries authored by a hidden entity are dropped outright. Otherwise the names
 * of hidden entities are masked wherever they appear in the rendered text — a
 * hero hit from inside fog still sees that they took damage, but not from what.
 * Substitution is safe here because the server itself inserted these exact
 * names when it built the entry.
 */
export function redactActionLogEntryForPlayer<T extends {
  actorId?: string;
  actorName?: string;
  title?: string;
  detail?: string;
}>(entry: T, hidden: Set<string>, hiddenNames: string[]): T | null {
  if (hidden.size === 0) return entry;
  if (entry.actorId && hidden.has(String(entry.actorId))) return null;
  if (hiddenNames.length === 0) return entry;

  const mask = (value: string | undefined): string | undefined => {
    if (!value) return value;
    let masked = value;
    for (const name of hiddenNames) {
      if (name) masked = masked.split(name).join(HIDDEN_ACTOR_LABEL);
    }
    return masked;
  };

  const title = mask(entry.title);
  const detail = mask(entry.detail);
  const actorName = mask(entry.actorName);
  if (title === entry.title && detail === entry.detail && actorName === entry.actorName) return entry;
  return { ...entry, title, detail, actorName };
}

/** Names of the entities currently hidden from players, for text masking. */
export function hiddenEntityNames(entities: EntityData[], hidden: Set<string>): string[] {
  if (hidden.size === 0) return [];
  return entities
    .filter((entity) => hidden.has(String(entity.id)))
    .map((entity) => String(entity.name))
    .filter((name) => name.length > 0);
}

/**
 * Produce a player-safe copy of session state: fog-hidden non-hero entities
 * removed, combat roster and action log filtered to match, and unrevealed
 * negotiation secrets stripped. Only the affected branches are cloned; the
 * director's state object is never mutated.
 */
export function redactStateForPlayer(state: SessionState): SessionState {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const fogZones = parseFogZones(activeScene?.data);
  const hidden = hiddenEntityIds(state.entities, fogZones);

  const entities = hidden.size === 0
    ? state.entities
    : state.entities.filter((entity) => !hidden.has(String(entity.id)));

  const scenes: SceneRef[] = state.scenes.map((scene) =>
    scene.type === 'negotiation' && scene.data
      ? { ...scene, data: redactSceneDataNegotiation(scene.data) }
      : scene,
  );

  const hiddenNames = hiddenEntityNames(state.entities, hidden);
  const actionLog = hidden.size === 0
    ? state.actionLog
    : (state.actionLog ?? []).flatMap((entry) => {
        const redacted = redactActionLogEntryForPlayer(entry, hidden, hiddenNames);
        return redacted ? [redacted] : [];
      });

  return {
    ...state,
    entities,
    scenes,
    combat: state.combat ? redactCombatForPlayer(state.combat, hidden) : state.combat,
    actionLog,
    negotiation: state.negotiation ? redactNegotiationLive(state.negotiation) : state.negotiation,
  };
}
