// Combat-related types for essence economy and turn flow

import type { GridPosition } from './common.js';

export interface EssenceEconomy {
  currentEssence: number;
  essenceGainedThisTurn: number;

  // Tracking for "first time" triggers
  turnNumber: number;
  signatureMinionsSpawnedThisTurn: boolean;

  // SRD: Gain +1 Essence when any minion dies in range (limit 1/round)
  minionDeathEssenceGainedThisRound: boolean;

  // Pending free signature minions to be selected by player
  pendingFreeMinions: number;
}

export interface SummoningAction {
  type: 'callForth' | 'signatureSpawn' | 'fixtureRelocation' | 'championSummon';
  essenceCost: number;
  minionTemplateId?: string;
  targetPosition?: GridPosition;
  sacrificedMinionIds?: string[]; // Minions sacrificed to reduce cost
}

export type TurnPhase =
  | 'collectResources'
  | 'summonMinions'
  | 'positionUnits'
  | 'executePlan';

export interface TurnState {
  currentPhase: TurnPhase;
  roundNumber: number;
  phasesCompleted: TurnPhase[];
}

/**
 * Out-of-Combat Summoner State
 * Summoner v1.0 SRD:
 * - Max 4 free minions outside combat
 * - Signature minions: freely summonable
 * - Other minions: require Victories >= essence cost
 * - Abilities: free but once per ability until Victory or respite
 */
export interface OutOfCombatState {
  // Out-of-combat minion tracking (max 4)
  activeMinions: OutOfCombatMinion[];

  // Ability usage tracking (ability ID -> used since last Victory/respite)
  usedAbilities: Record<string, boolean>;

  // When combat starts, these minions are dismissed
  shouldDismissOnCombatStart: boolean;
}

export interface OutOfCombatMinion {
  id: string;
  templateId: string;
  name: string;
  essenceCost: number;
  task?: string; // Optional description of what the minion is doing
}

/**
 * Champion State Tracking
 * Summoner v1.0 SRD:
 * - Unlocks at Level 8
 * - Only 1 instance at a time
 * - Must earn a Victory to resummon after death
 * - Champion Action (Level 10): eidos cost, once per encounter
 */
export interface ChampionState {
  // Can the champion be summoned?
  canSummon: boolean;

  // Has the champion been summoned this encounter?
  summonedThisEncounter: boolean;

  // Has Champion Action been used this encounter? (Level 10)
  championActionUsed: boolean;

  // Does the summoner need to earn a Victory before resummon?
  requiresVictoryToResummon: boolean;
}

/**
 * Sacrifice operation result
 */
export interface SacrificeResult {
  success: boolean;
  costReduction: number;
  sacrificedMinionIds: string[];
  errorMessage?: string;
}
