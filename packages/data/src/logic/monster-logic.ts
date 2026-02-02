/**
 * Monster Logic
 *
 * Pure functions for monster stat derivation, role multipliers, and EV calculations.
 * Used for battle scene instantiation and encounter building.
 *
 * Reference: Forge Steel src/logic/monster-logic.ts
 */

import * as FormatLogic from './format-logic.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Monster role types (Draw Steel).
 */
export type MonsterRoleType =
  | 'ambusher'
  | 'artillery'
  | 'brute'
  | 'controller'
  | 'defender'
  | 'harrier'
  | 'hexer'
  | 'mount'
  | 'support';

/**
 * Monster organization types (Draw Steel).
 */
export type MonsterOrganization =
  | 'minion'
  | 'band' // Forge Steel calls this "Horde"
  | 'platoon'
  | 'troop' // Standard, Forge Steel calls this "Elite"
  | 'leader'
  | 'solo';

/**
 * Characteristic names.
 */
export type Characteristic = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

/**
 * Movement mode.
 */
export interface MovementMode {
  type: 'fly' | 'swim' | 'burrow' | 'climb' | 'teleport';
  speed: number;
}

/**
 * Damage modifier (weakness/resistance).
 */
export interface DamageModifier {
  damageType: string;
  value: number;
}

/**
 * Stat modifier feature for runtime monster calculations.
 * Different from compendium MonsterFeature which is for display/data.
 */
export interface StatModifier {
  id?: string;
  name?: string;
  modifierType:
    | 'bonus'
    | 'immunity'
    | 'weakness'
    | 'conditionImmunity'
    | 'movement'
    | 'ability'
    | 'trait';
  field?: string; // For bonus: 'stamina', 'speed', 'stability', characteristic name
  value?: number;
  damageType?: string; // For immunity/weakness
  conditions?: string[]; // For conditionImmunity
  movementType?: MovementMode['type']; // For movement
  description?: string;
}

/**
 * Monster role information for runtime calculations.
 * Different from compendium MonsterRole which is a string union.
 */
export interface MonsterRoleInfo {
  type?: MonsterRoleType;
  organization?: MonsterOrganization;
}

/**
 * Monster combat state.
 */
export interface MonsterCombatState {
  currentStamina?: number;
  tempStamina?: number;
  conditions?: string[];
  defeated?: boolean;
}

/**
 * Minimal monster interface for logic calculations.
 */
export interface MonsterLike {
  id?: string;
  name: string;
  level?: number;
  stamina?: number;
  speed?: number;
  stability?: number;
  recoveries?: number;
  freeStrikeDamage?: number;
  characteristics?: Partial<Record<Characteristic, number>>;
  statModifiers?: StatModifier[];
  abilities?: unknown[];
  role?: MonsterRoleInfo;
  state?: MonsterCombatState;
}

/**
 * Monster group for display.
 */
export interface MonsterGroup {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Role & Organization
// ---------------------------------------------------------------------------

/**
 * Get the count multiplier for a monster organization.
 *
 * - Minions: 8 per slot
 * - Band/Horde: 4 per slot
 * - Platoon: 2 per slot
 * - Troop/Elite, Leader, Solo: 1 per slot
 *
 * @param organization - Monster organization type
 * @returns Count multiplier
 */
export function getRoleMultiplier(organization: MonsterOrganization | undefined): number {
  switch (organization) {
    case 'minion':
      return 8;
    case 'band':
      return 4;
    case 'platoon':
      return 2;
    case 'troop':
    case 'leader':
    case 'solo':
    default:
      return 1;
  }
}

/**
 * Get role type description for display.
 *
 * @param roleType - Monster role type
 * @returns Description string
 */
export function getRoleTypeDescription(roleType: MonsterRoleType): string {
  const descriptions: Record<MonsterRoleType, string> = {
    ambusher:
      'Ambushers are melee warriors who can slip by beefier heroes to reach squishier targets in the back lines.',
    artillery:
      'Artillery creatures fight best from afar, and can use their most powerful abilities at great distance.',
    brute: 'Brutes are hardy creatures who have lots of Stamina and deal lots of damage.',
    controller:
      'Controllers are creatures who change the battlefield, often with magic or psionics.',
    defender:
      'Defenders are tough creatures able to take a lot of damage, and who can force enemies to attack them.',
    harrier:
      'Harriers are mobile warriors who make definitive use of hit-and-run tactics.',
    hexer: 'Hexers specialize in debuffing enemies with conditions and other effects.',
    mount: 'Mounts are mobile creatures meant to be ridden in combat.',
    support: 'Support creatures specialize in aiding their allies.',
  };
  return descriptions[roleType] ?? '';
}

/**
 * Get organization description for display.
 *
 * @param organization - Monster organization type
 * @returns Description string
 */
export function getOrganizationDescription(organization: MonsterOrganization): string {
  const descriptions: Record<MonsterOrganization, string> = {
    minion:
      'Minions are weaker enemies who are made to die fast and threaten heroes en masse.',
    band: 'Monster bands are hardier and work in smaller groups than minions.',
    platoon: 'Monster platoons are highly organized and usually self-sufficient armies.',
    troop: 'Troops are hardy and can usually stand up to two heroes of the same level.',
    leader: 'A leader is powerful and buffs their allies, granting them extra actions.',
    solo: 'A creature under a solo organization is an encounter all on their own.',
  };
  return descriptions[organization] ?? '';
}

// ---------------------------------------------------------------------------
// Stamina & Defenses
// ---------------------------------------------------------------------------

/**
 * Get monster's max stamina.
 *
 * @param monster - Monster data
 * @returns Max stamina
 */
export function getStamina(monster: MonsterLike): number {
  let stamina = monster.stamina ?? 0;

  // Add bonuses from stat modifiers
  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'bonus' && mod.field === 'stamina') {
      stamina += mod.value ?? 0;
    }
  }

  return Math.max(0, stamina);
}

/**
 * Get minion squad stamina (shared pool).
 *
 * @param monsters - Array of minions
 * @returns Total squad stamina
 */
export function getMinionSquadStamina(monsters: MonsterLike[]): number {
  return monsters.reduce((sum, m) => sum + getStamina(m), 0);
}

/**
 * Get winded threshold (half max stamina).
 *
 * @param monster - Monster data
 * @returns Winded threshold
 */
export function getWindedThreshold(monster: MonsterLike): number {
  return Math.floor(getStamina(monster) / 2);
}

/**
 * Get dead threshold (negative winded value).
 *
 * @param monster - Monster data
 * @returns Dead threshold
 */
export function getDeadThreshold(monster: MonsterLike): number {
  return -getWindedThreshold(monster);
}

/**
 * Get number of recoveries.
 *
 * @param monster - Monster data
 * @returns Number of recoveries (default 6)
 */
export function getRecoveries(monster: MonsterLike): number {
  return monster.recoveries ?? 6;
}

/**
 * Get recovery value (1/3 max stamina).
 *
 * @param monster - Monster data
 * @returns Recovery value
 */
export function getRecoveryValue(monster: MonsterLike): number {
  return Math.floor(getStamina(monster) / 3);
}

// ---------------------------------------------------------------------------
// Characteristics
// ---------------------------------------------------------------------------

/**
 * Get a specific characteristic value.
 *
 * @param monster - Monster data
 * @param characteristic - Characteristic name
 * @returns Characteristic value
 */
export function getCharacteristic(
  monster: MonsterLike,
  characteristic: Characteristic
): number {
  let value = monster.characteristics?.[characteristic] ?? 0;

  // Add bonuses from stat modifiers
  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'bonus' && mod.field === characteristic) {
      value += mod.value ?? 0;
    }
  }

  return value;
}

/**
 * Get all characteristics.
 *
 * @param monster - Monster data
 * @returns All characteristic values
 */
export function getCharacteristics(monster: MonsterLike): Record<Characteristic, number> {
  return {
    might: getCharacteristic(monster, 'might'),
    agility: getCharacteristic(monster, 'agility'),
    reason: getCharacteristic(monster, 'reason'),
    intuition: getCharacteristic(monster, 'intuition'),
    presence: getCharacteristic(monster, 'presence'),
  };
}

// ---------------------------------------------------------------------------
// Speed & Movement
// ---------------------------------------------------------------------------

/**
 * Get monster's speed.
 *
 * @param monster - Monster data
 * @returns Speed value
 */
export function getSpeed(monster: MonsterLike): number {
  let speed = monster.speed ?? 5;

  // Add bonuses from stat modifiers
  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'bonus' && mod.field === 'speed') {
      speed += mod.value ?? 0;
    }
  }

  return Math.max(0, speed);
}

/**
 * Get monster's stability.
 *
 * @param monster - Monster data
 * @returns Stability value
 */
export function getStability(monster: MonsterLike): number {
  let stability = monster.stability ?? 0;

  // Add bonuses from stat modifiers
  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'bonus' && mod.field === 'stability') {
      stability += mod.value ?? 0;
    }
  }

  return stability;
}

/**
 * Get movement modes (fly, swim, burrow, climb, teleport).
 *
 * @param monster - Monster data
 * @returns Array of movement modes
 */
export function getMovementModes(monster: MonsterLike): MovementMode[] {
  const modes: MovementMode[] = [];

  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'movement' && mod.movementType) {
      modes.push({
        type: mod.movementType,
        speed: mod.value ?? monster.speed ?? 5,
      });
    }
  }

  return modes;
}

// ---------------------------------------------------------------------------
// Features & Abilities
// ---------------------------------------------------------------------------

/**
 * Get all stat modifiers from monster.
 *
 * @param monster - Monster data
 * @returns Array of stat modifiers
 */
export function getStatModifiers(monster: MonsterLike): StatModifier[] {
  return monster.statModifiers ?? [];
}

/**
 * Get monster's abilities.
 *
 * @param monster - Monster data
 * @returns Array of abilities
 */
export function getAbilities(monster: MonsterLike): unknown[] {
  return monster.abilities ?? [];
}

/**
 * Get free strike damage.
 *
 * @param monster - Monster data
 * @returns Free strike damage
 */
export function getFreeStrikeDamage(monster: MonsterLike): number {
  return monster.freeStrikeDamage ?? Math.max(1, Math.floor((monster.level ?? 1) / 2));
}

// ---------------------------------------------------------------------------
// Damage Modifiers
// ---------------------------------------------------------------------------

/**
 * Get damage immunities.
 *
 * @param monster - Monster data
 * @returns Array of damage types immune to
 */
export function getImmunities(monster: MonsterLike): string[] {
  const immunities: string[] = [];

  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'immunity' && mod.damageType) {
      if (!immunities.includes(mod.damageType)) {
        immunities.push(mod.damageType);
      }
    }
  }

  return immunities.sort();
}

/**
 * Get damage weaknesses.
 *
 * @param monster - Monster data
 * @returns Array of weakness modifiers
 */
export function getWeaknesses(monster: MonsterLike): DamageModifier[] {
  const modifiers = getStatModifiers(monster);
  return modifiers
    .filter((m) => m.modifierType === 'weakness' && m.damageType)
    .map((m) => ({
      damageType: m.damageType!,
      value: m.value ?? 5,
    }));
}

/**
 * Get condition immunities.
 *
 * @param monster - Monster data
 * @returns Array of condition names immune to
 */
export function getConditionImmunities(monster: MonsterLike): string[] {
  const immunities: string[] = [];

  const modifiers = getStatModifiers(monster);
  for (const mod of modifiers) {
    if (mod.modifierType === 'conditionImmunity' && mod.conditions) {
      for (const condition of mod.conditions) {
        if (!immunities.includes(condition)) {
          immunities.push(condition);
        }
      }
    }
  }

  return immunities.sort();
}

// ---------------------------------------------------------------------------
// Combat State
// ---------------------------------------------------------------------------

/**
 * Get health status based on current stamina.
 */
export type HealthStatus = 'healthy' | 'injured' | 'winded' | 'dead';

/**
 * Get combat state based on current stamina.
 *
 * @param monster - Monster data
 * @returns Health status
 */
export function getCombatState(monster: MonsterLike): HealthStatus {
  const maxStamina = getStamina(monster);
  const currentStamina = monster.state?.currentStamina ?? maxStamina;
  const winded = getWindedThreshold(monster);

  if (currentStamina <= 0) {
    return 'dead';
  }
  if (currentStamina <= winded) {
    return 'winded';
  }
  if (currentStamina < maxStamina) {
    return 'injured';
  }
  return 'healthy';
}

/**
 * Check if monster is a minion.
 *
 * @param monster - Monster data
 * @returns True if minion
 */
export function isMinion(monster: MonsterLike): boolean {
  return monster.role?.organization === 'minion';
}

/**
 * Check if monster is a solo.
 *
 * @param monster - Monster data
 * @returns True if solo
 */
export function isSolo(monster: MonsterLike): boolean {
  return monster.role?.organization === 'solo';
}

/**
 * Check if monster is a leader.
 *
 * @param monster - Monster data
 * @returns True if leader
 */
export function isLeader(monster: MonsterLike): boolean {
  return monster.role?.organization === 'leader';
}

/**
 * Check if monster is defeated.
 *
 * @param monster - Monster data
 * @returns True if defeated
 */
export function isDefeated(monster: MonsterLike): boolean {
  return monster.state?.defeated === true || getCombatState(monster) === 'dead';
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

/**
 * Get formatted monster name with group.
 *
 * @param monster - Monster data
 * @param group - Optional group info
 * @returns Formatted name
 */
export function getMonsterName(monster: MonsterLike, group?: MonsterGroup): string {
  if (group && group.name !== monster.name) {
    return `${monster.name} (${group.name})`;
  }
  return monster.name;
}

/**
 * Get stamina display string.
 * E.g., "15/30" or "15/30 (+5)"
 *
 * @param monster - Monster data
 * @returns Stamina display string
 */
export function getStaminaDescription(monster: MonsterLike): string {
  const max = getStamina(monster);
  const current = monster.state?.currentStamina ?? max;
  const temp = monster.state?.tempStamina ?? 0;

  return FormatLogic.formatStamina(current, max, temp);
}

/**
 * Get type label for display.
 * E.g., "Lvl 5 Brute" or "Lvl 1 Minion Harrier"
 *
 * @param monster - Monster data
 * @returns Type label
 */
export function getTypeLabel(monster: MonsterLike): string {
  const level = monster.level ?? 1;
  const org = monster.role?.organization;
  const role = monster.role?.type;

  return FormatLogic.formatMonsterType(level, org, role);
}

/**
 * Get role label.
 * E.g., "Brute", "Minion Harrier"
 *
 * @param monster - Monster data
 * @returns Role label
 */
export function getRoleLabel(monster: MonsterLike): string {
  const org = monster.role?.organization;
  const role = monster.role?.type;

  const parts: string[] = [];

  if (org && org !== 'troop') {
    parts.push(FormatLogic.capitalize(org));
  }
  if (role) {
    parts.push(FormatLogic.capitalize(role));
  }

  return parts.join(' ') || 'Monster';
}

// ---------------------------------------------------------------------------
// EV Calculation
// ---------------------------------------------------------------------------

/**
 * Base EV by organization type.
 */
const BASE_EV: Record<MonsterOrganization, number> = {
  minion: 1,
  band: 2,
  platoon: 3,
  troop: 4,
  leader: 6,
  solo: 12,
};

/**
 * Get effective level after adjustments.
 *
 * @param monster - Monster data
 * @param levelAdjustment - Optional level adjustment
 * @returns Effective level
 */
export function getEffectiveLevel(monster: MonsterLike, levelAdjustment = 0): number {
  return (monster.level ?? 1) + levelAdjustment;
}

/**
 * Calculate monster's encounter value.
 * Based on level and organization.
 *
 * @param monster - Monster data
 * @returns Encounter value
 */
export function calculateEV(monster: MonsterLike): number {
  const level = monster.level ?? 1;
  const org = monster.role?.organization ?? 'troop';

  // Scale by level
  const levelMultiplier = 1 + (level - 1) * 0.2;

  return Math.round(BASE_EV[org] * levelMultiplier);
}

/**
 * Calculate total EV for a group of monsters.
 *
 * @param monsters - Array of monsters
 * @returns Total encounter value
 */
export function calculateGroupEV(monsters: MonsterLike[]): number {
  return monsters.reduce((sum, m) => sum + calculateEV(m), 0);
}
