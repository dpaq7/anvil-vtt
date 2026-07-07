import { Button } from '@anvil/ui';
import { useSessionStore } from '../../stores/sessionStore.js';
import type { ClientMessage } from '../../types/protocol.js';

interface OpportunityAttackPromptProps {
  send: (message: ClientMessage) => void;
}

/**
 * Floating prompt shown when a committed move provoked opportunity attacks.
 * Resolves them one at a time — "Free Strike" makes the melee free strike on the
 * server; "Waive" logs that it was passed. Advisory: closing without acting is
 * fine (the move already happened).
 */
export function OpportunityAttackPrompt({ send }: OpportunityAttackPromptProps) {
  const pendingOA = useSessionStore((s) => s.pendingOA);
  const dismissOA = useSessionStore((s) => s.dismissOA);

  if (pendingOA.length === 0) return null;
  const trigger = pendingOA[0]!;

  const resolve = (decision: 'take' | 'pass') => {
    send({ type: 'resolve_opportunity_attack', trigger, decision });
    dismissOA(trigger);
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-30 w-72 -translate-x-1/2 rounded-lg border border-red-500/40 bg-zinc-900/95 p-3 shadow-xl">
      <p className="text-xs font-semibold text-red-300">Opportunity Attack</p>
      <p className="mt-1 text-sm text-zinc-200">
        <span className="font-bold">{trigger.attackerName}</span> can strike{' '}
        <span className="font-bold">{trigger.targetName}</span> as they leave.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => resolve('take')}>
          Free Strike
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={() => resolve('pass')}>
          Waive
        </Button>
      </div>
      {pendingOA.length > 1 && (
        <p className="mt-2 text-center text-[11px] text-zinc-500">
          +{pendingOA.length - 1} more to resolve
        </p>
      )}
    </div>
  );
}
