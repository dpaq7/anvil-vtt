// Troubadour Routines Data
// Based on Draw Steel TTRPG rules

import type { TroubadourClassAct } from './subclasses';

export interface RoutineDefinition {
  id: string;
  name: string;
  source: 'base' | TroubadourClassAct;
  level: number;
  auraDistance: number | null;
  rangedDistance?: number;
  effect: string;
  endOfTurnEffect?: string;
}

export const routineDefinitions: RoutineDefinition[] = [
  // ===== BASE ROUTINES (available to all Troubadours) =====
  {
    id: 'choreography',
    name: 'Choreography',
    source: 'base',
    level: 1,
    auraDistance: 5,
    effect: 'Targets gain a +2 bonus to speed until the end of their turn.',
  },
  {
    id: 'revitalizing-limerick',
    name: 'Revitalizing Limerick',
    source: 'base',
    level: 1,
    auraDistance: 5,
    effect: 'At the end of the troubadour\'s turn, up to Presence score targets can spend a Recovery.',
    endOfTurnEffect: 'Choose up to P targets to spend a Recovery',
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    source: 'base',
    level: 6,
    auraDistance: 5,
    effect: 'Targets starting their turn in the aura gain 1 of their Heroic Resource. The resource disappears if not spent by the end of their turn.',
  },

  // ===== AUTEUR ROUTINES =====
  {
    id: 'blocking',
    name: 'Blocking',
    source: 'auteur',
    level: 1,
    auraDistance: 2,
    effect: 'At the end of turn, choose up to Presence targets and teleport them to unoccupied spaces within the area.',
    endOfTurnEffect: 'Teleport up to P targets within 2 squares',
  },
  {
    id: 'take-two',
    name: 'Take Two!',
    source: 'auteur',
    level: 5,
    auraDistance: 5,
    effect: 'Targets reroll the first power roll that turn that obtains a tier 2 outcome. They must use the new roll.',
  },
  {
    id: 'plot-armor',
    name: 'Plot Armor',
    source: 'auteur',
    level: 7,
    auraDistance: 5,
    effect: 'When a target would take damage that would reduce them to 0 Stamina or below, they instead drop to 1 Stamina (once per encounter per target).',
  },

  // ===== DUELIST ROUTINES =====
  {
    id: 'acrobatics',
    name: 'Acrobatics',
    source: 'duelist',
    level: 1,
    auraDistance: 5,
    effect: 'Targets automatically obtain a tier 3 outcome on one test made to jump, tumble, or climb as part of their movement.',
  },
  {
    id: 'we-cant-be-upstaged',
    name: 'We Can\'t Be Upstaged!',
    source: 'duelist',
    level: 5,
    auraDistance: 5,
    effect: 'Targets gain a bonus to the distance they can shift equal to Presence score until the end of their turn.',
  },
  {
    id: 'tandem-strike',
    name: 'Tandem Strike',
    source: 'duelist',
    level: 7,
    auraDistance: 5,
    effect: 'When the troubadour hits with a strike, one ally in the aura can use a free triggered action to make a basic strike against the same target.',
  },

  // ===== VIRTUOSO ROUTINES =====
  {
    id: 'ballad-of-the-beast',
    name: '"Ballad of the Beast"',
    source: 'virtuoso',
    level: 1,
    auraDistance: 5,
    effect: 'Targets starting their turn in the aura gain 1 surge.',
  },
  {
    id: 'thunder-mother',
    name: '"Thunder Mother"',
    source: 'virtuoso',
    level: 1,
    auraDistance: null,
    rangedDistance: 10,
    effect: 'At the end of each round, make a Presence power roll (ignoring cover) against one creature within 10 squares, dealing Lightning damage (up to 10 + level damage).',
    endOfTurnEffect: 'Presence attack vs one target within 10',
  },
  {
    id: 'fire-up-the-night',
    name: '"Fire Up the Night"',
    source: 'virtuoso',
    level: 3,
    auraDistance: 5,
    effect: 'Targets do not take a bane on strikes against concealed creatures, and can use a free maneuver once per turn to search for hidden creatures.',
  },
  {
    id: 'never-ending-hero',
    name: '"Never-Ending Hero"',
    source: 'virtuoso',
    level: 3,
    auraDistance: 5,
    effect: 'Dying targets in the area gain an edge on power rolls and ignore bleeding until the end of their turn.',
  },
  {
    id: 'moonlight-sonata',
    name: '"Moonlight Sonata"',
    source: 'virtuoso',
    level: 9,
    auraDistance: 5,
    effect: 'Dead targets can choose to continue taking turns (move + main action/maneuver). They turn to dust at the end of the encounter.',
  },
  {
    id: 'radical-fantasia',
    name: '"Radical Fantasia"',
    source: 'virtuoso',
    level: 9,
    auraDistance: 5,
    effect: 'Targets ignore difficult terrain; forced movement abilities gain a +2 bonus to distance; can use one triggered action per round as a free triggered action.',
  },
];

/**
 * Get all routines available to a Troubadour based on their Class Act and level
 */
export function getRoutinesForClassAct(
  classAct: TroubadourClassAct | undefined,
  level: number
): RoutineDefinition[] {
  return routineDefinitions.filter(routine => {
    // Check level requirement
    if (routine.level > level) return false;
    // Include base routines
    if (routine.source === 'base') return true;
    // Include class-specific routines if matching
    if (classAct && routine.source === classAct) return true;
    return false;
  });
}

/**
 * Check if the Troubadour can use Medley (two active routines)
 * Only Virtuoso at level 5+ gets this feature
 */
export function canUseMedley(classAct: TroubadourClassAct | undefined, level: number): boolean {
  return classAct === 'virtuoso' && level >= 5;
}

/**
 * Get a routine definition by ID
 */
export function getRoutineById(id: string): RoutineDefinition | undefined {
  return routineDefinitions.find(r => r.id === id);
}

/**
 * Get routines grouped by source
 */
export function getRoutinesGroupedBySource(
  classAct: TroubadourClassAct | undefined,
  level: number
): { base: RoutineDefinition[]; classAct: RoutineDefinition[] } {
  const available = getRoutinesForClassAct(classAct, level);
  return {
    base: available.filter(r => r.source === 'base'),
    classAct: available.filter(r => r.source !== 'base'),
  };
}
