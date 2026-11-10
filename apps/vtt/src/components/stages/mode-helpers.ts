import { Backpack, Bed, Hammer, MessagesSquare, ScrollText, Tent, type LucideIcon } from 'lucide-react';
import { NegotiationLogic } from '@anvil/data';
import type { RespiteActivityState } from '../../types/protocol.js';

/* Small helpers shared by the mode screens, their rails, the phone and the Display. */

export type RespiteFilter = 'all' | 'open' | 'done';

export interface PreparedActivity {
  heroName: string;
  activityType: string;
  completed: boolean;
}

export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

export const OUTCOME_LABEL: Record<string, string> = {
  total_success: 'Total success',
  partial_success: 'Partial success',
  total_failure: 'Total failure',
};

export const interestStep = (n: number) =>
  NegotiationLogic.getInterestDescription(n).replace(/\.\.\.$/, "…");

export const secretTypeLabel = (type: string) =>
  type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const KIND_ICONS: [RegExp, LucideIcon][] = [
  [/recover|rest|sleep/i, Bed],
  [/craft|project|make/i, Hammer],
  [/research|study|read/i, ScrollText],
  [/social|talk|carous/i, MessagesSquare],
  [/kit|gear/i, Backpack],
];
export const kindIcon = (name: string): LucideIcon => KIND_ICONS.find(([re]) => re.test(name))?.[1] ?? Tent;
export const activityState = (a: RespiteActivityState) => (a.completed ? 'done' : a.claimedBy ? 'working' : 'open');

/** Live activities, or the scene's prepared ones shown as open tickets. */
export function respiteTickets(live: RespiteActivityState[] | undefined, prepared: PreparedActivity[]): RespiteActivityState[] {
  if (live && live.length > 0) return live;
  return prepared.map((a, i) => ({
    activityId: `prepared-${i}`,
    name: a.activityType.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    description: '',
    claimedBy: null,
    claimedByName: a.heroName === 'Available' ? null : a.heroName,
    completed: a.completed,
  }));
}
