import { DurableObject } from 'cloudflare:workers';
import {
  AbilityLogic,
  ConditionLogic,
  ForcedMovementLogic,
  GameData,
  GeometryLogic,
  HeroLogic,
  KitLogic,
  MovementLogic,
  OpportunityAttackLogic,
  RollLogic,
  UniversalActions,
  WizardLogic,
} from '@anvil/data';
import type { LevelAdvancementChoices } from '@anvil/data';
import type { Env } from '../types.js';
import type {
  CharacteristicId,
  ClientMessage,
  ServerMessage,
  SessionState,
  ParticipantInfo,
  SceneRef,
  EntityData,
  CombatAction,
  CombatEntityGroup,
  CombatState,
  TurnActionState,
  AbilityResult,
  ActionLogEntry,
  TokenActionEffect,
  TokenActionPowerRoll,
  TokenActionRequest,
  TokenActionResult,
  EntityCondition,
  ConditionEndType,
  MovementMode,
  OpportunityAttackTrigger,
  OpportunityAttackDecision,
  ThreatSource,
  ProtocolGridPoint,
  HeroInventoryItemInput,
  HeroTrackerOperation,
  DrawSteelDieResult,
  DrawSteelRollRequest,
  DrawSteelRollResult,
  SceneActionLogType,
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
  InventoryItemData,
} from '../protocol.js';
import { WS_LIMITS } from '../policy/limits.js';

interface ConnectionMeta {
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'director' | 'player';
  clientKind: 'desktop' | 'phone';
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
  culture: string | null;
  career: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  characteristics: string | null;
  kit: string | null;
  skills: string | null;
  abilities: string | null;
  portrait_asset_id: string | null;
  portrait_url: string | null;
  data: string | null;
}

interface AbilityEffectLike {
  roll?: string;
  effect?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
}

interface AbilityLike {
  id?: string;
  name?: string;
  usage?: string;
  cost?: string;
  cost_amount?: number;
  cost_resource?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
  effects?: AbilityEffectLike[];
  feature_type?: string;
  metadata?: {
    item_id?: string;
    scc?: string[];
    cost_amount?: number;
    cost_resource?: string;
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

interface SceneLiveSnapshot {
  data?: Record<string, unknown>;
  entities?: SessionEntity[];
  combat?: CombatState | null;
  negotiation?: NegotiationLiveState | null;
  montage?: MontageLiveState | null;
  respite?: RespiteLiveState | null;
  audio?: AudioLiveState | null;
  actionLog?: ActionLogEntry[];
  savedAt?: string;
}

interface HydratedSceneRef extends SceneRef {
  preparedData: Record<string, unknown>;
  snapshot: SceneLiveSnapshot | null;
}

type SessionEntity = SessionState['entities'][number];
type ConditionName = ReturnType<typeof ConditionLogic.getAllConditionNames>[number];

const CHARACTERISTIC_IDS = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;
const VALID_CONDITIONS = new Set<string>(ConditionLogic.getAllConditionNames());
const MAX_ACTION_LOG_ENTRIES: number = 200;
const MAX_INVENTORY_ITEMS: number = WS_LIMITS.inventoryItems;
const MAX_INVENTORY_TEXT_LENGTH: number = WS_LIMITS.inventoryTextLength;
const MAX_WS_MESSAGE_LENGTH: number = WS_LIMITS.messageBytes;
const MAX_ENTITY_JSON_LENGTH: number = WS_LIMITS.entityJsonBytes;
const MAX_PATCH_JSON_LENGTH: number = WS_LIMITS.patchJsonBytes;
const MAX_SCENE_SHAPE_POINTS: number = WS_LIMITS.sceneShapePoints;
const MAX_STORY_TEXT_LENGTH: number = WS_LIMITS.storyTextLength;
const MAX_APPROACH_TEXT_LENGTH: number = WS_LIMITS.approachTextLength;
const MAX_ID_LENGTH: number = WS_LIMITS.idLength;
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const VALID_INVENTORY_SOURCES = new Set(['mcdm-treasure', 'mcdm-imbuement', 'custom']);
const VALID_INVENTORY_CATEGORIES = new Set([
  'consumable',
  'trinket',
  'leveled',
  'artifact',
  'imbuement',
  'material',
  'mundane',
  'misc',
]);

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
    `ck:${meta.clientKind}`,
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
  const clientKind = map.get('ck') === 'phone' ? 'phone' : 'desktop';
  const sessionId = map.get('sid');
  if (!userId || !username || !role || !sessionId) return null;
  return {
    userId,
    username,
    avatarUrl: map.get('av') ?? null,
    role,
    clientKind,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeLevelUpChoices(value: unknown): LevelAdvancementChoices | undefined {
  if (!isRecord(value)) return undefined;

  const choices: LevelAdvancementChoices = {};
  for (const [key, rawChoices] of Object.entries(value)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 2 || level > 10) continue;
    if (!Array.isArray(rawChoices)) continue;
    choices[level] = rawChoices
      .filter(isRecord)
      .filter((choice) => typeof choice['featureId'] === 'string' && typeof choice['choiceId'] === 'string')
      .map((choice) => ({
        featureId: choice['featureId'] as string,
        choiceId: choice['choiceId'] as string,
        category: typeof choice['category'] === 'string' ? choice['category'] : undefined,
      }));
  }

  return choices;
}

function safeString(value: unknown, maxLength = MAX_ID_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function boundedNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function boundedInteger(value: unknown, min: number, max: number): number | null {
  const number = boundedNumber(value, min, max);
  if (number === null || !Number.isInteger(number)) return null;
  return number;
}

function boundedIdArray(value: unknown, maxItems = 100): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const ids = value.map((item) => safeString(item));
  if (ids.some((item) => item === null)) return null;
  return ids as string[];
}

function validateCombatGroups(value: unknown): CombatEntityGroup[] | null {
  if (!Array.isArray(value) || value.length > 40) return null;

  const groups = value.map((item) => {
    if (!isRecord(item)) return null;
    const id = safeString(item['id']);
    const name = safeString(item['name'], 120);
    const entityIds = boundedIdArray(item['entityIds'], 100);
    if (!id || !name || !entityIds || entityIds.length === 0) return null;
    return { id, name, entityIds };
  });

  if (groups.some((group) => group === null)) return null;
  return groups as CombatEntityGroup[];
}

function sanitizeCombatGroups(
  groups: CombatEntityGroup[],
  validEntityIds: string[],
): CombatEntityGroup[] {
  const validIds = new Set(validEntityIds);
  const usedEntityIds = new Set<string>();
  const usedGroupIds = new Set<string>();

  return groups.flatMap((group, index): CombatEntityGroup[] => {
    const entityIds = group.entityIds.filter((entityId) => {
      if (!validIds.has(entityId) || usedEntityIds.has(entityId)) return false;
      usedEntityIds.add(entityId);
      return true;
    });
    if (entityIds.length === 0) return [];

    let id = group.id;
    if (usedGroupIds.has(id)) id = `${id}-${index + 1}`;
    usedGroupIds.add(id);

    return [{ id, name: group.name, entityIds }];
  });
}

function jsonLength(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function hasUnsafeObjectKey(value: unknown, depth = 0): boolean {
  if (depth > 8) return true;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeObjectKey(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => (
    UNSAFE_OBJECT_KEYS.has(key) || key.length > 160 || hasUnsafeObjectKey(child, depth + 1)
  ));
}

function validateEntityData(value: unknown): EntityData | null {
  if (!isRecord(value)) return null;
  if (jsonLength(value) > MAX_ENTITY_JSON_LENGTH) return null;
  if (hasUnsafeObjectKey(value)) return null;
  const id = safeString(value['id']);
  const name = safeString(value['name'], 180);
  const type = safeString(value['type'], 40);
  const x = boundedNumber(value['x'], -100_000, 100_000);
  const y = boundedNumber(value['y'], -100_000, 100_000);
  if (!id || !name || !type || x === null || y === null) return null;
  return value as EntityData;
}

function validateRecordPatch(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || jsonLength(value) > MAX_PATCH_JSON_LENGTH) return null;
  if (hasUnsafeObjectKey(value)) return null;
  return value;
}

function validateDrawing(value: unknown): DrawingSync | null {
  if (!isRecord(value)) return null;
  const id = safeString(value['id']);
  const type = safeString(value['type'], 40);
  const color = safeString(value['color'], 40);
  const width = boundedNumber(value['width'], 0.25, 100);
  const points = Array.isArray(value['points']) ? value['points'] : null;
  if (!id || !type || !color || width === null || !points || points.length > MAX_SCENE_SHAPE_POINTS) return null;
  if (!points.every((point) => typeof point === 'number' && Number.isFinite(point))) return null;
  return { id, type, color, width, points };
}

function validateFog(value: unknown): FogSync | null {
  if (!isRecord(value)) return null;
  const id = safeString(value['id']);
  const x = boundedNumber(value['x'], -100_000, 100_000);
  const y = boundedNumber(value['y'], -100_000, 100_000);
  const w = boundedNumber(value['w'], 1, 100_000);
  const h = boundedNumber(value['h'], 1, 100_000);
  if (!id || x === null || y === null || w === null || h === null) return null;
  return { id, x, y, w, h };
}

function validateTerrain(value: unknown): TerrainSync | null {
  if (!isRecord(value)) return null;
  const id = safeString(value['id']);
  const terrainId = safeString(value['terrainId']);
  const name = safeString(value['name'], 180);
  const x = boundedNumber(value['x'], -100_000, 100_000);
  const y = boundedNumber(value['y'], -100_000, 100_000);
  const w = boundedNumber(value['w'], 1, 100_000);
  const h = boundedNumber(value['h'], 1, 100_000);
  if (!id || !terrainId || !name || x === null || y === null || w === null || h === null) return null;
  return {
    id,
    terrainId,
    name,
    x,
    y,
    w,
    h,
    ...(typeof value['color'] === 'number' && Number.isFinite(value['color']) ? { color: value['color'] } : {}),
    ...(typeof value['hidden'] === 'boolean' ? { hidden: value['hidden'] } : {}),
  };
}

function validateCombatAction(value: unknown): CombatAction | null {
  if (!isRecord(value)) return null;
  switch (value['type']) {
    case 'START_COMBAT': {
      const heroEntityIds = boundedIdArray(value['heroEntityIds']);
      const villainEntityIds = boundedIdArray(value['villainEntityIds']);
      const villainGroups = value['villainGroups'] === undefined
        ? undefined
        : validateCombatGroups(value['villainGroups']);
      if (!heroEntityIds || !villainEntityIds || villainGroups === null) return null;
      return {
        type: 'START_COMBAT',
        heroEntityIds,
        villainEntityIds,
        ...(villainGroups ? { villainGroups } : {}),
      };
    }
    case 'ROLL_INITIATIVE':
      return { type: 'ROLL_INITIATIVE' };
    case 'END_COMBAT':
      return { type: 'END_COMBAT' };
    case 'CLAIM_TURN':
    case 'SELECT_TURN':
    case 'APPLY_DAMAGE':
    case 'APPLY_HEALING':
    case 'APPLY_CONDITION':
    case 'REMOVE_CONDITION':
    case 'CATCH_BREATH':
    case 'DEFEND':
      break;
    case 'END_TURN':
      return { type: 'END_TURN' };
    case 'ADJUST_MALICE': {
      const delta = boundedInteger(value['delta'], -99, 99);
      return delta === null ? null : { type: 'ADJUST_MALICE', delta };
    }
    default:
      return null;
  }

  const entityId = safeString(value['entityId']);
  if (!entityId) return null;
  if (value['type'] === 'APPLY_DAMAGE' || value['type'] === 'APPLY_HEALING') {
    const amount = boundedNumber(value['amount'], 0, 100_000);
    return amount === null ? null : { type: value['type'], entityId, amount };
  }
  if (value['type'] === 'APPLY_CONDITION') {
    const condition = safeString(value['condition'], 80);
    return condition ? { type: 'APPLY_CONDITION', entityId, condition } : null;
  }
  if (value['type'] === 'REMOVE_CONDITION') {
    const conditionId = safeString(value['conditionId'], 80);
    return conditionId ? { type: 'REMOVE_CONDITION', entityId, conditionId } : null;
  }
  return { type: value['type'] as 'CLAIM_TURN' | 'SELECT_TURN' | 'CATCH_BREATH' | 'DEFEND', entityId };
}

function validateTokenAction(value: unknown): TokenActionRequest | null {
  if (!isRecord(value)) return null;
  const kind = safeString(value['kind'], 40) as TokenActionRequest['kind'] | null;
  if (!kind || ![
    'ability',
    'free-strike',
    'grab',
    'knockback',
    'catch-breath',
    'defend',
    'stand-up',
    'escape-grab',
    'manual-damage',
    'manual-heal',
    'apply-condition',
    'remove-condition',
  ].includes(kind)) return null;

  const characteristic = safeString(value['characteristic'], 20);
  if (characteristic && !CHARACTERISTIC_IDS.includes(characteristic as CharacteristicId)) return null;
  const amount = value['amount'] === undefined ? undefined : boundedNumber(value['amount'], 0, 100_000);
  const edges = value['edges'] === undefined ? undefined : boundedInteger(value['edges'], 0, 2);
  const banes = value['banes'] === undefined ? undefined : boundedInteger(value['banes'], 0, 2);
  if (amount === null || edges === null || banes === null) return null;

  return {
    kind,
    ...(safeString(value['sourceId']) ? { sourceId: safeString(value['sourceId'])! } : {}),
    ...(safeString(value['targetId']) ? { targetId: safeString(value['targetId'])! } : {}),
    ...(safeString(value['abilityId']) ? { abilityId: safeString(value['abilityId'])! } : {}),
    ...(amount !== undefined ? { amount } : {}),
    ...(safeString(value['condition'], 80) ? { condition: safeString(value['condition'], 80)! } : {}),
    ...(edges !== undefined ? { edges } : {}),
    ...(banes !== undefined ? { banes } : {}),
    ...(characteristic ? { characteristic: characteristic as CharacteristicId } : {}),
    ...(safeString(value['notes'], 1_000) ? { notes: safeString(value['notes'], 1_000)! } : {}),
  };
}

const EDGE_BANE_LABELS: Record<string, string> = {
  edge: 'Edge (+2)',
  'double-edge': 'Double edge (tier up)',
  bane: 'Bane (−2)',
  'double-bane': 'Double bane (tier down)',
};

function validateDrawSteelRoll(value: unknown): DrawSteelRollRequest | null {
  if (!isRecord(value)) return null;
  const kind = safeString(value['kind'], 40);
  if (kind !== 'power' && kind !== 'heroic-resource' && kind !== 'd6') return null;
  const modifier = value['modifier'] === undefined ? undefined : boundedInteger(value['modifier'], -100, 100);
  if (modifier === null) return null;
  const edges = value['edges'] === undefined ? undefined : boundedInteger(value['edges'], 0, 2);
  if (edges === null) return null;
  const banes = value['banes'] === undefined ? undefined : boundedInteger(value['banes'], 0, 2);
  if (banes === null) return null;
  return {
    kind,
    ...(safeString(value['label'], 120) ? { label: safeString(value['label'], 120)! } : {}),
    ...(modifier !== undefined ? { modifier } : {}),
    ...(edges !== undefined ? { edges } : {}),
    ...(banes !== undefined ? { banes } : {}),
    ...(safeString(value['sourceId']) ? { sourceId: safeString(value['sourceId'])! } : {}),
  };
}

function validateHeroInventoryItem(value: unknown): HeroInventoryItemInput | null {
  const item = sanitizeInventory([value])[0];
  return item ? { ...item } : null;
}

function validateHeroInventoryChanges(value: unknown): Partial<HeroInventoryItemInput> | null {
  if (!isRecord(value)) return null;
  const changes: Partial<HeroInventoryItemInput> = {};

  if (value['name'] !== undefined) {
    const name = inventoryString(value['name'], 160);
    if (!name) return null;
    changes.name = name;
  }
  if (value['quantity'] !== undefined) {
    const quantity = boundedInteger(value['quantity'], 0, 999);
    if (quantity === null) return null;
    changes.quantity = quantity;
  }
  if (value['category'] !== undefined) {
    const category = inventoryString(value['category'], 40);
    if (!category || !VALID_INVENTORY_CATEGORIES.has(category)) return null;
    changes.category = category as InventoryItemData['category'];
  }
  if (value['source'] !== undefined) {
    const source = inventoryString(value['source'], 40);
    if (!source || !VALID_INVENTORY_SOURCES.has(source)) return null;
    changes.source = source as InventoryItemData['source'];
  }
  if (value['description'] !== undefined) changes.description = inventoryString(value['description']) ?? '';
  if (value['effect'] !== undefined) changes.effect = inventoryString(value['effect']);
  if (value['flavorText'] !== undefined) changes.flavorText = inventoryString(value['flavorText']);
  if (value['notes'] !== undefined) changes.notes = inventoryString(value['notes']);
  if (value['equipped'] !== undefined) changes.equipped = value['equipped'] === true;

  return changes;
}

function validateHeroTrackerOperation(value: unknown): HeroTrackerOperation | null {
  if (!isRecord(value)) return null;
  const kind = value['kind'];
  switch (kind) {
    case 'adjust_stamina':
    case 'adjust_recoveries':
    case 'adjust_heroic_resource':
    case 'adjust_victories': {
      const delta = boundedInteger(value['delta'], -999, 999);
      return delta === null ? null : { kind, delta };
    }
    case 'set_stamina': {
      const stamina = boundedInteger(value['value'], 0, 9999);
      return stamina === null ? null : { kind, value: stamina };
    }
    case 'spend_recovery':
      return { kind };
    case 'inventory_add': {
      const item = validateHeroInventoryItem(value['item']);
      return item ? { kind, item } : null;
    }
    case 'inventory_update': {
      const itemId = safeString(value['itemId']);
      const changes = validateHeroInventoryChanges(value['changes']);
      return itemId && changes ? { kind, itemId, changes } : null;
    }
    case 'inventory_remove': {
      const itemId = safeString(value['itemId']);
      return itemId ? { kind, itemId } : null;
    }
    default:
      return null;
  }
}

function parseClientMessagePayload(raw: unknown): { msg?: ClientMessage; error?: string } {
  if (!isRecord(raw)) return { error: 'Message must be an object' };
  const type = raw['type'];

  switch (type) {
    case 'request_state':
    case 'ping':
    case 'end_session':
    case 'montage_reset':
    case 'audio_pause':
    case 'audio_stop':
      return { msg: { type } as ClientMessage };

    case 'ready':
      return typeof raw['ready'] === 'boolean' ? { msg: { type, ready: raw['ready'] } } : { error: 'Invalid ready state' };
    case 'select_hero': {
      const heroId = safeString(raw['heroId']);
      return heroId ? { msg: { type, heroId } } : { error: 'Invalid hero' };
    }
    case 'switch_scene': {
      const sceneId = safeString(raw['sceneId']);
      return sceneId ? { msg: { type, sceneId } } : { error: 'Invalid scene' };
    }
    case 'revert_scene': {
      const sceneId = raw['sceneId'] === undefined ? undefined : safeString(raw['sceneId']);
      return sceneId === null ? { error: 'Invalid scene' } : { msg: { type, ...(sceneId ? { sceneId } : {}) } };
    }
    case 'create_entity': {
      const entity = validateEntityData(raw['entity']);
      return entity ? { msg: { type, entity } } : { error: 'Invalid entity' };
    }
    case 'update_entity': {
      const entityId = safeString(raw['entityId']);
      const changes = validateRecordPatch(raw['changes']);
      return entityId && changes ? { msg: { type, entityId, changes } } : { error: 'Invalid entity update' };
    }
    case 'delete_entity': {
      const entityId = safeString(raw['entityId']);
      return entityId ? { msg: { type, entityId } } : { error: 'Invalid entity' };
    }
    case 'move_token': {
      const entityId = safeString(raw['entityId']);
      const x = boundedNumber(raw['x'], -100_000, 100_000);
      const y = boundedNumber(raw['y'], -100_000, 100_000);
      return entityId && x !== null && y !== null ? { msg: { type, entityId, x, y } } : { error: 'Invalid token move' };
    }
    case 'combat_action': {
      const action = validateCombatAction(raw['action']);
      return action ? { msg: { type, action } } : { error: 'Invalid combat action' };
    }
    case 'token_action': {
      const action = validateTokenAction(raw['action']);
      return action ? { msg: { type, action } } : { error: 'Invalid token action' };
    }
    case 'director_focus': {
      const entityId = safeString(raw['entityId']);
      return entityId ? { msg: { type, entityId } } : { error: 'Invalid focus' };
    }
    case 'draw_steel_roll': {
      const roll = validateDrawSteelRoll(raw['roll']);
      return roll ? { msg: { type, roll } } : { error: 'Invalid roll' };
    }
    case 'hero_tracker_update': {
      const heroId = safeString(raw['heroId']);
      const op = validateHeroTrackerOperation(raw['op']);
      return heroId && op ? { msg: { type, heroId, op } } : { error: 'Invalid hero tracker update' };
    }
    case 'use_ability': {
      const sourceId = safeString(raw['sourceId']);
      const targetId = safeString(raw['targetId']);
      const abilityId = safeString(raw['abilityId']);
      return sourceId && targetId && abilityId ? { msg: { type, sourceId, targetId, abilityId } } : { error: 'Invalid ability request' };
    }
    case 'update_inventory': {
      const heroId = safeString(raw['heroId']);
      return heroId && Array.isArray(raw['inventory']) && raw['inventory'].length <= MAX_INVENTORY_ITEMS
        ? { msg: { type, heroId, inventory: sanitizeInventory(raw['inventory']) } }
        : { error: 'Invalid inventory update' };
    }
    case 'scene_drawing_add': {
      const drawing = validateDrawing(raw['drawing']);
      return drawing ? { msg: { type, drawing } } : { error: 'Invalid drawing' };
    }
    case 'scene_drawing_remove': {
      const drawingId = safeString(raw['drawingId']);
      return drawingId ? { msg: { type, drawingId } } : { error: 'Invalid drawing' };
    }
    case 'scene_fog_add': {
      const fog = validateFog(raw['fog']);
      return fog ? { msg: { type, fog } } : { error: 'Invalid fog' };
    }
    case 'scene_fog_remove': {
      const fogId = safeString(raw['fogId']);
      return fogId ? { msg: { type, fogId } } : { error: 'Invalid fog' };
    }
    case 'scene_terrain_add':
    case 'scene_terrain_update': {
      const terrain = validateTerrain(raw['terrain']);
      return terrain ? { msg: { type, terrain } as ClientMessage } : { error: 'Invalid terrain' };
    }
    case 'scene_terrain_remove': {
      const terrainId = safeString(raw['terrainId']);
      return terrainId ? { msg: { type, terrainId } } : { error: 'Invalid terrain' };
    }
    case 'negotiation_argument': {
      const skillId = safeString(raw['skillId'], 120);
      const approachText = safeString(raw['approachText'], MAX_APPROACH_TEXT_LENGTH);
      return skillId && approachText ? { msg: { type, skillId, approachText } } : { error: 'Invalid negotiation argument' };
    }
    case 'negotiation_adjust_patience':
    case 'negotiation_adjust_interest': {
      const delta = boundedInteger(raw['delta'], -10, 10);
      return delta === null ? { error: 'Invalid adjustment' } : { msg: { type, delta } as ClientMessage };
    }
    case 'negotiation_reveal_motivation':
    case 'negotiation_reveal_pitfall': {
      const id = safeString(raw['id']);
      return id ? { msg: { type, id } as ClientMessage } : { error: 'Invalid reveal target' };
    }
    case 'negotiation_end':
      return raw['phase'] === 'success' || raw['phase'] === 'failure'
        ? { msg: { type, phase: raw['phase'] } }
        : { error: 'Invalid negotiation phase' };
    case 'montage_roll': {
      const skillId = safeString(raw['skillId'], 120);
      const characteristicId = safeString(raw['characteristicId'], 20);
      return skillId && characteristicId && CHARACTERISTIC_IDS.includes(characteristicId as CharacteristicId)
        ? { msg: { type, skillId, characteristicId } }
        : { error: 'Invalid montage roll' };
    }
    case 'montage_adjust_successes':
    case 'montage_adjust_failures': {
      const delta = boundedInteger(raw['delta'], -10, 10);
      return delta === null ? { error: 'Invalid montage adjustment' } : { msg: { type, delta } as ClientMessage };
    }
    case 'respite_choose_activity':
    case 'respite_complete_activity': {
      const activityId = safeString(raw['activityId']);
      return activityId ? { msg: { type, activityId } as ClientMessage } : { error: 'Invalid respite activity' };
    }
    case 'audio_play': {
      const audioAssetId = safeString(raw['audioAssetId']);
      return audioAssetId && typeof raw['loop'] === 'boolean'
        ? { msg: { type, audioAssetId, loop: raw['loop'] } }
        : { error: 'Invalid audio request' };
    }
    case 'story_update': {
      const readAloudText = typeof raw['readAloudText'] === 'string' && raw['readAloudText'].length <= MAX_STORY_TEXT_LENGTH
        ? raw['readAloudText']
        : null;
      return readAloudText !== null ? { msg: { type, readAloudText } } : { error: 'Invalid story text' };
    }
    default:
      return { error: 'Unsupported message type' };
  }
}

function inventoryString(value: unknown, maxLength = MAX_INVENTORY_TEXT_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function inventoryNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(1, Math.floor(parsed));
  }
  return undefined;
}

function inventoryStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 80))
    .slice(0, 12);
  return items.length > 0 ? items : undefined;
}

function sanitizeInventory(value: unknown): InventoryItemData[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_INVENTORY_ITEMS).flatMap((item, index): InventoryItemData[] => {
    if (!isRecord(item)) return [];
    const name = inventoryString(item['name'], 160);
    if (!name) return [];

    const rawSource = inventoryString(item['source'], 40);
    const rawCategory = inventoryString(item['category'], 40);
    const source = rawSource && VALID_INVENTORY_SOURCES.has(rawSource)
      ? rawSource as InventoryItemData['source']
      : 'custom';
    const category = rawCategory && VALID_INVENTORY_CATEGORIES.has(rawCategory)
      ? rawCategory as InventoryItemData['category']
      : 'misc';

    const enhancements = Array.isArray(item['enhancements'])
      ? item['enhancements'].slice(0, 12).flatMap((enhancement): NonNullable<InventoryItemData['enhancements']> => {
          if (!isRecord(enhancement)) return [];
          const level = inventoryNumber(enhancement['level']);
          const description = inventoryString(enhancement['description'] ?? enhancement['effect']);
          if (!level || !description) return [];
          const name = inventoryString(enhancement['name'], 80);
          return [{ level, ...(name ? { name } : {}), description }];
        })
      : undefined;

    const id = inventoryString(item['id'], 220) ?? `inventory-${index}`;
    const catalogId = inventoryString(item['catalogId'], 220);
    const quantity = inventoryNumber(item['quantity']) ?? 1;
    const description = inventoryString(item['description']) ?? inventoryString(item['effect']) ?? '';
    const effect = inventoryString(item['effect']);
    const flavorText = inventoryString(item['flavorText']);
    const echelon = inventoryNumber(item['echelon']);
    const level = inventoryNumber(item['level']);
    const slot = inventoryString(item['slot'], 60);
    const keywords = inventoryStringArray(item['keywords']);
    const projectGoal = inventoryNumber(item['projectGoal']);
    const notes = inventoryString(item['notes']);

    return [{
      id,
      ...(catalogId ? { catalogId } : {}),
      source,
      name,
      category,
      quantity,
      description,
      ...(effect ? { effect } : {}),
      ...(flavorText ? { flavorText } : {}),
      ...(echelon ? { echelon } : {}),
      ...(level ? { level } : {}),
      ...(slot ? { slot } : {}),
      ...(keywords ? { keywords } : {}),
      ...(projectGoal ? { projectGoal } : {}),
      equipped: item['equipped'] === true,
      ...(enhancements && enhancements.length > 0 ? { enhancements } : {}),
      ...(notes ? { notes } : {}),
    }];
  });
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

function toRuntimeAbility(abilityId: string, abilityOverride?: AbilityLike): RuntimeAbility {
  const ability = abilityOverride ?? resolveAbility(abilityId);
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

function findSourceFeature(source: Record<string, unknown>, abilityId: string): AbilityLike | undefined {
  const features = Array.isArray(source['features']) ? source['features'] as AbilityLike[] : [];
  const normalizedId = abilityId.toLowerCase();
  return features.find((feature) => {
    const ids = [
      feature.id,
      feature.name,
      feature.metadata?.item_id,
      ...(feature.metadata?.scc ?? []),
    ]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase());
    return ids.includes(normalizedId);
  });
}

function getResolvedAbilityForSource(source: Record<string, unknown>, abilityId: string): AbilityLike | undefined {
  return findSourceFeature(source, abilityId) ?? resolveAbility(abilityId);
}

function getAbilityForSource(source: Record<string, unknown>, abilityId: string): RuntimeAbility {
  const abilities = Array.isArray(source['abilities']) ? source['abilities'] as RuntimeAbility[] : [];
  const selected = abilities.find((ability) => ability.id === abilityId);
  if (selected) return selected;
  const sourceAbility = getResolvedAbilityForSource(source, abilityId);
  return toRuntimeAbility(abilityId, sourceAbility);
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
   * Per-connection token-bucket throttle for inbound WebSocket messages.
   * Capacity is the burst allowance (dragging a token streams positions);
   * refill is the sustained rate. State is in-memory only and resets after
   * hibernation, which is acceptable — a sustained flood keeps the DO awake.
   */
  private wsRateState = new WeakMap<WebSocket, { tokens: number; last: number; notified: boolean }>();
  private static readonly WS_RATE_CAPACITY = 60;
  private static readonly WS_RATE_REFILL_PER_SEC = 30;

  /** Returns true if the message fits the rate budget, consuming one token. */
  private allowWsMessage(ws: WebSocket): boolean {
    const now = Date.now();
    const state = this.wsRateState.get(ws) ?? { tokens: SessionRoom.WS_RATE_CAPACITY, last: now, notified: false };
    const elapsedSeconds = Math.max(0, (now - state.last) / 1000);
    state.tokens = Math.min(
      SessionRoom.WS_RATE_CAPACITY,
      state.tokens + elapsedSeconds * SessionRoom.WS_RATE_REFILL_PER_SEC,
    );
    state.last = now;
    if (state.tokens < 1) {
      this.wsRateState.set(ws, state);
      return false;
    }
    state.tokens -= 1;
    state.notified = false;
    this.wsRateState.set(ws, state);
    return true;
  }

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

  private async refreshMetaFromParticipant(meta: ConnectionMeta): Promise<ConnectionMeta> {
    const row = await this.env.DB.prepare(
      'SELECT hero_id, status FROM session_participants WHERE game_session_id = ? AND user_id = ?',
    )
      .bind(meta.sessionId, meta.userId)
      .first<{ hero_id: string | null; status: string }>();
    if (!row) return meta;
    return {
      ...meta,
      heroId: row.hero_id,
      ready: row.status === 'ready',
    };
  }

  private hasDesktopAnchor(meta: ConnectionMeta): boolean {
    if (meta.clientKind !== 'phone') return true;
    return this.getConnections().some(({ meta: candidate }) =>
      candidate.clientKind !== 'phone' &&
      candidate.userId === meta.userId &&
      candidate.sessionId === meta.sessionId
    );
  }

  private sendPhoneAnchorStatus(ws: WebSocket, meta: ConnectionMeta): void {
    if (meta.clientKind !== 'phone') return;
    this.sendTo(ws, { type: 'phone_anchor_status', anchored: this.hasDesktopAnchor(meta) });
  }

  private broadcastPhoneAnchorStatus(): void {
    for (const { ws, meta } of this.getConnections()) {
      this.sendPhoneAnchorStatus(ws, meta);
    }
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

  private async handleWebSocket(request: Request, url: URL): Promise<Response> {
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    const avatarUrl = url.searchParams.get('avatarUrl');
    const role = url.searchParams.get('role') as 'director' | 'player';
    const clientKind = url.searchParams.get('clientKind') === 'phone' ? 'phone' : 'desktop';
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
      clientKind,
      heroId,
      ready: false,
      sessionId,
      campaignId: campaignId ?? null,
    };

    this.mutableConnectionMeta.set(server, meta);

    // Accept with tags — tags persist across hibernation, unlike in-memory state
    this.ctx.acceptWebSocket(server, encodeTags(meta));

    // Broadcast updated participant list
    await this.broadcastParticipants();
    this.broadcastPhoneAnchorStatus();

    // A player who joined mid-session (via REST /join, which doesn't notify this
    // DO) may bring a hero the room hasn't loaded. Pull it in + broadcast so the
    // Director's panels and the canvas show them.
    if (
      role === 'player' &&
      heroId &&
      this.sessionState &&
      !this.sessionState.entities.some((entity) => entity.id === heroId)
    ) {
      await this.refreshHeroEntities();
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    let meta = this.getMetaForSocket(ws);
    if (!meta) return;

    // Per-connection flood protection. Drop over-budget messages, notifying the
    // client at most once per throttled burst so the error cannot itself be
    // used as an amplification vector.
    if (!this.allowWsMessage(ws)) {
      const state = this.wsRateState.get(ws);
      if (state && !state.notified) {
        state.notified = true;
        this.wsRateState.set(ws, state);
        this.sendTo(ws, { type: 'error', code: 'RATE_LIMITED', message: 'Too many messages — slow down' });
      }
      return;
    }

    // Recover sessionId after hibernation wake (in-memory fields are lost)
    if (!this.sessionId) {
      this.sessionId = meta.sessionId;
      this.campaignId = meta.campaignId;
    }

    // Ensure session state is hydrated (guards against concurrent calls after hibernation)
    await this.ensureHydrated();
    meta = await this.refreshMetaFromParticipant(meta);

    let msg: ClientMessage;
    if (message.length > MAX_WS_MESSAGE_LENGTH) {
      this.sendTo(ws, { type: 'error', code: 'MESSAGE_TOO_LARGE', message: 'Message is too large' });
      return;
    }

    try {
      const parsed = parseClientMessagePayload(JSON.parse(message));
      if (!parsed.msg) {
        this.sendTo(ws, { type: 'error', code: 'INVALID_MESSAGE', message: parsed.error ?? 'Invalid message' });
        return;
      }
      msg = parsed.msg;
    } catch {
      this.sendTo(ws, { type: 'error', code: 'PARSE_ERROR', message: 'Invalid JSON' });
      return;
    }

    if (meta.clientKind === 'phone' && msg.type !== 'ping' && msg.type !== 'request_state' && !this.hasDesktopAnchor(meta)) {
      this.sendPhoneAnchorStatus(ws, meta);
      this.sendTo(ws, {
        type: 'error',
        code: 'PHONE_ANCHOR_REQUIRED',
        message: 'Open this session on desktop first to sync the phone companion.',
      });
      return;
    }

    switch (msg.type) {
      case 'ping':
        this.sendTo(ws, { type: 'pong' });
        break;

      case 'request_state':
        if (meta.clientKind === 'phone') {
          this.sendPhoneAnchorStatus(ws, meta);
          if (!this.hasDesktopAnchor(meta)) return;
        }
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
        await this.broadcastParticipants();
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

        await this.refreshHeroEntities();

        this.updateTag(ws, { ...meta, heroId: msg.heroId });
        await this.broadcastParticipants();
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
          await this.persistActiveSceneSnapshot();
          this.sessionState.activeSceneId = msg.sceneId;
          await this.persistActiveScene(msg.sceneId);
          this.replaceSceneEntities(msg.sceneId);
          // Initialize mode-specific live state for the new scene
          this.initializeSceneLiveState(msg.sceneId);
          await this.persistActiveSceneSnapshot();
        }
        this.broadcast({ type: 'scene_changed', sceneId: msg.sceneId });
        if (this.sessionState) this.broadcast({ type: 'state', state: this.sessionState });
        break;

      case 'revert_scene':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        await this.handleRevertScene(ws, msg.sceneId);
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

      case 'update_inventory':
        await this.handleInventoryUpdate(ws, meta, msg.heroId, msg.inventory);
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

        this.moveEntityTo(entity as unknown as Record<string, unknown>, msg.x, msg.y);
        break;
      }

      case 'commit_move':
        this.handleCommitMove(ws, meta, msg.entityId, msg.path, msg.mode);
        break;

      case 'resolve_forced_movement':
        this.handleResolveForcedMovement(ws, msg.sourceId, msg.targetId, msg.kind, msg.distance, msg.direction);
        break;

      case 'resolve_opportunity_attack':
        await this.handleResolveOpportunityAttack(ws, meta, msg.trigger, msg.decision);
        break;

      case 'combat_action':
        await this.handleCombatAction(ws, meta, msg.action);
        break;

      case 'token_action':
        await this.handleTokenAction(ws, meta, msg.action);
        break;

      case 'director_focus':
        // Director pulls everyone's camera to a token.
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.broadcast({ type: 'focus_broadcast', entityId: msg.entityId });
        break;

      case 'draw_steel_roll':
        this.handleDrawSteelRoll(meta, msg.roll);
        break;

      case 'hero_tracker_update':
        await this.handleHeroTrackerUpdate(ws, meta, msg.heroId, msg.op);
        break;

      case 'use_ability':
        await this.handleUseAbility(ws, meta, msg.sourceId, msg.targetId, msg.abilityId);
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
        {
          const terrain = this.clampTerrainToActiveBattleGrid(msg.terrain);
          this.storeSceneTerrain(terrain);
          this.broadcast({ type: 'scene_terrain_added', terrain });
        }
        break;

      case 'scene_terrain_update':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        {
          const terrain = this.clampTerrainToActiveBattleGrid(msg.terrain);
          this.updateSceneTerrain(terrain);
          this.broadcast({ type: 'scene_terrain_updated', terrain });
        }
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
        this.handleNegotiationAdjustPatience(meta, msg.delta);
        break;

      case 'negotiation_adjust_interest':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationAdjustInterest(meta, msg.delta);
        break;

      case 'negotiation_reveal_motivation':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationReveal(meta, 'motivations', msg.id);
        break;

      case 'negotiation_reveal_pitfall':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationReveal(meta, 'pitfalls', msg.id);
        break;

      case 'negotiation_end':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleNegotiationEnd(meta, msg.phase);
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
        this.handleMontageAdjust(meta, 'successes', msg.delta);
        break;

      case 'montage_adjust_failures':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleMontageAdjust(meta, 'failures', msg.delta);
        break;

      case 'montage_reset':
        if (meta.role !== 'director') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }
        this.handleMontageReset(meta);
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
    await this.persistActiveSceneSnapshot();
    await this.broadcastParticipants();
    this.broadcastPhoneAnchorStatus();
  }

  override async webSocketError(_ws: WebSocket): Promise<void> {
    await this.persistActiveSceneSnapshot();
    await this.broadcastParticipants();
    this.broadcastPhoneAnchorStatus();
  }

  /**
   * Cache mutable per-socket metadata for the current DO lifetime.
   * Durable participant fields are refreshed from D1 after hibernation wake.
   */
  private updateTag(ws: WebSocket, meta: ConnectionMeta): void {
    this.mutableConnectionMeta.set(ws, meta);
  }

  private async sendState(ws: WebSocket): Promise<void> {
    await this.ensureHydrated();
    if (this.sessionState) {
      this.sessionState.participants = await this.getParticipantList();
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
      'SELECT id, title AS name, type, order_index, data, snapshot FROM scenes WHERE game_session_id = ? AND deleted_at IS NULL ORDER BY order_index',
    )
      .bind(sessionId)
      .all<SceneRef & { data?: string; snapshot?: string | null }>();

    const sceneRefs: HydratedSceneRef[] = await Promise.all(
      scenes.results.map(async (s) => {
        let preparedData: Record<string, unknown> = {};
        if (typeof s.data === 'string') {
          try { preparedData = JSON.parse(s.data) as Record<string, unknown>; } catch { /* ignore */ }
        }
        preparedData = await this.hydrateSceneMedia(s.type, preparedData, session.campaign_id);
        const snapshot = this.parseSceneSnapshot(s.snapshot);
        if (snapshot?.data) {
          snapshot.data = await this.hydrateSceneMedia(s.type, snapshot.data, session.campaign_id);
          snapshot.data = this.applyPreparedSceneMediaFallbacks(s.type, snapshot.data, preparedData);
        }
        const ref = {
          id: s.id,
          name: s.name,
          type: s.type,
          order_index: s.order_index,
          data: snapshot?.data ?? preparedData,
        } as HydratedSceneRef;
        Object.defineProperties(ref, {
          preparedData: { value: preparedData, writable: true, enumerable: false },
          snapshot: { value: snapshot, writable: true, enumerable: false },
        });
        return ref;
      }),
    );
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
      entities: activeScene ? this.createLiveEntitiesForScene(activeScene, heroEntities) : heroEntities,
      combat: activeScene?.snapshot?.combat ?? null,
      participants: await this.getParticipantList(),
      actionLog: activeScene?.snapshot?.actionLog ?? [],
      negotiation: null,
      montage: null,
      respite: null,
      audio: null,
    };

    if (activeSceneId) this.initializeSceneLiveState(activeSceneId, false);
  }

  private async loadHeroEntities(sessionId: string): Promise<SessionState['entities']> {
    const rows = await this.env.DB.prepare(
      `SELECT h.id, h.name, h.user_id, h.ancestry, h.culture, h.career, h.hero_class, h.subclass, h.level,
              h.characteristics, h.kit, h.skills, h.abilities, h.portrait_asset_id, h.portrait_url, h.data
       FROM session_participants sp
       JOIN heroes h ON h.id = sp.hero_id
       WHERE sp.game_session_id = ? AND h.deleted_at IS NULL
       ORDER BY h.created_at`,
    )
      .bind(sessionId)
      .all<HeroEntityRow>();

    return rows.results.map((hero, index) => this.createHeroEntity(hero, index));
  }

  /**
   * Reload hero entities from the DB into session state and broadcast, so a hero
   * that joined mid-session appears for everyone (the Director's panels and the
   * canvas). REST `/join` inserts the participant row but doesn't notify this
   * Durable Object, and a socket connect otherwise only re-broadcasts the
   * participant list — never the new hero entity.
   */
  private async refreshHeroEntities(): Promise<void> {
    if (!this.sessionState || !this.sessionId) return;
    const heroEntities = this.applyHeroStart(
      await this.loadHeroEntities(this.sessionId),
      this.getActiveSceneData() ?? {},
    );
    const nonHeroEntities = this.sessionState.entities.filter((entity) => entity.type !== 'hero');
    this.sessionState.entities = [...heroEntities, ...nonHeroEntities];
    this.broadcast({ type: 'state', state: this.sessionState });

    // If combat is live, splice any newly-loaded heroes into the initiative
    // roster so they appear in the combat panes, not just as tokens.
    const combat = this.sessionState.combat;
    if (combat) {
      const known = new Set(combat.heroEntities);
      const added = heroEntities
        .filter((entity) => !known.has(entity.id) && this.canEntityAct(entity.id))
        .map((entity) => entity.id);
      if (added.length > 0) {
        combat.heroEntities = [...combat.heroEntities, ...added];
        this.broadcast({ type: 'combat_updated', combat });
      }
    }
  }

  private parseSceneSnapshot(value: string | null | undefined): SceneLiveSnapshot | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as SceneLiveSnapshot;
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private async hydrateSceneMedia(
    sceneType: string,
    data: Record<string, unknown>,
    campaignId: string | null,
  ): Promise<Record<string, unknown>> {
    if (!campaignId || (sceneType !== 'battle' && sceneType !== 'story')) return data;

    const mapAssetId = typeof data['mapAssetId'] === 'string'
      ? data['mapAssetId'].trim()
      : '';
    if (!mapAssetId) return data;

    const urlKey = sceneType === 'story' ? 'assetUrl' : 'mapUrl';
    const existingUrl = data[urlKey];
    if (typeof existingUrl === 'string' && existingUrl.trim()) return data;

    const map = await this.env.DB.prepare(
      'SELECT asset_id FROM maps WHERE id = ? AND campaign_id = ?',
    )
      .bind(mapAssetId, campaignId)
      .first<{ asset_id: string | null }>();
    if (!map?.asset_id) return data;

    return {
      ...data,
      [urlKey]: `/api/assets/${map.asset_id}/data`,
    };
  }

  private applyPreparedSceneMediaFallbacks(
    sceneType: string,
    data: Record<string, unknown>,
    preparedData: Record<string, unknown>,
  ): Record<string, unknown> {
    const keys = sceneType === 'battle'
      ? [
          'mapUrl',
          'backgroundUrl',
          'mapAssetId',
          'gridCols',
          'gridRows',
          'gridCellSize',
          'gridType',
          'gridOpacity',
          'gridColor',
          'gridOffsetX',
          'gridOffsetY',
        ]
      : sceneType === 'story'
        ? ['assetUrl', 'mapAssetId']
        : [];
    if (keys.length === 0) return data;

    let next: Record<string, unknown> | null = null;
    for (const key of keys) {
      const current = data[key];
      const fallback = preparedData[key];
      const missing = current === undefined || current === null || (typeof current === 'string' && current.trim() === '');
      const hasFallback = fallback !== undefined && fallback !== null && (typeof fallback !== 'string' || fallback.trim() !== '');
      if (!missing || !hasFallback) continue;
      next ??= { ...data };
      next[key] = fallback;
    }

    return next ?? data;
  }

  private activeSceneRef(): HydratedSceneRef | null {
    if (!this.sessionState?.activeSceneId) return null;
    return (this.sessionState.scenes.find((scene) => scene.id === this.sessionState!.activeSceneId) as HydratedSceneRef | undefined) ?? null;
  }

  private createLiveEntitiesForScene(scene: HydratedSceneRef, heroEntities: SessionEntity[]): SessionEntity[] {
    const snapshotEntities = Array.isArray(scene.snapshot?.entities) ? scene.snapshot.entities : null;
    if (!snapshotEntities) return [...heroEntities, ...this.createSceneEntities(scene.data ?? {})];

    const snapshotById = new Map(snapshotEntities.map((entity) => [entity.id, entity]));
    const mergedHeroes = heroEntities.map((hero) => {
      const snapshot = snapshotById.get(hero.id);
      return snapshot && snapshot.type === 'hero'
        ? { ...hero, ...snapshot, inventory: hero['inventory'], portraitUrl: hero['portraitUrl'] }
        : hero;
    });
    const heroIds = new Set(mergedHeroes.map((hero) => hero.id));
    const nonHeroes = snapshotEntities.filter((entity) => entity.type !== 'hero' || !heroIds.has(entity.id));
    return [...mergedHeroes, ...nonHeroes];
  }

  private createHeroEntity(hero: HeroEntityRow, index: number): SessionState['entities'][number] {
    const data = parseJson<Record<string, unknown>>(hero.data, {});
    const baseCharacteristics = parseJson<Record<string, number>>(hero.characteristics, {});
    const selectedSkills = parseJson<string[]>(hero.skills, []);
    const selectedAbilityIds = parseJson<string[]>(hero.abilities, []);
    const state = isRecord(data['state']) ? data['state'] : {};
    const inventory = sanitizeInventory(data['inventory'] ?? state['inventory']);
    const heroClass = hero.hero_class && HeroLogic.isValidHeroClass(hero.hero_class)
      ? hero.hero_class
      : null;
    const levelUpChoices = normalizeLevelUpChoices(data['levelUpChoices']);
    const characteristics = heroClass
      ? HeroLogic.applyLevelAdvancementCharacteristics(
        heroClass,
        hero.level,
        baseCharacteristics,
        levelUpChoices,
      )
      : baseCharacteristics;
    const kit = hero.kit ? GameData.getKit(hero.kit) : null;
    const secondaryKitId = heroClass === 'tactician' && typeof data['secondaryKit'] === 'string'
      ? data['secondaryKit']
      : null;
    const secondaryKit = secondaryKitId ? GameData.getKit(secondaryKitId) : null;
    const kitStaminaBonus = (kit?.staminaPerEchelon ?? 0) + (secondaryKit?.staminaPerEchelon ?? 0);
    const maxStamina = heroClass
      ? HeroLogic.getMaxStaminaWithAdvancements(heroClass, hero.level, kitStaminaBonus, levelUpChoices)
      : 20;
    const maxRecoveries = heroClass ? HeroLogic.getMaxRecoveries(heroClass) : null;
    const resourceType = heroClass ? HeroLogic.getHeroicResourceType(heroClass) : null;
    const startingResource = heroClass ? HeroLogic.getStartingHeroicResource(heroClass) : 0;
    const speed = HeroLogic.getBaseSpeed(hero.ancestry ?? '')
      + (hero.kit ? KitLogic.getKitSpeedBonus(hero.kit) : 0)
      + (secondaryKitId ? KitLogic.getKitSpeedBonus(secondaryKitId) : 0);
    const companionId = heroClass === 'beastheart' && typeof data['companion'] === 'string'
      ? data['companion']
      : null;
    const companion = companionId
      ? WizardLogic.getCompanionOptions().find((option) => option.id === companionId)
      : undefined;
    const companionDetails = companion as (typeof companion & Record<string, unknown>) | undefined;
    const companionCurrentStamina = typeof data['companionStaminaCurrent'] === 'number'
      ? data['companionStaminaCurrent']
      : maxStamina;
    const companionRampage = typeof data['companionRampage'] === 'number' ? data['companionRampage'] : 0;

    return {
      id: hero.id,
      name: hero.name,
      type: 'hero',
      x: 2,
      y: 2 + index,
      ownerUserId: hero.user_id,
      ancestry: hero.ancestry,
      culture: hero.culture,
      career: hero.career,
      heroClass,
      subclass: hero.subclass,
      level: hero.level,
      kit: hero.kit,
      secondaryKit: secondaryKitId,
      skills: selectedSkills,
      portraitUrl: hero.portrait_asset_id ? `/api/assets/${hero.portrait_asset_id}/data` : hero.portrait_url,
      maxStamina,
      currentStamina: typeof data['staminaCurrent'] === 'number'
        ? data['staminaCurrent']
        : typeof data['currentStamina'] === 'number'
          ? data['currentStamina']
          : typeof state['currentStamina'] === 'number'
            ? state['currentStamina']
            : maxStamina,
      recoveriesMax: maxRecoveries,
      recoveriesCurrent: typeof data['recoveriesCurrent'] === 'number'
        ? data['recoveriesCurrent']
        : typeof data['currentRecoveries'] === 'number'
          ? data['currentRecoveries']
          : maxRecoveries,
      victories: typeof data['victories'] === 'number' ? data['victories'] : 0,
      xp: typeof data['xp'] === 'number' ? data['xp'] : 0,
      heroicResource: typeof data['heroicResource'] === 'number'
        ? data['heroicResource']
        : typeof state['heroicResource'] === 'number'
          ? state['heroicResource']
          : startingResource,
      heroicResourceName: resourceType ? HeroLogic.getHeroicResourceName(resourceType) : 'Resource',
      speed,
      conditions: [],
      might: characteristics['might'] ?? 0,
      agility: characteristics['agility'] ?? 0,
      reason: characteristics['reason'] ?? 0,
      intuition: characteristics['intuition'] ?? 0,
      presence: characteristics['presence'] ?? 0,
      abilities: selectedAbilityIds.map((abilityId) => toRuntimeAbility(abilityId)),
      inventory,
      ...(companion ? {
        companionId: companion.id,
        companionName: companion.name,
        companionLevel: companion.level,
        companionRoles: companion.roles,
        companionAncestry: companion.ancestry,
        companionSize: typeof companionDetails?.['size'] === 'string' ? companionDetails['size'] : undefined,
        companionSpeed: typeof companionDetails?.['speed'] === 'string' ? companionDetails['speed'] : undefined,
        companionStability: typeof companionDetails?.['stability'] === 'number' ? companionDetails['stability'] : undefined,
        companionSignatureAbility: typeof companionDetails?.['signatureAbility'] === 'string' ? companionDetails['signatureAbility'] : undefined,
        companionMaxStamina: maxStamina,
        companionCurrentStamina,
        companionRecoveriesMax: 0,
        companionRecoveriesCurrent: 0,
        companionUsesHeroRecoveries: true,
        companionRampage,
        companionRampageThresholds: [8, 12, 16, 20, 24],
      } : {}),
    };
  }

  private replaceSceneEntities(sceneId: string): void {
    if (!this.sessionState) return;
    const scene = this.sessionState.scenes.find((candidate) => candidate.id === sceneId) as HydratedSceneRef | undefined;
    const data = scene?.data ?? {};
    const heroEntities = this.applyHeroStart(
      this.sessionState.entities.filter((entity) => entity.type === 'hero'),
      data,
    );
    this.sessionState.entities = scene ? this.createLiveEntitiesForScene(scene, heroEntities) : heroEntities;
    this.sessionState.combat = scene?.snapshot?.combat ?? null;
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
    const monsterRecord = monster as Record<string, unknown> | undefined;
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
      recoveriesCurrent: this.getNumericSceneValue(token['recoveriesCurrent'], monsterRecord?.['recoveries'], 6),
      monsterName,
      level: this.getNumericSceneValue(token['level'], monster?.level, 1),
      roles,
      conditions: this.getEntityConditionObjects({ conditions: token['conditions'] }),
      ...(typeof token['squadId'] === 'string' ? { squadId: token['squadId'] } : {}),
      ...(typeof token['squadSize'] === 'number' ? { squadSize: token['squadSize'] } : {}),
      ...(typeof token['portraitUrl'] === 'string' ? { portraitUrl: token['portraitUrl'] } : {}),
      ...(typeof token['notes'] === 'string' ? { notes: token['notes'] } : {}),
      ...(monster?.features ? { features: monster.features } : {}),
      ...(token['freeStrike'] ? { freeStrike: token['freeStrike'] } : {}),
      ...(token['free_strike'] ? { freeStrike: token['free_strike'] } : {}),
      ...(monsterRecord?.['freeStrike'] ? { freeStrike: monsterRecord['freeStrike'] } : {}),
      ...(monsterRecord?.['free_strike'] ? { freeStrike: monsterRecord['free_strike'] } : {}),
    };
  }

  private async persistActiveScene(sceneId: string): Promise<void> {
    if (!this.sessionId) return;
    await this.env.DB.prepare('UPDATE game_sessions SET active_scene_id = ? WHERE id = ?')
      .bind(sceneId, this.sessionId)
      .run();
  }

  private async handleRevertScene(ws: WebSocket, sceneId?: string): Promise<void> {
    if (!this.sessionState) return;
    const targetSceneId = sceneId ?? this.sessionState.activeSceneId;
    if (!targetSceneId) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_SCENE', message: 'No active scene' });
      return;
    }
    const scene = this.sessionState.scenes.find((candidate) => candidate.id === targetSceneId) as HydratedSceneRef | undefined;
    if (!scene) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_SCENE', message: 'Scene not found' });
      return;
    }

    const row = await this.env.DB.prepare('SELECT data FROM scenes WHERE id = ? AND deleted_at IS NULL')
      .bind(targetSceneId)
      .first<{ data: string | null }>();
    const preparedData = await this.hydrateSceneMedia(
      scene.type,
      parseJson<Record<string, unknown>>(row?.data, {}),
      this.sessionState.campaignId,
    );

    await this.env.DB.prepare('UPDATE scenes SET snapshot = NULL WHERE id = ?')
      .bind(targetSceneId)
      .run();

    scene.preparedData = preparedData;
    scene.snapshot = null;
    scene.data = preparedData;

    if (this.sessionState.activeSceneId !== targetSceneId) {
      this.sessionState.activeSceneId = targetSceneId;
      await this.persistActiveScene(targetSceneId);
      this.broadcast({ type: 'scene_changed', sceneId: targetSceneId });
    }

    this.replaceSceneEntities(targetSceneId);
    this.initializeSceneLiveState(targetSceneId, false);
    this.broadcast({ type: 'scene_reverted', sceneId: targetSceneId });
    this.broadcast({ type: 'state', state: this.sessionState });
  }

  private buildActiveSceneSnapshot(scene: HydratedSceneRef): SceneLiveSnapshot {
    return {
      data: scene.data ?? {},
      entities: this.sessionState?.entities ?? [],
      combat: this.sessionState?.combat ?? null,
      negotiation: this.sessionState?.negotiation ?? null,
      montage: this.sessionState?.montage ?? null,
      respite: this.sessionState?.respite ?? null,
      audio: this.sessionState?.audio ?? null,
      actionLog: this.sessionState?.actionLog ?? [],
      savedAt: new Date().toISOString(),
    };
  }

  private async persistActiveSceneSnapshot(): Promise<void> {
    if (!this.sessionState) return;
    const scene = this.activeSceneRef();
    if (!scene) return;
    const snapshot = this.buildActiveSceneSnapshot(scene);
    scene.snapshot = snapshot;
    await this.env.DB.prepare('UPDATE scenes SET snapshot = ? WHERE id = ?')
      .bind(JSON.stringify(snapshot), scene.id)
      .run();
  }

  private scheduleActiveSceneSnapshot(): void {
    if (!this.sessionState?.activeSceneId) return;
    this.ctx.waitUntil(this.persistActiveSceneSnapshot().catch(() => undefined));
  }

  private shouldSnapshotAfterBroadcast(msg: ServerMessage): boolean {
    return [
      'entity_created',
      'entity_updated',
      'entity_deleted',
      'entity_moved',
      'combat_updated',
      'action_logged',
      'negotiation_updated',
      'montage_updated',
      'respite_updated',
      'audio_command',
      'story_updated',
      'scene_drawing_added',
      'scene_drawing_removed',
      'scene_fog_added',
      'scene_fog_removed',
      'scene_terrain_added',
      'scene_terrain_updated',
      'scene_terrain_removed',
    ].includes(msg.type);
  }

  private async getParticipantList(): Promise<ParticipantInfo[]> {
    const participants: ParticipantInfo[] = [];
    const seen = new Set<string>();
    for (const { ws, meta: connectionMeta } of this.getConnections()) {
      const meta = await this.refreshMetaFromParticipant(connectionMeta);
      this.mutableConnectionMeta.set(ws, meta);
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

  private async broadcastParticipants(): Promise<void> {
    this.broadcast({ type: 'participant_update', participants: await this.getParticipantList() });
  }

  private async handleEndSession(): Promise<void> {
    const db = this.env.DB;

    await this.persistActiveSceneSnapshot();

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
    const scene = this.sessionState.scenes.find((s) => s.id === sceneId) as HydratedSceneRef | undefined;
    if (!scene) return;

    this.sessionState.negotiation = null;
    this.sessionState.montage = null;
    this.sessionState.respite = null;
    this.sessionState.audio = scene.snapshot?.audio ?? this.sessionState.audio;

    const data = scene.data ?? {};
    if (scene.type === 'negotiation') {
      this.sessionState.negotiation = scene.snapshot?.negotiation ?? this.createNegotiationState(data);
      if (shouldBroadcast) this.broadcastNegotiationUpdate();
    } else if (scene.type === 'montage') {
      this.sessionState.montage = scene.snapshot?.montage ?? this.createMontageState(data);
      if (shouldBroadcast) this.broadcastMontageUpdate();
    } else if (scene.type === 'respite') {
      this.sessionState.respite = scene.snapshot?.respite ?? this.createRespiteState(data);
      if (shouldBroadcast) this.broadcastRespiteUpdate();
    }
  }

  private async handleCombatAction(ws: WebSocket, meta: ConnectionMeta, action: CombatAction): Promise<void> {
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

        const heroCount = heroEntityIds.length;
        const villainGroups = sanitizeCombatGroups(action.villainGroups ?? [], villainEntityIds);

        const combat: CombatState = {
          round: 1,
          activeSide: null,
          firstSide: null,
          initiativeRoll: null,
          initiativeRollerId: null,
          initiativeRollerName: null,
          heroEntities: heroEntityIds,
          villainEntities: villainEntityIds,
          ...(villainGroups.length > 0 ? { villainGroups } : {}),
          actedThisRound: [],
          activeEntityId: null,
          malice: Math.max(0, heroCount + 1), // Starting malice = heroCount + round(1)
          turnActions: {},
        };
        this.sessionState.combat = combat;
        break;
      }

      case 'ROLL_INITIATIVE': {
        const c = this.sessionState.combat;
        if (!c) return;
        if (meta.role !== 'player') {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Players roll initiative' });
          return;
        }
        if (c.initiativeRoll !== null) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Initiative has already been rolled' });
          return;
        }

        const initiativeRoll = this.rollD10(1)[0] ?? 5;
        const firstSide: 'heroes' | 'villains' = initiativeRoll >= 6 ? 'heroes' : 'villains';
        c.initiativeRoll = initiativeRoll;
        c.firstSide = firstSide;
        c.activeSide = firstSide;
        c.initiativeRollerId = meta.userId;
        c.initiativeRollerName = meta.username;

        this.appendActionLog({
          actorId: meta.userId,
          actorName: meta.username,
          title: `${meta.username} rolled initiative`,
          detail: initiativeRoll >= 6 ? 'Heroes act first.' : 'Director acts first.',
          dice: this.toPowerDice([initiativeRoll]),
          total: initiativeRoll,
        });

        // Surface the initiative roll as a roll result so it toasts for everyone
        // (initiative is a combat action, not a normal draw_steel_roll).
        this.broadcast({
          type: 'draw_steel_roll_resolved',
          result: {
            id: this.createActionResultId('initiative'),
            kind: 'power',
            label: 'Initiative',
            rollerId: meta.userId,
            rollerName: meta.username,
            dice: this.toPowerDice([initiativeRoll]),
            modifier: 0,
            total: initiativeRoll,
            timestamp: Date.now(),
          },
        });
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
        if (c.initiativeRoll === null || !c.activeSide) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Roll initiative before taking turns' });
          return;
        }
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
        this.clearDefending(action.entityId);
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
        if (c.initiativeRoll === null || !c.activeSide) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Roll initiative before taking turns' });
          return;
        }
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
        this.clearDefending(action.entityId);
        break;
      }

      case 'END_TURN': {
        // Either director or the player whose turn it is
        const c = this.sessionState.combat;
        if (!c || !c.activeEntityId) return;
        if (!c.activeSide || !c.firstSide) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Roll initiative before ending turns' });
          return;
        }

        // Players can only end their own turn
        if (meta.role === 'player' && meta.heroId !== c.activeEntityId) {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Not your turn' });
          return;
        }

        const entityId = c.activeEntityId;
        this.applyEndOfTurnConditionEffects(entityId);
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
        await this.handleTokenAction(ws, meta, {
          kind: 'manual-damage',
          targetId: action.entityId,
          amount: action.amount,
        });
        return;
      }

      case 'APPLY_HEALING': {
        await this.handleTokenAction(ws, meta, {
          kind: 'manual-heal',
          targetId: action.entityId,
          amount: action.amount,
        });
        return;
      }

      case 'APPLY_CONDITION': {
        await this.handleTokenAction(ws, meta, {
          kind: 'apply-condition',
          targetId: action.entityId,
          condition: action.condition,
        });
        return;
      }

      case 'REMOVE_CONDITION': {
        await this.handleTokenAction(ws, meta, {
          kind: 'remove-condition',
          targetId: action.entityId,
          condition: action.conditionId,
        });
        return;
      }

      case 'CATCH_BREATH': {
        await this.handleTokenAction(ws, meta, {
          kind: 'catch-breath',
          sourceId: action.entityId,
          targetId: action.entityId,
        });
        return;
      }

      case 'DEFEND': {
        await this.handleTokenAction(ws, meta, {
          kind: 'defend',
          sourceId: action.entityId,
          targetId: action.entityId,
        });
        return;
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

    if (Object.keys(changes).length > 0) {
      this.sendTo(ws, {
        type: 'error',
        code: 'FORBIDDEN',
        message: 'Use token actions for stamina, resources, and conditions',
      });
    }
    return null;
  }

  private async handleInventoryUpdate(
    ws: WebSocket,
    meta: ConnectionMeta,
    heroId: string,
    rawInventory: unknown,
  ): Promise<void> {
    if (meta.role === 'player' && heroId !== meta.heroId) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only update your own inventory' });
      return;
    }

    const inventory = sanitizeInventory(rawInventory);
    const row = await this.env.DB.prepare(
      'SELECT user_id, data FROM heroes WHERE id = ? AND deleted_at IS NULL',
    )
      .bind(heroId)
      .first<{ user_id: string; data: string | null }>();

    if (!row) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_HERO', message: 'Hero not found' });
      return;
    }

    if (meta.role === 'player' && row.user_id !== meta.userId) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only update your own inventory' });
      return;
    }

    const data = parseJson<Record<string, unknown>>(row.data, {});
    data['inventory'] = inventory;

    await this.env.DB.prepare(
      "UPDATE heroes SET data = ?, updated_at = datetime('now'), version = version + 1 WHERE id = ?",
    )
      .bind(JSON.stringify(data), heroId)
      .run();

    const entity = this.sessionState?.entities.find((candidate) => candidate.id === heroId && candidate.type === 'hero');
    if (entity) entity['inventory'] = inventory;

    this.broadcast({ type: 'entity_updated', entityId: heroId, changes: { inventory } });
  }

  private async handleHeroTrackerUpdate(
    ws: WebSocket,
    meta: ConnectionMeta,
    heroId: string,
    op: HeroTrackerOperation,
  ): Promise<void> {
    const entity = this.sessionState?.entities.find((candidate) => candidate.id === heroId);
    if (!entity || entity.type !== 'hero') {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Hero not found' });
      return;
    }

    if (meta.role === 'player' && (entity.id !== meta.heroId || entity['ownerUserId'] !== meta.userId)) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only update your own hero tracker' });
      return;
    }

    const changes: Record<string, unknown> = {};

    switch (op.kind) {
      case 'adjust_stamina': {
        const current = this.numberFromEntity(entity, 'currentStamina', 0);
        const max = this.numberFromEntity(entity, 'maxStamina', Math.max(0, current));
        changes['currentStamina'] = this.clampInt(current + op.delta, 0, Math.max(0, max));
        break;
      }
      case 'set_stamina': {
        const max = this.numberFromEntity(entity, 'maxStamina', Math.max(0, op.value));
        changes['currentStamina'] = this.clampInt(op.value, 0, Math.max(0, max));
        break;
      }
      case 'adjust_recoveries': {
        const current = this.numberFromEntity(entity, 'recoveriesCurrent', 0);
        const max = this.numberFromEntity(entity, 'recoveriesMax', Math.max(0, current));
        changes['recoveriesCurrent'] = this.clampInt(current + op.delta, 0, Math.max(0, max));
        break;
      }
      case 'spend_recovery': {
        const current = this.numberFromEntity(entity, 'recoveriesCurrent', 0);
        changes['recoveriesCurrent'] = this.clampInt(current - 1, 0, Math.max(0, current));
        break;
      }
      case 'adjust_heroic_resource': {
        const current = this.numberFromEntity(entity, 'heroicResource', 0);
        changes['heroicResource'] = this.clampInt(current + op.delta, 0, 99);
        break;
      }
      case 'adjust_victories': {
        const current = this.numberFromEntity(entity, 'victories', 0);
        changes['victories'] = this.clampInt(current + op.delta, 0, 99);
        break;
      }
      case 'inventory_add': {
        const item = sanitizeInventory([op.item])[0];
        if (!item) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Inventory item needs a name' });
          return;
        }
        await this.handleInventoryUpdate(ws, meta, heroId, [...this.getInventory(entity), item]);
        return;
      }
      case 'inventory_update': {
        const inventory = this.getInventory(entity);
        const itemIndex = inventory.findIndex((item) => item.id === op.itemId);
        if (itemIndex === -1) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Inventory item not found' });
          return;
        }
        const next = [...inventory];
        next[itemIndex] = sanitizeInventory([{ ...next[itemIndex], ...op.changes, id: op.itemId }])[0] ?? next[itemIndex]!;
        await this.handleInventoryUpdate(ws, meta, heroId, next);
        return;
      }
      case 'inventory_remove':
        await this.handleInventoryUpdate(ws, meta, heroId, this.getInventory(entity).filter((item) => item.id !== op.itemId));
        return;
    }

    if (Object.keys(changes).length === 0) return;
    Object.assign(entity, changes);
    this.broadcast({ type: 'entity_updated', entityId: heroId, changes });
  }

  private numberFromEntity(entity: SessionEntity, key: string, fallback: number): number {
    const value = entity[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private clampInt(value: number, min: number, max: number): number {
    const normalized = Number.isFinite(value) ? Math.round(value) : min;
    return Math.max(min, Math.min(max, normalized));
  }

  private getInventory(entity: SessionEntity): InventoryItemData[] {
    return sanitizeInventory(entity['inventory']);
  }

  /** Roll n d10 using crypto-secure, unbiased randomness. */
  private rollD10(count: number): number[] {
    return Array.from({ length: count }, () => this.rollDie(10));
  }

  /** Roll Draw Steel heroic resource dice: d6 bodies labeled 1-3 twice. */
  private rollD3(count: number): number[] {
    return Array.from({ length: count }, () => this.rollDie(3));
  }

  private rollDie(sides: number): number {
    if (!Number.isInteger(sides) || sides < 1 || sides > 256) return 1;
    const maxAccepted = Math.floor(256 / sides) * sides;
    const bytes = new Uint8Array(1);
    do {
      crypto.getRandomValues(bytes);
    } while (bytes[0]! >= maxAccepted);
    return (bytes[0]! % sides) + 1;
  }

  private getTier(total: number): 1 | 2 | 3 {
    return RollLogic.getTier(total);
  }

  private asActionLogSceneType(sceneType: string | null | undefined): SceneActionLogType | null {
    return sceneType === 'battle' || sceneType === 'negotiation' || sceneType === 'montage' || sceneType === 'respite'
      ? sceneType
      : null;
  }

  private appendActionLog(
    entry: Omit<ActionLogEntry, 'id' | 'sceneType' | 'timestamp'> & {
      id?: string;
      sceneType?: SceneActionLogType;
      timestamp?: number;
    },
  ): void {
    if (!this.sessionState) return;
    const scene = this.activeSceneRef();
    const sceneType = entry.sceneType ?? this.asActionLogSceneType(scene?.type);
    if (!sceneType) return;

    const loggedEntry: ActionLogEntry = {
      id: entry.id ?? this.createActionResultId('log'),
      sceneId: entry.sceneId ?? scene?.id,
      sceneType,
      actorId: entry.actorId,
      actorName: this.clampLogText(entry.actorName, 80),
      title: this.clampLogText(entry.title, 140) ?? 'Action',
      detail: this.clampLogText(entry.detail, 500),
      dice: entry.dice,
      total: entry.total,
      tier: entry.tier,
      timestamp: entry.timestamp ?? Date.now(),
    };

    const existing = this.sessionState.actionLog ?? [];
    if (existing.some((candidate) => candidate.id === loggedEntry.id)) return;
    this.sessionState.actionLog = [...existing, loggedEntry].slice(-MAX_ACTION_LOG_ENTRIES);
    this.broadcast({ type: 'action_logged', entry: loggedEntry });
  }

  private clampLogText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const text = value.trim();
    if (!text) return undefined;
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  private toPowerDice(values: number[]): DrawSteelDieResult[] {
    return values.map((value) => ({ shape: 'd20', faceSet: 'd10-twice', value }));
  }

  private toHeroicResourceDice(values: number[]): DrawSteelDieResult[] {
    return values.map((value) => ({ shape: 'd6', faceSet: 'd3-twice', value }));
  }

  private toD6Dice(values: number[]): DrawSteelDieResult[] {
    return values.map((value) => ({ shape: 'd6', faceSet: 'd6', value }));
  }

  private normalizeRollModifier(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    return Math.max(-100, Math.min(100, Math.trunc(value)));
  }

  private normalizeRollLabel(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const label = value.trim();
    return label.length > 0 && label.length <= 60 ? label : fallback;
  }

  private handleDrawSteelRoll(meta: ConnectionMeta, request: DrawSteelRollRequest): void {
    const roll = (request && typeof request === 'object' ? request : {}) as Partial<DrawSteelRollRequest>;
    const kind = roll.kind === 'heroic-resource' || roll.kind === 'd6' || roll.kind === 'power'
      ? roll.kind
      : 'power';
    const timestamp = Date.now();
    const modifier = kind === 'power' ? this.normalizeRollModifier(roll.modifier) : 0;
    let result: DrawSteelRollResult;

    if (kind === 'heroic-resource') {
      const values = this.rollD3(2);
      const total = values.reduce((sum, value) => sum + value, 0);
      result = {
        id: this.createActionResultId('heroic-resource-roll'),
        kind,
        label: this.normalizeRollLabel(roll.label, 'Heroic Resource'),
        rollerId: meta.userId,
        rollerName: meta.username,
        dice: this.toHeroicResourceDice(values),
        modifier: 0,
        total,
        timestamp,
      };
    } else if (kind === 'd6') {
      const value = this.rollDie(6);
      result = {
        id: this.createActionResultId('d6-roll'),
        kind,
        label: this.normalizeRollLabel(roll.label, 'd6 Roll'),
        rollerId: meta.userId,
        rollerName: meta.username,
        dice: this.toD6Dice([value]),
        modifier: 0,
        total: value,
        timestamp,
      };
    } else {
      const values = this.rollD10(2);
      const edges = this.sanitizeEdgeBane(roll.edges);
      const banes = this.sanitizeEdgeBane(roll.banes);
      // Resolve edge/bane the same way combat does: flat +2/-2 for a single
      // edge/bane, tier shift for a double. `modifier` is the flat user bonus.
      const powerRoll = RollLogic.calculatePowerRoll(values, edges, banes, modifier);
      result = {
        id: this.createActionResultId('power-roll'),
        kind: 'power',
        label: this.normalizeRollLabel(roll.label, 'Power Roll'),
        rollerId: meta.userId,
        rollerName: meta.username,
        dice: this.toPowerDice(values),
        modifier,
        total: powerRoll.total,
        tier: powerRoll.tier,
        rollState: powerRoll.rollState,
        tierShifted: powerRoll.tierShifted,
        timestamp,
      };
    }

    this.broadcast({ type: 'draw_steel_roll_resolved', result });
    const detailParts: string[] = [];
    if (result.modifier !== 0) {
      detailParts.push(`Modifier ${result.modifier >= 0 ? '+' : ''}${result.modifier}`);
    }
    const edgeBaneLabel = result.rollState ? EDGE_BANE_LABELS[result.rollState] : undefined;
    if (edgeBaneLabel) {
      detailParts.push(edgeBaneLabel);
    }
    this.appendActionLog({
      id: `log-${result.id}`,
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} rolled ${result.label}`,
      detail: detailParts.length > 0 ? detailParts.join(' · ') : undefined,
      dice: result.dice,
      total: result.total,
      tier: result.tier,
      timestamp,
    });
  }

  private async handleUseAbility(
    ws: WebSocket,
    meta: ConnectionMeta,
    sourceId: string,
    targetId: string,
    abilityId: string,
  ): Promise<void> {
    await this.handleTokenAction(ws, meta, {
      kind: 'ability',
      sourceId,
      targetId,
      abilityId,
    });
  }

  /**
   * Build the list of potential opportunity-attack threats from all entities
   * except the mover. Reach defaults to 1; conditions that block reactions
   * (dazed/grabbed/restrained) set `canMakeOA` false.
   */
  private buildThreatSources(moverId: string): ThreatSource[] {
    if (!this.sessionState) return [];
    return this.sessionState.entities
      .filter((entity) => entity.id !== moverId)
      .map((entity) => {
        const record = entity as unknown as Record<string, unknown>;
        const canMakeOA =
          !this.hasCondition(record, 'dazed') &&
          !this.hasCondition(record, 'grabbed') &&
          !this.hasCondition(record, 'restrained');
        return {
          entityId: entity.id,
          name: entity.name,
          gridX: typeof entity.x === 'number' ? entity.x : 0,
          gridY: typeof entity.y === 'number' ? entity.y : 0,
          side: entity.type === 'hero' ? 'heroes' : 'enemies',
          reach: 1,
          canMakeOA,
          size: this.getEntitySize(record),
        } satisfies ThreatSource;
      });
  }

  /**
   * Record a rules-aware move: cost it against the movement budget, detect
   * opportunity attacks, apply the move, and broadcast an advisory summary.
   * Never rejects — an over-budget move still happens (manual-tracking ethos).
   */
  private handleCommitMove(
    ws: WebSocket,
    meta: ConnectionMeta,
    entityId: string,
    path: ProtocolGridPoint[],
    mode: MovementMode,
  ): void {
    const entity = this.getEntity(entityId);
    if (!entity) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Token not found' });
      return;
    }
    if (meta.role === 'player' && (entity.type !== 'hero' || entity.id !== meta.heroId)) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only move your own hero' });
      return;
    }
    if (!path || path.length < 2) return;

    const baseSpeed = typeof entity['speed'] === 'number' ? entity['speed'] : 5;
    const conditions = this.getEntityConditions(entity);
    const combat = this.sessionState?.combat;
    const isActiveTurn = Boolean(combat && combat.activeEntityId === entityId);
    const turnState =
      (isActiveTurn ? combat!.turnActions[entityId] : undefined) ??
      this.createTurnActions(baseSpeed);

    const budget = MovementLogic.getMovementBudget(baseSpeed, turnState, conditions);
    const movePath = MovementLogic.buildMovementPath(path, budget);

    const mover: OpportunityAttackLogic.MoverInfo = {
      entityId,
      name: entity.name,
      side: entity.type === 'hero' ? 'heroes' : 'enemies',
      size: this.getEntitySize(entity),
    };
    const oa = OpportunityAttackLogic.detectOpportunityAttacks(
      path,
      mover,
      mode,
      this.buildThreatSources(entityId),
    );

    const destination = path[path.length - 1]!;
    this.moveEntityTo(entity, destination.x, destination.y);

    if (isActiveTurn && combat) {
      turnState.moveRemaining = Math.max(0, turnState.moveRemaining - movePath.totalCost);
      combat.turnActions[entityId] = turnState;
      this.broadcast({ type: 'combat_updated', combat });
    }

    const detailParts = [`Moved ${movePath.totalCost} square${movePath.totalCost === 1 ? '' : 's'}`];
    if (movePath.overBudget) detailParts.push('(exceeded speed)');
    if (oa.triggersOA) {
      detailParts.push(
        `— provoked ${oa.triggers.length} opportunity attack${oa.triggers.length === 1 ? '' : 's'}`,
      );
    }
    this.appendActionLog({
      actorId: entityId,
      actorName: entity.name,
      title: `${entity.name} ${mode === 'disengage' ? 'shifted' : 'moved'}`,
      detail: detailParts.join(' '),
    });

    this.broadcast({
      type: 'move_committed',
      entityId,
      path,
      cost: movePath.totalCost,
      overBudget: movePath.overBudget,
      oaTriggers: oa.triggers,
    });
  }

  /**
   * Resolve a push/pull/slide: plan the straight-line path, stop at the first
   * collision, apply slam damage (dice stay server-side), move the target, and
   * broadcast the outcome.
   */
  private handleResolveForcedMovement(
    ws: WebSocket,
    sourceId: string,
    targetId: string,
    kind: 'push' | 'pull' | 'slide',
    distance: number,
    direction?: ProtocolGridPoint,
  ): void {
    const source = this.getEntity(sourceId);
    const target = this.getEntity(targetId);
    if (!source || !target) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source or target entity not found' });
      return;
    }

    const effects: TokenActionEffect[] = [];
    const plan = this.applyForcedMovement(source, target, kind, distance, effects, direction);
    const slamDamage = this.slamDamageForPlan(plan);

    this.appendActionLog({
      actorId: source.id,
      actorName: source.name,
      title: `${target.name} was ${kind === 'pull' ? 'pulled' : kind === 'slide' ? 'slid' : 'pushed'}`,
      detail: plan.collided
        ? `Stopped after ${plan.totalDistance - plan.remainingSquares} square${plan.totalDistance - plan.remainingSquares === 1 ? '' : 's'}${slamDamage ? ` (${slamDamage} slam damage)` : ''}`
        : `Moved ${plan.totalDistance} square${plan.totalDistance === 1 ? '' : 's'}`,
    });

    this.broadcast({
      type: 'forced_movement_resolved',
      targetId,
      finalPosition: plan.finalPosition,
      collided: plan.collided,
      collisionWith: plan.collisionWith,
      slamDamage,
    });
  }

  /**
   * Resolve an opportunity attack: on 'take', make a melee free strike from the
   * threatening creature (a free triggered action — no turn/action-slot gate);
   * on 'pass', just log that it was waived.
   */
  private handleResolveOpportunityAttack(
    ws: WebSocket,
    _meta: ConnectionMeta,
    trigger: OpportunityAttackTrigger,
    decision: OpportunityAttackDecision,
  ): void {
    if (decision === 'pass') {
      this.appendActionLog({
        actorId: trigger.attackerId,
        actorName: trigger.attackerName,
        title: 'Opportunity attack waived',
        detail: `${trigger.attackerName} let ${trigger.targetName} go.`,
      });
      return;
    }

    const attacker = this.getEntity(trigger.attackerId);
    const target = this.getEntity(trigger.targetId);
    if (!attacker || !target) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Opportunity attack participants not found' });
      return;
    }

    const timestamp = Date.now();
    const effects: TokenActionEffect[] = [];
    const characteristic = this.bestCharacteristic(attacker, ['might', 'agility']).characteristic;
    const powerRoll = this.resolvePowerRoll(
      attacker,
      target,
      characteristic,
      { kind: 'free-strike', sourceId: attacker.id, targetId: target.id },
      { isAttack: true, attackMode: 'melee' },
    );
    const damage = this.getFreeStrikeDamage(attacker, powerRoll.tier, characteristic, 'melee');
    this.applyDamageToEntity(target, damage, effects);

    const combat = this.sessionState?.combat;
    const attackerActions = combat?.turnActions[trigger.attackerId];
    if (combat && attackerActions) {
      attackerActions.triggeredUsedThisRound = true;
      this.broadcast({ type: 'combat_updated', combat });
    }

    this.finishTokenAction(
      {
        id: this.createActionResultId('free-strike'),
        kind: 'free-strike',
        sourceId: attacker.id,
        targetId: target.id,
        abilityName: 'Opportunity Attack',
        powerRoll,
        effects,
        summary: this.summarizeAction('free-strike', target, effects),
        timestamp,
      },
      this.toAbilityResult('free-strike', attacker, target, 'Opportunity Attack', powerRoll, effects, timestamp),
    );
  }

  private async handleTokenAction(
    ws: WebSocket,
    meta: ConnectionMeta,
    action: TokenActionRequest,
  ): Promise<void> {
    if (!this.sessionState) return;

    const timestamp = Date.now();
    const effects: TokenActionEffect[] = [];

    switch (action.kind) {
      case 'manual-damage':
      case 'manual-heal':
      case 'apply-condition':
      case 'remove-condition': {
        const target = this.getEntity(action.targetId);
        if (!target) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Target entity not found' });
          return;
        }

        // Damage/heal stay Director-only; players may manage conditions on their
        // own hero (user-selectable status), otherwise Director-only.
        const conditionKind = action.kind === 'apply-condition' || action.kind === 'remove-condition';
        const ownsTarget = meta.role === 'player' && meta.heroId === target.id;
        if (meta.role !== 'director' && !(conditionKind && ownsTarget)) {
          this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Director only' });
          return;
        }

        if (action.kind === 'manual-damage') {
          const amount = this.getPositiveAmount(action.amount);
          if (!amount) {
            this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Damage must be a positive number' });
            return;
          }
          this.applyDamageToEntity(target, amount, effects, { ignoreResistance: true });
        } else if (action.kind === 'manual-heal') {
          const amount = this.getPositiveAmount(action.amount);
          if (!amount) {
            this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Healing must be a positive number' });
            return;
          }
          this.applyHealingToEntity(target, amount, effects);
        } else if (action.kind === 'apply-condition') {
          if (!action.condition || !this.applyConditionToEntity(ws, target, action.condition, effects, action.endType)) return;
        } else if (action.condition) {
          this.removeConditionFromEntity(target, action.condition, effects);
        }

        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          targetId: target.id,
          effects,
          summary: this.summarizeAction(action.kind, target, effects),
          timestamp,
        });
        return;
      }

      case 'catch-breath': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        if (!source) return;
        if (!this.canCatchBreath(ws, source)) return;
        const turnActions = this.getActiveTurnActions(ws, source, 'maneuver');
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, 'maneuver', effects)) return;
        this.resolveCatchBreath(ws, source, effects);
        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: source.id,
          effects,
          summary: this.summarizeAction(action.kind, source, effects),
          timestamp,
        });
        return;
      }

      case 'defend': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        if (!source) return;
        const turnActions = this.getActiveTurnActions(ws, source, 'main');
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, 'main', effects)) return;
        this.applyDefend(source, effects);
        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: source.id,
          effects,
          summary: this.summarizeAction(action.kind, source, effects),
          timestamp,
        });
        return;
      }

      case 'stand-up': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        if (!source) return;
        const turnActions = this.getActiveTurnActions(ws, source, 'maneuver');
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, 'maneuver', effects)) return;
        this.removeConditionFromEntity(source, 'prone', effects);
        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: source.id,
          effects,
          summary: this.summarizeAction(action.kind, source, effects),
          timestamp,
        });
        return;
      }

      case 'escape-grab': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        if (!source) return;
        if (!this.hasCondition(source, 'grabbed') && !this.hasCondition(source, 'restrained')) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Escape Grab requires grabbed or restrained' });
          return;
        }
        const turnActions = this.getActiveTurnActions(ws, source, 'maneuver');
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, 'maneuver', effects)) return;
        const characteristic = action.characteristic ?? this.bestCharacteristic(source, ['might', 'agility']).characteristic;
        const powerRoll = this.resolvePowerRoll(source, undefined, characteristic, action, { isAttack: false });
        const escape = UniversalActions.resolveEscapeGrab(powerRoll.tier);
        if (escape.escaped) {
          this.removeConditionFromEntity(source, 'grabbed', effects);
          this.removeConditionFromEntity(source, 'restrained', effects);
        }
        if (escape.canShift) {
          effects.push({ kind: 'movement', entityId: source.id, message: 'Can shift 1 square after escaping.' });
        }
        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: source.id,
          powerRoll,
          effects,
          summary: escape.escaped ? 'Escaped the grab.' : 'Could not escape the grab.',
          timestamp,
        }, this.toAbilityResult(action.kind, source, source, 'Escape Grab', powerRoll, effects, timestamp));
        return;
      }

      case 'grab':
      case 'knockback':
      case 'free-strike': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        const target = this.getEntity(action.targetId);
        if (!source || !target) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source or target entity not found' });
          return;
        }
        if (!this.isWithinDistance(source, target, action.kind === 'free-strike' ? 'Melee 1 or Ranged 5' : 'Melee 1')) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Target is out of range' });
          return;
        }

        const actionType = action.kind === 'free-strike' ? 'main' : 'maneuver';
        const turnActions = this.getActiveTurnActions(ws, source, actionType);
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, actionType, effects)) return;

        const mode = this.getGridDistance(source, target) <= 1 ? 'melee' : 'ranged';
        const characteristic = action.characteristic ?? this.bestCharacteristic(source, ['might', 'agility']).characteristic;
        const powerRoll = this.resolvePowerRoll(source, target, characteristic, action, {
          isAttack: true,
          attackMode: mode,
        });

        if (action.kind === 'free-strike') {
          const damage = this.getFreeStrikeDamage(source, powerRoll.tier, characteristic, mode);
          this.applyDamageToEntity(target, damage, effects);
        } else if (action.kind === 'grab') {
          const grab = UniversalActions.resolveGrab(powerRoll.tier);
          if (grab.targetGrabbed) {
            this.applyConditionToEntity(ws, target, 'grabbed', effects);
            // Track the grabber so the target moves with them (moveEntityTo).
            (target as Record<string, unknown>)['grabbedBy'] = source.id;
          }
        } else {
          const knockback = UniversalActions.resolveKnockback(powerRoll.tier);
          if (knockback.pushDistance > 0) {
            const plan = this.applyForcedMovement(source, target, 'push', knockback.pushDistance, effects);
            const moved = plan.totalDistance - plan.remainingSquares;
            effects.push({
              kind: 'movement',
              entityId: target.id,
              amount: moved,
              message: `Pushed ${moved} square${moved === 1 ? '' : 's'}${plan.collided ? ' (slammed)' : ''}.`,
            });
          }
          if (knockback.targetProne) this.applyConditionToEntity(ws, target, 'prone', effects);
        }

        const abilityName = this.formatActionName(action.kind);
        this.finishTokenAction({
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: target.id,
          abilityName,
          powerRoll,
          effects,
          summary: this.summarizeAction(action.kind, target, effects),
          timestamp,
        }, this.toAbilityResult(action.kind, source, target, abilityName, powerRoll, effects, timestamp));
        return;
      }

      case 'charge': {
        // Charge: the move itself is a normal commit_move; this resolves the
        // main-action melee free strike it ends with, which gains an edge.
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        const target = this.getEntity(action.targetId);
        if (!source || !target) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source or target entity not found' });
          return;
        }
        if (!this.isWithinDistance(source, target, 'Melee 1')) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Charge target must be adjacent at the end of the move' });
          return;
        }

        const turnActions = this.getActiveTurnActions(ws, source, 'main');
        if (!turnActions) return;
        if (!this.consumeActionForSource(ws, source, turnActions, 'main', effects)) return;

        const characteristic = action.characteristic ?? this.bestCharacteristic(source, ['might', 'agility']).characteristic;
        const powerRoll = this.resolvePowerRoll(
          source,
          target,
          characteristic,
          { ...action, edges: (action.edges ?? 0) + 1 },
          { isAttack: true, attackMode: 'melee' },
        );
        const damage = this.getFreeStrikeDamage(source, powerRoll.tier, characteristic, 'melee');
        this.applyDamageToEntity(target, damage, effects);
        effects.push({ kind: 'note', message: 'Charge grants an edge on the strike.' });

        this.finishTokenAction({
          id: this.createActionResultId('charge'),
          kind: 'charge',
          sourceId: source.id,
          targetId: target.id,
          abilityName: 'Charge',
          powerRoll,
          effects,
          summary: this.summarizeAction('charge', target, effects),
          timestamp,
        }, this.toAbilityResult('charge', source, target, 'Charge', powerRoll, effects, timestamp));
        return;
      }

      case 'ability': {
        const source = this.getRequiredSource(ws, meta, action.sourceId);
        const target = this.getEntity(action.targetId);
        if (!source || !target || !action.abilityId) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source, target, and ability are required' });
          return;
        }

        const rawAbility = getResolvedAbilityForSource(source, action.abilityId);
        const ability = getAbilityForSource(source, action.abilityId);
        if (!rawAbility && !ability) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Ability not found' });
          return;
        }
        if (!this.isWithinDistance(source, target, ability.distance)) {
          this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Target is out of range' });
          return;
        }

        const turnActions = this.getActiveTurnActions(ws, source, ability.actionType);
        if (!turnActions) return;
        if (!this.validateAbilityCost(ws, source, rawAbility, ability.cost)) return;
        if (!this.consumeActionForSource(ws, source, turnActions, ability.actionType, effects)) return;
        this.spendAbilityCost(source, rawAbility, ability.cost, effects);

        const tieredEffect = firstTieredEffect(rawAbility);
        const hasPowerRoll = Boolean(tieredEffect?.roll || tieredEffect?.tier1 || tieredEffect?.tier2 || tieredEffect?.tier3);
        const category = AbilityLogic.getAbilityCategory(ability.keywords);
        let powerRoll: TokenActionPowerRoll | undefined;
        let effectText = tieredEffect?.effect ?? '';
        if (hasPowerRoll) {
          const characteristic = action.characteristic ?? this.getAbilityRollCharacteristic(rawAbility, source);
          powerRoll = this.resolvePowerRoll(source, target, characteristic, action, {
            isAttack: true,
            attackMode: category === 'ranged' ? 'ranged' : category === 'melee' ? 'melee' : 'magic',
          });
          effectText = getTierText(tieredEffect, powerRoll.tier);
        }

        if (effectText) {
          effects.push({ kind: 'note', message: effectText });
        }

        const damage = this.calculateDamageFromEffect(source, target, rawAbility, ability, effectText, powerRoll?.tier ?? 2);
        if (damage > 0) this.applyDamageToEntity(target, damage, effects);

        const healing = this.extractHealingAmount(effectText, source, target);
        if (healing > 0) this.applyHealingToEntity(target, healing, effects);

        for (const condition of this.extractAutomaticConditions(effectText)) {
          this.applyConditionToEntity(ws, target, condition, effects);
        }

        const result: TokenActionResult = {
          id: this.createActionResultId(action.kind),
          kind: action.kind,
          sourceId: source.id,
          targetId: target.id,
          abilityId: action.abilityId,
          abilityName: ability.name,
          powerRoll,
          effects,
          summary: this.summarizeAction(action.kind, target, effects),
          timestamp,
        };
        this.finishTokenAction(
          result,
          powerRoll ? this.toAbilityResult(action.abilityId, source, target, ability.name, powerRoll, effects, timestamp) : undefined,
        );
        return;
      }
    }
  }

  private getEntity(entityId: string | undefined): (SessionEntity & Record<string, unknown>) | null {
    if (!entityId || !this.sessionState) return null;
    return (this.sessionState.entities.find((entity) => entity.id === entityId) as (SessionEntity & Record<string, unknown>) | undefined) ?? null;
  }

  private getRequiredSource(
    ws: WebSocket,
    meta: ConnectionMeta,
    sourceId: string | undefined,
  ): (SessionEntity & Record<string, unknown>) | null {
    const source = this.getEntity(sourceId);
    if (!source) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_TARGET', message: 'Source entity not found' });
      return null;
    }
    if (meta.role === 'player' && (source.type !== 'hero' || source.id !== meta.heroId)) {
      this.sendTo(ws, { type: 'error', code: 'FORBIDDEN', message: 'Can only control your own hero' });
      return null;
    }
    return source;
  }

  private getPositiveAmount(amount: unknown): number | null {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return null;
    const value = Math.floor(amount);
    return value > 0 ? value : null;
  }

  private createActionResultId(kind: string): string {
    return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private entityDisplayName(entityId: string | undefined): string | undefined {
    if (!entityId || !this.sessionState) return undefined;
    return this.sessionState.entities.find((entity) => entity.id === entityId)?.name ?? entityId;
  }

  private describeActionEffect(effect: TokenActionEffect): string | null {
    const entityName = this.entityDisplayName(effect.entityId);
    switch (effect.kind) {
      case 'damage':
        return `${entityName ?? 'Target'} took ${effect.amount ?? 0} damage`;
      case 'healing':
        return `${entityName ?? 'Target'} healed ${effect.amount ?? 0}`;
      case 'condition-applied':
        return `${entityName ?? 'Target'} gained ${effect.condition ?? 'condition'}`;
      case 'condition-removed':
        return `${entityName ?? 'Target'} lost ${effect.condition ?? 'condition'}`;
      case 'resource':
        return effect.message ?? `${entityName ?? 'Token'} resource changed`;
      case 'action-slot':
        return effect.message ?? 'Action slot spent';
      case 'movement':
        return effect.message ?? `${entityName ?? 'Token'} moved`;
      case 'note':
        return effect.message ?? null;
      default:
        return null;
    }
  }

  private logTokenAction(result: TokenActionResult): void {
    const sourceName = this.entityDisplayName(result.sourceId);
    const targetName = this.entityDisplayName(result.targetId);
    const detail = result.effects
      .map((effect) => this.describeActionEffect(effect))
      .filter((message): message is string => Boolean(message))
      .join('; ');

    const title = result.abilityName && sourceName
      ? `${sourceName} used ${result.abilityName}${targetName && targetName !== sourceName ? ` on ${targetName}` : ''}`
      : result.summary;

    this.appendActionLog({
      id: `log-${result.id}`,
      actorId: result.sourceId,
      actorName: sourceName,
      title,
      detail: detail || undefined,
      dice: result.powerRoll ? this.toPowerDice(result.powerRoll.dice) : undefined,
      total: result.powerRoll?.total,
      tier: result.powerRoll?.tier,
      timestamp: result.timestamp,
    });
  }

  private finishTokenAction(result: TokenActionResult, legacyAbilityResult?: AbilityResult): void {
    this.broadcast({ type: 'token_action_resolved', result });
    this.logTokenAction(result);
    if (legacyAbilityResult) this.broadcast({ type: 'ability_resolved', result: legacyAbilityResult });
    if (this.sessionState) this.broadcast({ type: 'combat_updated', combat: this.sessionState.combat });
  }

  private toAbilityResult(
    abilityId: string,
    source: Record<string, unknown>,
    target: Record<string, unknown>,
    abilityName: string,
    powerRoll: TokenActionPowerRoll,
    effects: TokenActionEffect[],
    timestamp: number,
  ): AbilityResult {
    const damage = effects
      .filter((effect) => effect.kind === 'damage')
      .reduce((sum, effect) => sum + (effect.amount ?? 0), 0);
    return {
      sourceId: String(source['id']),
      targetId: String(target['id']),
      abilityId,
      abilityName,
      dice: powerRoll.dice,
      modifier: powerRoll.modifier,
      total: powerRoll.total,
      tier: powerRoll.tier,
      damage,
      effects: effects
        .map((effect) => effect.message ?? effect.condition ?? '')
        .filter((message) => message.length > 0),
      timestamp,
    };
  }

  private getActiveTurnActions(
    ws: WebSocket,
    source: Record<string, unknown>,
    _actionType: string,
  ): TurnActionState | null {
    const combat = this.sessionState?.combat;
    const sourceId = String(source['id']);
    if (!combat || combat.activeEntityId !== sourceId) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'It is not that entity\'s turn' });
      return null;
    }
    const turnActions = combat.turnActions[sourceId] ?? this.createTurnActions(
      typeof source['speed'] === 'number' ? source['speed'] : 5,
    );
    combat.turnActions[sourceId] = turnActions;
    return turnActions;
  }

  private consumeActionForSource(
    ws: WebSocket,
    source: Record<string, unknown>,
    turnActions: TurnActionState,
    actionType: string,
    effects: TokenActionEffect[],
  ): boolean {
    if (this.hasCondition(source, 'dazed') && actionType === 'triggered') {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Dazed creatures cannot take triggered actions' });
      return false;
    }
    if (!this.consumeActionSlot(ws, turnActions, actionType)) return false;
    effects.push({
      kind: 'action-slot',
      entityId: String(source['id']),
      message: `Spent ${this.formatActionSlot(actionType)}.`,
    });
    if (this.hasCondition(source, 'dazed') && !['free', 'none'].includes(actionType)) {
      turnActions.mainActionUsed = true;
      turnActions.maneuverUsed = true;
      turnActions.triggeredUsedThisRound = true;
      turnActions.moveRemaining = 0;
      effects.push({ kind: 'note', entityId: String(source['id']), message: 'Dazed limits the turn to this one action.' });
    }
    return true;
  }

  /**
   * Read an entity's tracked conditions as structured objects, tolerant of the
   * legacy `string[]` shape (each name gets its condition's natural end rule).
   */
  private getEntityConditionObjects(entity: Record<string, unknown>): EntityCondition[] {
    const raw = entity['conditions'];
    if (!Array.isArray(raw)) return [];
    const out: EntityCondition[] = [];
    for (const item of raw as unknown[]) {
      if (typeof item === 'string') {
        const name = this.normalizeCondition(item);
        if (name) out.push({ name, endType: this.defaultConditionEndType(name) });
      } else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const name = this.normalizeCondition(String(rec['name'] ?? ''));
        if (!name) continue;
        const cond: EntityCondition = { name, endType: this.normalizeEndType(rec['endType'], name) };
        if (typeof rec['sourceId'] === 'string') cond.sourceId = rec['sourceId'];
        out.push(cond);
      }
    }
    return out;
  }

  private getEntityConditions(entity: Record<string, unknown>): ConditionName[] {
    return this.getEntityConditionObjects(entity).map((c) => c.name as ConditionName);
  }

  private hasCondition(entity: Record<string, unknown>, condition: ConditionName): boolean {
    return this.getEntityConditions(entity).includes(condition);
  }

  private normalizeCondition(condition: string): ConditionName | null {
    const normalized = condition.trim().toLowerCase();
    return VALID_CONDITIONS.has(normalized) ? normalized as ConditionName : null;
  }

  private normalizeEndType(value: unknown, condition: ConditionName): ConditionEndType {
    return value === 'eot' || value === 'save' || value === 'manual'
      ? value
      : this.defaultConditionEndType(condition);
  }

  /**
   * The condition's natural end rule when the applier doesn't specify one.
   * Grabbed/prone/restrained persist until a specific action clears them; the
   * rest end via save if Draw Steel says so, otherwise at end of turn.
   */
  private defaultConditionEndType(condition: ConditionName): ConditionEndType {
    if (condition === 'grabbed' || condition === 'prone' || condition === 'restrained') {
      return 'manual';
    }
    return ConditionLogic.canEndWithSave(condition) ? 'save' : 'eot';
  }

  private writeConditions(entity: Record<string, unknown>, conditions: EntityCondition[]): void {
    entity['conditions'] = conditions;
    this.broadcast({
      type: 'entity_updated',
      entityId: String(entity['id']),
      changes: { conditions },
    });
  }

  private applyDamageToEntity(
    entity: Record<string, unknown>,
    amount: number,
    effects: TokenActionEffect[],
    options: { ignoreResistance?: boolean } = {},
  ): void {
    if (typeof entity['currentStamina'] !== 'number') return;
    const before = entity['currentStamina'];
    let finalAmount = Math.max(0, Math.floor(amount));
    if (!options.ignoreResistance && entity['defending'] === true) {
      const resistance = typeof entity['defendResistance'] === 'number' ? entity['defendResistance'] : 0;
      if (resistance > 0) {
        finalAmount = Math.max(0, finalAmount - resistance);
        effects.push({
          kind: 'note',
          entityId: String(entity['id']),
          message: `Defend reduced damage by ${resistance}.`,
        });
      }
    }
    const after = Math.max(0, before - finalAmount);
    entity['currentStamina'] = after;
    this.broadcast({ type: 'entity_updated', entityId: String(entity['id']), changes: { currentStamina: after } });
    effects.push({
      kind: 'damage',
      entityId: String(entity['id']),
      amount: before - after,
      before,
      after,
      message: `${before - after} damage.`,
    });
  }

  private applyHealingToEntity(
    entity: Record<string, unknown>,
    amount: number,
    effects: TokenActionEffect[],
  ): void {
    if (typeof entity['currentStamina'] !== 'number' || typeof entity['maxStamina'] !== 'number') return;
    const before = entity['currentStamina'];
    const after = Math.min(entity['maxStamina'], before + Math.max(0, Math.floor(amount)));
    entity['currentStamina'] = after;
    this.broadcast({ type: 'entity_updated', entityId: String(entity['id']), changes: { currentStamina: after } });
    effects.push({
      kind: 'healing',
      entityId: String(entity['id']),
      amount: after - before,
      before,
      after,
      message: `${after - before} healing.`,
    });
  }

  private applyConditionToEntity(
    ws: WebSocket,
    entity: Record<string, unknown>,
    rawCondition: string,
    effects: TokenActionEffect[],
    endType?: ConditionEndType,
    sourceId?: string,
  ): boolean {
    const condition = this.normalizeCondition(rawCondition);
    if (!condition) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Unknown condition' });
      return false;
    }

    const currentObjs = this.getEntityConditionObjects(entity);
    const currentNames = currentObjs.map((c) => c.name as ConditionName);
    const resolvedEnd = endType ?? this.defaultConditionEndType(condition);

    // Already present — just update the end rule if the caller chose a new one.
    if (currentNames.includes(condition)) {
      if (endType) {
        this.writeConditions(
          entity,
          currentObjs.map((c) => (c.name === condition ? { ...c, endType: resolvedEnd } : c)),
        );
      }
      return true;
    }

    // Stacking / severity is resolved on names (existing rules), then rebuilt
    // into objects preserving each surviving condition's end rule.
    let nextNames = [...currentNames];
    for (const existing of currentNames) {
      if (ConditionLogic.canConditionsStack(existing, condition)) continue;
      const severe = ConditionLogic.getMoreSevereCondition(existing, condition);
      nextNames = nextNames.filter((candidate) => candidate !== existing && candidate !== condition);
      nextNames.push(severe);
    }
    if (!nextNames.includes(condition) && currentNames.every((existing) => ConditionLogic.canConditionsStack(existing, condition))) {
      nextNames.push(condition);
    }

    const byName = new Map(currentObjs.map((c) => [c.name, c]));
    const nextObjs: EntityCondition[] = nextNames.map((name) => {
      if (name === condition) {
        const obj: EntityCondition = { name, endType: resolvedEnd };
        if (sourceId) obj.sourceId = sourceId;
        return obj;
      }
      return byName.get(name) ?? { name, endType: this.defaultConditionEndType(name as ConditionName) };
    });

    this.writeConditions(entity, nextObjs);
    effects.push({
      kind: 'condition-applied',
      entityId: String(entity['id']),
      condition,
      message: `${this.formatCondition(condition)} applied (${this.endTypeLabel(resolvedEnd)}).`,
    });
    return true;
  }

  private endTypeLabel(endType: ConditionEndType): string {
    return endType === 'save' ? 'save ends' : endType === 'eot' ? 'end of turn' : 'until removed';
  }

  private removeConditionFromEntity(
    entity: Record<string, unknown>,
    rawCondition: string,
    effects: TokenActionEffect[],
  ): void {
    const condition = this.normalizeCondition(rawCondition);
    if (!condition) return;
    const next = this.getEntityConditionObjects(entity).filter((c) => c.name !== condition);
    this.writeConditions(entity, next);
    // Releasing a grab clears the grabber link used by moveEntityTo.
    if (condition === 'grabbed') delete entity['grabbedBy'];
    effects.push({
      kind: 'condition-removed',
      entityId: String(entity['id']),
      condition,
      message: `${this.formatCondition(condition)} removed.`,
    });
  }

  private canCatchBreath(ws: WebSocket, source: Record<string, unknown>): boolean {
    if (typeof source['currentStamina'] !== 'number' || typeof source['maxStamina'] !== 'number') {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Catch Breath requires stamina tracking' });
      return false;
    }
    if (typeof source['recoveriesCurrent'] === 'number' && source['recoveriesCurrent'] <= 0) {
      this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'No recoveries remaining' });
      return false;
    }
    return true;
  }

  private resolveCatchBreath(ws: WebSocket, source: Record<string, unknown>, effects: TokenActionEffect[]): void {
    if (!this.canCatchBreath(ws, source)) return;
    const current = source['currentStamina'] as number;
    const max = source['maxStamina'] as number;
    const recoveries = typeof source['recoveriesCurrent'] === 'number' ? source['recoveriesCurrent'] : 1;
    const result = UniversalActions.resolveCatchBreath(current, max, recoveries);
    if (!result.recoverySpent) return;

    source['recoveriesCurrent'] = result.recoveriesRemaining;
    source['currentStamina'] = Math.min(max, current + result.healAmount);
    this.broadcast({
      type: 'entity_updated',
      entityId: String(source['id']),
      changes: {
        currentStamina: source['currentStamina'],
        recoveriesCurrent: source['recoveriesCurrent'],
      },
    });
    effects.push({
      kind: 'resource',
      entityId: String(source['id']),
      amount: -1,
      after: result.recoveriesRemaining,
      message: 'Spent 1 recovery.',
    });
    effects.push({
      kind: 'healing',
      entityId: String(source['id']),
      amount: result.healAmount,
      before: current,
      after: source['currentStamina'] as number,
      message: `${result.healAmount} healing.`,
    });
  }

  private applyDefend(source: Record<string, unknown>, effects: TokenActionEffect[]): void {
    const level = typeof source['level'] === 'number' ? source['level'] : 1;
    const resistance = UniversalActions.getDefendResistance(level);
    source['defending'] = true;
    source['defendResistance'] = resistance;
    this.broadcast({
      type: 'entity_updated',
      entityId: String(source['id']),
      changes: { defending: true, defendResistance: resistance },
    });
    effects.push({
      kind: 'note',
      entityId: String(source['id']),
      message: `Defending: attacks against this token have a bane and damage resistance ${resistance}.`,
    });
  }

  private clearDefending(entityId: string): void {
    const entity = this.getEntity(entityId);
    if (!entity || entity['defending'] !== true) return;
    entity['defending'] = false;
    entity['defendResistance'] = 0;
    this.broadcast({
      type: 'entity_updated',
      entityId,
      changes: { defending: false, defendResistance: 0 },
    });
  }

  private applyEndOfTurnConditionEffects(entityId: string): void {
    const entity = this.getEntity(entityId);
    if (!entity) return;
    const conditions = this.getEntityConditionObjects(entity);
    if (conditions.length === 0) return;
    const effects: TokenActionEffect[] = [];
    const actorName = typeof entity['name'] === 'string' ? (entity['name'] as string) : 'Combatant';

    // Ongoing (bleeding) damage first.
    if (conditions.some((c) => ConditionLogic.dealsOngoingDamage(c.name as ConditionName))) {
      const level = typeof entity['level'] === 'number' ? entity['level'] : 1;
      const damage = Math.max(1, this.rollDie(6) + level);
      this.applyDamageToEntity(entity, damage, effects, { ignoreResistance: true });
    }

    // Resolve end rules: EoT drops, save rolls 1d10 (6+ ends), manual persists.
    const kept: EntityCondition[] = [];
    const notes: string[] = [];
    for (const cond of conditions) {
      const label = this.formatCondition(cond.name);
      if (cond.endType === 'manual') {
        kept.push(cond);
      } else if (cond.endType === 'eot') {
        notes.push(`${label} ended (end of turn).`);
      } else {
        const roll = this.rollDie(10);
        if (roll >= 6) {
          notes.push(`${label} save ${roll} — ends.`);
        } else {
          kept.push(cond);
          notes.push(`${label} save ${roll} — persists.`);
        }
      }
    }

    if (kept.length !== conditions.length) {
      this.writeConditions(entity, kept);
    }
    if (notes.length > 0) {
      this.appendActionLog({
        actorId: entityId,
        actorName,
        title: 'End of turn',
        detail: notes.join(' '),
      });
    }
  }

  private resolvePowerRoll(
    source: Record<string, unknown>,
    target: Record<string, unknown> | undefined,
    characteristic: CharacteristicId,
    action: TokenActionRequest,
    options: { isAttack: boolean; attackMode?: 'melee' | 'ranged' | 'magic' },
  ): TokenActionPowerRoll {
    let edges = this.sanitizeEdgeBane(action.edges);
    let banes = this.sanitizeEdgeBane(action.banes);

    if (options.isAttack) {
      const sourceConditions = this.getEntityConditions(source);
      if (sourceConditions.some((condition) => ['restrained', 'frightened', 'taunted'].includes(condition))) banes += 1;
      if (
        sourceConditions.includes('prone') &&
        options.attackMode === 'melee' &&
        target &&
        !this.hasCondition(target, 'prone')
      ) {
        banes += 1;
      }
      if (target) {
        const targetConditions = this.getEntityConditions(target);
        if (targetConditions.includes('restrained')) edges += 1;
        if (targetConditions.includes('prone') && options.attackMode === 'ranged') edges += 1;
        if (targetConditions.includes('prone') && options.attackMode === 'melee') banes += 1;
        if (target['defending'] === true) banes += 1;
      }
    }

    const dice = this.rollD10(2);
    const characteristicValue = this.getCharacteristicValue(source, characteristic);
    const roll = RollLogic.calculatePowerRoll(dice, edges, banes, characteristicValue);
    const diceTotal = (dice[0] ?? 0) + (dice[1] ?? 0);
    return {
      sourceId: String(source['id']),
      targetId: target ? String(target['id']) : undefined,
      dice,
      characteristic,
      characteristicValue,
      modifier: roll.total - diceTotal,
      bonuses: 0,
      edges,
      banes,
      rollState: roll.rollState,
      total: roll.total,
      tier: roll.tier,
      tierShifted: roll.tierShifted,
      isNatural19Or20: roll.isNatural19Or20,
    };
  }

  private sanitizeEdgeBane(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  private getAbilityRollCharacteristic(
    ability: AbilityLike | undefined,
    source: Record<string, unknown>,
  ): CharacteristicId {
    const text = [
      ...(ability?.effects ?? []).map((effect) => effect.roll ?? ''),
      ...(ability?.effects ?? []).flatMap((effect) => [effect.tier1 ?? '', effect.tier2 ?? '', effect.tier3 ?? '']),
    ].join(' ');
    const nameMatch = /\b(Might|Agility|Reason|Intuition|Presence)\b/i.exec(text);
    if (nameMatch?.[1]) return nameMatch[1].toLowerCase() as CharacteristicId;
    const shorthandMatch = /(?:\+|\s)([MARIP])(?:\s|$)/i.exec(text);
    const characteristic = shorthandMatch?.[1] ? AbilityLogic.getCharacteristicFromShorthand(shorthandMatch[1]) : null;
    if (characteristic) return characteristic;
    return this.bestCharacteristic(source, [...CHARACTERISTIC_IDS]).characteristic;
  }

  private bestCharacteristic(
    source: Record<string, unknown>,
    choices: CharacteristicId[],
  ): { characteristic: CharacteristicId; value: number } {
    let best = choices[0] ?? 'might';
    let value = this.getCharacteristicValue(source, best);
    for (const characteristic of choices) {
      const candidate = this.getCharacteristicValue(source, characteristic);
      if (candidate > value) {
        best = characteristic;
        value = candidate;
      }
    }
    return { characteristic: best, value };
  }

  private getCharacteristicValue(source: Record<string, unknown>, characteristic: CharacteristicId): number {
    return typeof source[characteristic] === 'number' ? source[characteristic] : 0;
  }

  private validateAbilityCost(
    ws: WebSocket,
    source: Record<string, unknown>,
    ability: AbilityLike | undefined,
    runtimeCost: string,
  ): boolean {
    const amount = this.getAbilityCostAmount(ability, runtimeCost);
    if (amount <= 0) return true;
    const resource = this.getAbilityCostResource(ability, runtimeCost);
    if (resource === 'malice') {
      const combat = this.sessionState?.combat;
      if (!combat || combat.malice < amount) {
        this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Not enough Malice' });
        return false;
      }
      return true;
    }
    if (typeof source['heroicResource'] === 'number' && source['heroicResource'] >= amount) return true;
    this.sendTo(ws, { type: 'error', code: 'INVALID_ACTION', message: 'Not enough heroic resource' });
    return false;
  }

  private spendAbilityCost(
    source: Record<string, unknown>,
    ability: AbilityLike | undefined,
    runtimeCost: string,
    effects: TokenActionEffect[],
  ): void {
    const amount = this.getAbilityCostAmount(ability, runtimeCost);
    if (amount <= 0) return;
    const resource = this.getAbilityCostResource(ability, runtimeCost);
    if (resource === 'malice' && this.sessionState?.combat) {
      this.sessionState.combat.malice = Math.max(0, this.sessionState.combat.malice - amount);
      effects.push({ kind: 'resource', amount: -amount, message: `Spent ${amount} Malice.` });
      return;
    }
    if (typeof source['heroicResource'] === 'number') {
      const before = source['heroicResource'];
      source['heroicResource'] = Math.max(0, before - amount);
      this.broadcast({
        type: 'entity_updated',
        entityId: String(source['id']),
        changes: { heroicResource: source['heroicResource'] },
      });
      effects.push({
        kind: 'resource',
        entityId: String(source['id']),
        amount: -amount,
        before,
        after: source['heroicResource'] as number,
        message: `Spent ${amount} heroic resource.`,
      });
    }
  }

  private getAbilityCostAmount(ability: AbilityLike | undefined, runtimeCost: string): number {
    if (typeof ability?.cost_amount === 'number') return ability.cost_amount;
    if (typeof ability?.metadata?.cost_amount === 'number') return ability.metadata.cost_amount;
    const text = `${ability?.cost ?? ''} ${runtimeCost}`.toLowerCase();
    if (!text || text.includes('signature') || text.includes('no cost')) return 0;
    const match = /(?:cost|spend)?\s*(\d+)\+?/.exec(text);
    return match?.[1] ? Number.parseInt(match[1], 10) : 0;
  }

  private getAbilityCostResource(ability: AbilityLike | undefined, runtimeCost: string): string | null {
    const explicit = ability?.cost_resource ?? ability?.metadata?.cost_resource;
    if (explicit) return explicit.toLowerCase();
    const text = `${ability?.cost ?? ''} ${runtimeCost}`.toLowerCase();
    if (text.includes('malice')) return 'malice';
    return null;
  }

  private isWithinDistance(
    source: Record<string, unknown>,
    target: Record<string, unknown>,
    distance: string,
  ): boolean {
    if (!distance.trim()) return true;
    if (isTargetInRange(source, target, distance)) return true;
    const parts = distance.split(/\s+or\s+/i);
    if (parts.length > 1) return parts.some((part) => this.isWithinDistance(source, target, part));
    const parsed = AbilityLogic.parseDistance(distance);
    const gridDistance = this.getGridDistance(source, target);
    const kitId = typeof source['kit'] === 'string' ? source['kit'] : null;
    const distanceBonus = kitId && parsed.type === 'melee'
      ? KitLogic.getMeleeDistanceBonus(kitId)
      : kitId && parsed.type === 'ranged'
        ? KitLogic.getRangedDistanceBonus(kitId)
        : 0;
    if (parsed.type === 'special') return true;
    return AbilityLogic.isInRange(parsed, gridDistance, distanceBonus);
  }

  private getGridDistance(source: Record<string, unknown>, target: Record<string, unknown>): number {
    // Footprint-aware Chebyshev distance: large tokens measure from their
    // nearest occupied square, not a single corner.
    return GeometryLogic.distanceBetweenFootprints(
      this.getEntityFootprint(source),
      this.getEntityFootprint(target),
    );
  }

  /** Resolve a token's edge length in squares from its `size` field (number or Size string). */
  private getEntitySize(entity: Record<string, unknown>): number {
    const size = entity['size'];
    if (typeof size === 'number') return Math.max(1, Math.floor(size));
    if (typeof size === 'string') {
      const numeric = Number(size);
      if (Number.isFinite(numeric)) return Math.max(1, Math.floor(numeric));
      // Size categories 1T/1S/1M/1L all occupy a single square.
      return 1;
    }
    return 1;
  }

  private getEntityFootprint(entity: Record<string, unknown>): GeometryLogic.TokenFootprint {
    const x = typeof entity['x'] === 'number' ? entity['x'] : 0;
    const y = typeof entity['y'] === 'number' ? entity['y'] : 0;
    return GeometryLogic.makeFootprint(x, y, this.getEntitySize(entity));
  }

  private getActiveGridBounds(): GeometryLogic.GridBounds {
    const data = this.getActiveSceneData();
    const cols = typeof data?.['gridCols'] === 'number'
      ? data['gridCols'] as number
      : typeof data?.['gridSize'] === 'number'
        ? data['gridSize'] as number
        : 30;
    const rows = typeof data?.['gridRows'] === 'number' ? data['gridRows'] as number : 20;
    return { cols, rows };
  }

  /**
   * Move an entity to a grid cell, clamp to bounds, broadcast, and drag along any
   * creature it has grabbed (grabbed creatures move with their grabber). Shared by
   * move_token, commit_move, and forced-movement resolution.
   */
  private moveEntityTo(entity: Record<string, unknown>, x: number, y: number): { x: number; y: number } {
    const prevX = typeof entity['x'] === 'number' ? entity['x'] : 0;
    const prevY = typeof entity['y'] === 'number' ? entity['y'] : 0;
    const bounded = this.clampToActiveBattleGrid(x, y);
    entity['x'] = bounded.x;
    entity['y'] = bounded.y;
    this.broadcast({ type: 'entity_moved', entityId: String(entity['id']), x: bounded.x, y: bounded.y });

    // Drag any grabbed creature along by the same offset (Draw Steel: a grabbed
    // creature moves with its grabber).
    const dx = bounded.x - prevX;
    const dy = bounded.y - prevY;
    if ((dx !== 0 || dy !== 0) && this.sessionState) {
      const grabberId = String(entity['id']);
      for (const other of this.sessionState.entities) {
        if ((other as Record<string, unknown>)['grabbedBy'] === grabberId) {
          const ox = typeof other.x === 'number' ? other.x : 0;
          const oy = typeof other.y === 'number' ? other.y : 0;
          const movedTo = this.clampToActiveBattleGrid(ox + dx, oy + dy);
          other.x = movedTo.x;
          other.y = movedTo.y;
          this.broadcast({ type: 'entity_moved', entityId: String(other.id), x: movedTo.x, y: movedTo.y });
        }
      }
    }

    return bounded;
  }

  /**
   * Plan and apply a forced movement: move the target, and on collision apply
   * slam damage into `effects` (2 + remaining vs a surface/edge; remaining to
   * both creatures vs another token). Returns the plan for logging/broadcast.
   */
  private applyForcedMovement(
    source: Record<string, unknown>,
    target: SessionEntity & Record<string, unknown>,
    kind: 'push' | 'pull' | 'slide',
    distance: number,
    effects: TokenActionEffect[],
    direction?: ProtocolGridPoint,
  ): ForcedMovementLogic.ForcedMovementPlan {
    const occupants: ForcedMovementLogic.OccupantFootprint[] = (this.sessionState?.entities ?? [])
      .filter((entity) => entity.id !== target.id)
      .map((entity) => ({
        id: entity.id,
        footprint: this.getEntityFootprint(entity as unknown as Record<string, unknown>),
      }));

    const plan = ForcedMovementLogic.planForcedMovement(
      kind,
      this.getEntityFootprint(source),
      this.getEntityFootprint(target),
      distance,
      occupants,
      this.getActiveGridBounds(),
      direction,
    );

    this.moveEntityTo(target, plan.finalPosition.x, plan.finalPosition.y);

    if (plan.collided && plan.remainingSquares > 0) {
      if (plan.collisionWith === 'edge') {
        this.applyDamageToEntity(target, 2 + plan.remainingSquares, effects);
      } else {
        this.applyDamageToEntity(target, plan.remainingSquares, effects);
        const blocker = this.getEntity(plan.collisionWith);
        if (blocker) this.applyDamageToEntity(blocker, plan.remainingSquares, effects);
      }
    }

    return plan;
  }

  private slamDamageForPlan(plan: ForcedMovementLogic.ForcedMovementPlan): number | undefined {
    if (!plan.collided || plan.remainingSquares <= 0) return undefined;
    return plan.collisionWith === 'edge' ? 2 + plan.remainingSquares : plan.remainingSquares;
  }

  private getFreeStrikeDamage(
    source: Record<string, unknown>,
    tier: 1 | 2 | 3,
    characteristic: CharacteristicId,
    mode: 'melee' | 'ranged',
  ): number {
    const freeStrike = source['freeStrike'];
    if (freeStrike && typeof freeStrike === 'object') {
      const strike = freeStrike as Record<string, unknown>;
      const tierText = strike[`tier${tier}`];
      if (typeof tierText === 'string') {
        const damage = this.calculateDamageFormula(source, tierText, tier, mode);
        if (damage > 0) return this.applyWeakening(source, damage);
      }
    }
    const baseByTier = mode === 'ranged'
      ? ({ 1: 2, 2: 4, 3: 6 } as const)
      : ({ 1: 2, 2: 5, 3: 7 } as const);
    const kitId = typeof source['kit'] === 'string' ? source['kit'] : null;
    const kitBonus = kitId
      ? mode === 'ranged'
        ? KitLogic.getRangedDamageBonus(kitId, tier)
        : KitLogic.getMeleeDamageBonus(kitId, tier)
      : 0;
    return this.applyWeakening(source, baseByTier[tier] + this.getCharacteristicValue(source, characteristic) + kitBonus);
  }

  private calculateDamageFromEffect(
    source: Record<string, unknown>,
    _target: Record<string, unknown>,
    rawAbility: AbilityLike | undefined,
    ability: RuntimeAbility,
    effectText: string,
    tier: 1 | 2 | 3,
  ): number {
    if (!/\bdamage\b/i.test(effectText)) return 0;
    const category = AbilityLogic.getAbilityCategory(ability.keywords);
    const formulaCharacteristic = this.getDamageFormulaCharacteristic(effectText) ?? this.getAbilityRollCharacteristic(rawAbility, source);
    const kitId = typeof source['kit'] === 'string' ? source['kit'] : null;
    const kitBonus = kitId && (AbilityLogic.isStrike(ability.keywords) || category === 'melee' || category === 'ranged')
      ? {
          tier1: category === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 1) : KitLogic.getMeleeDamageBonus(kitId, 1),
          tier2: category === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 2) : KitLogic.getMeleeDamageBonus(kitId, 2),
          tier3: category === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 3) : KitLogic.getMeleeDamageBonus(kitId, 3),
        }
      : undefined;
    const result = AbilityLogic.calculateTierDamage(
      effectText,
      this.getCharacteristicValue(source, formulaCharacteristic),
      kitBonus,
      tier,
    );
    return this.applyWeakening(source, Math.max(0, result.total || extractDamage(effectText)));
  }

  private calculateDamageFormula(
    source: Record<string, unknown>,
    formula: string,
    tier: 1 | 2 | 3,
    mode: 'melee' | 'ranged',
  ): number {
    const characteristic = this.getDamageFormulaCharacteristic(formula) ?? (mode === 'ranged' ? 'agility' : 'might');
    const kitId = typeof source['kit'] === 'string' ? source['kit'] : null;
    const kitBonus = kitId
      ? {
          tier1: mode === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 1) : KitLogic.getMeleeDamageBonus(kitId, 1),
          tier2: mode === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 2) : KitLogic.getMeleeDamageBonus(kitId, 2),
          tier3: mode === 'ranged' ? KitLogic.getRangedDamageBonus(kitId, 3) : KitLogic.getMeleeDamageBonus(kitId, 3),
        }
      : undefined;
    return AbilityLogic.calculateTierDamage(formula, this.getCharacteristicValue(source, characteristic), kitBonus, tier).total;
  }

  private getDamageFormulaCharacteristic(text: string): CharacteristicId | null {
    const shorthand = /(?:\+|\s)([MARIP])(?:\s|$)/i.exec(text)?.[1];
    return shorthand ? AbilityLogic.getCharacteristicFromShorthand(shorthand) : null;
  }

  private applyWeakening(source: Record<string, unknown>, damage: number): number {
    return this.hasCondition(source, 'weakened') ? Math.floor(damage / 2) : damage;
  }

  private extractHealingAmount(
    effectText: string,
    source: Record<string, unknown>,
    _target: Record<string, unknown>,
  ): number {
    const text = effectText.toLowerCase();
    if (text.includes('can spend a recovery')) return 0;
    if (text.includes('recovery value')) {
      const max = typeof source['maxStamina'] === 'number' ? source['maxStamina'] : 0;
      return max > 0 ? UniversalActions.calculateRecoveryValue(max) : 0;
    }
    const regain = /\bregains?\s+(\d+)\s+stamina\b/i.exec(effectText)?.[1];
    if (regain) return Number.parseInt(regain, 10);
    const healing = /\b(\d+)\s+healing\b/i.exec(effectText)?.[1];
    return healing ? Number.parseInt(healing, 10) : 0;
  }

  private extractAutomaticConditions(effectText: string): ConditionName[] {
    const text = effectText.toLowerCase();
    const found: ConditionName[] = [];
    for (const condition of ConditionLogic.getAllConditionNames()) {
      if (!new RegExp(`\\b${condition}\\b`).test(text)) continue;
      if (new RegExp(`[marip]\\s*<[^.;]*\\b${condition}\\b`).test(text)) continue;
      const direct = new RegExp(`\\b(?:target|creature|enemy|foe|they|it)\\s+(?:is|are|becomes?|become)\\s+${condition}\\b`).test(text);
      const shorthand = new RegExp(`(?:^|[;,.])\\s*${condition}\\s*(?:\\(|$|[;,.])`).test(text);
      if (direct || shorthand) found.push(condition);
    }
    return found;
  }

  private summarizeAction(kind: string, target: Record<string, unknown>, effects: TokenActionEffect[]): string {
    const targetName = typeof target['name'] === 'string' ? target['name'] : 'target';
    const damage = effects.filter((effect) => effect.kind === 'damage').reduce((sum, effect) => sum + (effect.amount ?? 0), 0);
    const healing = effects.filter((effect) => effect.kind === 'healing').reduce((sum, effect) => sum + (effect.amount ?? 0), 0);
    const conditions = effects
      .filter((effect) => effect.kind === 'condition-applied' && effect.condition)
      .map((effect) => this.formatCondition(effect.condition!));
    if (damage > 0) return `${this.formatActionName(kind)} dealt ${damage} damage to ${targetName}.`;
    if (healing > 0) return `${this.formatActionName(kind)} healed ${targetName} for ${healing}.`;
    if (conditions.length > 0) return `${this.formatActionName(kind)} applied ${conditions.join(', ')} to ${targetName}.`;
    return `${this.formatActionName(kind)} resolved.`;
  }

  private formatActionName(kind: string): string {
    return kind
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatCondition(condition: string): string {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  }

  private formatActionSlot(actionType: string): string {
    if (actionType === 'action') return 'main action';
    return actionType.replace('-', ' ');
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

  private clampTerrainToActiveBattleGrid(terrain: TerrainSync): TerrainSync {
    const data = this.getActiveSceneData();
    const cols = typeof data?.['gridCols'] === 'number'
      ? data['gridCols'] as number
      : typeof data?.['gridSize'] === 'number'
        ? data['gridSize'] as number
        : 30;
    const rows = typeof data?.['gridRows'] === 'number' ? data['gridRows'] as number : 20;
    const w = Math.max(1, Math.min(cols, Math.round(terrain.w)));
    const h = Math.max(1, Math.min(rows, Math.round(terrain.h)));
    const x = Math.max(0, Math.min(cols - w, Math.round(terrain.x)));
    const y = Math.max(0, Math.min(rows - h, Math.round(terrain.y)));
    return { ...terrain, x, y, w, h };
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

  private updateSceneTerrain(terrain: TerrainSync): void {
    const data = this.getActiveSceneData();
    if (!data) return;
    if (!Array.isArray(data['terrain'])) data['terrain'] = [];
    const zones = data['terrain'] as TerrainSync[];
    const index = zones.findIndex((zone) => zone.id === terrain.id);
    if (index === -1) zones.push(terrain);
    else zones[index] = terrain;
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

    this.appendActionLog({
      id: `log-${entry.id}`,
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} made a ${skillId} argument`,
      detail: `${approachText} - interest ${interestDelta >= 0 ? '+' : ''}${interestDelta}, patience -1`,
      dice: this.toPowerDice(dice),
      total,
      tier,
      timestamp: entry.timestamp,
    });
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationAdjustPatience(meta: ConnectionMeta, delta: number): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.patience = Math.max(0, Math.min(neg.maxPatience, neg.patience + delta));
    if (neg.phase !== 'active' && neg.patience > 0) neg.phase = 'active';
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} adjusted patience`,
      detail: `${delta >= 0 ? '+' : ''}${delta} patience`,
    });
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationAdjustInterest(meta: ConnectionMeta, delta: number): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.interest = Math.max(0, Math.min(5, neg.interest + delta));
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} adjusted interest`,
      detail: `${delta >= 0 ? '+' : ''}${delta} interest`,
    });
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationReveal(meta: ConnectionMeta, kind: 'motivations' | 'pitfalls', id: string): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    const secret = neg[kind].find((candidate) => candidate.id === id);
    if (!secret) return;
    secret.revealed = true;
    this.syncNegotiationSecretReveal(kind, id);
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} revealed a ${kind === 'motivations' ? 'motivation' : 'pitfall'}`,
    });
    this.broadcastNegotiationUpdate();
  }

  private handleNegotiationEnd(meta: ConnectionMeta, phase: 'success' | 'failure'): void {
    const neg = this.ensureNegotiationState();
    if (!neg) return;
    neg.phase = phase;
    this.syncNegotiationPhase(phase);
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} ended the negotiation`,
      detail: phase,
    });
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
    this.appendActionLog({
      id: `log-${entry.id}`,
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} rolled ${skillId}`,
      detail: `${characteristicId} - ${outcome}`,
      dice: this.toPowerDice(dice),
      total,
      tier,
      timestamp: entry.timestamp,
    });
    this.broadcastMontageUpdate();
  }

  private handleMontageAdjust(meta: ConnectionMeta, track: 'successes' | 'failures', delta: number): void {
    const mont = this.ensureMontageState();
    if (!mont) return;
    const limit = track === 'successes' ? mont.successLimit : mont.failureLimit;
    mont[track] = Math.max(0, Math.min(limit, mont[track] + delta));
    this.updateMontageOutcome(mont);
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} adjusted montage ${track}`,
      detail: `${delta >= 0 ? '+' : ''}${delta} ${track}`,
    });
    this.broadcastMontageUpdate();
  }

  private handleMontageReset(meta: ConnectionMeta): void {
    const mont = this.ensureMontageState();
    if (!mont) return;
    mont.successes = 0;
    mont.failures = 0;
    mont.outcome = null;
    mont.testLog = [];
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} reset the montage`,
    });
    this.broadcastMontageUpdate();
  }

  private updateMontageOutcome(mont: MontageLiveState): void {
    const hitSuccess = mont.successes >= mont.successLimit;
    const hitFailure = mont.failures >= mont.failureLimit;
    if (hitSuccess && hitFailure) mont.outcome = 'partial_success';
    else if (hitSuccess) mont.outcome = 'total_success';
    else if (hitFailure) mont.outcome = 'total_failure';
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
    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} claimed ${activity.name}`,
      detail: activity.description,
    });
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

    this.appendActionLog({
      actorId: meta.userId,
      actorName: meta.username,
      title: `${meta.username} completed ${activity.name}`,
    });
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
    if (this.shouldSnapshotAfterBroadcast(msg)) {
      this.scheduleActiveSceneSnapshot();
    }
  }
}
