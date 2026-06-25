/**
 * Server-side redaction of director-only secrets before broadcasting session
 * state to player connections.
 *
 * The original architecture broadcast the full SessionState to every client and
 * relied on the client to hide secrets (fog-of-war entities, unrevealed
 * negotiation motivations/pitfalls). That let any player read director-only
 * data straight from the WebSocket payload. These pure helpers strip that data
 * for player recipients; directors still receive the full state.
 */
import type {
  SessionState,
  SceneRef,
  EntityData,
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

/** Parse fog zones from a battle scene's data blob (the `fog` array). */
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

function redactSecretList(list: unknown): NegotiationSecretState[] | null {
  if (!Array.isArray(list)) return null;
  return list.map((item) => {
    if (!item || typeof item !== 'object') return item as NegotiationSecretState;
    const secret = item as Record<string, unknown>;
    if (secret['revealed'] === true) return item as NegotiationSecretState;
    return { ...(item as Record<string, unknown>), description: '' } as unknown as NegotiationSecretState;
  });
}

/** Strip descriptions from unrevealed motivations/pitfalls in live negotiation state. */
export function redactNegotiationLive(neg: NegotiationLiveState): NegotiationLiveState {
  return {
    ...neg,
    motivations: redactSecretList(neg.motivations) ?? neg.motivations,
    pitfalls: redactSecretList(neg.pitfalls) ?? neg.pitfalls,
  };
}

/**
 * Strip descriptions from unrevealed negotiation motivations/pitfalls inside a
 * static scene-data blob. Secrets may live under `template.{motivations,pitfalls}`
 * or as top-level `{motivations,pitfalls}` fallbacks.
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
 * Produce a player-safe copy of session state: unrevealed negotiation secrets
 * stripped and fog-hidden non-hero entities removed. Returns a shallow copy with
 * only the affected branches cloned; the original (director) state is untouched.
 */
export function redactStateForPlayer(state: SessionState): SessionState {
  const activeScene = state.scenes.find((scene) => scene.id === state.activeSceneId);
  const fogZones = parseFogZones(activeScene?.data);

  const entities = fogZones.length === 0
    ? state.entities
    : state.entities.filter((entity) => !isEntityHiddenFromPlayers(entity, fogZones));

  const scenes: SceneRef[] = state.scenes.map((scene) =>
    scene.type === 'negotiation' && scene.data
      ? { ...scene, data: redactSceneDataNegotiation(scene.data) }
      : scene,
  );

  return {
    ...state,
    entities,
    scenes,
    negotiation: state.negotiation ? redactNegotiationLive(state.negotiation) : state.negotiation,
  };
}
