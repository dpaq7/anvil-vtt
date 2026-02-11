import type { EntityData } from '../../types/protocol.js';

/** Condition ID → display name */
const CONDITION_NAMES: Record<string, string> = {
  bleeding: 'Bleeding',
  dazed: 'Dazed',
  frightened: 'Frightened',
  grabbed: 'Grabbed',
  prone: 'Prone',
  restrained: 'Restrained',
  slowed: 'Slowed',
  taunted: 'Taunted',
  weakened: 'Weakened',
};

export interface TokenTooltipProps {
  entity: EntityData;
  x: number;
  y: number;
}

/**
 * Floating tooltip shown above a hovered token on the battle canvas.
 * Displays name, current/max stamina, and active conditions.
 */
export function TokenTooltip({ entity, x, y }: TokenTooltipProps) {
  const maxStamina = typeof entity['maxStamina'] === 'number' ? (entity['maxStamina'] as number) : 0;
  const currentStamina = typeof entity['currentStamina'] === 'number' ? (entity['currentStamina'] as number) : maxStamina;
  const conditions = Array.isArray(entity['conditions'])
    ? (entity['conditions'] as string[])
    : [];

  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-700/50 bg-zinc-900/90 px-3 py-1.5 shadow-xl backdrop-blur-sm"
      style={{ left: x, top: y - 12 }}
    >
      {/* Name */}
      <p className="whitespace-nowrap text-xs font-semibold text-zinc-100">
        {entity.name}
      </p>

      {/* Stamina */}
      {maxStamina > 0 && (
        <p className="text-[10px] text-zinc-400">
          Stamina:{' '}
          <span className={currentStamina <= maxStamina * 0.25 ? 'text-red-400' : currentStamina <= maxStamina * 0.5 ? 'text-amber-400' : 'text-emerald-400'}>
            {currentStamina}
          </span>
          <span className="text-zinc-500"> / {maxStamina}</span>
        </p>
      )}

      {/* Conditions */}
      {conditions.length > 0 && (
        <p className="mt-0.5 text-[10px] text-amber-400/80">
          {conditions.map((c) => CONDITION_NAMES[c] ?? c).join(', ')}
        </p>
      )}
    </div>
  );
}
