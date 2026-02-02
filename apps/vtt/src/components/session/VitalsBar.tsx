import { StaminaBar } from '@anvil/ui';

interface VitalsBarProps {
  name: string;
  heroClass: string | null;
  level: number;
  currentStamina: number;
  maxStamina: number;
  tempStamina?: number;
  heroicResource?: number;
  maxHeroicResource?: number;
}

export function VitalsBar({
  name,
  heroClass,
  level,
  currentStamina,
  maxStamina,
  tempStamina = 0,
  heroicResource = 0,
  maxHeroicResource = 0,
}: VitalsBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2">
      {/* Portrait placeholder */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
        {name[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Name + class */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
        <p className="text-xs text-zinc-500">
          {heroClass ?? 'No class'} Lv{level}
        </p>
      </div>

      {/* Stamina */}
      <div className="w-40">
        <StaminaBar current={currentStamina} max={maxStamina} temp={tempStamina} />
      </div>

      {/* Heroic resource */}
      {maxHeroicResource > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: maxHeroicResource }, (_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full border ${
                i < heroicResource
                  ? 'border-yellow-400 bg-yellow-400'
                  : 'border-zinc-600 bg-zinc-800'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
