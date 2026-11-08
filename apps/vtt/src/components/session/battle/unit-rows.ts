import { buildTokenLabels } from '../../../canvas/labels.js';
import { getVillainDisplayGroups } from '../../../lib/combat-groups.js';
import { cleanName, shortName } from '../../../lib/faces.js';
import type { CombatState, EntityData } from '../../../types/protocol.js';

export interface UnitRowData {
  id: string;
  name: string;
  members: EntityData[];
}

const stem = (name: string) => cleanName(name).replace(/\s+\d+$/, '');
const plural = (word: string) => (word.endsWith('s') ? word : `${word}s`);

/**
 * The Director's side as rows. Draws only from `entityMap`, which is what this viewer may see, so a
 * Player's rows and counts drop hidden creatures (0/11, not 0/14). With `fold`, squads of one kind
 * become one row ("Scrappers, 3 squads") and single creatures of one family another ("Angulotl, 5").
 */
export function buildUnitRows(combat: CombatState, entityMap: Map<string, EntityData>, fold: boolean): UnitRowData[] {
  const visible = [...entityMap.values()];
  const labels = buildTokenLabels(visible, combat);
  const units: UnitRowData[] = [];
  for (const group of getVillainDisplayGroups(combat, entityMap)) {
    const members = group.entityIds.flatMap((id) => entityMap.get(id) ?? []);
    const first = members[0];
    if (!first) continue;
    const name = labels.get(first.id)?.text ?? shortName(first.name);
    units.push({ id: group.id, name, members });
  }
  if (!fold) return units;

  const out: UnitRowData[] = [];
  const buckets = new Map<string, { label: string; units: UnitRowData[]; at: number }>();
  units.forEach((unit) => {
    const first = unit.members[0]!;
    const squad = unit.members.length > 1;
    const words = stem(first.name).split(/\s+/);
    // Squads fold by kind; single creatures by the family word they share.
    const key = squad ? `squad:${stem(first.name)}` : `one:${words[0] ?? ''}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.units.push(unit);
    else buckets.set(key, { label: words[0] ?? '', units: [unit], at: out.length });
    if (!bucket) out.push(unit);
  });
  for (const [key, bucket] of buckets) {
    if (bucket.units.length < 2) continue;
    const first = bucket.units[0]!;
    const members = bucket.units.flatMap((u) => u.members);
    const kind = stem(first.members[0]!.name).split(/\s+/).pop() ?? bucket.label;
    const name = key.startsWith('squad:') ? `${plural(kind)}, ${bucket.units.length} squads` : `${bucket.label}, ${bucket.units.length}`;
    out[bucket.at] = { id: key, name, members };
  }
  return out;
}
