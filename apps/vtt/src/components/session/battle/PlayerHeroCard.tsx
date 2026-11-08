import { cleanName, heroClassName, staminaOf, staminaState } from '../../../lib/faces.js';
import type { EntityData, TurnActionState } from '../../../types/protocol.js';
import { TurnActionBar } from '../TurnActionBar.js';
import type { AbilityGroup } from './turn-slots.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { Meter } from './HeroRow.js';
import { TokenFace } from './TokenFace.js';

const TRAITS = [
  ['might', 'MIG', 'Might'],
  ['agility', 'AGI', 'Agility'],
  ['reason', 'REA', 'Reason'],
  ['intuition', 'INT', 'Intuition'],
  ['presence', 'PRE', 'Presence'],
] as const;

const num = (entity: EntityData, key: string, fallback: number) =>
  typeof entity[key] === 'number' ? (entity[key] as number) : fallback;
const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

interface PlayerHeroCardProps {
  hero: EntityData;
  turnActions: TurnActionState | null;
  isMyTurn: boolean;
  conditions: string[];
  onCatchBreath: () => void;
  onDefend: () => void;
  onEndTurn: () => void;
  onOpenAbilities: (group: AbilityGroup) => void;
  onRollCharacteristic: (label: string, modifier: number) => void;
  onRollResource: () => void;
}

/** The Player's hero, pinned at the top of the right rail (`sb-now[data-player]`). */
export function PlayerHeroCard({
  hero,
  turnActions,
  isMyTurn,
  conditions,
  onCatchBreath,
  onDefend,
  onEndTurn,
  onOpenAbilities,
  onRollCharacteristic,
  onRollResource,
}: PlayerHeroCardProps) {
  const { paused } = useSessionConnection();
  const { cur, max } = staminaOf(hero);
  const speed = num(hero, 'speed', 5);
  const resourceName = typeof hero['heroicResourceName'] === 'string' ? hero['heroicResourceName'] : 'Resource';
  const resource = num(hero, 'heroicResource', 0);
  return (
    <>
      <section className="sb-sec sb-now">
        <div className="sb-now__h">
          <div className="sb-now__f"><TokenFace entity={hero} size={46} /></div>
          <div>
            <strong>{cleanName(hero.name)}</strong>
            <small>Level {num(hero, 'level', 1)} {heroClassName(hero)}</small>
          </div>
        </div>
        <div className="sb-vital">
          <span>Stamina</span>
          <b>{cur}/{max}</b>
          <Meter cur={cur} max={max} winded={staminaState(hero, 'hero') === 'winded'} />
        </div>
        <TurnActionBar
          turnActions={turnActions}
          isMyTurn={isMyTurn}
          baseSpeed={speed}
          heroicResource={0}
          resourceName={resourceName}
          conditions={conditions}
          onCatchBreath={onCatchBreath}
          onDefend={onDefend}
          onEndTurn={onEndTurn}
          onOpenAbilities={onOpenAbilities}
        />
      </section>
      <section className="sb-sec">
        <div className="sb-traits">
          {TRAITS.map(([key, short, label]) => {
            const value = num(hero, key, 0);
            return (
              <button key={key} type="button" disabled={paused} title={paused ? `Roll ${label}, when back` : `Roll ${label}`} onClick={() => onRollCharacteristic(label, value)}>
                <small>{short}</small>
                <b>{signed(value)}</b>
              </button>
            );
          })}
        </div>
        <div className="sb-stats">
          <button type="button" className="text-inherit underline underline-offset-[3px] disabled:no-underline" disabled={paused} title={`Roll ${resourceName}`} onClick={onRollResource}>
            {resourceName} <b>{resource}</b>
          </button>
          <span>Recoveries <b>{num(hero, 'recoveriesCurrent', 0)}/{num(hero, 'recoveriesMax', 0)}</b></span>
          <span>Speed <b>{speed}</b></span>
        </div>
      </section>
    </>
  );
}
