import { cn } from '../lib/utils.js';

export interface StaminaBarProps {
  current: number;
  max: number;
  temp?: number;
  className?: string;
}

export function StaminaBar({ current, max, temp = 0, className }: StaminaBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const tempPct = max > 0 ? Math.min(100 - pct, (temp / max) * 100) : 0;
  const isWinded = current <= max / 2;

  return (
    <div className={cn('relative h-3 w-full overflow-hidden rounded-full bg-zinc-800', className)}>
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all',
          isWinded ? 'bg-amber-500' : 'bg-emerald-500',
        )}
        style={{ width: `${pct}%` }}
      />
      {temp > 0 && (
        <div
          className="absolute inset-y-0 rounded-full bg-cyan-400/60"
          style={{ left: `${pct}%`, width: `${tempPct}%` }}
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
        {current}{temp > 0 ? `+${temp}` : ''}/{max}
      </span>
    </div>
  );
}
