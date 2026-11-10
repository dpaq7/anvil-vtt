import { AArrowDown, AArrowUp } from 'lucide-react';
import { useTextScale } from '../../../lib/mode-prefs.js';
import type { ClientMessage } from '../../../types/protocol.js';
import type { RespiteFilter } from '../../stages/mode-helpers.js';
import { DiceRollControls } from '../DiceRollControls.js';

/**
 * The bar under a mode screen (DESIGN.md section 6): Smaller / Larger text in Story, Montage and
 * Negotiation, the All / Open / Done filter in Respite, and the same dice on the right as Battle.
 * Text size and the filter are this device's view only; nothing is sent. The dice never fold
 * here: a mode's bar has at most three tools (section 6).
 */
export function ModeBar({
  mode,
  send,
  filter,
  counts,
  onFilter,
}: {
  mode: 'story' | 'montage' | 'negotiation' | 'respite';
  send: (msg: ClientMessage) => void;
  filter?: RespiteFilter;
  counts?: Record<RespiteFilter, number>;
  onFilter?: (filter: RespiteFilter) => void;
}) {
  const text = useTextScale();
  return (
    <div className="sb-bar-host">
      {mode === 'respite' ? (
        <div className="md-bartools" role="group" aria-label="Show activities">
          {(['all', 'open', 'done'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => onFilter?.(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} <em>{counts?.[f] ?? 0}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="md-bartools" role="group" aria-label="Text size">
          <button type="button" disabled={!text.canSmaller} onClick={text.smaller}>
            <AArrowDown size={15} strokeWidth={2.6} aria-hidden="true" />
            Smaller text
          </button>
          <button type="button" disabled={!text.canLarger} onClick={text.larger}>
            <AArrowUp size={15} strokeWidth={2.6} aria-hidden="true" />
            Larger text
          </button>
        </div>
      )}
      <DiceRollControls send={send} variant="bar" />
    </div>
  );
}
