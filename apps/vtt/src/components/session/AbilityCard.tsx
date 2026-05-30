import { cn } from '@anvil/ui';

export interface AbilityInfo {
  id: string;
  name: string;
  keywords: string[];
  actionType: string;
  distance: string;
  damage: string;
  cost: string;
  tier1Effect: string;
  tier2Effect: string;
  tier3Effect: string;
}

interface AbilityCardProps {
  ability: AbilityInfo;
  disabled?: boolean;
  onUse: (abilityId: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  action: 'border-blue-500/40',
  maneuver: 'border-green-500/40',
  triggered: 'border-amber-500/40',
  free: 'border-purple-500/40',
};

export function AbilityCard({ ability, disabled, onUse }: AbilityCardProps) {
  const borderColor = ACTION_COLORS[ability.actionType] ?? 'border-zinc-700';
  const tierEffects = [
    { label: 'T1', text: ability.tier1Effect },
    { label: 'T2', text: ability.tier2Effect },
    { label: 'T3', text: ability.tier3Effect },
  ].filter((effect) => effect.text.trim());

  return (
    <button
      onClick={() => onUse(ability.id)}
      disabled={disabled}
      className={cn(
        'w-full rounded border px-3 py-2 text-left transition hover:bg-zinc-800',
        borderColor,
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">{ability.name}</span>
        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
          {formatActionType(ability.actionType)}
        </span>
      </div>

      {/* Keywords */}
      {ability.keywords.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {ability.keywords.map((kw) => (
            <span key={kw} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Distance + Damage */}
      <div className="mt-1 flex gap-3 text-xs text-zinc-500">
        {ability.distance && <span>{ability.distance}</span>}
        {ability.damage && <span className="text-red-400">{ability.damage}</span>}
        {ability.cost && <span className="text-amber-400">{ability.cost}</span>}
      </div>

      {tierEffects.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
          {tierEffects.map((effect) => (
            <p key={effect.label} className="text-[11px] leading-snug text-zinc-400">
              <span className="mr-1 font-semibold text-zinc-300">{effect.label}</span>
              {effect.text}
            </p>
          ))}
        </div>
      )}
    </button>
  );
}

function formatActionType(actionType: string): string {
  if (actionType === 'action') return 'Action';
  if (actionType === 'maneuver') return 'Maneuver';
  if (actionType === 'triggered') return 'Triggered';
  if (actionType === 'free') return 'Free';
  return actionType;
}
