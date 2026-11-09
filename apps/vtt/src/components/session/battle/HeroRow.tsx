import type { MouseEvent } from 'react';
import { Check } from 'lucide-react';
import { cleanName, conditionLine, heroClassName, staminaOf, staminaState } from '../../../lib/faces.js';
import type { EntityData } from '../../../types/protocol.js';
import { TokenFace } from './TokenFace.js';
import { useHitFlash, useRollingNumber } from './hooks.js';

export function Meter({ cur, max, winded }: { cur: number; max: number; winded?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return (
    <i className="sb-meter" data-winded={winded || undefined}>
      <u style={{ width: `${pct}%` }} />
    </i>
  );
}

interface HeroRowProps {
  hero: EntityData;
  active: boolean;
  done: boolean;
  own?: boolean;
  selected?: boolean;
  onClick?: (event: MouseEvent) => void;
  onDoubleClick?: () => void;
}

/** A hero in the rail: the dying row shouts; every other state keeps the row's shape. */
export function HeroRow({ hero, active, done, own = false, selected, onClick, onDoubleClick }: HeroRowProps) {
  const { cur, max } = staminaOf(hero);
  const shown = useRollingNumber(cur);
  const hit = useHitFlash(cur);
  const state = staminaState(hero, 'hero');
  const name = cleanName(hero.name);

  const note = active ? (own ? 'Your turn' : 'Acting now') : done ? 'Done' : null;
  if (state === 'dying') {
    return (
      <button type="button" className="sb-dying" data-active={active || undefined} data-sel={selected || undefined} onClick={onClick} onDoubleClick={onDoubleClick}>
        <span className="sb-dying__f"><TokenFace entity={hero} size={38} out /></span>
        <span className="sb-who" data-note={note ? true : undefined}>
          <strong><span>{name}</span></strong>
          <span>
            <span className="sb-dying__w">Dying</span>
            {note && <span className="sb-dying__note">, {note.toLowerCase()}</span>}
          </span>
        </span>
        <b className="sb-dying__n">{shown}/{max}</b>
      </button>
    );
  }

  const sub = [note, ...conditionLine(hero)].filter(Boolean).join(', ') || (own ? `${heroClassName(hero)}, you` : heroClassName(hero));
  return (
    <button
      type="button"
      className="sb-row"
      data-active={active || undefined}
      data-done={done || undefined}
      data-sel={selected || undefined}
      data-hit={hit || undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="sb-row__f">
        <TokenFace entity={hero} size={36} />
        <em className="sb-badge" data-on={done || undefined}><Check size={10} strokeWidth={4} aria-hidden="true" /></em>
      </span>
      <span className="sb-who">
        <strong><span>{name}</span>{state === 'winded' && <em className="sb-winded">Winded</em>}</strong>
        <small>{sub}</small>
      </span>
      <span className="sb-st">
        <b>{shown}/{max}</b>
        <Meter cur={cur} max={max} winded={state === 'winded'} />
      </span>
    </button>
  );
}
