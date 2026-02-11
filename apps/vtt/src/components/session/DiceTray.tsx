import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@anvil/ui';
import type { AbilityResult } from '../../types/protocol.js';

const TIER_COLORS = {
  1: { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: 'T1' },
  2: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'T2' },
  3: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'T3' },
} as const;

/** Auto-fade timeout in ms */
const FADE_AFTER = 10_000;

interface TrackedEntry {
  result: AbilityResult;
  key: string;
  fadeOut: boolean;
}

export interface DiceTrayProps {
  entries: AbilityResult[];
  entityNames: Map<string, string>;
  maxVisible?: number;
}

/**
 * Floating dice-roll overlay shown over the battle canvas.
 * Renders last N ability results with auto-fade after 10s.
 */
export function DiceTray({ entries, entityNames, maxVisible = 5 }: DiceTrayProps) {
  const [trackedEntries, setTrackedEntries] = useState<TrackedEntry[]>([]);
  const prevLenRef = useRef(entries.length);

  // Detect new entries appended to the combatLog array
  useEffect(() => {
    if (entries.length > prevLenRef.current) {
      const newItems = entries.slice(prevLenRef.current);
      const newTracked: TrackedEntry[] = newItems.map((result) => ({
        result,
        key: `${result.timestamp}-${result.sourceId}-${Math.random().toString(36).slice(2, 6)}`,
        fadeOut: false,
      }));
      setTrackedEntries((prev) => [...prev, ...newTracked].slice(-maxVisible));
    }
    prevLenRef.current = entries.length;
  }, [entries, maxVisible]);

  // Auto-fade timer: mark entries for fade-out after FADE_AFTER ms, then remove
  useEffect(() => {
    if (trackedEntries.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const entry of trackedEntries) {
      if (!entry.fadeOut) {
        // Set fade-out flag
        const fadeTimer = setTimeout(() => {
          setTrackedEntries((prev) =>
            prev.map((e) => (e.key === entry.key ? { ...e, fadeOut: true } : e)),
          );
        }, FADE_AFTER);
        timers.push(fadeTimer);

        // Remove entirely after fade animation (500ms after fadeOut)
        const removeTimer = setTimeout(() => {
          setTrackedEntries((prev) => prev.filter((e) => e.key !== entry.key));
        }, FADE_AFTER + 500);
        timers.push(removeTimer);
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [trackedEntries]);

  // Memoize visible (non-removed) entries
  const visible = useMemo(
    () => trackedEntries.slice(-maxVisible),
    [trackedEntries, maxVisible],
  );

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 flex w-64 flex-col gap-2">
      {visible.map(({ result, key, fadeOut }) => {
        const tier = TIER_COLORS[result.tier];
        const sourceName = entityNames.get(result.sourceId) ?? 'Unknown';

        return (
          <div
            key={key}
            className={cn(
              'pointer-events-auto rounded-lg border border-zinc-700/50 bg-zinc-900/80 p-2.5 backdrop-blur-sm transition-all duration-500',
              fadeOut ? 'translate-x-8 opacity-0' : 'animate-in slide-in-from-right',
            )}
          >
            {/* Source + ability name */}
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-500">{sourceName}</span>
                <span className="block truncate text-xs font-medium text-zinc-200">
                  {result.abilityName}
                </span>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                  tier.bg,
                  tier.text,
                )}
              >
                {tier.label}
              </span>
            </div>

            {/* Dice + total */}
            <div className="flex items-center gap-1.5">
              {result.dice.map((d, i) => (
                <span
                  key={i}
                  className="flex size-6 items-center justify-center rounded bg-zinc-800 font-mono text-xs font-bold text-zinc-100"
                >
                  {d}
                </span>
              ))}
              {result.modifier !== 0 && (
                <span className="text-xs text-zinc-400">
                  {result.modifier >= 0 ? '+' : ''}
                  {result.modifier}
                </span>
              )}
              <span className="text-xs text-zinc-600">=</span>
              <span className={cn('text-sm font-bold', tier.text)}>{result.total}</span>

              {/* Damage (if any) */}
              {result.damage > 0 && (
                <span className="ml-auto text-xs font-bold text-red-400">
                  {result.damage} dmg
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
