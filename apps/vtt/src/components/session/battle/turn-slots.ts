import { Footprints, Shield, Swords, Zap, type LucideIcon } from 'lucide-react';
import { MovementLogic } from '@anvil/data';
import type { ConditionName } from '@anvil/types';
import type { TurnActionState } from '../../../types/protocol.js';

export type AbilityGroup = 'action' | 'maneuver' | 'triggered';

interface Slot {
  label: string;
  Icon: LucideIcon;
  state: string;
  used: boolean;
  group?: AbilityGroup;
}

/** The four action slots, shared by the Player's hero card and the Director's Now card. */
export function turnSlots(turnActions: TurnActionState | null, baseSpeed: number, conditions: string[]): Slot[] {
  const main = !turnActions || (!turnActions.mainActionUsed && turnActions.mainConvertedTo === null);
  const maneuver = !turnActions || !turnActions.maneuverUsed || (turnActions.mainConvertedTo === 'maneuver' && !turnActions.mainActionUsed);
  const triggered = !turnActions || !turnActions.triggeredUsedThisRound;
  // Condition-adjusted movement (slowed caps at 2, grabbed/restrained to 0).
  const budget = turnActions ? MovementLogic.getMovementBudget(baseSpeed, turnActions, conditions as ConditionName[]) : null;
  const remaining = budget ? budget.remaining : baseSpeed;
  const total = budget ? budget.totalSpeed : baseSpeed;
  const note = budget?.isImmobilized ? ', immobilized' : budget?.mustCrawl ? ', crawl' : budget && budget.totalSpeed < baseSpeed ? ', slowed' : '';
  return [
    { label: 'Main', Icon: Swords, state: main ? 'Ready' : 'Used', used: !main, group: 'action' },
    { label: 'Maneuver', Icon: Shield, state: maneuver ? 'Ready' : 'Used', used: !maneuver, group: 'maneuver' },
    { label: 'Move', Icon: Footprints, state: `${remaining}/${total}${note}`, used: remaining <= 0 },
    { label: 'Triggered', Icon: Zap, state: triggered ? 'Ready' : 'Used', used: !triggered, group: 'triggered' },
  ];
}

