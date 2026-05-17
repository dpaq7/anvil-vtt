import { cn } from '@anvil/ui';
import type { AbilityResult } from '../../types/protocol.js';

interface PowerRollDisplayProps {
  result: AbilityResult;
  className?: string;
}

const TIER_COLORS = {
  1: { text: 'text-zinc-300', label: '≤11' },
  2: { text: 'text-blue-300', label: '12-16' },
  3: { text: 'text-green-300', label: '17+' },
} as const;

export function PowerRollDisplay({ result, className }: PowerRollDisplayProps) {
  const tier = TIER_COLORS[result.tier];

  return (
    <div className={cn('rounded-lg border border-zinc-300/80 bg-zinc-800/95 p-3 shadow-sm', className)}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="min-w-0 truncate text-sm font-black uppercase tracking-wide text-zinc-100">{result.abilityName}</span>
        <span
          className={cn('inline-flex h-6 min-w-14 items-center justify-center border border-zinc-300 px-2 text-[11px] font-black leading-none', tier.text)}
          style={{ clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)' }}
        >
          {tier.label}
        </span>
      </div>
      <div className="mb-3 border-t border-zinc-300/70" />

      {/* Dice */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-1">
          {result.dice.map((d, i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center bg-zinc-800 font-mono text-sm font-bold text-zinc-100"
              style={{ clipPath: 'polygon(50% 0%, 88% 14%, 100% 50%, 88% 86%, 50% 100%, 12% 86%, 0 50%, 12% 14%)' }}
              title="Draw Steel d10: d20 body numbered 1-10 twice"
            >
              {d}
            </span>
          ))}
        </div>
        {result.modifier !== 0 && (
          <span className="text-sm text-zinc-400">
            {result.modifier >= 0 ? '+' : ''}{result.modifier}
          </span>
        )}
        <span className="text-sm text-zinc-500">=</span>
        <span className={cn('text-lg font-bold', tier.text)}>{result.total}</span>
      </div>

      {/* Damage */}
      {result.damage > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Damage:</span>
          <span className="font-bold text-red-400">{result.damage}</span>
        </div>
      )}

      {/* Effects */}
      {result.effects.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {result.effects.map((effect, i) => (
            <span key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {effect}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
