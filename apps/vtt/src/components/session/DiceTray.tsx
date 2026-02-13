import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@anvil/ui';
import type { AbilityResult } from '../../types/protocol.js';

/* ── Tier colour config (Draw Steel power roll tiers) ── */
const TIER_CONFIG = {
  1: {
    bg: 'bg-zinc-700/50',
    border: 'border-zinc-600/50',
    text: 'text-zinc-200',
    glow: '',
    label: 'Tier 1',
    desc: '≤ 11',
  },
  2: {
    bg: 'bg-blue-950/60',
    border: 'border-blue-700/40',
    text: 'text-blue-300',
    glow: 'shadow-[0_0_14px_rgba(59,130,246,0.2)]',
    label: 'Tier 2',
    desc: '12–16',
  },
  3: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-600/40',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_18px_rgba(52,211,153,0.25)]',
    label: 'Tier 3',
    desc: '17+',
  },
} as const;

/** How long the result stays visible before auto-fading (ms) */
const FADE_AFTER = 8_000;
/** Duration of the dice tumble animation (ms) */
const TUMBLE_DURATION = 600;

type Phase = 'tumble' | 'show' | 'fadeOut';

interface TrackedEntry {
  result: AbilityResult;
  key: string;
  phase: Phase;
}

export interface DiceTrayProps {
  entries: AbilityResult[];
  entityNames: Map<string, string>;
  maxVisible?: number;
}

/**
 * Power Roll dice tray — floating overlay in the top-right of the battle canvas.
 *
 * Animation lifecycle for each roll:
 *   1. **Tumble** — dice spin with random intermediate values (600ms)
 *   2. **Show** — final result revealed with tier-coloured glow
 *   3. **Fade-out** — card slides away after 8 seconds
 */
export function DiceTray({ entries, entityNames, maxVisible = 4 }: DiceTrayProps) {
  const [trackedEntries, setTrackedEntries] = useState<TrackedEntry[]>([]);
  /** Set of entry keys we've already processed — survives strict-mode double-invoke. */
  const seenRef = useRef(new Set<string>());

  // Detect new entries appended to the combatLog array
  useEffect(() => {
    const newTracked: TrackedEntry[] = [];
    for (const result of entries) {
      const entryKey = `${result.timestamp}-${result.sourceId}-${result.abilityId}`;
      if (seenRef.current.has(entryKey)) continue;
      seenRef.current.add(entryKey);
      newTracked.push({
        result,
        key: `${entryKey}-${Math.random().toString(36).slice(2, 6)}`,
        phase: 'tumble' as const,
      });
    }

    if (newTracked.length === 0) return;

    setTrackedEntries((prev) => [...prev, ...newTracked].slice(-maxVisible));

    // Transition tumble → show after animation
    for (const entry of newTracked) {
      setTimeout(() => {
        setTrackedEntries((prev) =>
          prev.map((e) => (e.key === entry.key && e.phase === 'tumble' ? { ...e, phase: 'show' } : e)),
        );
      }, TUMBLE_DURATION);
    }
  }, [entries, maxVisible]);

  // Auto-fade: show → fadeOut → remove
  useEffect(() => {
    if (trackedEntries.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const entry of trackedEntries) {
      if (entry.phase !== 'show') continue;
      timers.push(
        setTimeout(() => {
          setTrackedEntries((prev) =>
            prev.map((e) => (e.key === entry.key ? { ...e, phase: 'fadeOut' } : e)),
          );
        }, FADE_AFTER),
      );
      timers.push(
        setTimeout(() => {
          setTrackedEntries((prev) => prev.filter((e) => e.key !== entry.key));
        }, FADE_AFTER + 600),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [trackedEntries]);

  const visible = useMemo(() => trackedEntries.slice(-maxVisible), [trackedEntries, maxVisible]);

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 flex w-72 flex-col gap-2.5">
      {/* Inject keyframes once */}
      <style>{KEYFRAMES}</style>
      {visible.map(({ result, key, phase }) => (
        <DiceRollCard
          key={key}
          result={result}
          sourceName={entityNames.get(result.sourceId) ?? 'Unknown'}
          phase={phase}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── Single Roll Card ─────────────────────── */

interface DiceRollCardProps {
  result: AbilityResult;
  sourceName: string;
  phase: Phase;
}

function DiceRollCard({ result, sourceName, phase }: DiceRollCardProps) {
  const tier = TIER_CONFIG[result.tier];

  return (
    <div
      className={cn(
        'pointer-events-auto overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-500',
        phase === 'fadeOut' ? 'translate-x-16 scale-95 opacity-0' : 'translate-x-0 opacity-100',
        phase === 'show' ? tier.glow : '',
        tier.border,
        'bg-zinc-900/90',
      )}
      style={phase !== 'fadeOut' ? { animation: 'dt-slideIn 0.3s ease-out' } : undefined}
    >
      {/* Header — source + ability */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
            {sourceName}
          </span>
          <p className="truncate text-xs font-semibold text-zinc-100">{result.abilityName}</p>
        </div>
      </div>

      {/* Dice area */}
      <div className={cn('mx-2.5 mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5', tier.bg)}>
        {/* The two d10 */}
        <div className="flex gap-2">
          {result.dice.map((d, i) => (
            <TumblingDie key={i} finalValue={d} phase={phase} delayMs={i * 80} />
          ))}
        </div>

        {/* Modifier */}
        {result.modifier !== 0 && (
          <span className="text-sm font-semibold text-zinc-400">
            {result.modifier >= 0 ? '+' : ''}{result.modifier}
          </span>
        )}

        {/* = Total */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-600">=</span>
          <span className={cn('text-xl font-black tabular-nums leading-none', tier.text)}>
            {phase === 'tumble' ? '?' : result.total}
          </span>
        </div>

        {/* Tier badge */}
        <div className="ml-auto flex flex-col items-end">
          <span className={cn('text-[11px] font-bold', tier.text)}>
            {phase === 'tumble' ? '…' : tier.label}
          </span>
          {phase !== 'tumble' && (
            <span className="text-[9px] text-zinc-500">{tier.desc}</span>
          )}
        </div>
      </div>

      {/* Damage bar */}
      {result.damage > 0 && phase !== 'tumble' && (
        <div className="flex items-center justify-between border-t border-zinc-800/50 px-3 py-1.5">
          <span className="text-[10px] font-medium text-zinc-500">Damage</span>
          <span className="text-sm font-bold tabular-nums text-red-400">{result.damage}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Tumbling Die ─────────────────────── */

interface TumblingDieProps {
  finalValue: number;
  phase: Phase;
  delayMs: number;
}

function TumblingDie({ finalValue, phase, delayMs }: TumblingDieProps) {
  const [display, setDisplay] = useState<number | string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'tumble') {
      // Start rapid random cycling after a short stagger delay
      const timeout = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setDisplay(Math.floor(Math.random() * 10) + 1);
        }, 50);
      }, delayMs);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    // Resolve to final value
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplay(finalValue);
    return undefined;
  }, [phase, finalValue, delayMs]);

  const isTumbling = phase === 'tumble';

  return (
    <div
      className={cn(
        'relative flex size-10 items-center justify-center rounded-lg border-2 font-mono text-lg font-black transition-all duration-200',
        isTumbling
          ? 'border-zinc-500/80 bg-zinc-800 text-zinc-300'
          : 'border-zinc-600/60 bg-zinc-800/80 text-zinc-50',
      )}
      style={{
        animation: isTumbling ? 'dt-tumble 0.15s ease-in-out infinite' : 'dt-settle 0.3s ease-out',
        animationDelay: isTumbling ? `${delayMs}ms` : '0ms',
      }}
    >
      <span className="tabular-nums">{display}</span>
      {/* d10 marker */}
      <span className="absolute -top-1 -right-1 rounded bg-zinc-700/80 px-0.5 text-[7px] font-bold leading-tight text-zinc-400">
        d10
      </span>
    </div>
  );
}

/* ─────────────────────── Keyframes ─────────────────────── */

const KEYFRAMES = `
@keyframes dt-tumble {
  0%, 100% { transform: rotate(0deg) scale(1.08); }
  25% { transform: rotate(-4deg) scale(1.02); }
  75% { transform: rotate(4deg) scale(1.12); }
}
@keyframes dt-settle {
  0% { transform: scale(1.15) rotate(3deg); }
  50% { transform: scale(0.92) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes dt-slideIn {
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;
