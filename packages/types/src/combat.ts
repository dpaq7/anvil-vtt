/**
 * Draw Steel Combat Types
 * Action economy, initiative, and power rolls
 */

import type { Characteristic as CharacteristicName } from './hero/common.js';

/**
 * Action types in VTT combat tracking
 * Note: This differs from ability ActionType which uses 'action' instead of 'main'
 */
export type CombatActionType =
  | 'main' // Main action (attacks, abilities)
  | 'maneuver' // Maneuver (Aid Attack, Grab, Knockback, Hide, etc.)
  | 'move' // Move action (move, Disengage, etc.)
  | 'triggered' // Triggered action (reaction to trigger)
  | 'free-triggered' // Free triggered action (doesn't use triggered action)
  | 'free-maneuver'; // Free maneuver (doesn't use maneuver)

/** @deprecated Use CombatActionType for VTT or ActionType from abilities for hero data */
export type VttActionType = CombatActionType;

/**
 * Combat turn tracking
 */
export interface CombatTurn {
  entityId: string;
  round: number;

  mainActionUsed: boolean;
  maneuverUsed: boolean;
  moveActionUsed: boolean;
  /** One per round, not per turn */
  triggeredActionUsed: boolean;

  movementRemaining: number;
  hasShifted: boolean;

  forcedMovementDealt: ForcedMovement[];
}

export interface ForcedMovement {
  type: 'push' | 'pull' | 'slide' | 'vertical-push' | 'vertical-pull';
  distance: number;
  targetEntityId: string;
}

/**
 * Initiative entry for combat order
 * @deprecated Draw Steel uses alternating initiative, not numeric. This interface
 * is retained for backward compatibility but should not be used for new code.
 * Use BattleState.combatState for proper alternating turn tracking.
 */
export interface InitiativeEntry {
  entityId: string;
  /** @deprecated Draw Steel doesn't use numeric initiative */
  initiative: number;
  hasActed: boolean;
  isDelaying: boolean;
  turn?: CombatTurn;
}

/**
 * Power roll modifier
 */
export interface RollModifier {
  type: 'edge' | 'bane' | 'bonus' | 'penalty';
  /** For bonus/penalty */
  value?: number;
  source: string;
  /** Edges/banes don't stack (take best/worst) */
  stacks?: boolean;
}

/**
 * Power roll result
 */
export interface PowerRollResult {
  dice: number[];
  selected: number[];
  characteristic: CharacteristicName;
  characteristicValue: number;
  modifiers: RollModifier[];
  total: number;
  /** 1 = ≤11, 2 = 12-16, 3 = 17+ */
  tier: 1 | 2 | 3;
}

/**
 * Power roll configuration
 */
export interface PowerRollConfig {
  characteristic: CharacteristicName;
  characteristicValue: number;
  edges: number;
  banes: number;
  bonuses: number[];
}

// ---------------------------------------------------------------------------
// Movement & Opportunity Attacks
// ---------------------------------------------------------------------------

/**
 * Movement mode determines how tokens move and whether they trigger OAs.
 * - advance: Normal movement, can trigger opportunity attacks
 * - disengage: Shift movement (Draw Steel: "disengage"), safe from OA triggers
 */
export type MovementMode = 'advance' | 'disengage';

/**
 * A source that can threaten opportunity attacks.
 */
export interface ThreatSource {
  /** Entity ID of the threatening creature */
  entityId: string;
  /** Display name of the threatening creature (for OA prompts) */
  name?: string;
  /** Grid position X (top-left for multi-square) */
  gridX: number;
  /** Grid position Y (top-left for multi-square) */
  gridY: number;
  /** Which side this entity is on */
  side: 'heroes' | 'enemies';
  /** Melee reach in squares (default 1) */
  reach?: number;
  /** Whether this entity can currently make OAs */
  canMakeOA: boolean;
  /** Token size in squares (default 1) */
  size?: number;
}

/**
 * An opportunity attack that has been triggered by movement.
 */
export interface OpportunityAttackTrigger {
  /** Entity ID of the attacker (who gets the free strike) */
  attackerId: string;
  /** Name of the attacker for display */
  attackerName: string;
  /** Entity ID of the mover (target of the free strike) */
  targetId: string;
  /** Name of the target for display */
  targetName: string;
  /** Grid position where the OA was triggered (the "from" position) */
  triggerGridX: number;
  triggerGridY: number;
  /** Grid position the target was moving to (the "to" position) */
  destinationGridX: number;
  destinationGridY: number;
}

/**
 * Result of opportunity attack detection for a movement path.
 */
export interface OpportunityAttackResult {
  /** Whether any OAs would be triggered */
  triggersOA: boolean;
  /** List of triggered opportunity attacks */
  triggers: OpportunityAttackTrigger[];
  /** Index in the path where first OA would trigger (for path visualization) */
  firstTriggerIndex?: number;
}

/**
 * User decision on an opportunity attack prompt.
 */
export type OpportunityAttackDecision = 'take' | 'pass';

/**
 * State for opportunity attack resolution UI.
 */
export interface OpportunityAttackPromptState {
  /** Whether the prompt is visible */
  isVisible: boolean;
  /** Current trigger being resolved */
  currentTrigger: OpportunityAttackTrigger | null;
  /** Remaining triggers to resolve */
  pendingTriggers: OpportunityAttackTrigger[];
  /** Entity ID of the token being moved */
  moverId: string | null;
  /** Final destination if movement completes */
  finalDestination: { gridX: number; gridY: number } | null;
}
