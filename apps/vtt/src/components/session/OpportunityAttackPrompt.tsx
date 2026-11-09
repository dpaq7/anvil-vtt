import { cleanName } from '../../lib/faces.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import type { ClientMessage } from '../../types/protocol.js';
import { useSessionConnection } from './shell/connection-context.js';

interface OpportunityAttackPromptProps {
  send: (message: ClientMessage) => void;
}

/**
 * Floating prompt shown when a committed move provoked opportunity attacks.
 * Resolves them one at a time: "Free Strike" makes the melee free strike on the
 * server; "Waive" logs that it was passed. Advisory: closing without acting is
 * fine (the move already happened). During a drop it stays open and waits, because
 * sending then dismissing would lose the attack for good.
 */
export function OpportunityAttackPrompt({ send }: OpportunityAttackPromptProps) {
  const pendingOA = useSessionStore((s) => s.pendingOA);
  const dismissOA = useSessionStore((s) => s.dismissOA);
  const { paused } = useSessionConnection();

  if (pendingOA.length === 0) return null;
  const trigger = pendingOA[0]!;

  const resolve = (decision: 'take' | 'pass') => {
    if (paused) return;
    send({ type: 'resolve_opportunity_attack', trigger, decision });
    dismissOA(trigger);
  };

  return (
    <div className="sb-pop sb-screen-msg" data-map-panel>
      <strong>Opportunity attack</strong>
      <p className="sb-note">
        <b>{cleanName(trigger.attackerName)}</b> can strike <b>{cleanName(trigger.targetName)}</b> as they leave.
      </p>
      <div className="my-1 flex items-center gap-3">
        <button type="button" className="sb-end flex-1" data-wait={paused || undefined} disabled={paused} onClick={() => resolve('take')}>
          {paused ? 'Free Strike, when back' : 'Free Strike'}
        </button>
        <button type="button" className="sb-link" disabled={paused} onClick={() => resolve('pass')}>Waive</button>
      </div>
      {pendingOA.length > 1 && <p className="sb-note">{pendingOA.length - 1} more to resolve</p>}
    </div>
  );
}
