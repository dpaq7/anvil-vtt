import type { CombatState } from '../types/protocol.js';

/** The Player's hero may claim the next turn (the same rule the combat tracker uses). */
export function canClaimTurn(combat: CombatState | null, heroId: string | null): boolean {
  if (!combat || !heroId) return false;
  const initiativePending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  return (
    !initiativePending &&
    combat.activeSide === 'heroes' &&
    !combat.activeEntityId &&
    !combat.actedThisRound.includes(heroId)
  );
}
