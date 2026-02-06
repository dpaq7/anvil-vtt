// Draw Steel Conditions Data
// Based on SRD condition rules

import type { ConditionEndTrigger } from '@anvil/types';

// Alias for compatibility
type ConditionEndType = ConditionEndTrigger;

export type ConditionId =
  | 'bleeding'
  | 'dazed'
  | 'frightened'
  | 'grabbed'
  | 'prone'
  | 'restrained'
  | 'slowed'
  | 'taunted'
  | 'weakened';

export interface ConditionDefinition {
  id: ConditionId;
  name: string;
  icon: string; // Emoji icon
  description: string;
  primaryEffect: string;
  saveEnds: boolean;
  saveRequired: string; // Description of how to end
  affectsActions: boolean; // True if this condition triggers on certain actions
  actionTriggers?: ('main' | 'triggered' | 'might_roll' | 'agility_roll' | 'power_roll')[];
  // Extended rules content from Draw Steel SRD
  rulesDescription: string;
}

export const CONDITIONS: Record<ConditionId, ConditionDefinition> = {
  bleeding: {
    id: 'bleeding',
    name: 'Bleeding',
    icon: '🩸',
    description: 'You are losing blood or vital essence rapidly.',
    primaryEffect: 'Take 1d6 + level damage when using a main action, triggered action, or making a Power Roll using Might or Agility.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: true,
    actionTriggers: ['main', 'triggered', 'might_roll', 'agility_roll'],
    rulesDescription: `While a creature is bleeding, whenever they use a main action, use a triggered action, or make a test or ability roll using Might or Agility, they lose Stamina equal to 1d6 + their level after the main action, triggered action, or power roll is resolved. This Stamina loss can't be prevented in any way, and only happens once per action.

You take damage from this condition when you use a main action off your turn. For example, a signature ability used as a free triggered action with the assistance of the tactician's Strike Now ability triggers the damage from the bleeding condition.`,
  },
  dazed: {
    id: 'dazed',
    name: 'Dazed',
    icon: '💫',
    description: 'Your senses are scrambled and you struggle to act.',
    primaryEffect: 'Limited to ONE of: Move Action, Maneuver, or Main Action. Cannot use triggered actions, free triggered actions, or free maneuvers.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `A creature who is dazed can do only one thing on their turn: use a main action, use a maneuver, or use a move action. A dazed creature also can't use triggered actions, free triggered actions, or free maneuvers.`,
  },
  frightened: {
    id: 'frightened',
    name: 'Frightened',
    icon: '😨',
    description: 'You are overcome with fear of a specific source.',
    primaryEffect: 'Bane on ability rolls against the fear source. Cannot willingly move closer to the source.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `When a creature is frightened, any ability roll they make against the source of their fear takes a bane. If that source is a creature, their ability rolls made against the frightened creature gain an edge. A frightened creature can't willingly move closer to the source of their fear if they know the location of that source. If a creature gains the frightened condition from one source while already frightened by a different source, the new condition replaces the old one.`,
  },
  grabbed: {
    id: 'grabbed',
    name: 'Grabbed',
    icon: '✊',
    description: 'A creature or effect is holding you in place.',
    primaryEffect: 'Speed 0. Bane on abilities that don\'t target the grab source.',
    saveEnds: false,
    saveRequired: 'Escape Grab maneuver or break adjacency',
    affectsActions: false,
    rulesDescription: `A creature who is grabbed has speed 0, can't be force moved except by a creature, object, or effect that has them grabbed, can't use the Knockback maneuver, and takes a bane on abilities that don't target the creature, object, or effect that has them grabbed. If a creature is grabbed by another creature and that creature moves, they bring the grabbed creature with them. If a creature's size is equal to or less than the size of a creature they have grabbed, their speed is halved while they have that creature grabbed.

A creature who has another creature grabbed can use a maneuver to move the grabbed creature into an unoccupied space adjacent to them.

A creature can release a creature they have grabbed at any time to end that condition (no action required). A grabbed creature can attempt to escape being grabbed using the Escape Grab maneuver. If a grabbed creature teleports, or if either the grabbed creature or the creature grabbing them is force moved so that both creatures are not adjacent to each other, that creature is no longer grabbed.

A creature can grab only creatures of their size or smaller. If a creature's Might score is 2 or higher, they can grab any creature larger than them with a size equal to or less than their Might score. Unless otherwise indicated, a creature can grab only one creature at a time.`,
  },
  prone: {
    id: 'prone',
    name: 'Prone',
    icon: '🔻',
    description: 'You are flat on the ground.',
    primaryEffect: 'Strikes you make take a bane. Melee abilities against you gain an edge.',
    saveEnds: false,
    saveRequired: 'Stand Up maneuver',
    affectsActions: false,
    rulesDescription: `While a creature is prone, they are flat on the ground, any strike they make takes a bane, and melee abilities used against them gain an edge. A prone creature must crawl to move along the ground, which costs 1 additional square of movement for every square crawled. A creature can't climb, jump, swim, or fly while prone. If they are climbing, flying, or jumping when knocked prone, they fall.

Unless the ability or effect that imposed the prone condition says otherwise, a prone creature can stand up using the Stand Up maneuver. A creature adjacent to a willing prone creature can likewise use the Stand Up maneuver to make that creature stand up.`,
  },
  restrained: {
    id: 'restrained',
    name: 'Restrained',
    icon: '⛓️',
    description: 'You are bound or entangled and cannot move freely.',
    primaryEffect: 'Speed 0. Cannot use Stand Up or be force moved. Bane on Ability Rolls and Might/Agility tests.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `A creature who is restrained has speed 0, can't use the Stand Up maneuver, and can't be force moved. A restrained creature takes a bane on ability rolls and on Might and Agility tests, and abilities used against them gain an edge.

If a creature teleports while restrained, that condition ends.`,
  },
  slowed: {
    id: 'slowed',
    name: 'Slowed',
    icon: '🐌',
    description: 'Your movement is impaired.',
    primaryEffect: 'Speed reduced to 2 (minimum). Cannot shift.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `A creature who is slowed has speed 2 unless their speed is already lower, and they can't shift.`,
  },
  taunted: {
    id: 'taunted',
    name: 'Taunted',
    icon: '😤',
    description: 'A creature has drawn your ire and demands your attention.',
    primaryEffect: 'Double bane on ability rolls that do not target the taunt source.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `A creature who is taunted has a double bane on ability rolls for any ability that doesn't target the creature who taunted them, as long as they have line of effect to that creature. If a creature gains the taunted condition from one source while already taunted by a different source, the new condition replaces the old one.`,
  },
  weakened: {
    id: 'weakened',
    name: 'Weakened',
    icon: '💔',
    description: 'Your strength is sapped.',
    primaryEffect: 'Bane on ALL Power Rolls.',
    saveEnds: true,
    saveRequired: 'd10 roll of 6+ at end of turn',
    affectsActions: false,
    rulesDescription: `A creature who is weakened takes a bane on power rolls.`,
  },
};

// Get all conditions as an array
export const ALL_CONDITIONS = Object.values(CONDITIONS);

// Get conditions that can be saved against
export const SAVEABLE_CONDITIONS = ALL_CONDITIONS.filter(c => c.saveEnds);

// Get conditions that affect actions
export const ACTION_AFFECTING_CONDITIONS = ALL_CONDITIONS.filter(c => c.affectsActions);

// Helper to perform a saving throw (d10, 6+ succeeds)
export const performSavingThrow = (): { roll: number; success: boolean } => {
  const roll = Math.floor(Math.random() * 10) + 1;
  return { roll, success: roll >= 6 };
};

// Calculate bleeding damage (1d6 + level)
export const calculateBleedingDamage = (level: number): { roll: number; total: number } => {
  const roll = Math.floor(Math.random() * 6) + 1;
  return { roll, total: roll + level };
};

/**
 * Get the default end type for a condition based on its nature
 * - Conditions that typically save-end default to 'roll'
 * - Conditions that need specific actions to end default to 'manual'
 */
export const getDefaultEndType = (conditionId: ConditionId): ConditionEndType => {
  const condition = CONDITIONS[conditionId];

  if (!condition) return 'manual';

  // Conditions that save-end (roll 6+ on d10) should default to 'roll'
  if (condition.saveEnds) {
    return 'roll';
  }

  // Conditions that require specific actions (grabbed, prone) default to 'manual'
  return 'manual';
};
