import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '../stores/sessionStore.js';

const TIER_LABEL: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

/**
 * Surface every resolved dice roll as a toast for everyone in the session (not
 * just the Director's action log). Fires once per roll id; a roll already in
 * state when this mounts (e.g. after a reconnect) is not re-toasted.
 */
export function useDiceRollToast(): void {
  const lastRoll = useSessionStore((s) => s.lastRoll);
  const seenId = useRef<string | null>(lastRoll?.id ?? null);

  useEffect(() => {
    if (!lastRoll || lastRoll.id === seenId.current) return;
    seenId.current = lastRoll.id;

    const tier = lastRoll.tier ? ` · ${TIER_LABEL[lastRoll.tier]}` : '';
    const dice = lastRoll.dice.map((d) => d.value).join(', ');
    const mod = lastRoll.modifier ? ` ${lastRoll.modifier > 0 ? '+' : ''}${lastRoll.modifier}` : '';
    toast(`🎲 ${lastRoll.rollerName} — ${lastRoll.label}: ${lastRoll.total}${tier}`, {
      description: `dice ${dice}${mod}`,
    });
  }, [lastRoll]);
}
