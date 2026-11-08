import { Meter } from './battle/HeroRow.js';

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

/** A hero's vitals (`sb-vital`). */
export function VitalsBar({ name, heroClass, level, currentStamina, maxStamina, tempStamina = 0, heroicResource = 0, maxHeroicResource = 0 }: VitalsBarProps) {
  return (
    <div className="sb-vital">
      <span>{name}, level {level} {heroClass ?? 'hero'}</span>
      <b>{currentStamina}/{maxStamina}{tempStamina > 0 ? ` +${tempStamina}` : ''}</b>
      <Meter cur={currentStamina} max={maxStamina} winded={currentStamina <= maxStamina / 2} />
      {maxHeroicResource > 0 && <span>Resource {heroicResource}/{maxHeroicResource}</span>}
    </div>
  );
}
