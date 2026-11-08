import type { CSSProperties } from 'react';

export interface RollCardData {
  /** Who rolled, as this viewer may read it. */
  title: string;
  dice: number[];
  modifier: number;
  total: number;
  tier?: 1 | 2 | 3;
  damage?: number;
  effects?: string[];
}

interface PowerRollDisplayProps {
  roll: RollCardData;
  /** While true the dice tumble and the total waits. */
  settling?: boolean;
  /** Dice shown during the tumble. */
  tumble?: number[];
  on?: boolean;
  style?: CSSProperties;
}

/** The roll card (`bt-roll`): dice on plates, then the total and tier pop in last. */
export function PowerRollDisplay({ roll, settling = false, tumble, on = true, style }: PowerRollDisplayProps) {
  const dice = settling && tumble ? tumble : roll.dice;
  const modifier = roll.modifier !== 0 ? ` ${roll.modifier > 0 ? '+' : '−'} ${Math.abs(roll.modifier)}` : '';
  return (
    <div className="bt-roll" data-on={on || undefined} style={style}>
      <strong>{roll.title}</strong>
      <div className="bt-dice">
        {dice.slice(0, 2).map((d, i) => <span key={i}>{d}</span>)}
        {dice.length < 2 && <i />}
        <b data-on={!settling || undefined}>{settling ? '' : roll.total}</b>
        <em data-on={(!settling && Boolean(roll.tier)) || undefined}>{roll.tier ? `Tier ${roll.tier}` : ''}</em>
      </div>
      {!settling && (modifier || (roll.damage ?? 0) > 0) && (
        <small>
          {modifier && `Modifier${modifier}`}
          {modifier && (roll.damage ?? 0) > 0 && '. '}
          {(roll.damage ?? 0) > 0 && `Damage ${roll.damage}`}
        </small>
      )}
      {!settling && roll.effects?.map((effect, i) => <small key={i}>{effect}</small>)}
    </div>
  );
}
