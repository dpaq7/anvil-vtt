import { getVillainDisplayGroups } from '../lib/combat-groups.js';
import { cleanName, shortName } from '../lib/faces.js';
import type { CombatState, EntityData } from '../types/protocol.js';

export type Rect = { x: number; y: number; w: number; h: number };
export type Slot = 'below' | 'above' | 'right' | 'left';
export interface LabelInput {
  id: string;
  cx: number;
  cy: number;
  r: number;
  w: number;
  h: number;
  priority: number;
  /** Which way is away from this token's cluster, when it has one. */
  out?: { x: number; y: number };
}
export interface TokenLabel {
  /** Text of the map label, on one token per squad. Null on the other members. */
  text: string | null;
  /** The number on this squad member's own plate. */
  number: string | null;
}

const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * The collision rule (DESIGN.md 3.3). Highest priority first; each label tries below, above, right
 * and left of its token. A label with no free slot is dropped: the token's face and number stay.
 */
export function placeLabels(items: LabelInput[], blockers: Rect[], bounds: Rect): Record<string, Rect | null> {
  const out: Record<string, Rect | null> = {};
  const taken: Rect[] = [...blockers];
  const gap = 1;
  for (const it of [...items].sort((a, b) => b.priority - a.priority)) {
    const slots: Rect[] = [
      { x: it.cx - it.w / 2, y: it.cy + it.r + gap, w: it.w, h: it.h },
      { x: it.cx - it.w / 2, y: it.cy - it.r - gap - it.h, w: it.w, h: it.h },
      { x: it.cx + it.r + gap + 2, y: it.cy - it.h / 2, w: it.w, h: it.h },
      { x: it.cx - it.r - gap - 2 - it.w, y: it.cy - it.h / 2, w: it.w, h: it.h },
    ];
    // Labels are pushed outward from the cluster's middle, so a crowded party keeps its names.
    if (it.out) {
      const out = it.out;
      const score = (s: Rect) => (s.x + s.w / 2 - it.cx) * out.x + (s.y + s.h / 2 - it.cy) * out.y;
      slots.sort((a, b) => score(b) - score(a));
    }
    // A token never blocks its own label.
    const isSelf = (t: Rect) => t.x <= it.cx && it.cx <= t.x + t.w && t.y <= it.cy && it.cy <= t.y + t.h;
    const free = slots.find(
      (s) =>
        s.x >= bounds.x && s.y >= bounds.y && s.x + s.w <= bounds.x + bounds.w && s.y + s.h <= bounds.y + bounds.h &&
        !taken.some((t) => !isSelf(t) && hit(s, t)),
    );
    out[it.id] = free ?? null;
    if (free) taken.push(free);
  }
  return out;
}

const numberOf = (name: string) => /\s(\d+)$/.exec(cleanName(name))?.[1] ?? null;
const stemOf = (name: string) => cleanName(name).replace(/\s+\d+$/, '');
const plural = (word: string) => (word.endsWith('s') ? word : `${word}s`);

/**
 * One label per squad ("Scrappers 1 to 4"); each member carries its number. Named creatures take a
 * short tag. A family word shared by two or more kinds in the scene is dropped ("Angulotl Wave"
 * reads "Wave"). `entities` is what this viewer may see, so a Player's ranges and tags never count
 * a hidden creature.
 */
export function buildTokenLabels(entities: EntityData[], combat: CombatState | null): Map<string, TokenLabel> {
  const out = new Map<string, TokenLabel>();
  const creatures = entities.filter((e) => e.type !== 'hero');
  const byId = new Map(entities.map((e) => [e.id, e]));

  const families = new Map<string, Set<string>>();
  for (const creature of creatures) {
    const stem = stemOf(creature.name);
    const family = stem.split(/\s+/)[0] ?? stem;
    const kinds = families.get(family) ?? new Set<string>();
    kinds.add(stem);
    families.set(family, kinds);
  }
  const tag = (name: string) => {
    const stem = shortName(stemOf(name));
    const words = stem.split(/\s+/);
    const family = words[0] ?? stem;
    return words.length > 1 && (families.get(family)?.size ?? 0) > 1 ? words.slice(1).join(' ') : stem;
  };

  const groupOf = new Map<string, string[]>();
  if (combat) {
    for (const group of getVillainDisplayGroups(combat, byId)) {
      const members = group.entityIds.filter((id) => byId.has(id));
      if (members.length > 1) for (const id of members) groupOf.set(id, members);
    }
  }
  for (const creature of creatures) {
    if (groupOf.has(creature.id)) continue;
    const squad = creature['squadId'];
    if (typeof squad === 'string') {
      const members = creatures.filter((c) => c['squadId'] === squad).map((c) => c.id);
      if (members.length > 1) for (const id of members) groupOf.set(id, members);
    }
  }

  for (const creature of creatures) {
    const number = numberOf(creature.name);
    const members = groupOf.get(creature.id);
    if (!members) {
      out.set(creature.id, { text: tag(creature.name), number: null });
      continue;
    }
    const numbers = members.map((id) => numberOf(byId.get(id)?.name ?? '')).filter((n): n is string => n !== null).map(Number).sort((a, b) => a - b);
    const lead = members[0] === creature.id;
    const stem = tag(creature.name);
    const range = numbers.length > 1 ? ` ${numbers[0]} to ${numbers[numbers.length - 1]}` : '';
    out.set(creature.id, { text: lead ? `${plural(stem)}${range}` : null, number });
  }
  return out;
}
