import { ArrowDown, ArrowDownToLine, Droplet, Ghost, Grab, Link2, Megaphone, Orbit, Snail, type LucideIcon } from 'lucide-react';

/** One icon per condition (`conditionIcon` in the demos). The same set is drawn on the map. */
export const CONDITION_ICONS: Record<string, LucideIcon> = {
  dazed: Orbit,
  bleeding: Droplet,
  weakened: ArrowDown,
  frightened: Ghost,
  slowed: Snail,
  prone: ArrowDownToLine,
  taunted: Megaphone,
  grabbed: Grab,
  restrained: Link2,
};
