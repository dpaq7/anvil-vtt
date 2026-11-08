import { cn } from '../lib/utils.js';

export interface StaminaBarProps {
  current: number;
  max: number;
  temp?: number;
  className?: string;
}

const WINDED_HATCH =
  'bg-[repeating-linear-gradient(135deg,var(--color-text)_0_2px,transparent_2px_4px)]';

/*
 * Meter (DESIGN.md section 4): a bar with a 1.5 px text edge and text fill.
 * Winded hatches the fill, so it reads without colour. The cur/max number sits
 * beside the bar at 13 px, never inside it. `className` sizes the bar.
 */
export function StaminaBar({ current, max, temp = 0, className }: StaminaBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const tempPct = max > 0 ? Math.min(100 - pct, (temp / max) * 100) : 0;
  const isWinded = current <= max / 2;

  return (
    <div className="flex w-full items-center gap-2">
      <div
        className={cn(
          'relative h-3 min-w-0 flex-1 overflow-hidden border-[1.5px] border-text bg-transparent',
          className,
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-[width] duration-700 ease-[cubic-bezier(0.45,0,0.1,1)]',
            isWinded ? WINDED_HATCH : 'bg-text',
          )}
          style={{ width: `${pct}%` }}
        />
        {temp > 0 && (
          <div
            className="absolute inset-y-0 bg-active"
            style={{ left: `${pct}%`, width: `${tempPct}%` }}
          />
        )}
      </div>
      <span className="shrink-0 text-xs font-bold tabular-nums text-text">
        {current}{temp > 0 ? `+${temp}` : ''}/{max}
      </span>
    </div>
  );
}
