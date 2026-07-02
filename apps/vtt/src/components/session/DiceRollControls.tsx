import { useState } from 'react';
import { Dices } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { ClientMessage, DrawSteelRollKind } from '../../types/protocol.js';

interface DiceRollControlsProps {
  send: (msg: ClientMessage) => void;
  className?: string;
}

export function DiceRollControls({ send, className }: DiceRollControlsProps) {
  const [modifier, setModifier] = useState('0');

  const roll = (kind: DrawSteelRollKind) => {
    const parsedModifier = Number.parseInt(modifier, 10);
    send({
      type: 'draw_steel_roll',
      roll: {
        kind,
        modifier: kind === 'power' && Number.isFinite(parsedModifier) ? parsedModifier : undefined,
      },
    });
  };

  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 text-xs shadow-lg backdrop-blur',
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
        <Dices className="size-3.5" />
      </span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('power')}>
          Power
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('heroic-resource')}>
          Resource
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => roll('d6')}>
          d6
        </Button>
      </div>
      <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
        Mod
        <input
          type="number"
          value={modifier}
          onChange={(event) => setModifier(event.target.value)}
          className="h-7 w-14 rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
        />
      </label>
    </div>
  );
}
