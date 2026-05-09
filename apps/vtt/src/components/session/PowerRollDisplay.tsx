import { cn } from '@anvil/ui';
import type { AbilityResult } from '../../types/protocol.js';

interface PowerRollDisplayProps {
  result: AbilityResult;
  className?: string;
}

const TIER_COLORS = {
  1: { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: 'Tier 1' },
  2: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Tier 2' },
  3: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Tier 3' },
} as const;

export function PowerRollDisplay({ result, className }: PowerRollDisplayProps) {
  const tier = TIER_COLORS[result.tier];

  return (
    <div className={cn('rounded border border-zinc-700 bg-zinc-900 p-3', className)}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{result.abilityName}</span>
        <span className={cn('rounded px-2 py-0.5 text-xs font-bold', tier.bg, tier.text)}>
          {tier.label}
        </span>
      </div>

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
