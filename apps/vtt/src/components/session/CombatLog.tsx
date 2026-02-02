import { useRef, useEffect } from 'react';
import { cn } from '@anvil/ui';
import type { AbilityResult } from '../../types/protocol.js';

interface CombatLogProps {
  entries: AbilityResult[];
  entityNames: Map<string, string>;
}

const TIER_COLORS = {
  1: 'text-zinc-400',
  2: 'text-blue-400',
  3: 'text-green-400',
} as const;

export function CombatLog({ entries, entityNames }: CombatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="flex h-full flex-col">
      <p className="border-b border-zinc-800 px-3 py-2 text-xs font-medium uppercase text-zinc-500">
        Combat Log
      </p>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <p className="p-3 text-xs text-zinc-600">No actions yet.</p>
        )}
        {entries.map((entry, i) => {
          const sourceName = entityNames.get(entry.sourceId) ?? entry.sourceId;
          const targetName = entityNames.get(entry.targetId) ?? entry.targetId;
          const tierColor = TIER_COLORS[entry.tier];

          return (
            <div
              key={i}
              className="border-b border-zinc-800/50 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-1">
                <span className="font-medium text-zinc-200">{sourceName}</span>
                <span className="text-zinc-600">used</span>
                <span className="text-zinc-300">{entry.abilityName}</span>
                <span className="text-zinc-600">on</span>
                <span className="text-zinc-200">{targetName}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-zinc-500">
                  [{entry.dice.join(', ')}]{entry.modifier >= 0 ? '+' : ''}{entry.modifier} = {entry.total}
                </span>
                <span className={cn('font-bold', tierColor)}>T{entry.tier}</span>
                {entry.damage > 0 && (
                  <span className="text-red-400">{entry.damage} dmg</span>
                )}
              </div>
              {entry.effects.length > 0 && (
                <div className="mt-0.5 text-zinc-500">
                  {entry.effects.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
