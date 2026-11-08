import { cleanName, conditionLine, staminaOf, staminaState } from '../../lib/faces.js';
import type { EntityData } from '../../types/protocol.js';
import { Meter } from './battle/HeroRow.js';

export interface TokenTooltipProps {
  entity: EntityData;
  x: number;
  y: number;
  /** A Player reads a creature by condition words, never by stamina. */
  isDirector?: boolean;
}

/**
 * Floating box above a hovered token. Name, stamina for those who may read it, and conditions.
 * Uses the popover's box (DESIGN.md, Popover). Winded and dying say so in words.
 */
export function TokenTooltip({ entity, x, y, isDirector = false }: TokenTooltipProps) {
  const { cur, max } = staminaOf(entity);
  const showStamina = max > 0 && (isDirector || entity.type === 'hero');
  const state = entity.type === 'hero' ? staminaState(entity, 'hero') : 'healthy';
  const conditions = conditionLine(entity);

  return (
    <div className="sb-tip" style={{ left: x, top: y }} data-map-panel>
      <div className="sb-pop">
        <strong>{cleanName(entity.name)}</strong>
        {showStamina && (
          <>
            <div className="sb-pop__st"><span>Stamina</span><b>{cur} / {max}</b></div>
            <Meter cur={cur} max={max} winded={state === 'winded'} />
          </>
        )}
        {state !== 'healthy' && <p className="sb-note"><b>{state === 'dying' ? 'Dying' : 'Winded'}</b></p>}
        {conditions.length > 0 && <p className="sb-note">{conditions.join(', ')}</p>}
      </div>
    </div>
  );
}
