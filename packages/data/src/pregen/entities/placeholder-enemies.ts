/**
 * Placeholder Enemy Templates
 *
 * Generic enemy templates for use until full Mettle integration.
 * These provide basic stat blocks that can be customized.
 */

import type { EntityType, CharacteristicName } from '@anvil/types';

/**
 * Enemy role determines their combat behavior
 */
export type EnemyRole = 'minion' | 'standard' | 'elite' | 'boss' | 'solo';

/**
 * Entity template for pre-gen enemies
 */
export interface EntityTemplate {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  role: EnemyRole;
  level: number;
  /** Base stamina (scales with level) */
  stamina: { current: number; max: number; temporary: number };
  /** Characteristics */
  characteristics: Record<CharacteristicName, number>;
  /** Speed in squares */
  speed: number;
  /** Stability */
  stability: number;
  /** Encounter value for balancing */
  ev: number;
  /** Free strike damage */
  freeStrike: number;
  /** Attack distance */
  distance: number;
  /** Notes for the director */
  notes: string;
}

/**
 * Placeholder minion enemy
 * Minions are weak but numerous - they go down in one hit
 */
export const PLACEHOLDER_MINION: EntityTemplate = {
  id: 'placeholder-minion',
  type: 'enemy',
  name: 'Minion (Placeholder)',
  description: 'A generic minion enemy. Weak individually, dangerous in numbers.',
  role: 'minion',
  level: 1,
  stamina: { current: 1, max: 1, temporary: 0 },
  characteristics: {
    might: 0,
    agility: 1,
    reason: -1,
    intuition: 0,
    presence: -1,
  },
  speed: 5,
  stability: 0,
  ev: 2,
  freeStrike: 2,
  distance: 1,
  notes: 'Minions have 1 stamina regardless of level. Use in groups of 4-8.',
};

/**
 * Placeholder standard enemy
 * Standard enemies are the bread and butter of encounters
 */
export const PLACEHOLDER_STANDARD: EntityTemplate = {
  id: 'placeholder-standard',
  type: 'enemy',
  name: 'Standard (Placeholder)',
  description: 'A generic standard enemy. Reliable and balanced.',
  role: 'standard',
  level: 1,
  stamina: { current: 20, max: 20, temporary: 0 },
  characteristics: {
    might: 1,
    agility: 1,
    reason: 0,
    intuition: 1,
    presence: 0,
  },
  speed: 5,
  stability: 1,
  ev: 6,
  freeStrike: 4,
  distance: 1,
  notes: 'Standard enemies form the core of most encounters. Stamina scales with level (20 + 5/level).',
};

/**
 * Placeholder elite enemy
 * Elites are tougher than standards and have special abilities
 */
export const PLACEHOLDER_ELITE: EntityTemplate = {
  id: 'placeholder-elite',
  type: 'enemy',
  name: 'Elite (Placeholder)',
  description: 'A generic elite enemy. Tougher and more dangerous.',
  role: 'elite',
  level: 1,
  stamina: { current: 40, max: 40, temporary: 0 },
  characteristics: {
    might: 2,
    agility: 1,
    reason: 1,
    intuition: 1,
    presence: 1,
  },
  speed: 5,
  stability: 2,
  ev: 12,
  freeStrike: 6,
  distance: 1,
  notes: 'Elites often have one special ability. Stamina scales with level (40 + 10/level).',
};

/**
 * Placeholder boss enemy
 * Bosses anchor an encounter and require focused effort to defeat
 */
export const PLACEHOLDER_BOSS: EntityTemplate = {
  id: 'placeholder-boss',
  type: 'enemy',
  name: 'Boss (Placeholder)',
  description: 'A generic boss enemy. The centerpiece of a challenging encounter.',
  role: 'boss',
  level: 1,
  stamina: { current: 80, max: 80, temporary: 0 },
  characteristics: {
    might: 2,
    agility: 2,
    reason: 1,
    intuition: 2,
    presence: 2,
  },
  speed: 6,
  stability: 3,
  ev: 30,
  freeStrike: 8,
  distance: 2,
  notes: 'Bosses typically have 2-3 special abilities and may have minions. Stamina scales with level (80 + 20/level).',
};

/**
 * Placeholder solo enemy
 * Solos are designed to fight the entire party alone
 */
export const PLACEHOLDER_SOLO: EntityTemplate = {
  id: 'placeholder-solo',
  type: 'enemy',
  name: 'Solo (Placeholder)',
  description: 'A generic solo enemy. A single creature that can challenge an entire party.',
  role: 'solo',
  level: 1,
  stamina: { current: 200, max: 200, temporary: 0 },
  characteristics: {
    might: 3,
    agility: 2,
    reason: 2,
    intuition: 2,
    presence: 3,
  },
  speed: 6,
  stability: 4,
  ev: 60,
  freeStrike: 10,
  distance: 2,
  notes: 'Solos take 2 turns per round and have multiple powerful abilities. Stamina scales with level (200 + 50/level).',
};

/**
 * All placeholder enemy templates
 */
export const PLACEHOLDER_ENEMIES: EntityTemplate[] = [
  PLACEHOLDER_MINION,
  PLACEHOLDER_STANDARD,
  PLACEHOLDER_ELITE,
  PLACEHOLDER_BOSS,
  PLACEHOLDER_SOLO,
];

/**
 * Get placeholder enemy by role
 */
export function getPlaceholderByRole(role: EnemyRole): EntityTemplate | undefined {
  return PLACEHOLDER_ENEMIES.find(e => e.role === role);
}

/**
 * Scale enemy stats to a given level
 */
export function scaleEnemyToLevel(template: EntityTemplate, targetLevel: number): EntityTemplate {
  const levelDiff = targetLevel - template.level;
  if (levelDiff === 0) return template;

  // Stamina scaling based on role
  const staminaPerLevel: Record<EnemyRole, number> = {
    minion: 0, // Minions always have 1 stamina
    standard: 5,
    elite: 10,
    boss: 20,
    solo: 50,
  };

  const newStamina = template.role === 'minion'
    ? 1
    : template.stamina.max + (staminaPerLevel[template.role] * levelDiff);

  // EV scaling (rough approximation)
  const evMultiplier = 1 + (levelDiff * 0.2);

  return {
    ...template,
    id: `${template.id}-level-${targetLevel}`,
    level: targetLevel,
    stamina: { current: newStamina, max: newStamina, temporary: 0 },
    ev: Math.round(template.ev * evMultiplier),
    freeStrike: template.freeStrike + Math.floor(levelDiff / 2),
  };
}
