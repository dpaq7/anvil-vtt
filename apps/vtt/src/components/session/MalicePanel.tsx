import { Minus, Plus } from 'lucide-react';
import { useSessionConnection } from './shell/connection-context.js';

interface MalicePanelProps {
  malice: number;
  isDirector: boolean;
  onAdjust: (delta: number) => void;
}

/** Malice on the Director's side heading (`sb-malice`). The Director's alone: section 7. */
export function MalicePanel({ malice, isDirector, onAdjust }: MalicePanelProps) {
  const { paused } = useSessionConnection();
  if (!isDirector) return null;
  return (
    <span className="sb-malice">
      {paused ? 'Malice, when back' : 'Malice'}
      <button type="button" aria-label="Lower Malice" disabled={paused || malice <= 0} onClick={() => onAdjust(-1)}>
        <Minus size={13} strokeWidth={3} aria-hidden="true" />
      </button>
      <strong>{malice}</strong>
      <button type="button" aria-label="Raise Malice" disabled={paused} onClick={() => onAdjust(1)}>
        <Plus size={13} strokeWidth={3} aria-hidden="true" />
      </button>
    </span>
  );
}
