import { Check } from 'lucide-react';
import type { SceneType } from '@anvil/ui';
import { ModeIcon } from '../../../components/session/FilmStrip.js';
import { Meter } from '../../../components/session/battle/HeroRow.js';
import { TokenFace } from '../../../components/session/battle/TokenFace.js';
import { firstName, staminaOf, staminaState } from '../../../lib/faces.js';
import { MODE_WORD } from '../../../lib/scene-mode.js';
import type { CombatState, EntityData } from '../../../types/protocol.js';

/* Parts of the Display's rail, at room scale (demo `display`). Nothing here is a control. */

export function DisplayBoard({ mode, name }: { mode: SceneType; name: string }) {
  return (
    <div className="dp-board" data-mode={mode}>
      <i>
        <ModeIcon type={mode} size={44} />
      </i>
      <span>
        <b>{name}</b>
        <small>{MODE_WORD[mode]}</small>
      </span>
    </div>
  );
}

/** The party, one row each, at 34 px names. Hero stamina is everyone's to read; creatures never appear here. */
export function DisplayParty({ heroes, combat, subFor }: { heroes: EntityData[]; combat?: CombatState | null; subFor?: (hero: EntityData) => string }) {
  return (
    <ol className="dp-party">
      {heroes.map((h) => {
        const { cur, max } = staminaOf(h);
        const state = staminaState(h, 'hero');
        const done = Boolean(combat?.actedThisRound.includes(h.id));
        const on = combat?.activeEntityId === h.id;
        if (state === 'dying') {
          return (
            <li key={h.id} className="dp-dying">
              <div className="dp-plate">
                <i><TokenFace entity={h} size={52} out /></i>
                <div className="dp-who"><strong>{firstName(h.name)}</strong><b>Dying</b></div>
                <span><b>{cur}/{max}</b></span>
              </div>
            </li>
          );
        }
        const sub = subFor?.(h);
        return (
          <li key={h.id} data-on={on || undefined} data-done={done || undefined}>
            <i>
              <TokenFace entity={h} size={52} />
              {done && <em className="sb-badge" data-on><Check size={14} strokeWidth={4} aria-hidden="true" /></em>}
            </i>
            <div className="dp-who">
              <strong>{firstName(h.name)}</strong>
              {state === 'winded' ? <em>Winded</em> : done ? <small>Done</small> : sub ? <span className="dp-sub">{sub}</span> : null}
            </div>
            <span><b>{cur}/{max}</b><Meter cur={cur} max={max} winded={state === 'winded'} /></span>
          </li>
        );
      })}
    </ol>
  );
}
