import type {
  CombatEntityGroup,
  CombatState,
  EntityData,
} from '../types/protocol.js';

interface InitiativeGroupAssignment {
  id: string;
  name: string;
  creatureIds: string[];
}

interface EntityGroup {
  id: string;
  name: string;
  entityIds: string[];
  firstIndex: number;
}

export interface CombatDisplayGroup extends CombatEntityGroup {
  isGroup: boolean;
}

export function buildVillainCombatGroups(
  entities: EntityData[],
  sceneData: Record<string, unknown>,
): CombatEntityGroup[] {
  const villains = entities.filter(isVillain);
  if (villains.length === 0) return [];

  const entityGroups = buildEntityGroupsFromEntities(villains);
  const assignments = parseInitiativeGroupAssignments(
    sceneData['initiativeGroups'],
  );

  if (assignments.length > 0) {
    const grouped = buildGroupsFromAssignments(assignments, entityGroups);
    if (grouped.length > 0) return grouped;
  }

  return disambiguateEntityGroupNames(entityGroups)
    .filter((group) => group.entityIds.length > 1)
    .map(toCombatEntityGroup);
}

export function getVillainDisplayGroups(
  combat: CombatState,
  entityMap: Map<string, EntityData>,
): CombatDisplayGroup[] {
  const combatGroups = normalizeCombatGroups(
    combat.villainGroups ?? [],
    combat.villainEntities,
    entityMap,
  );

  if (combatGroups.length > 0) {
    return appendUngroupedVillains(
      combatGroups,
      combat.villainEntities,
      entityMap,
    );
  }

  return disambiguateEntityGroupNames(
    buildEntityGroupsFromIds(combat.villainEntities, entityMap),
  ).map((group) => ({
    ...toCombatEntityGroup(group),
    isGroup: group.entityIds.length > 1,
  }));
}

function buildGroupsFromAssignments(
  assignments: InitiativeGroupAssignment[],
  entityGroups: EntityGroup[],
): CombatEntityGroup[] {
  const groupByCreatureId = new Map(
    entityGroups.map((group) => [group.id, group]),
  );
  const assignedEntityIds = new Set<string>();
  const result: CombatEntityGroup[] = [];

  for (const assignment of assignments) {
    const entityIds: string[] = [];
    for (const creatureId of assignment.creatureIds) {
      const group = groupByCreatureId.get(creatureId);
      if (!group) continue;
      for (const entityId of group.entityIds) {
        if (assignedEntityIds.has(entityId)) continue;
        assignedEntityIds.add(entityId);
        entityIds.push(entityId);
      }
    }
    if (entityIds.length === 0) continue;
    result.push({
      id: assignment.id,
      name: assignment.name,
      entityIds,
    });
  }

  const fallbackGroups = disambiguateEntityGroupNames(entityGroups)
    .map((group) => ({
      ...group,
      entityIds: group.entityIds.filter(
        (entityId) => !assignedEntityIds.has(entityId),
      ),
    }))
    .filter((group) => group.entityIds.length > 1)
    .map(toCombatEntityGroup);

  return [...result, ...fallbackGroups];
}

function normalizeCombatGroups(
  groups: CombatEntityGroup[],
  villainEntityIds: string[],
  entityMap: Map<string, EntityData>,
): CombatDisplayGroup[] {
  const validIds = new Set(villainEntityIds);
  const usedIds = new Set<string>();

  return groups.flatMap((group, index): CombatDisplayGroup[] => {
    const entityIds = group.entityIds.filter((entityId) => {
      if (!validIds.has(entityId) || usedIds.has(entityId)) return false;
      usedIds.add(entityId);
      return true;
    });
    if (entityIds.length === 0) return [];

    const firstEntity =
      entityIds.length === 1 ? entityMap.get(entityIds[0]!) : null;
    const name = group.name.trim() || firstEntity?.name || `Group ${index + 1}`;

    return [
      {
        id: group.id.trim() || `combat-group-${index + 1}`,
        name,
        entityIds,
        isGroup: entityIds.length > 1 || name !== firstEntity?.name,
      },
    ];
  });
}

function appendUngroupedVillains(
  groups: CombatDisplayGroup[],
  villainEntityIds: string[],
  entityMap: Map<string, EntityData>,
): CombatDisplayGroup[] {
  const groupedEntityIds = new Set(groups.flatMap((group) => group.entityIds));
  const ungrouped = villainEntityIds
    .filter((entityId) => !groupedEntityIds.has(entityId))
    .map(
      (entityId): CombatDisplayGroup => ({
        id: `entity-${entityId}`,
        name: entityMap.get(entityId)?.name ?? entityId,
        entityIds: [entityId],
        isGroup: false,
      }),
    );

  return [...groups, ...ungrouped];
}

function buildEntityGroupsFromEntities(entities: EntityData[]): EntityGroup[] {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]));
  return buildEntityGroupsFromIds(
    entities.map((entity) => entity.id),
    entityMap,
  );
}

function buildEntityGroupsFromIds(
  entityIds: string[],
  entityMap: Map<string, EntityData>,
): EntityGroup[] {
  const groups = new Map<string, EntityGroup>();
  const missingEntities: EntityGroup[] = [];

  entityIds.forEach((entityId, index) => {
    const entity = entityMap.get(entityId);
    if (!entity) {
      missingEntities.push({
        id: entityId,
        name: entityId,
        entityIds: [entityId],
        firstIndex: index,
      });
      return;
    }

    const groupId = getCreatureGroupId(entity);
    const existing = groups.get(groupId);
    if (existing) {
      existing.entityIds.push(entity.id);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      name: getCreatureGroupName(entity),
      entityIds: [entity.id],
      firstIndex: index,
    });
  });

  return [...groups.values(), ...missingEntities].sort(
    (a, b) => a.firstIndex - b.firstIndex,
  );
}

function disambiguateEntityGroupNames(groups: EntityGroup[]): EntityGroup[] {
  const counts = new Map<string, number>();
  for (const group of groups) {
    if (group.entityIds.length <= 1) continue;
    counts.set(group.name, (counts.get(group.name) ?? 0) + 1);
  }

  return groups.map((group) => {
    if (group.entityIds.length <= 1 || (counts.get(group.name) ?? 0) <= 1) {
      return group;
    }
    const ordinalRange = formatOrdinalRange(group.entityIds);
    return {
      ...group,
      name: ordinalRange ? `${group.name} ${ordinalRange}` : group.name,
    };
  });
}

function parseInitiativeGroupAssignments(
  value: unknown,
): InitiativeGroupAssignment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry, index): InitiativeGroupAssignment[] => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const creatureIds = Array.isArray(record['creatureIds'])
      ? record['creatureIds'].filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        )
      : [];

    if (creatureIds.length === 0) return [];

    return [
      {
        id:
          typeof record['id'] === 'string' && record['id'].trim()
            ? record['id'].trim()
            : `initiative-group-${index + 1}`,
        name:
          typeof record['name'] === 'string' && record['name'].trim()
            ? record['name'].trim()
            : `Initiative Group ${index + 1}`,
        creatureIds,
      },
    ];
  });
}

function toCombatEntityGroup(group: EntityGroup): CombatEntityGroup {
  return {
    id: `combat-group-${slugify(group.id)}`,
    name: group.name,
    entityIds: group.entityIds,
  };
}

function getCreatureGroupId(entity: EntityData): string {
  return (
    getStringField(entity, 'squadId') ??
    getStringField(entity, 'monsterName')?.toLowerCase() ??
    stripTokenOrdinal(entity.name).toLowerCase()
  );
}

function getCreatureGroupName(entity: EntityData): string {
  return (
    getStringField(entity, 'monsterName') ??
    stripTokenOrdinal(entity.name) ??
    entity.name
  );
}

function getStringField(entity: EntityData, key: string): string | null {
  const value = entity[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stripTokenOrdinal(name: string): string {
  return name
    .replace(/\s+x\d+$/i, '')
    .replace(/\s+\d+$/, '')
    .trim();
}

function formatOrdinalRange(entityIds: string[]): string | null {
  const ordinals = entityIds
    .map((entityId) => entityId.match(/-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (ordinals.length !== entityIds.length || ordinals.length === 0) {
    return null;
  }

  const first = ordinals[0]!;
  const last = ordinals[ordinals.length - 1]!;
  return first === last ? String(first) : `${first}-${last}`;
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'group'
  );
}

function isVillain(entity: EntityData): boolean {
  return entity.type === 'monster' || entity.type === 'npc';
}
