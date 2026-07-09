import type { ConditionName } from '@anvil/types';
import type { ConditionEndType, EntityCondition } from '../types/protocol.js';

export type { ConditionEndType, EntityCondition };

/** The nine Draw Steel conditions. */
export const CONDITION_IDS: readonly ConditionName[] = [
  'bleeding',
  'dazed',
  'frightened',
  'grabbed',
  'prone',
  'restrained',
  'slowed',
  'taunted',
  'weakened',
];

const VALID = new Set<string>(CONDITION_IDS);
const MANUAL = new Set<string>(['grabbed', 'prone', 'restrained']);

/** Fallback end rule for a bare condition name (matches the server default). */
export function defaultEndType(name: string): ConditionEndType {
  return MANUAL.has(name) ? 'manual' : 'save';
}

/** Short label for a condition's end/save rule. */
export function endTypeLabel(endType: ConditionEndType): string {
  return endType === 'save' ? 'save ends' : endType === 'eot' ? 'end of turn' : 'until removed';
}

function isEndType(value: unknown): value is ConditionEndType {
  return value === 'eot' || value === 'save' || value === 'manual';
}

/**
 * Read an entity's conditions as structured objects, tolerant of the legacy
 * `string[]` shape. Unknown names are dropped.
 */
export function readConditions(
  entity: Record<string, unknown> | null | undefined,
): EntityCondition[] {
  const raw = entity?.['conditions'];
  if (!Array.isArray(raw)) return [];
  const out: EntityCondition[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item === 'string') {
      const name = item.toLowerCase();
      if (VALID.has(name)) out.push({ name, endType: defaultEndType(name) });
    } else if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const name = String(rec['name'] ?? '').toLowerCase();
      if (!VALID.has(name)) continue;
      const endType = isEndType(rec['endType']) ? rec['endType'] : defaultEndType(name);
      const cond: EntityCondition = { name, endType };
      if (typeof rec['sourceId'] === 'string') cond.sourceId = rec['sourceId'];
      out.push(cond);
    }
  }
  return out;
}

/** Just the condition names on an entity. */
export function conditionNames(
  entity: Record<string, unknown> | null | undefined,
): ConditionName[] {
  return readConditions(entity).map((c) => c.name as ConditionName);
}
